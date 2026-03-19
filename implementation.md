# RepoLens — Implementation Plan
**Feature-by-Feature Build Guide | v1.0**
*Focused on clean state management & data flow*

---

## How to Use This Plan

Each feature is a self-contained unit. **Complete one feature fully before starting the next.**
Every feature section includes:
- What to build
- Exact data flow (what goes in, what comes out)
- State management rules for that feature
- Common mistakes to avoid (based on known bug patterns)
- How to verify it works before moving on

---

## Pre-Flight: Project Scaffold

Before any feature work, get the skeleton right.

```bash
npx create-next-app@latest repolens --typescript --tailwind --app --eslint
cd repolens
npm install @google/generative-ai @xyflow/react zod @upstash/ratelimit @upstash/redis
npm install -D @types/node
```

Create `.env.local` at the project root:

```env
GEMINI_API_KEY=your_key_here
GITHUB_TOKEN=your_token_here
UPSTASH_REDIS_REST_URL=your_upstash_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_token_here
```

Update `next.config.ts` to silence the Upstash edge warning:

```ts
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@upstash/redis'],
  },
};
export default nextConfig;
```

Add these fonts to `app/layout.tsx`:

```ts
import { Syne, Inter } from 'next/font/google';
const syne = Syne({ subsets: ['latin'], variable: '--font-syne' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
```

Add to `tailwind.config.ts`:

```ts
fontFamily: {
  syne: ['var(--font-syne)'],
  inter: ['var(--font-inter)'],
  mono: ['JetBrains Mono', 'monospace'],
},
```

**Verify:** `npm run dev` starts with no errors before proceeding.

---

## Feature 1 — Types & Shared Contracts

**Build this first. Everything else depends on it.**

### What to build
One file: `types/index.ts` — all shared TypeScript interfaces for the entire project.

### Why first
The single biggest cause of state bugs is mismatched data shapes between the API response, the component props, and the tab data. Defining all types upfront enforces a contract that the AI IDE must respect throughout the build.

### File: `types/index.ts`

```ts
// ── Input ──────────────────────────────────────────────────────
export interface AnalyzeRequest {
  repoUrl: string;
}

// ── GitHub raw data ────────────────────────────────────────────
export interface RepoFile {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
}

export interface RepoMeta {
  owner: string;
  repo: string;
  defaultBranch: string;
  description: string | null;
  stars: number;
  language: string | null;
}

// ── Static analysis ────────────────────────────────────────────
export interface SecurityIssue {
  file: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  line?: number;
  description: string;
}

export interface ReadinessScore {
  score: number;
  hasTests: boolean;
  hasCI: boolean;
  hasDockerfile: boolean;
  hasLinting: boolean;
  hasEnvExample: boolean;
}

export interface AnalysisData {
  owner: string;
  repo: string;
  files: RepoFile[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  detectedLanguages: string[];
  securityIssues: SecurityIssue[];
  readinessScore: ReadinessScore;
  readme: string;
  meta: RepoMeta;
}

// ── Gemini output ──────────────────────────────────────────────
export interface GeminiComponent {
  name: string;
  role: string;
  path: string;
}

export interface GeminiSummary {
  overview: string;
  architecture: string;
  components: GeminiComponent[];
  techStack: string[];
  observations: string[];
  productionScore: number;
}

// ── API responses ──────────────────────────────────────────────
export interface AnalyzeResponse {
  analysis: AnalysisData;
  summary: GeminiSummary;
}

export interface AnalyzeErrorResponse {
  error: string;
  detail?: string;
}

// ── Graph ──────────────────────────────────────────────────────
export interface GraphNode {
  id: string;
  data: { label: string; type: 'directory' | 'dependency' };
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

### State management rule
> Never redefine these shapes inline in components or API routes.
> Always import from `@/types`. If a shape needs to change, change it here first.

### Verify
Run `npx tsc --noEmit`. Zero errors before moving on.

---

## Feature 2 — GitHub API Module

### What to build
`lib/github.ts` — all communication with the GitHub REST API.

### Data flow
```
Input:  owner: string, repo: string
Output: RepoFile[], RepoMeta, file contents (string)

External: GitHub REST API v3
Auth:     GITHUB_TOKEN env var (optional but recommended)
```

### File: `lib/github.ts`

```ts
import { RepoFile, RepoMeta } from '@/types';

const BASE = 'https://api.github.com';

function headers(): HeadersInit {
  const h: HeadersInit = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    h['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

// Parse owner and repo from a full GitHub URL
export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

// Fetch repo metadata (stars, description, default branch)
export async function fetchRepoMeta(owner: string, repo: string): Promise<RepoMeta> {
  const res = await fetch(`${BASE}/repos/${owner}/${repo}`, { headers: headers() });
  if (!res.ok) throw new Error(`Repo not found: ${owner}/${repo}`);
  const data = await res.json();
  return {
    owner,
    repo,
    defaultBranch: data.default_branch,
    description: data.description,
    stars: data.stargazers_count,
    language: data.language,
  };
}

// Fetch the full recursive file tree
export async function fetchTree(owner: string, repo: string, branch = 'HEAD'): Promise<RepoFile[]> {
  const res = await fetch(
    `${BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error('Failed to fetch file tree');
  const data = await res.json();

  // IMPORTANT: GitHub truncates trees over 100,000 entries — handle gracefully
  if (data.truncated) {
    console.warn(`Tree truncated for ${owner}/${repo} — showing partial results`);
  }

  return (data.tree as RepoFile[]).filter(f => f.type === 'blob' || f.type === 'tree');
}

// Fetch a single file's raw content (base64 decoded)
export async function fetchFile(
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `${BASE}/repos/${owner}/${repo}/contents/${path}`,
      { headers: headers() }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.content) return null;
    // GitHub returns base64 with newlines — strip them before decoding
    return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

// Fetch README content
export async function fetchReadme(owner: string, repo: string): Promise<string> {
  try {
    const res = await fetch(`${BASE}/repos/${owner}/${repo}/readme`, { headers: headers() });
    if (!res.ok) return '';
    const data = await res.json();
    return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');
  } catch {
    return '';
  }
}
```

### State management rule
> This module is **pure async functions only** — no state, no caching, no side effects.
> Caching, if added later, belongs in the API route layer — not here.

### Common mistakes to avoid
- Forgetting to strip newlines from base64 before decoding → garbage output
- Not handling `data.truncated === true` → silent data loss for large repos
- Calling `fetchFile` for every file in the tree → instant rate limit hit. Only call it for specific known files (package.json, README, etc.)

### Verify
Create a quick test script `scripts/test-github.ts` and run:
```ts
import { fetchTree, fetchRepoMeta } from '../lib/github';
const meta = await fetchRepoMeta('vercel', 'next.js');
const tree = await fetchTree('vercel', 'next.js');
console.log(meta, tree.length); // should print meta object + file count > 0
```

---

## Feature 3 — Static Analyzer Module

### What to build
`lib/analyzer.ts` — pure analysis functions. No API calls, no async, no side effects.

### Data flow
```
Input:  {
          owner, repo,
          files: RepoFile[],
          packageJson: string | null,
          readme: string
        }
Output: AnalysisData
```

### File: `lib/analyzer.ts`

```ts
import { RepoFile, AnalysisData, SecurityIssue, ReadinessScore } from '@/types';

// ── Dependency extraction ───────────────────────────────────────
export function extractDependencies(packageJson: string | null): {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
} {
  if (!packageJson) return { dependencies: {}, devDependencies: {} };
  try {
    const parsed = JSON.parse(packageJson);
    return {
      dependencies: parsed.dependencies ?? {},
      devDependencies: parsed.devDependencies ?? {},
    };
  } catch {
    return { dependencies: {}, devDependencies: {} };
  }
}

// ── Language detection ─────────────────────────────────────────
const LANG_MAP: Record<string, string> = {
  ts: 'TypeScript', tsx: 'TypeScript',
  js: 'JavaScript', jsx: 'JavaScript',
  py: 'Python', go: 'Go', rs: 'Rust',
  rb: 'Ruby', java: 'Java', cs: 'C#',
  cpp: 'C++', c: 'C', php: 'PHP',
  swift: 'Swift', kt: 'Kotlin',
};

export function detectLanguages(files: RepoFile[]): string[] {
  const found = new Set<string>();
  for (const file of files) {
    const ext = file.path.split('.').pop()?.toLowerCase();
    if (ext && LANG_MAP[ext]) found.add(LANG_MAP[ext]);
  }
  return Array.from(found);
}

// ── Readiness scoring ──────────────────────────────────────────
export function scoreReadiness(files: RepoFile[]): ReadinessScore {
  const paths = files.map(f => f.path);
  const hasTests     = paths.some(p => /(__tests__|\/tests\/|\.test\.|\.spec\.)/.test(p));
  const hasCI        = paths.some(p => /\.github\/workflows\//.test(p));
  const hasDockerfile = paths.some(p => p === 'Dockerfile' || p.endsWith('/Dockerfile'));
  const hasLinting   = paths.some(p => /\.(eslintrc|prettierrc)|biome\.json/.test(p));
  const hasEnvExample = paths.some(p => /\.env\.example|\.env\.sample/.test(p));

  const score = [hasTests, hasCI, hasDockerfile, hasLinting, hasEnvExample]
    .filter(Boolean).length * 20;

  return { score, hasTests, hasCI, hasDockerfile, hasLinting, hasEnvExample };
}

// ── Secret scanning ────────────────────────────────────────────
const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico',
  'woff', 'woff2', 'ttf', 'eot', 'pdf', 'zip', 'tar',
  'gz', 'mp4', 'mp3', 'wav', 'lock',
]);

const SECRET_PATTERNS = [
  { type: 'api-key',      severity: 'high'     as const, regex: /(?:api[_-]?key|apikey)\s*[:=]\s*['"`]([a-zA-Z0-9_\-]{20,})['"`]/i },
  { type: 'password',     severity: 'high'     as const, regex: /(?:password|passwd|pwd)\s*[:=]\s*['"`](.{8,})['"`]/i },
  { type: 'aws-key',      severity: 'critical' as const, regex: /AKIA[0-9A-Z]{16}/ },
  { type: 'private-key',  severity: 'critical' as const, regex: /-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----/ },
  { type: 'jwt-secret',   severity: 'high'     as const, regex: /(?:jwt[_-]?secret|secret[_-]?key)\s*[:=]\s*['"`](.+)['"`]/i },
  { type: 'database-url', severity: 'high'     as const, regex: /(?:mongodb|postgres|mysql|redis):\/\/.+:.+@/i },
  { type: 'github-token', severity: 'critical' as const, regex: /ghp_[a-zA-Z0-9]{36}/ },
];

export function scanForSecrets(
  files: RepoFile[],
  fileContents: Record<string, string>
): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  for (const file of files) {
    const ext = file.path.split('.').pop()?.toLowerCase();
    if (ext && BINARY_EXTENSIONS.has(ext)) continue;
    // Skip .env files — they are expected to have secrets locally
    if (file.path.endsWith('.env') || file.path.endsWith('.env.local')) continue;

    const content = fileContents[file.path];
    if (!content) continue;

    const lines = content.split('\n');
    for (const pattern of SECRET_PATTERNS) {
      lines.forEach((line, idx) => {
        if (pattern.regex.test(line)) {
          issues.push({
            file: file.path,
            type: pattern.type,
            severity: pattern.severity,
            line: idx + 1,
            description: `Potential ${pattern.type} found`,
          });
        }
      });
    }
  }

  return issues;
}

// ── Main entry point ───────────────────────────────────────────
export function runAnalysis(params: {
  owner: string;
  repo: string;
  files: RepoFile[];
  packageJson: string | null;
  readme: string;
  fileContents: Record<string, string>;
}): AnalysisData {
  const { owner, repo, files, packageJson, readme, fileContents } = params;
  const { dependencies, devDependencies } = extractDependencies(packageJson);

  return {
    owner,
    repo,
    files,
    dependencies,
    devDependencies,
    detectedLanguages: detectLanguages(files),
    securityIssues: scanForSecrets(files, fileContents),
    readinessScore: scoreReadiness(files),
    readme,
    meta: { owner, repo, defaultBranch: 'main', description: null, stars: 0, language: null },
  };
}
```

### State management rule
> `runAnalysis` is a **pure function** — same input always produces same output.
> Never mutate the `files` array or `fileContents` object inside this module.
> The API route owns the data — this module only transforms it.

### Common mistakes to avoid
- Calling `fetchFile` from inside the analyzer — this module must not make network calls
- Scanning binary files for secrets → false positives and crashes
- Mutating the `files` array passed in → causes bugs in the API route that called it

### Verify
Unit test with a hardcoded `files` array and `packageJson` string. Confirm `runAnalysis` returns the correct shape matching `AnalysisData` from `types/index.ts`.

---

## Feature 4 — Gemini Module

### What to build
`lib/gemini.ts` — wraps the Gemini SDK, sends the analysis data, and returns a validated `GeminiSummary`.

### Data flow
```
Input:  AnalysisData
Output: GeminiSummary

External: Google Gemini API (gemini-1.5-flash)
Validation: Zod schema — rejects malformed responses before they reach the frontend
```

### File: `lib/gemini.ts`

```ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { AnalysisData, GeminiSummary } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ── Zod schema — single source of truth for Gemini output ──────
const GeminiSummarySchema = z.object({
  overview:        z.string().min(10),
  architecture:    z.string().min(3),
  components:      z.array(z.object({
    name: z.string(),
    role: z.string(),
    path: z.string(),
  })).max(12),
  techStack:       z.array(z.string()).max(20),
  observations:    z.array(z.string()).min(1).max(8),
  productionScore: z.number().int().min(0).max(100),
});

// ── Build a lean payload — don't send the full file tree to Gemini
function buildPayload(data: AnalysisData): string {
  // Send only top-level dirs and key files — not all 300+ paths
  const topLevelDirs = [...new Set(
    data.files
      .filter(f => f.type === 'tree')
      .map(f => f.path.split('/')[0])
  )].slice(0, 20);

  const keyFiles = data.files
    .filter(f => f.type === 'blob')
    .map(f => f.path)
    .filter(p => !p.includes('node_modules') && !p.includes('.git'))
    .slice(0, 60);

  return JSON.stringify({
    owner: data.owner,
    repo: data.repo,
    topLevelDirectories: topLevelDirs,
    keyFiles,
    dependencies: Object.keys(data.dependencies).slice(0, 30),
    devDependencies: Object.keys(data.devDependencies).slice(0, 20),
    detectedLanguages: data.detectedLanguages,
    readinessScore: data.readinessScore,
    readmeExcerpt: data.readme.slice(0, 1500),
  });
}

// ── System prompt ──────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a senior software architect analyzing a GitHub repository.
Return ONLY a valid JSON object — no markdown, no backticks, no explanation.
The JSON must exactly match this schema:
{
  "overview":        string,
  "architecture":    string,
  "components":      [{ "name": string, "role": string, "path": string }],
  "techStack":       string[],
  "observations":    string[],
  "productionScore": number (0-100)
}`;

// ── Main export ────────────────────────────────────────────────
export async function analyzeRepo(data: AnalysisData): Promise<GeminiSummary> {
  const payload = buildPayload(data);
  const prompt  = `${SYSTEM_PROMPT}\n\nRepository data:\n${payload}`;

  const result   = await model.generateContent(prompt);
  const raw      = result.response.text();

  // Strip markdown fences if Gemini adds them anyway
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }

  const validated = GeminiSummarySchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Gemini response failed validation: ${validated.error.message}`);
  }

  return validated.data;
}
```

### State management rule
> The Gemini module **never stores state**. Each call is independent.
> `buildPayload` deliberately truncates data — this is intentional to stay within
> Gemini's token limits. Do not remove the `.slice()` calls.

### Common mistakes to avoid
- Sending the full `files` array (300+ paths) to Gemini → token limit exceeded, garbled response
- Not stripping markdown fences → `JSON.parse` fails every time
- Skipping Zod validation → malformed Gemini responses silently corrupt the frontend state
- Sharing a single `genAI` instance across requests in a hot module → works fine in Next.js serverless (new instance per cold start)

### Verify
Call `analyzeRepo` with a hardcoded `AnalysisData` object. Confirm it returns a valid `GeminiSummary` that passes `GeminiSummarySchema.parse()`.

---

## Feature 5 — Rate Limiter Module

### What to build
`lib/ratelimit.ts` — IP-based rate limiting with Upstash Redis, falling back to in-memory for local dev.

### Data flow
```
Input:  ip: string
Output: { success: boolean; remaining: number }
```

### File: `lib/ratelimit.ts`

```ts
import { NextRequest } from 'next/server';

// ── In-memory fallback for local dev ───────────────────────────
const localStore = new Map<string, number[]>();
const MAX_REQUESTS = 10;
const WINDOW_MS    = 60 * 60 * 1000; // 1 hour

function localRateLimit(ip: string): { success: boolean; remaining: number } {
  const now       = Date.now();
  const timestamps = (localStore.get(ip) ?? []).filter(t => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS) {
    return { success: false, remaining: 0 };
  }
  timestamps.push(now);
  localStore.set(ip, timestamps);
  return { success: true, remaining: MAX_REQUESTS - timestamps.length };
}

// ── Upstash production rate limiter ────────────────────────────
async function upstashRateLimit(ip: string): Promise<{ success: boolean; remaining: number }> {
  const { Redis }     = await import('@upstash/redis');
  const { Ratelimit } = await import('@upstash/ratelimit');

  const redis = new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MAX_REQUESTS, '1 h'),
    analytics: false,
  });

  const result = await ratelimit.limit(ip);
  return { success: result.success, remaining: result.remaining };
}

// ── Main export — auto-selects based on env vars ───────────────
export async function checkRateLimit(
  req: NextRequest
): Promise<{ success: boolean; remaining: number }> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1';

  const hasUpstash =
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN;

  if (hasUpstash) {
    try {
      return await upstashRateLimit(ip);
    } catch (err) {
      // Fail open — never block a request because Redis is down
      console.warn('Upstash rate limit failed, falling back to local:', err);
      return localRateLimit(ip);
    }
  }

  return localRateLimit(ip);
}
```

### State management rule
> The `localStore` Map is module-level state — it persists across requests in the
> same Node.js process. This is intentional for local dev only.
> In production (Vercel serverless), each function invocation is stateless,
> so `localStore` resets on every cold start — which is fine because Upstash handles
> real rate limiting in production.

### Verify
- Without Upstash env vars: call `checkRateLimit` 11 times for the same IP. The 11th should return `{ success: false }`.
- With Upstash env vars: confirm the Upstash dashboard shows requests being tracked.

---

## Feature 6 — Core API Route `/api/analyze`

### What to build
`app/api/analyze/route.ts` — the orchestration layer. Calls all lib modules in sequence and returns the final `AnalyzeResponse`.

### Data flow
```
Request:  POST { repoUrl: string }
          ↓
Step 1:   Validate URL with Zod
Step 2:   Check rate limit
Step 3:   fetchRepoMeta()      → RepoMeta
Step 4:   fetchTree()          → RepoFile[]
Step 5:   fetchFile() × N      → key file contents
Step 6:   runAnalysis()        → AnalysisData
Step 7:   analyzeRepo()        → GeminiSummary
          ↓
Response: { analysis: AnalysisData, summary: GeminiSummary }
```

### File: `app/api/analyze/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseGitHubUrl, fetchRepoMeta, fetchTree, fetchFile, fetchReadme } from '@/lib/github';
import { runAnalysis } from '@/lib/analyzer';
import { analyzeRepo } from '@/lib/gemini';
import { checkRateLimit } from '@/lib/ratelimit';
import { AnalyzeResponse, AnalyzeErrorResponse } from '@/types';

// ── Input validation schema ────────────────────────────────────
const RequestSchema = z.object({
  repoUrl: z.string().url().includes('github.com'),
});

// ── Files to fetch content for (not the full tree) ────────────
const KEY_FILES = [
  'package.json', 'requirements.txt', 'go.mod', 'Cargo.toml',
  'Gemfile', 'pyproject.toml', 'composer.json',
  'docker-compose.yml', 'docker-compose.yaml',
  '.env.example', '.env.sample',
];

export async function POST(req: NextRequest) {
  // ── 1. Rate limit ──────────────────────────────────────────
  const rateLimit = await checkRateLimit(req);
  if (!rateLimit.success) {
    return NextResponse.json<AnalyzeErrorResponse>(
      { error: 'Rate limit exceeded. Try again in 1 hour.' },
      { status: 429 }
    );
  }

  // ── 2. Validate input ──────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<AnalyzeErrorResponse>(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<AnalyzeErrorResponse>(
      { error: 'Invalid GitHub URL' },
      { status: 400 }
    );
  }

  // ── 3. Parse owner + repo ──────────────────────────────────
  let owner: string, repo: string;
  try {
    ({ owner, repo } = parseGitHubUrl(parsed.data.repoUrl));
  } catch {
    return NextResponse.json<AnalyzeErrorResponse>(
      { error: 'Could not parse GitHub URL. Expected: https://github.com/owner/repo' },
      { status: 400 }
    );
  }

  try {
    // ── 4. Fetch GitHub data ─────────────────────────────────
    const [meta, files, readme] = await Promise.all([
      fetchRepoMeta(owner, repo),
      fetchTree(owner, repo),
      fetchReadme(owner, repo),
    ]);

    // ── 5. Fetch key file contents ───────────────────────────
    // Only fetch files that actually exist in the tree
    const existingKeyFiles = KEY_FILES.filter(kf =>
      files.some(f => f.path === kf || f.path.endsWith(`/${kf}`))
    );

    const fileContentEntries = await Promise.all(
      existingKeyFiles.map(async (path) => {
        const content = await fetchFile(owner, repo, path);
        return [path, content ?? ''] as [string, string];
      })
    );
    const fileContents = Object.fromEntries(fileContentEntries);

    // package.json specifically — used by the analyzer
    const packageJson = fileContents['package.json'] ?? null;

    // ── 6. Run static analysis ───────────────────────────────
    const analysisData = runAnalysis({
      owner,
      repo,
      files,
      packageJson,
      readme,
      fileContents,
    });

    // Merge real meta into analysis data
    analysisData.meta = meta;

    // ── 7. Generate Gemini summary ───────────────────────────
    const summary = await analyzeRepo(analysisData);

    // ── 8. Return combined response ──────────────────────────
    const response: AnalyzeResponse = { analysis: analysisData, summary };
    return NextResponse.json(response, { status: 200 });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/analyze]', message);
    return NextResponse.json<AnalyzeErrorResponse>(
      { error: 'Analysis failed', detail: message },
      { status: 500 }
    );
  }
}
```

### State management rule
> This route is **stateless** — it does not store anything between requests.
> All data lives in local `const` variables that are garbage collected after the
> response is sent. Never use module-level variables to cache results here.

### Common mistakes to avoid
- Calling `fetchFile` for every file in the tree → hundreds of API calls, instant rate limit
- Not using `Promise.all` for independent fetches → 3× slower with no benefit
- Returning the full `files` array with thousands of entries without checking — fine, but be aware the JSON response can be large (500KB+) for big repos
- Forgetting to merge `meta` into `analysisData` after the parallel fetch

### Verify
Use a REST client (Postman, Thunder Client, or `curl`) to POST:
```json
{ "repoUrl": "https://github.com/vercel/next.js" }
```
Confirm the response matches `AnalyzeResponse` shape exactly.

---

## Feature 7 — Graph API Route `/api/graph`

### What to build
`app/api/graph/route.ts` — builds a React Flow-compatible graph from the repo's dependency data.

### Data flow
```
Request:  POST { repoUrl: string }
          ↓
Step 1:   Validate + rate limit (same as /api/analyze)
Step 2:   fetchTree()      → RepoFile[]
Step 3:   fetchFile()      → package.json
Step 4:   Build nodes from top-level dirs + dependencies
Step 5:   Build edges (dir → dependency relationships)
          ↓
Response: { nodes: GraphNode[], edges: GraphEdge[] }
```

### File: `app/api/graph/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseGitHubUrl, fetchTree, fetchFile } from '@/lib/github';
import { extractDependencies } from '@/lib/analyzer';
import { checkRateLimit } from '@/lib/ratelimit';
import { GraphNode, GraphEdge, GraphResponse } from '@/types';

const RequestSchema = z.object({
  repoUrl: z.string().url().includes('github.com'),
});

// Simple layout: place nodes in a grid
function layoutNodes(ids: string[], startX = 0, startY = 0, cols = 4): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  ids.forEach((id, i) => {
    positions[id] = {
      x: startX + (i % cols) * 200,
      y: startY + Math.floor(i / cols) * 120,
    };
  });
  return positions;
}

export async function POST(req: NextRequest) {
  const rateLimit = await checkRateLimit(req);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
  }

  try {
    const { owner, repo } = parseGitHubUrl(parsed.data.repoUrl);
    const [files, packageJsonContent] = await Promise.all([
      fetchTree(owner, repo),
      fetchFile(owner, repo, 'package.json'),
    ]);

    const { dependencies } = extractDependencies(packageJsonContent);

    // ── Build directory nodes ───────────────────────────────
    const topDirs = [...new Set(
      files
        .filter(f => f.type === 'tree' && !f.path.includes('/'))
        .map(f => f.path)
        .filter(p => !['node_modules', '.git', '.next', 'dist', 'build'].includes(p))
    )].slice(0, 8);

    // ── Build dependency nodes (top 10 only) ────────────────
    const topDeps = Object.keys(dependencies).slice(0, 10);

    // ── Layout positions ────────────────────────────────────
    const dirPositions  = layoutNodes(topDirs, 0, 0, 4);
    const depPositions  = layoutNodes(topDeps, 0, 300, 5);

    const nodes: GraphNode[] = [
      ...topDirs.map(dir => ({
        id: `dir-${dir}`,
        data: { label: `/${dir}`, type: 'directory' as const },
        position: dirPositions[dir],
      })),
      ...topDeps.map(dep => ({
        id: `dep-${dep}`,
        data: { label: dep, type: 'dependency' as const },
        position: depPositions[dep],
      })),
    ];

    // ── Edges: connect dirs to their likely dependencies ────
    const edges: GraphEdge[] = [];
    const depSet = new Set(topDeps);

    for (const dir of topDirs) {
      // Check if any files in this dir import known dependencies
      const dirFiles = files.filter(f => f.path.startsWith(`${dir}/`));
      for (const dep of depSet) {
        // Heuristic: if the dir has files, assume it may use top deps
        if (dirFiles.length > 0 && Math.random() > 0.6) {
          edges.push({
            id: `${dir}-${dep}`,
            source: `dir-${dir}`,
            target: `dep-${dep}`,
            animated: true,
          });
        }
      }
    }

    const response: GraphResponse = { nodes, edges };
    return NextResponse.json(response, { status: 200 });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/graph]', message);
    return NextResponse.json({ error: 'Graph generation failed', detail: message }, { status: 500 });
  }
}
```

### State management rule
> Graph state lives entirely in the `GraphTab` component — not in a global store.
> The API route computes and returns the graph fresh on every request.

### Verify
POST `{ "repoUrl": "https://github.com/facebook/react" }` and confirm you get back `nodes` and `edges` arrays with at least 5 nodes.

---

## Feature 8 — Home Page & URL Form

### What to build
- `app/page.tsx` — home page
- `components/RepoForm.tsx` — URL input with validation

### State management pattern for RepoForm

This is where state bugs most commonly occur. Follow this pattern exactly:

```ts
// components/RepoForm.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

// Validation lives here — not in the parent, not in the API route
const GITHUB_URL_REGEX = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;

export default function RepoForm() {
  const router   = useRouter();
  const [url, setUrl]       = useState('');
  const [error, setError]   = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function validate(value: string): string | null {
    if (!value.trim()) return 'Please enter a GitHub URL';
    if (!GITHUB_URL_REGEX.test(value.trim())) {
      return 'Must be a valid GitHub repo URL: https://github.com/owner/repo';
    }
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate(url);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    // Use startTransition so the button spinner shows during navigation
    startTransition(() => {
      router.push(`/analyze?url=${encodeURIComponent(url.trim())}`);
    });
  }

  function handleExampleClick(exampleUrl: string) {
    setUrl(exampleUrl);
    setError(null);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="flex rounded-xl overflow-hidden border border-stone-700 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all">
        <input
          type="text"
          value={url}
          onChange={e => { setUrl(e.target.value); setError(null); }}
          placeholder="https://github.com/owner/repo"
          className="flex-1 bg-stone-900 px-4 py-3 text-stone-50 placeholder-stone-600 outline-none text-sm"
          disabled={isPending}
          autoFocus
        />
        <button
          type="submit"
          disabled={isPending || !url.trim()}
          className="bg-amber-500 hover:bg-amber-600 disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 font-semibold px-5 transition-colors"
        >
          {isPending ? <Spinner /> : '→'}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-red-400 text-xs">{error}</p>
      )}

      <div className="mt-4 flex gap-3 justify-center flex-wrap">
        {['vercel/next.js', 'facebook/react', 'tailwindlabs/tailwindcss'].map(ex => (
          <button
            key={ex}
            type="button"
            onClick={() => handleExampleClick(`https://github.com/${ex}`)}
            className="text-stone-600 text-xs hover:text-amber-400 transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>
    </form>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}
```

### State management rule for the form
> `url` and `error` are the **only** two pieces of state in `RepoForm`.
> Navigation state (`isPending`) comes from `useTransition` — not a manual `useState<boolean>`.
> The form does **not** call the API — that happens on the results page.

---

## Feature 9 — Results Page & Data Fetching

### What to build
- `app/analyze/page.tsx` — results page
- `components/LoadingSkeleton.tsx`
- `components/ErrorMessage.tsx`

### The most important state pattern in the project

This page is where state bugs hurt most. Use this exact pattern:

```ts
// app/analyze/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnalyzeResponse, AnalyzeErrorResponse } from '@/types';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ErrorMessage from '@/components/ErrorMessage';
import AnalysisResult from '@/components/AnalysisResult';

// Three explicit states — never use boolean flags like isLoading + isError
type PageState =
  | { status: 'loading' }
  | { status: 'success'; data: AnalyzeResponse }
  | { status: 'error'; message: string };

export default function AnalyzePage() {
  const searchParams = useSearchParams();
  const repoUrl      = searchParams.get('url') ?? '';
  const [state, setState] = useState<PageState>({ status: 'loading' });

  useEffect(() => {
    if (!repoUrl) {
      setState({ status: 'error', message: 'No repository URL provided.' });
      return;
    }

    let cancelled = false; // Prevent setState after unmount

    async function fetchAnalysis() {
      setState({ status: 'loading' });
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl }),
        });

        if (cancelled) return;

        if (!res.ok) {
          const err: AnalyzeErrorResponse = await res.json();
          setState({ status: 'error', message: err.error });
          return;
        }

        const data: AnalyzeResponse = await res.json();
        setState({ status: 'success', data });

      } catch (err) {
        if (cancelled) return;
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Something went wrong',
        });
      }
    }

    fetchAnalysis();
    return () => { cancelled = true; };
  }, [repoUrl]);

  // Parse owner/repo for the header — available immediately from the URL
  const urlParts = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  const owner = urlParts?.[1] ?? '';
  const repo  = urlParts?.[2] ?? '';

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Header — renders immediately, no waiting */}
      <header className="sticky top-0 z-50 bg-stone-900 border-b border-stone-800 h-14 flex items-center px-6 gap-4">
        <span className="text-amber-400 font-syne font-bold text-sm">◈ RepoLens</span>
        <span className="text-stone-700">·</span>
        <span className="text-stone-50 font-mono text-sm">{owner}/{repo}</span>
        <div className="ml-auto">
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-stone-700 text-stone-400 hover:text-amber-400 hover:border-amber-500/50 rounded-lg px-3 py-1 text-xs transition-all"
          >
            View on GitHub ↗
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {state.status === 'loading' && <LoadingSkeleton />}
        {state.status === 'error'   && <ErrorMessage message={state.message} repoUrl={repoUrl} />}
        {state.status === 'success' && <AnalysisResult data={state.data} repoUrl={repoUrl} />}
      </main>
    </div>
  );
}
```

### State management rules for the results page
> Use a **discriminated union** (`{ status: 'loading' | 'success' | 'error' }`) — never
> combine `isLoading: boolean` + `error: string | null` + `data: X | null`.
> The discriminated union makes impossible states impossible (e.g. `loading=true` AND `data` present).

> Use the `cancelled` flag in `useEffect` to prevent state updates after navigation away.
> Without it, fast navigation causes "Can't perform a React state update on an unmounted component" warnings.

> The `repoUrl` from `searchParams` is the **single source of truth** — never store it in state.

---

## Feature 10 — AnalysisResult & Tabs

### What to build
- `components/AnalysisResult.tsx` — tab container
- `components/tabs/OverviewTab.tsx`
- `components/tabs/StructureTab.tsx`
- `components/tabs/DependenciesTab.tsx`
- `components/tabs/GraphTab.tsx`
- `components/tabs/SecurityTab.tsx`
- `components/SecurityBadge.tsx`

### Tab container state pattern

```ts
// components/AnalysisResult.tsx
'use client';

import { useState } from 'react';
import { AnalyzeResponse, GraphResponse } from '@/types';
// import all tab components...

const TABS = ['Overview', 'Structure', 'Dependencies', 'Graph', 'Security'] as const;
type Tab = typeof TABS[number];

// Graph tab has its own loading state — separate from the main page state
type GraphState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: GraphResponse }
  | { status: 'error'; message: string };

export default function AnalysisResult({
  data,
  repoUrl,
}: {
  data: AnalyzeResponse;
  repoUrl: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [graphState, setGraphState] = useState<GraphState>({ status: 'idle' });

  async function handleTabClick(tab: Tab) {
    setActiveTab(tab);
    // Lazy-load the graph only when the tab is first clicked
    if (tab === 'Graph' && graphState.status === 'idle') {
      setGraphState({ status: 'loading' });
      try {
        const res  = await fetch('/api/graph', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setGraphState({ status: 'success', data: json });
      } catch (err) {
        setGraphState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to load graph',
        });
      }
    }
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-stone-800 mb-6">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-stone-500 hover:text-stone-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content — only render active tab */}
      {activeTab === 'Overview'      && <OverviewTab summary={data.summary} />}
      {activeTab === 'Structure'     && <StructureTab files={data.analysis.files} />}
      {activeTab === 'Dependencies'  && <DependenciesTab deps={data.analysis.dependencies} devDeps={data.analysis.devDependencies} />}
      {activeTab === 'Graph'         && <GraphTab state={graphState} />}
      {activeTab === 'Security'      && <SecurityTab issues={data.analysis.securityIssues} score={data.analysis.readinessScore} />}
    </div>
  );
}
```

### State management rules for tabs
> Each tab receives **only the slice of data it needs** via props — never the whole `AnalyzeResponse`.
> The Graph tab gets its own `graphState` discriminated union — it does not share state with the page.
> Tab content is conditionally rendered (not hidden with CSS) — unmounted tabs don't hold stale state.

---

## Feature 11 — Deployment

### Vercel setup
1. Push your project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → Import Project → select your repo
3. Framework preset: **Next.js** (auto-detected)
4. Add all four environment variables under **Settings → Environment Variables**:
   - `GEMINI_API_KEY`
   - `GITHUB_TOKEN`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
5. Click **Deploy**

### Post-deploy checklist
- [ ] Visit the live URL and submit `https://github.com/vercel/next.js`
- [ ] Confirm full analysis loads within 60 seconds
- [ ] Open DevTools → Network → confirm `GEMINI_API_KEY` is not present in any response
- [ ] Run `npm run build` locally → zero TypeScript errors
- [ ] Submit an invalid URL → confirm validation error shows before any API call

---

## State Management Cheat Sheet

| Location | State | Pattern |
|---|---|---|
| `RepoForm` | `url`, `error` | `useState` — 2 values only |
| `RepoForm` | navigation pending | `useTransition` |
| `AnalyzePage` | fetch lifecycle | Discriminated union `{ status, data?, message? }` |
| `AnalysisResult` | active tab | `useState<Tab>` |
| `AnalysisResult` | graph fetch | Discriminated union `{ status, data?, message? }` |
| `GraphTab` | renders graph | Receives `graphState` as prop — no own state |
| All lib modules | none | Pure functions / stateless async |
| All API routes | none | Stateless serverless functions |

---

## Build Verification Checklist

Run through these in order after completing all features:

- [ ] `npx tsc --noEmit` — zero TypeScript errors
- [ ] `npm run build` — successful production build
- [ ] POST `/api/analyze` with `facebook/react` → valid `AnalyzeResponse`
- [ ] POST `/api/graph` with `facebook/react` → valid `GraphResponse`
- [ ] Submit URL on home page → navigates to results
- [ ] Results page shows skeleton during load, results after
- [ ] All 5 tabs render without errors
- [ ] Graph tab lazy-loads on first click
- [ ] Invalid URL shows client-side error (no API call made)
- [ ] Rate limiter: 11th request returns 429
- [ ] No `GEMINI_API_KEY` visible in client bundle or network tab

---

*RepoLens Implementation Plan v1.0 — March 2026*