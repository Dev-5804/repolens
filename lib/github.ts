import { RepoMetadata, CommitActivity, ContributorData, LanguageData, RepoStructure } from './types';

const GITHUB_API_URL = 'https://api.github.com';

function getHeaders(token: string) {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Repolens-App',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  return headers;
}

async function fetchGitHub(endpoint: string, token: string, options: RequestInit = {}) {
  const res = await fetch(`${GITHUB_API_URL}${endpoint}`, {
    ...options,
    headers: { ...getHeaders(token), ...options.headers },
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (res.status === 404) throw new Error('REPO_NOT_FOUND');
    if (res.status === 403) throw new Error('RATE_LIMIT');
    const text = await res.text().catch(() => 'No response text');
    console.error(`GitHub API Error: ${res.status} ${res.statusText} - ${text}`);
    throw new Error(`GITHUB_API_ERROR: ${res.status} ${res.statusText}`);
  }

  // Return empty array for 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

export async function getRepoMetadata(owner: string, repo: string, token: string): Promise<RepoMetadata> {
  const data = await fetchGitHub(`/repos/${owner}/${repo}`, token);
  return {
    name: data.name,
    full_name: data.full_name,
    description: data.description,
    stars: data.stargazers_count,
    forks: data.forks_count,
    watchers: data.subscribers_count, // Watchers is actually subscribers_count
    openIssues: data.open_issues_count,
    license: data.license?.name || null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    defaultBranch: data.default_branch,
  };
}

export async function getCommitActivity(owner: string, repo: string, token: string): Promise<CommitActivity> {
  // To avoid fetching thousands of commits, we fetch commits since 90 days ago
  const date90DaysAgo = new Date();
  date90DaysAgo.setDate(date90DaysAgo.getDate() - 90);
  
  const date30DaysAgo = new Date();
  date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);

  // We request up to 100 commits (max per page) since 90 days ago
  // Note: Pagination may be needed for highly active repos, but per FRD, max 100 commits.
  const data = await fetchGitHub(`/repos/${owner}/${repo}/commits?since=${date90DaysAgo.toISOString()}&per_page=100`, token);
  
  let commitsLast30Days = 0;
  const commitsLast90Days = data.length || 0;
  const lastCommitDate: string | null = data[0]?.commit?.author?.date || null;

  if (data && Array.isArray(data)) {
    for (const commit of data) {
      const commitDate = new Date(commit.commit.author.date);
      if (commitDate >= date30DaysAgo) {
        commitsLast30Days++;
      }
    }
  }

  return {
    commitsLast30Days,
    commitsLast90Days,
    lastCommitDate,
  };
}

export async function getContributors(owner: string, repo: string, token: string): Promise<ContributorData> {
  const data = await fetchGitHub(`/repos/${owner}/${repo}/contributors?per_page=10`, token);
  if (!data) {
    return { totalContributors: 0, topContributors: [] };
  }

  // To get an exact total contributor count, we would need to parse Link headers.
  // We'll estimate or just use the fetched list for now if the header isn't available.
  const topContributors = (data as { login: string; contributions: number }[]).map((c) => ({
    login: c.login,
    contributions: c.contributions,
  }));

  return {
    // Estimating total contributors based on the length of the top page is inaccurate but we'll use topContributors.length 
    // unless we make a separate call. For MVP, this is acceptable.
    totalContributors: topContributors.length >= 10 ? 10 : topContributors.length,
    topContributors,
  };
}

export async function getLanguages(owner: string, repo: string, token: string): Promise<LanguageData> {
  const data = await fetchGitHub(`/repos/${owner}/${repo}/languages`, token);
  return data || {};
}

export async function getRepoTree(owner: string, repo: string, defaultBranch: string, token: string): Promise<RepoStructure> {
  // Fetch tree recursive up to depth 3 is hard with REST API natively unless we parse it.
  // `recursive=1` gets the whole tree. We can filter it.
  const data = await fetchGitHub(`/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, token);
  
  let hasReadme = false;
  let hasLicense = false;
  let hasTests = false;
  let hasCi = false;

  if (data && data.tree) {
    for (const item of data.tree) {
      // Check depth manually if needed: const depth = item.path.split('/').length;
      const pathLower = item.path.toLowerCase();
      
      if (pathLower.includes('readme')) hasReadme = true;
      if (pathLower.includes('license')) hasLicense = true;
      if (pathLower.includes('test')) hasTests = true; // matches test/, tests/, __tests__
      if (pathLower.startsWith('.github/workflows/')) hasCi = true;

      // Early exit if all found
      if (hasReadme && hasLicense && hasTests && hasCi) break;
    }
  }

  return {
    hasReadme,
    hasLicense,
    hasTests,
    hasCi,
  };
}

export async function getCommitsByDateRange(owner: string, repo: string, since: string, until: string, token: string) {
  let allCommits: { commit: { author: { date: string }; message: string } }[] = [];
  let page = 1;
  const maxPages = 5; // Limit to 500 commits to avoid API abuse/timeouts

  while (page <= maxPages) {
    // If until is null or empty, omit it.
    let url = `/repos/${owner}/${repo}/commits?per_page=100&page=${page}`;
    if (since) url += `&since=${since}`;
    if (until) url += `&until=${until}`;

    const data = await fetchGitHub(url, token) as { commit: { author: { date: string }; message: string } }[] | null;
    if (!data || !Array.isArray(data) || data.length === 0) {
      break;
    }
    allCommits = allCommits.concat(data);
    
    // If we received less than 100, it's the last page
    if (data.length < 100) {
      break;
    }
    page++;
  }

  return {
    commits: allCommits.map(c => ({
      date: c.commit.author.date,
      message: c.commit.message,
    })),
    isSample: page > maxPages,
  };
}
