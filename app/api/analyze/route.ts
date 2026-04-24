import { NextRequest, NextResponse } from 'next/server';
import { getRepoMetadata, getCommitActivity, getContributors, getLanguages, getRepoTree } from '@/lib/github';
import { generateScore } from '@/lib/scorer';
import { getCachedAnalysis, setCachedAnalysis } from '@/lib/cache';
import { RepoAnalysisData, ApiResponse } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
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
      metadata = await getRepoMetadata(owner, repo);
    } catch (err: any) {
      if (err.message === 'REPO_NOT_FOUND') {
         return NextResponse.json({ status: 'error', code: 'REPO_NOT_FOUND', message: 'Repository does not exist' } as ApiResponse, { status: 404 });
      }
      if (err.message === 'RATE_LIMIT') {
         return NextResponse.json({ status: 'error', code: 'RATE_LIMIT', message: 'API rate limit exceeded' } as ApiResponse, { status: 429 });
      }
      throw err;
    }

    // 3. Parallel Fetching for remaining metrics
    const [activity, contributors, languages, structure] = await Promise.all([
      getCommitActivity(owner, repo),
      getContributors(owner, repo),
      getLanguages(owner, repo),
      getRepoTree(owner, repo, metadata.defaultBranch)
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

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred during analysis'
    } as ApiResponse, { status: 500 });
  }
}
