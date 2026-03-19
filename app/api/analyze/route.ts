import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { runAnalysis } from '@/lib/analyzer';
import { analyzeRepo } from '@/lib/gemini';
import { fetchFile, fetchReadme, fetchRepoMeta, fetchTree, parseGitHubUrl } from '@/lib/github';
import { checkRateLimit } from '@/lib/ratelimit';
import { AnalyzeErrorResponse, AnalyzeResponse, RepoFile } from '@/types';

const RequestSchema = z.object({
  repoUrl: z
    .string()
    .url()
    .refine((url) => {
      try {
        const parsed = new URL(url);
        const segments = parsed.pathname.split('/').filter(Boolean);
        return parsed.hostname === 'github.com' && segments.length === 2 && !url.endsWith('/');
      } catch {
        return false;
      }
    }, 'Invalid GitHub URL'),
});

const KEY_FILE_NAMES = new Set([
  'package.json',
  'requirements.txt',
  'go.mod',
  'Cargo.toml',
  'Gemfile',
  'pyproject.toml',
  'composer.json',
  'docker-compose.yml',
  'docker-compose.yaml',
  '.env.example',
  '.env.sample',
]);

function pickKeyFiles(files: RepoFile[]): string[] {
  return files
    .filter((file) => file.type === 'blob')
    .map((file) => file.path)
    .filter((path) => KEY_FILE_NAMES.has(path.split('/').pop() ?? ''));
}

function pickPackageJsonPath(files: string[]): string | null {
  if (files.includes('package.json')) {
    return 'package.json';
  }

  return files.find((path) => path.endsWith('/package.json')) ?? null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rateLimit = await checkRateLimit(req);
  if (!rateLimit.success) {
    return NextResponse.json<AnalyzeErrorResponse>(
      { error: 'Rate limit exceeded. Try again in 1 hour.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<AnalyzeErrorResponse>({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<AnalyzeErrorResponse>({ error: 'Invalid GitHub URL' }, { status: 400 });
  }

  let owner: string;
  let repo: string;
  try {
    ({ owner, repo } = parseGitHubUrl(parsed.data.repoUrl));
  } catch {
    return NextResponse.json<AnalyzeErrorResponse>(
      { error: 'Could not parse GitHub URL. Expected: https://github.com/owner/repo' },
      { status: 400 }
    );
  }

  try {
    const [meta, files, readme] = await Promise.all([
      fetchRepoMeta(owner, repo),
      fetchTree(owner, repo),
      fetchReadme(owner, repo),
    ]);

    const keyFiles = pickKeyFiles(files);

    const keyFileEntries = await Promise.all(
      keyFiles.map(async (path) => {
        const content = await fetchFile(owner, repo, path);
        return [path, content ?? ''] as const;
      })
    );

    const fileContents = Object.fromEntries(keyFileEntries) as Record<string, string>;
    const packageJsonPath = pickPackageJsonPath(keyFiles);

    const analysis = runAnalysis({
      owner,
      repo,
      files,
      packageJson: packageJsonPath ? (fileContents[packageJsonPath] ?? null) : null,
      readme,
      fileContents,
    });

    analysis.meta = meta;

    const summary = await analyzeRepo(analysis);
    const response: AnalyzeResponse = { analysis, summary };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/api/analyze]', detail);

    return NextResponse.json<AnalyzeErrorResponse>(
      { error: 'Analysis failed', detail },
      { status: 500 }
    );
  }
}
