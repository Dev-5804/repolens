# RepoLens — Product Requirements Document
**GitHub Repository Analyzer | v1.0 | March 2026**
*For use with AI IDEs: Cursor, Windsurf, GitHub Copilot*

---

| Stack | AI Model | Deploy | Status |
|---|---|---|---|
| Next.js 16.1.6 (App Router) | Google Gemini API | Vercel + Railway | v1.0 — Ready to Build |

---

## Table of Contents
1. [Purpose & Scope](#1-purpose--scope)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Project Folder Structure](#3-project-folder-structure)
4. [TypeScript Types](#4-typescript-types)
5. [API Route Specifications](#5-api-route-specifications)
6. [Library Module Specifications](#6-library-module-specifications)
7. [Component Specifications](#7-component-specifications)
8. [Functional Requirements](#8-functional-requirements)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Environment Variables](#10-environment-variables)
11. [Setup Instructions for AI IDE](#11-setup-instructions-for-ai-ide)
12. [Acceptance Criteria](#12-acceptance-criteria)
13. [Known Constraints & Edge Cases](#13-known-constraints--edge-cases)
14. [Future Scope](#14-future-scope-post-v10)

---

## 1. Purpose & Scope

RepoLens is a fullstack web application that accepts any public GitHub repository URL and produces a structured, AI-generated breakdown of the codebase. It helps developers onboard faster, understand unfamiliar code, and identify basic security and quality issues — without manually exploring every file.

### 1.1 Problem Statement

Developers frequently need to evaluate or contribute to unfamiliar repositories. Manual exploration is slow, inconsistent, and misses non-obvious patterns like implicit dependencies or hardcoded secrets. There is no fast, structured way to get an architectural overview of a repository without reading its code.

### 1.2 Target Users

- **Open-source contributors** — evaluating a new repo before contributing
- **Engineering teams** — onboarding new hires onto existing codebases
- **Security reviewers** — quickly scanning repos for exposed credentials
- **Tech leads** — auditing third-party dependencies before adoption

### 1.3 Out of Scope (v1.0)

- Private GitHub repositories (requires OAuth — post-v1)
- Non-GitHub hosts (GitLab, Bitbucket)
- Deep AST-level code analysis or execution of repository code
- User accounts, saved history, or persistent storage (post-v1)

---

## 2. Tech Stack & Architecture

| Layer | Technology / Notes |
|---|---|
| Framework | Next.js 14 with App Router — fullstack, SSR, API routes as serverless functions |
| Language | TypeScript throughout — strict mode enabled |
| Styling | Tailwind CSS — utility-first, no additional component library required |
| AI | Google Gemini API via `@google/generative-ai` SDK (`gemini-1.5-flash` for speed) |
| GitHub Data | GitHub REST API v3 — no auth required for public repos; add `GITHUB_TOKEN` to raise rate limits |
| Graph UI | React Flow (`@xyflow/react`) for interactive dependency graph rendering |
| Validation | Zod — runtime schema validation for API inputs and Gemini JSON output |
| Deployment | Vercel (app + API routes) — connect GitHub repo, set env vars, deploy |
| Rate Limiting | Upstash Ratelimit — IP-based, protect `/api/*` from abuse |

---

## 3. Project Folder Structure

The AI IDE must scaffold the project exactly as follows. Every file listed here must be created.

```
repolens/
├── app/
│   ├── layout.tsx                  ← Root layout, metadata, global font
│   ├── page.tsx                    ← Home page — URL input form
│   ├── analyze/
│   │   └── page.tsx                ← Results page (receives repoUrl via searchParams)
│   └── api/
│       ├── analyze/
│       │   └── route.ts            ← POST /api/analyze — core orchestration endpoint
│       └── graph/
│           └── route.ts            ← POST /api/graph — dependency graph endpoint
├── components/
│   ├── RepoForm.tsx                ← URL input form with validation
│   ├── AnalysisResult.tsx          ← Tabbed results container
│   ├── tabs/
│   │   ├── OverviewTab.tsx         ← AI summary + architecture overview
│   │   ├── StructureTab.tsx        ← File tree viewer
│   │   ├── DependenciesTab.tsx     ← Dependency list with versions
│   │   ├── GraphTab.tsx            ← React Flow dependency graph
│   │   └── SecurityTab.tsx         ← Secrets scan + readiness score
│   ├── SecurityBadge.tsx           ← Color-coded safe/warning/critical badge
│   ├── LoadingSkeleton.tsx         ← Skeleton loader for analysis wait state
│   └── ErrorMessage.tsx            ← Styled error display component
├── lib/
│   ├── github.ts                   ← GitHub API wrapper (fetchTree, fetchFile, fetchReadme)
│   ├── analyzer.ts                 ← Static analysis engine (structure, deps, security)
│   ├── gemini.ts                   ← Gemini API wrapper (analyzeRepo function)
│   └── ratelimit.ts                ← Upstash rate limiter setup
├── types/
│   └── index.ts                    ← All shared TypeScript interfaces
├── .env.local                      ← GEMINI_API_KEY, GITHUB_TOKEN (optional)
├── next.config.ts
└── tailwind.config.ts
```

---

## 4. TypeScript Types

All interfaces below must be defined in `types/index.ts` and imported from there — never redefined inline.

```typescript
// ── Input ──────────────────────────────────────────────────────────────────
export interface AnalyzeRequest {
  repoUrl: string; // e.g. https://github.com/owner/repo
}

// ── GitHub API ─────────────────────────────────────────────────────────────
export interface RepoFile {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
}

// ── Static analysis output ─────────────────────────────────────────────────
export interface AnalysisData {
  owner: string;
  repo: string;
  files: RepoFile[];
  dependencies: Record<string, string>;    // { 'react': '^18.0.0' }
  devDependencies: Record<string, string>;
  detectedLanguages: string[];
  securityIssues: SecurityIssue[];
  readinessScore: ReadinessScore;
  readme: string;
}

export interface SecurityIssue {
  file: string;
  type: string;    // 'hardcoded-secret' | 'env-exposed' | etc.
  severity: 'low' | 'medium' | 'high' | 'critical';
  line?: number;
  description: string;
}

export interface ReadinessScore {
  score: number;           // 0-100
  hasTests: boolean;
  hasCI: boolean;
  hasDockerfile: boolean;
  hasLinting: boolean;
  hasEnvExample: boolean;
}

// ── Gemini output (strict JSON schema) ─────────────────────────────────────
export interface GeminiSummary {
  overview: string;
  architecture: string;
  components: { name: string; role: string; path: string }[];
  techStack: string[];
  observations: string[];
  productionScore: number;
}

// ── Full API response ───────────────────────────────────────────────────────
export interface AnalyzeResponse {
  analysis: AnalysisData;
  summary: GeminiSummary;
}

// ── Graph types (React Flow format) ────────────────────────────────────────
export interface GraphNode {
  id: string;
  data: { label: string };
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}
```

---

## 5. API Route Specifications

### 5.1 POST /api/analyze

| Field | Detail |
|---|---|
| Method | POST |
| Auth | None (public endpoint) — rate limited by IP |
| Request body | `{ "repoUrl": "https://github.com/owner/repo" }` |
| Success (200) | `AnalyzeResponse` JSON object |
| Error (400) | `{ "error": "Invalid GitHub URL" }` |
| Error (429) | `{ "error": "Rate limit exceeded" }` |
| Error (500) | `{ "error": "Analysis failed", "detail": "..." }` |
| Timeout | 60 seconds max (Vercel hobby plan limit) |

**Orchestration logic inside `route.ts`:**

1. Validate input URL with Zod — reject non-GitHub URLs immediately
2. Apply IP-based rate limit (max 10 requests / 1 hour per IP)
3. Call `lib/github.ts → fetchTree(owner, repo)` to get all file paths
4. Call `lib/github.ts → fetchFile()` for `package.json`, `requirements.txt`, `go.mod`, `Gemfile` (whichever exist)
5. Call `lib/github.ts → fetchReadme(owner, repo)`
6. Call `lib/analyzer.ts → runAnalysis()` — returns `AnalysisData`
7. Call `lib/gemini.ts → analyzeRepo(analysisData)` — returns `GeminiSummary`
8. Return combined `AnalyzeResponse` to the client

### 5.2 POST /api/graph

| Field | Detail |
|---|---|
| Method | POST |
| Request body | `{ "repoUrl": "https://github.com/owner/repo" }` |
| Success (200) | `{ "nodes": GraphNode[], "edges": GraphEdge[] }` — React Flow compatible |
| Purpose | Separate endpoint — lazy-loaded when the Graph tab is clicked |

---

## 6. Library Module Specifications

### 6.1 lib/github.ts

Wraps GitHub REST API v3. All functions are async and throw typed errors on failure.

```typescript
// Fetches the full recursive file tree of a repo
export async function fetchTree(owner: string, repo: string): Promise<RepoFile[]>
// → GET https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD?recursive=1

// Fetches raw content of a specific file (base64 decoded)
export async function fetchFile(owner: string, repo: string, path: string): Promise<string | null>
// → GET https://api.github.com/repos/{owner}/{repo}/contents/{path}

// Fetches README.md content
export async function fetchReadme(owner: string, repo: string): Promise<string>
// → GET https://api.github.com/repos/{owner}/{repo}/readme

// Always set these headers on every request:
// {
//   'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,   ← only if token is present
//   'Accept': 'application/vnd.github+json',
//   'X-GitHub-Api-Version': '2022-11-28'
// }
```

### 6.2 lib/analyzer.ts

Pure function module — no side effects, no API calls. Takes raw GitHub data and returns `AnalysisData`.

```typescript
export function runAnalysis(params: {
  owner: string;
  repo: string;
  files: RepoFile[];
  packageJson: string | null;
  readme: string;
}): AnalysisData

// Internal functions to implement:
//
// extractDependencies(packageJson: string): Record<string, string>
//   → Parse package.json, return dependencies + devDependencies
//
// detectLanguages(files: RepoFile[]): string[]
//   → Infer from file extensions (.ts, .py, .go, .rs, etc.)
//
// scanForSecrets(files: RepoFile[], contents: string[]): SecurityIssue[]
//   → Apply regex patterns below against file contents
//
// scoreReadiness(files: RepoFile[]): ReadinessScore
//   → Check file paths for test dirs, CI, Dockerfile, lint configs
```

**Secret scanning regex patterns:**

```typescript
const SECRET_PATTERNS = [
  { type: 'api-key',      regex: /(?:api[_-]?key|apikey)\s*=\s*['"`][a-zA-Z0-9]{20,}['"`]/i },
  { type: 'password',     regex: /(?:password|passwd|pwd)\s*=\s*['"`].{6,}['"`]/i },
  { type: 'aws-key',      regex: /AKIA[0-9A-Z]{16}/ },
  { type: 'private-key',  regex: /-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----/ },
  { type: 'jwt-secret',   regex: /(?:jwt[_-]?secret|secret[_-]?key)\s*=\s*['"`].+['"`]/i },
  { type: 'database-url', regex: /(?:mongodb|postgres|mysql|redis):\/\/.+:.+@/i },
  { type: 'github-token', regex: /ghp_[a-zA-Z0-9]{36}/ },
];

// Readiness score criteria (+20 points each):
// hasTests:      /(__tests__|spec|test)\//.test(filePath)
// hasCI:         /.github\/workflows/.test(filePath)
// hasDockerfile: filePath === 'Dockerfile'
// hasLinting:    /(.eslintrc|.prettierrc|biome.json)/.test(filePath)
// hasEnvExample: /\.env\.example/.test(filePath)
```

### 6.3 lib/gemini.ts

Wraps the Google Generative AI SDK. Returns a validated `GeminiSummary` object.

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function analyzeRepo(data: AnalysisData): Promise<GeminiSummary>

// System prompt to use (return ONLY valid JSON, no markdown fences):
//
// You are a senior software architect. Analyze the repository data provided
// and return ONLY a JSON object matching this exact schema:
// {
//   "overview":        string,   // 2-3 sentence plain-English project description
//   "architecture":    string,   // Architectural pattern (MVC, microservices, monorepo...)
//   "components":      Array<{ name: string, role: string, path: string }>,
//   "techStack":       string[], // All detected technologies
//   "observations":    string[], // 3-5 notable insights about the codebase
//   "productionScore": number    // 0-100 readiness estimate
// }
// Return nothing else. No explanation. No markdown backticks.

// Post-processing steps:
// 1. Strip any ```json fences if present
// 2. JSON.parse()
// 3. Validate with Zod schema below
// 4. Return typed GeminiSummary

// Zod validation schema:
const GeminiSummarySchema = z.object({
  overview:        z.string(),
  architecture:    z.string(),
  components:      z.array(z.object({ name: z.string(), role: z.string(), path: z.string() })),
  techStack:       z.array(z.string()),
  observations:    z.array(z.string()),
  productionScore: z.number().min(0).max(100),
});
```

---

## 7. Component Specifications

### 7.1 app/page.tsx — Home Page
- Renders a centered hero section with the RepoLens name and a one-line tagline
- Renders `<RepoForm />` component
- No server-side data fetching on this page

### 7.2 components/RepoForm.tsx
- Controlled input field with placeholder `https://github.com/owner/repo`
- Client-side validation: must match `/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/`
- On submit: navigate to `/analyze?url=<encoded-repo-url>`
- Show inline validation error if URL format is wrong
- Disable submit button and show spinner while navigating

### 7.3 app/analyze/page.tsx — Results Page
- Read `repoUrl` from `searchParams`
- On mount: call `POST /api/analyze` with the repoUrl
- Show `<LoadingSkeleton />` while waiting (expected 5–15 seconds)
- On success: render `<AnalysisResult data={response} />`
- On error: render `<ErrorMessage message={error} />`
- Show repo name and GitHub link in the page header

### 7.4 components/AnalysisResult.tsx
- 5 tabs: **Overview**, **Structure**, **Dependencies**, **Graph**, **Security**
- Default active tab: Overview
- Graph tab lazy-loads by calling `POST /api/graph` separately on tab click
- Each tab renders its corresponding component from `components/tabs/`

### 7.5 components/tabs/OverviewTab.tsx
- Display `summary.overview` in a prominent card
- Display `summary.architecture` as a labeled badge
- Render `summary.components` as a 3-column card grid: name, path, role
- Render `summary.techStack` as pill badges
- Render `summary.observations` as a bulleted list
- Show `summary.productionScore` as a circular progress indicator (0–100)

### 7.6 components/tabs/StructureTab.tsx
- Render `analysis.files` as an expandable tree view grouped by top-level directory
- Show file count and total size summary at the top
- Color-code by file type (`.ts` → blue, `.json` → amber, `.md` → green, etc.)

### 7.7 components/tabs/DependenciesTab.tsx
- Two sections: **Production Dependencies** and **Dev Dependencies**
- Each renders as a searchable table: package name | version | "View on npm" link
- Show total dependency count for each section

### 7.8 components/tabs/GraphTab.tsx
- Uses `@xyflow/react` (React Flow) to render an interactive dependency graph
- Nodes = top-level directories + major dependencies
- Edges = detected import relationships
- Controls: zoom in/out, fit view, minimap
- Node click shows a tooltip with details
- Show a spinner while `/api/graph` loads

### 7.9 components/tabs/SecurityTab.tsx
- Top: `<SecurityBadge />` showing overall security status
- Readiness score breakdown: checklist of `hasTests`, `hasCI`, `hasDockerfile`, `hasLinting`, `hasEnvExample`
- If no issues: display a green "No secrets detected" confirmation
- If issues found: list each `SecurityIssue` with file, type, severity, description
- Severity color coding: `critical` = red, `high` = orange, `medium` = amber, `low` = gray

### 7.10 components/SecurityBadge.tsx
- Props: `{ score: number, issueCount: number }`
- Renders one of three states:
  - **SAFE** — green, 0 issues
  - **WARNING** — amber, 1–3 issues
  - **CRITICAL** — red, 4+ issues

---

## 8. Functional Requirements

| # | ID | Requirement | Priority |
|---|---|---|---|
| 1 | FR-001 | User can submit any valid public GitHub repository URL | P0 |
| 2 | FR-002 | System fetches full recursive file tree via GitHub API | P0 |
| 3 | FR-003 | System parses `package.json` to extract production and dev dependencies | P0 |
| 4 | FR-004 | System detects programming languages from file extensions | P0 |
| 5 | FR-005 | System scans file contents for hardcoded secrets using regex patterns | P0 |
| 6 | FR-006 | System computes a 0–100 production readiness score | P0 |
| 7 | FR-007 | System sends analysis data to Gemini and receives a structured JSON summary | P0 |
| 8 | FR-008 | Results display in a tabbed UI with 5 distinct sections | P0 |
| 9 | FR-009 | Dependency graph renders as an interactive React Flow diagram | P1 |
| 10 | FR-010 | Loading skeleton is shown while analysis runs (expected 5–15 seconds) | P0 |
| 11 | FR-011 | All API errors are surfaced with a user-friendly error message | P0 |
| 12 | FR-012 | API routes enforce IP-based rate limiting (max 10 requests/hour per IP) | P1 |
| 13 | FR-013 | Application is fully responsive on mobile and desktop | P1 |
| 14 | FR-014 | User can copy the AI summary as plain text with one click | P2 |
| 15 | FR-015 | Gemini JSON output is validated with Zod — malformed responses return a 500 error | P0 |

> **Priority key:** P0 = must-have for launch, P1 = important, P2 = nice-to-have

---

## 9. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | Full analysis must complete within 60 seconds (Vercel hobby limit). Gemini call must complete in < 30s. |
| Reliability | GitHub API failures must not crash the app — return partial analysis with error flags where applicable. |
| Security | API keys must only exist in server-side `.env.local` — never exposed to the client bundle. |
| Scalability | Each API route is stateless and serverless — no shared memory between requests. |
| Accessibility | All interactive elements must have accessible labels. Color is never the sole indicator of status. |
| SEO | Home page must have appropriate meta title and description set in `layout.tsx`. |
| TypeScript | No use of `any` type. All functions must have explicit return type annotations. |
| Error handling | All async functions must be wrapped in try/catch. Errors must be logged server-side. |

---

## 10. Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | **Required.** Get from Google AI Studio → [aistudio.google.com](https://aistudio.google.com) → "Get API Key". Free tier available. |
| `GITHUB_TOKEN` | **Optional but recommended.** Personal access token with `read:public_repo` scope. Raises rate limit from 60 to 5,000 requests/hour. |

> ⚠️ Both variables must be added to Vercel project settings under **Settings → Environment Variables** before deploying.

---

## 11. Setup Instructions for AI IDE

### 11.1 Install

```bash
# 1. Scaffold the project
npx create-next-app@latest repolens --typescript --tailwind --app --eslint
cd repolens

# 2. Install all dependencies
npm install @google/generative-ai @xyflow/react zod
npm install @upstash/ratelimit @upstash/redis

# 3. Create .env.local
echo 'GEMINI_API_KEY=your_key_here' >> .env.local
echo 'GITHUB_TOKEN=your_token_here' >> .env.local

# 4. Run dev server
npm run dev
```

### 11.2 Build Order for AI IDE

Implement files in this exact order to avoid missing dependency errors:

1. `types/index.ts` — all interfaces first
2. `lib/github.ts` — GitHub API wrapper
3. `lib/analyzer.ts` — static analysis engine
4. `lib/gemini.ts` — Gemini wrapper
5. `lib/ratelimit.ts` — rate limiter setup
6. `app/api/analyze/route.ts` — core API route
7. `app/api/graph/route.ts` — graph API route
8. `components/RepoForm.tsx`
9. `components/LoadingSkeleton.tsx` + `components/ErrorMessage.tsx`
10. `components/SecurityBadge.tsx`
11. `components/tabs/*` — all 5 tab components
12. `components/AnalysisResult.tsx` — composes tab components
13. `app/page.tsx` — home page
14. `app/analyze/page.tsx` — results page
15. `app/layout.tsx` — root layout and metadata

---

## 12. Acceptance Criteria

The project is considered complete when **all** of the following pass:

- **AC-01** — Submitting `https://github.com/facebook/react` returns a full analysis result without errors
- **AC-02** — The Overview tab displays a non-empty AI-generated summary, architecture label, and tech stack pills
- **AC-03** — The Structure tab displays a file tree with at least 10 entries for the react repo
- **AC-04** — The Dependencies tab lists `react-dom` and other known dependencies with correct versions
- **AC-05** — The Graph tab renders an interactive React Flow graph with at least 5 nodes
- **AC-06** — The Security tab shows the readiness score checklist with at least `hasCI = true` for the react repo
- **AC-07** — Submitting an invalid URL like `not-a-url` shows a validation error before any API call is made
- **AC-08** — The loading skeleton is visible for the full duration of the analysis call
- **AC-09** — `GEMINI_API_KEY` is never present in any client-side bundle (verify via browser DevTools → Network tab)
- **AC-10** — The app builds without TypeScript errors: `npm run build` exits with code 0

---

## 13. Known Constraints & Edge Cases

- **Large repos** — Repos with 10,000+ files may hit the GitHub API tree truncation limit. Check for `truncated: true` in the API response and surface a warning to the user.
- **Gemini rate limits** — Free tier allows 15 requests/minute. Ensure the UI disables the submit button during and briefly after analysis to prevent spamming.
- **Large package.json** — Monorepos with 200+ dependencies should have their dependency list truncated before sending to Gemini to stay within token limits.
- **Binary files** — Files with extensions `.png`, `.jpg`, `.gif`, `.woff`, `.ttf`, `.ico`, `.pdf` must be excluded from the secret scanning pass.
- **Base64 encoding** — The GitHub API returns file content base64-encoded. Always decode with `Buffer.from(content, 'base64').toString('utf-8')` before processing.
- **No package.json** — Python, Go, and Rust projects won't have a `package.json`. The Dependencies tab should show a "No package.json detected" notice rather than an error.

---

## 14. Future Scope (Post v1.0)

| Feature | Description |
|---|---|
| Private repos | GitHub OAuth login flow to analyze private repositories with user consent |
| Persistent storage | Save analysis results to Postgres (Supabase/Railway) for shareable permalinks |
| Diff mode | Compare two branches or two repos side-by-side |
| PDF export | Export the full analysis report as a formatted PDF |
| Browser extension | Chrome/Firefox extension to trigger analysis directly from any github.com page |
| Webhooks | Re-analyze automatically when a new commit is pushed to a monitored repo |
| Multi-language deps | Support `requirements.txt`, `go.mod`, `Cargo.toml`, `Gemfile` alongside `package.json` |

---

*RepoLens PRD v1.0 — Generated March 2026*