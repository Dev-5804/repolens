import { NextRequest, NextResponse } from 'next/server';
import { getRepoMetadata, getCommitActivity, getContributors, getLanguages, getRepoTree } from '@/lib/github';
import { generateScore } from '@/lib/scorer';
import { getCachedAnalysis, setCachedAnalysis } from '@/lib/cache';
import { RepoAnalysisData, ApiResponse } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('x-github-token');
    
    if (!token) {
      return NextResponse.json({
        status: 'error',
        code: 'MISSING_TOKEN',
        message: 'A GitHub Personal Access Token is required. Please provide it in the X-GitHub-Token header.'
      } as ApiResponse, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const repoQuery = searchParams.get('repo');

    if (!repoQuery || !repoQuery.includes('/')) {
      return NextResponse.json({
        status: 'error',
        code: 'INVALID_REPO_FORMAT',
        message: 'Invalid repository format. Must be owner/repo'
      } as ApiResponse, { status: 400 });
    }

    const [owner, repo] = repoQuery.split('/');
    const repoKey = `${owner}/${repo}`;

    // 1. Check Cache
    const cachedData = await getCachedAnalysis(repoKey);
    if (cachedData) {
      return NextResponse.json({
        status: 'success',
        cached: true,
        data: cachedData
      } as ApiResponse);
    }

    // 2. Fetch Metadata
    let metadata;
    try {
      metadata = await getRepoMetadata(owner, repo, token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'UNAUTHORIZED') {
         return NextResponse.json({ status: 'error', code: 'UNAUTHORIZED', message: 'Invalid or expired GitHub Token' } as ApiResponse, { status: 401 });
      }
      if (message === 'REPO_NOT_FOUND') {
         return NextResponse.json({ status: 'error', code: 'REPO_NOT_FOUND', message: 'Repository does not exist' } as ApiResponse, { status: 404 });
      }
      if (message === 'RATE_LIMIT') {
         return NextResponse.json({ status: 'error', code: 'RATE_LIMIT', message: 'API rate limit exceeded' } as ApiResponse, { status: 429 });
      }
      throw err;
    }

    // 3. Parallel Fetching for remaining metrics
    const [activity, contributors, languages, structure] = await Promise.all([
      getCommitActivity(owner, repo, token),
      getContributors(owner, repo, token),
      getLanguages(owner, repo, token),
      getRepoTree(owner, repo, metadata.defaultBranch, token)
    ]);

    // 4. Score Generation
    const score = generateScore(activity, contributors, structure);

    const analysisData: RepoAnalysisData = {
      metadata,
      activity,
      contributors,
      languages,
      structure,
      quality: score.breakdown,
      score,
    };

    // 5. Cache Result
    await setCachedAnalysis(repoKey, analysisData);

    // 6. Return Response
    return NextResponse.json({
      status: 'success',
      cached: false,
      data: analysisData
    } as ApiResponse);

  } catch (error: unknown) {
    console.error('API Error:', error);
    return NextResponse.json({
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred during analysis'
    } as ApiResponse, { status: 500 });
  }
}
