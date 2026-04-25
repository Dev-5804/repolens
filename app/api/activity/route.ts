import { NextResponse } from 'next/server';
import { getCommitsByDateRange } from '@/lib/github';

export async function GET(request: Request) {
  const token = request.headers.get('x-github-token');

  if (!token) {
    return NextResponse.json({ status: 'error', code: 'MISSING_TOKEN', message: 'A GitHub Personal Access Token is required.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const repo = searchParams.get('repo');
  const since = searchParams.get('since') || '';
  const until = searchParams.get('until') || '';

  if (!repo || !repo.includes('/')) {
    return NextResponse.json({ status: 'error', message: 'Invalid repository format' }, { status: 400 });
  }

  const [owner, repoName] = repo.split('/');

  try {
    const data = await getCommitsByDateRange(owner, repoName, since, until, token);
    return NextResponse.json({ status: 'success', data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ status: 'error', code: 'UNAUTHORIZED', message: 'Invalid or expired GitHub Token' }, { status: 401 });
    }
    if (message === 'REPO_NOT_FOUND') {
      return NextResponse.json({ status: 'error', code: 'REPO_NOT_FOUND', message: 'Repository not found' }, { status: 404 });
    }
    if (message === 'RATE_LIMIT') {
      return NextResponse.json({ status: 'error', code: 'RATE_LIMIT', message: 'API rate limit exceeded' }, { status: 403 });
    }
    return NextResponse.json({ status: 'error', message: 'Failed to fetch activity data' }, { status: 500 });
  }
}
