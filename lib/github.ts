import { RepoFile, RepoMeta } from '@/types';

const BASE_URL = 'https://api.github.com';

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid URL');
  }

  if (parsed.hostname !== 'github.com') {
    throw new Error('Only github.com URLs are supported');
  }

  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length !== 2) {
    throw new Error('GitHub URL must include exactly owner/repo');
  }

  const owner = segments[0];
  const repo = segments[1].replace(/\.git$/, '');

  if (!owner || !repo) {
    throw new Error('Invalid owner or repository name');
  }

  return { owner, repo };
}

export async function fetchRepoMeta(owner: string, repo: string): Promise<RepoMeta> {
  const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}`, {
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Repository not found: ${owner}/${repo}`);
  }

  const data = await response.json();
  return {
    owner,
    repo,
    defaultBranch: data.default_branch,
    description: data.description,
    stars: data.stargazers_count,
    language: data.language,
  };
}

export async function fetchTree(owner: string, repo: string, branch = 'HEAD'): Promise<RepoFile[]> {
  const response = await fetch(
    `${BASE_URL}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: buildHeaders() }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch tree for ${owner}/${repo}`);
  }

  const data = await response.json();

  if (data.truncated) {
    console.warn(`GitHub tree is truncated for ${owner}/${repo}`);
  }

  return (data.tree as RepoFile[]).filter((entry) => entry.type === 'blob' || entry.type === 'tree');
}

export async function fetchFile(owner: string, repo: string, path: string): Promise<string | null> {
  try {
    const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/contents/${path}`, {
      headers: buildHeaders(),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.content) {
      return null;
    }

    return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

export async function fetchReadme(owner: string, repo: string): Promise<string> {
  try {
    const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/readme`, {
      headers: buildHeaders(),
    });

    if (!response.ok) {
      return '';
    }

    const data = await response.json();
    if (!data.content) {
      return '';
    }

    return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');
  } catch {
    return '';
  }
}
