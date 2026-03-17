# RepoLens — UI/UX & Workflow Specification
**Visual Design Guide + User Flow | v1.1 — Amber & Lime Edition**

---

## Table of Contents
1. [Design Principles](#1-design-principles)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Page-by-Page UI Breakdown](#4-page-by-page-ui-breakdown)
5. [Component Visual Specs](#5-component-visual-specs)
6. [Complete User Workflow](#6-complete-user-workflow)
7. [States & Transitions](#7-states--transitions)
8. [Responsive Behavior](#8-responsive-behavior)
9. [Micro-interactions & Animations](#9-micro-interactions--animations)

---

## 1. Design Principles

| Principle | Meaning in practice |
|---|---|
| **Developer-first** | Dense information display is fine. Devs are comfortable with data-rich UIs. |
| **Warm & Distinct** | Amber and lime create an earthy, premium feel that stands out from every blue-heavy dev tool. |
| **Dark by default** | Very dark warm-tinted background — not cold gray-950, but a warmer `stone-950` base. |
| **Clarity over decoration** | Every visual element must serve a purpose. Color is used to communicate, not just decorate. |
| **Progressive disclosure** | Show the most important info first (Overview), let the user drill into details (Structure, Graph). |

---

## 2. Color System

### Brand Colors — Amber & Lime

These are the two primary brand colors used for all interactive and highlight elements.

| Role | Tailwind Class | Hex | Usage |
|---|---|---|---|
| Brand primary | `text-amber-400` | #fbbf24 | Logo, active tabs, primary links |
| Brand primary bg | `bg-amber-500` | #f59e0b | Primary buttons |
| Brand primary hover | `bg-amber-600` | #d97706 | Button hover state |
| Brand accent | `text-lime-400` | #a3e635 | Secondary highlights, badges, icons |
| Brand accent bg | `bg-lime-500` | #84cc16 | Accent buttons, active indicators |
| Brand accent hover | `bg-lime-600` | #65a30d | Accent button hover |

### Base Palette — Warm Dark

Do **not** use cold `gray-*` classes. Use `stone-*` everywhere for a warmer, more cohesive feel.

| Role | Tailwind Class | Hex | Usage |
|---|---|---|---|
| Background | `bg-stone-950` | #0c0a09 | Page background |
| Surface | `bg-stone-900` | #1c1917 | Cards, panels, tab bars |
| Surface elevated | `bg-stone-800` | #292524 | Hover states, dropdowns |
| Border | `border-stone-700` | #44403c | All borders |
| Border subtle | `border-stone-800` | #292524 | Dividers, internal separators |
| Text primary | `text-stone-50` | #fafaf9 | Headings, important labels |
| Text secondary | `text-stone-300` | #d6d3d1 | Body text, descriptions |
| Text muted | `text-stone-500` | #78716c | Metadata, file sizes, timestamps |

### Semantic Colors

| Meaning | Text | Background | Border | Usage |
|---|---|---|---|---|
| Success / Safe | `text-lime-400` | `bg-lime-950` | `border-lime-800` | No security issues, passed checks |
| Warning | `text-amber-400` | `bg-amber-950` | `border-amber-800` | Minor issues, partial readiness |
| Danger / Critical | `text-red-400` | `bg-red-950` | `border-red-800` | Secrets found, critical failures |
| Info / Neutral | `text-stone-300` | `bg-stone-800` | `border-stone-700` | General info, dev dependencies |
| Highlight | `text-lime-300` | `bg-lime-950` | `border-lime-800` | Special callouts, key observations |

### Color Usage Rules

- **Amber** = primary brand, interactive elements, the logo, active states, and primary CTA buttons
- **Lime** = success states, security badges, production score (when high), tech stack pills, and accent highlights
- **Stone** = all backgrounds, surfaces, borders, and neutral text — never cold gray
- **Red** = danger only — security critical issues, errors
- **Never use blue** anywhere in this project

---

## 3. Typography

```
Font stack:  Syne (headings) + Inter (body) + JetBrains Mono (code)
Load all three via next/font/google in layout.tsx
```

Syne gives headings a geometric, slightly editorial character that pairs well with the amber/lime palette.

| Element | Font | Tailwind Class | Size | Weight |
|---|---|---|---|---|
| Page title / logo | Syne | `text-4xl font-bold` | 36px | 700 |
| Section heading | Syne | `text-2xl font-semibold` | 24px | 600 |
| Card heading | Inter | `text-lg font-medium` | 18px | 500 |
| Body text | Inter | `text-sm text-stone-300` | 14px | 400 |
| Small / meta | Inter | `text-xs text-stone-500` | 12px | 400 |
| Code / paths | JetBrains Mono | `font-mono text-sm` | 14px | 400 |
| Badge / pill | Inter | `text-xs font-medium` | 12px | 500 |

---

## 4. Page-by-Page UI Breakdown

---

### 4.1 Home Page (`/`)

**Layout:** Full-height centered column. Nothing else on the page.

```
+-----------------------------------------------------+  bg-stone-950
|                                                     |
|                                                     |
|          o  RepoLens                                |  text-amber-400, Syne, 48px bold
|                                                     |
|    Understand any GitHub repository instantly.      |  text-stone-400, Inter, 16px
|                                                     |
|  +----------------------------------------------- + |
|  |  https://github.com/owner/repo            [->] | |  border-stone-700, focus:border-amber-500
|  +------------------------------------------------+ |  [->] button: bg-amber-500 hover:bg-amber-600
|                                                     |
|  Try:  vercel/next.js  .  facebook/react  .  ...   |  text-stone-600, hover:text-amber-400
|                                                     |
+-----------------------------------------------------+
```

**Details:**
- Background: `bg-stone-950`
- Logo icon: diamond symbol or custom SVG in `text-amber-400`
- Logo text: `font-syne text-5xl font-bold text-amber-400`
- Tagline: `text-stone-400 text-base text-center mt-3`
- Faint radial glow behind the logo: `bg-amber-500/5 blur-3xl rounded-full w-96 h-96 absolute` centered — subtle warmth, not distracting
- Input: `bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50`
- Submit button: `bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold rounded-r-xl px-5` — dark text on amber looks sharp
- Example links: `text-stone-600 text-xs hover:text-amber-400 transition-colors`
- Max width: `max-w-xl mx-auto`

---

### 4.2 Results Page (`/analyze?url=...`)

**Layout:** Sticky header + sticky tab bar + scrollable content.

```
+-----------------------------------------------------+  bg-stone-900 border-b border-stone-800, sticky
|  o RepoLens      facebook / react    [-> GitHub]    |
+-----------------------------------------------------+

+-----------------------------------------------------+  bg-stone-900 border-b border-stone-800, sticky
|  [ Overview ] [ Structure ] [ Dependencies ]        |  active: text-amber-400 border-b-2 border-amber-400
|  [ Graph ]    [ Security ]                          |  inactive: text-stone-500 hover:text-stone-200
+-----------------------------------------------------+

+-----------------------------------------------------+
|           [ active tab content ]                    |
+-----------------------------------------------------+
```

**Header bar details:**
- Logo: `text-amber-400 font-syne font-bold text-sm`
- Separator: `text-stone-700 mx-2`
- Repo name: `text-stone-50 font-mono text-sm`
- GitHub button: `border border-stone-700 text-stone-400 hover:text-amber-400 hover:border-amber-500/50 rounded-lg px-3 py-1 text-xs transition-all`

---

### 4.3 Overview Tab

```
+----------------------------------------------------------+
|  PROJECT OVERVIEW                                        |  text-stone-500 text-xs tracking-widest uppercase
|  +----------------------------------------------------+  |
|  |  [AI summary - 2-3 sentences, stone-300]           |  |  bg-stone-900 border-stone-800 rounded-xl p-5
|  +----------------------------------------------------+  |
|                                                          |
|  Architecture: [ Fullstack MVC ]   Score: [ 82 / 100 ]  |
|                ^-- amber badge              ^-- lime     |
|                                                          |
|  TECH STACK                                              |
|  [ Next.js ] [ TypeScript ] [ Tailwind ] [ Prisma ] ...  |  lime-950 bg, lime-400 text, lime-800 border
|                                                          |
|  COMPONENTS                                              |
|  +--------------+  +--------------+  +--------------+   |
|  | /app         |  | /lib         |  | /components  |   |  bg-stone-900 border-stone-800
|  | Route layer  |  | Business     |  | UI Layer     |   |  hover: border-amber-500/30
|  +--------------+  +--------------+  +--------------+   |
|                                                          |
|  KEY OBSERVATIONS                                        |
|  + Uses App Router with server components                |  + bullet in amber-400, text in stone-300
|  + No test files detected                                |
|  + 2 potential security concerns                         |
+----------------------------------------------------------+
```

**Details:**
- Section labels: `text-stone-500 text-xs font-medium tracking-widest uppercase mb-3`
- Overview card: `bg-stone-900 border border-stone-800 rounded-xl p-5 text-stone-300 text-sm leading-relaxed`
- Architecture badge: `bg-amber-950 text-amber-400 border border-amber-800 rounded-full px-3 py-1 text-xs font-medium`
- Production score number: `text-5xl font-syne font-bold` colored by value:
  - 80-100: `text-lime-400`
  - 50-79: `text-amber-400`
  - 0-49: `text-red-400`
- Score suffix `/100`: `text-stone-600 text-lg`
- Tech stack pills: `bg-lime-950 text-lime-400 border border-lime-900 rounded-full px-3 py-1 text-xs font-medium`
- Component cards: `bg-stone-900 border border-stone-800 rounded-xl p-4 hover:border-amber-500/30 transition-colors`
  - Name: `text-stone-50 font-mono text-sm font-medium`
  - Role: `text-stone-500 text-xs mt-1`
- Observation bullet: diamond `+` in `text-amber-500`, body text in `text-stone-300 text-sm`

---

### 4.4 Structure Tab

```
+----------------------------------------------------------+
|  FILE STRUCTURE           312 files    2.4 MB            |  text-stone-500 text-xs
+----------------------------------------------------------+
|                                                          |
|  v  /app                                    48 files    |  folder icon + name: text-amber-400
|      v  /api                                12 files    |
|            route.ts                          3.2 KB     |  .ts: text-lime-400
|            middleware.ts                     1.1 KB     |
|      >  /analyze                             6 files    |
|                                                          |
|  >  /components                             24 files    |
|  >  /lib                                     8 files    |
|     package.json                             1.2 KB     |  .json: text-amber-400
|     README.md                                8.4 KB     |  .md:   text-lime-300
|     .env.example                              512 B     |  .env:  text-red-400
|                                                          |
+----------------------------------------------------------+
```

**Details:**
- Folder rows: `flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-stone-800 cursor-pointer`
- Folder icon + name: `text-amber-400 font-mono text-sm`
- Chevron: `text-stone-600` rotates 90 degrees when open
- File type color map:
  - `.ts` / `.tsx` → `text-lime-400`
  - `.js` / `.jsx` → `text-lime-300`
  - `.json` → `text-amber-400`
  - `.md` → `text-lime-300`
  - `.css` / `.scss` → `text-amber-300`
  - `.env*` → `text-red-400`
  - all others → `text-stone-500`
- File size: `text-stone-600 text-xs font-mono ml-auto`
- Indentation per level: `pl-5`

---

### 4.5 Dependencies Tab

```
+----------------------------------------------------------+
|  DEPENDENCIES                                            |
|                                                          |
|  Production (18)         [ Search packages... ]          |  search: focus:border-amber-500
|  +--------------------------------------------------+   |
|  | Package           Version     Link               |   |  header: bg-stone-800 text-stone-500
|  +--------------------------------------------------+   |
|  | react             ^18.2.0     -> npm             |   |  version: text-amber-400 font-mono
|  | next              14.1.0      -> npm             |   |  link: text-lime-400 hover:text-lime-300
|  | @prisma/client    ^5.0.0      -> npm             |   |
|  +--------------------------------------------------+   |
|                                                          |
|  Dev Dependencies (12)                                   |
|  +--------------------------------------------------+   |
|  | typescript        ^5.0.0      -> npm             |   |
|  | eslint            ^8.0.0      -> npm             |   |
|  +--------------------------------------------------+   |
+----------------------------------------------------------+
```

**Details:**
- Search input: `bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-50 placeholder-stone-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30`
- Table header: `bg-stone-800 text-stone-500 text-xs uppercase tracking-wide`
- Body rows: alternating `bg-stone-900` / `bg-stone-950`, `hover:bg-stone-800`
- Package name: `text-stone-100 font-mono text-sm`
- Version: `text-amber-400 font-mono text-xs`
- NPM link: `text-lime-400 hover:text-lime-300 text-xs` opens in new tab
- Production count badge: `bg-amber-950 text-amber-400 border border-amber-900 text-xs rounded-full px-2 py-0.5`
- Dev count badge: `bg-stone-800 text-stone-400 text-xs rounded-full px-2 py-0.5`

---

### 4.6 Graph Tab

```
+----------------------------------------------------------+
|  DEPENDENCY GRAPH          [ Fit View ]  [ + ]  [ - ]    |  controls: bg-stone-800 border-stone-700
+----------------------------------------------------------+  bg-stone-950
|                                                          |
|         +-----------+                                    |
|         |   /app    |------------------+                 |  node: bg-stone-800 border-stone-600
|         +-----------+                  v                 |  edge: stroke amber-500, dashed
|              |                   +----------+            |
|              v                   |   /lib   |            |
|         +----------+             +----------+            |
|         |  react   |                  |                  |  active node: border-amber-400
|         +----------+                  v                  |
|                                 +------------+           |
|                                 |   prisma   |           |
|                                 +------------+           |
|                                                  [map]   |  minimap: bg-stone-900 border-stone-700
+----------------------------------------------------------+
```

**Details:**
- Canvas background: `bg-stone-950`
- Node default: `bg-stone-800 border border-stone-600 rounded-xl px-4 py-2 text-stone-200 text-sm font-mono shadow-lg`
- Node hover / selected: `border-amber-400 shadow-amber-400/20 shadow-xl`
- Internal directory nodes: `border-lime-600` to distinguish from dependency nodes
- Edge: `stroke: #f59e0b` (amber-500), `strokeWidth: 1.5`, `strokeDasharray: 5 3`
- Controls: `bg-stone-800 border border-stone-700 text-stone-300 rounded-xl`
- Minimap: `bg-stone-900 border border-stone-700 rounded-xl`
- Tooltip on node click: `bg-stone-800 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-stone-300`

---

### 4.7 Security Tab

```
+----------------------------------------------------------+
|                                                          |
|  +--------------------------------------------------+   |  bg-amber-950 border-amber-800
|  |  ! WARNING - 2 potential issues found            |   |  text-amber-400
|  +--------------------------------------------------+   |
|                                                          |
|  PRODUCTION READINESS                    Score: 60/100  |
|  +--------------------------------------------------+   |  bg-stone-900 border-stone-800
|  |  [ok]  Tests detected        /src/__tests__      |   |  ok: text-lime-400
|  |  [ok]  CI/CD configured      /.github/workflows  |   |
|  |  [x]   No Dockerfile found                       |   |  x: text-red-400
|  |  [ok]  Linting configured    /.eslintrc.json     |   |
|  |  [x]   No .env.example found                     |   |
|  +--------------------------------------------------+   |
|                                                          |
|  DETECTED ISSUES                                         |
|  +--------------------------------------------------+   |  bg-stone-900 border-stone-800
|  |  HIGH    /config/db.js line 12                   |   |  severity: text-red-400
|  |  Hardcoded database password detected             |   |  text-stone-400 text-sm
|  |                                                   |   |
|  |  MEDIUM  /.env line 4                            |   |  severity: text-amber-400
|  |  JWT secret appears to be a weak default value    |   |
|  +--------------------------------------------------+   |
+----------------------------------------------------------+
```

**Details:**
- SAFE badge: `bg-lime-950 border border-lime-800 text-lime-400 rounded-xl p-5`
- WARNING badge: `bg-amber-950 border border-amber-800 text-amber-400 rounded-xl p-5`
- CRITICAL badge: `bg-red-950 border border-red-800 text-red-400 rounded-xl p-5`
- Checklist container: `bg-stone-900 border border-stone-800 rounded-xl divide-y divide-stone-800`
- Checklist row: `flex items-center gap-3 px-5 py-3 text-sm`
  - Pass: `text-lime-400` checkmark icon
  - Fail: `text-red-400` X icon
  - Path: `text-stone-600 font-mono text-xs ml-auto`
- Issue cards: `bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-1.5`
- Severity: `text-red-400` (critical/high), `text-amber-400` (medium), `text-stone-500` (low)
- File path in issue: `text-stone-400 font-mono text-xs`

---

## 5. Component Visual Specs

### 5.1 Loading Skeleton

```
+----------------------------------------------------------+  bg-stone-950
|  [########] [################]   <- header shimmer       |  bg-stone-800 animate-pulse
+----------------------------------------------------------+
|  [##] [####] [######] [###] [####]  <- tabs              |
|                                                          |
|  +--------------------------------------------------+   |
|  |  ############################################    |   |
|  |  ##############################                  |   |
|  +--------------------------------------------------+   |
|                                                          |
|  +--------------+  +--------------+  +--------------+   |
|  |  ##########  |  |  ##########  |  |  ##########  |   |
|  |  ########    |  |  ########    |  |  ########    |   |
|  +--------------+  +--------------+  +--------------+   |
|                                                          |
|       Analyzing repository...                            |  text-stone-600 text-sm, fades between messages
+----------------------------------------------------------+
```

- Skeleton blocks: `bg-stone-800 rounded-lg animate-pulse`
- Cycling status messages (fade every 4 seconds):
  1. `"Fetching repository structure..."`
  2. `"Analyzing dependencies..."`
  3. `"Running security scan..."`
  4. `"Generating AI summary with Gemini..."`
- Message style: `text-stone-600 text-sm text-center mt-6`
- Faint amber glow pulses in the background: `bg-amber-500/3 blur-3xl` barely visible, adds warmth

### 5.2 Error Message Component

```
+----------------------------------------------------------+
|  o  Something went wrong                                 |  text-amber-400 font-syne text-lg font-semibold
|                                                          |
|  Could not fetch this repository. Make sure the URL     |  text-stone-400 text-sm
|  is correct and the repository is public.               |
|                                                          |
|  [ Try again ]                                           |  bg-stone-800 hover:bg-stone-700 text-stone-200
+----------------------------------------------------------+  bg-stone-900 border border-stone-800 rounded-xl
```

### 5.3 SecurityBadge Component

Three states, always at the top of the Security tab:

```
SAFE:     [ +  SAFE - No secrets detected ]        bg-lime-950  border-lime-800  text-lime-400
WARNING:  [ !  WARNING - 2 issues found ]           bg-amber-950 border-amber-800 text-amber-400
CRITICAL: [ x  CRITICAL - 5+ issues detected ]     bg-red-950   border-red-800   text-red-400
```

- Container: `rounded-xl border p-5 flex items-center gap-4`
- Title: `font-syne font-bold text-lg`
- Subtitle: `text-sm opacity-75`

### 5.4 Tech Stack Pill

```
[ Next.js ]   bg-lime-950 text-lime-400 border border-lime-900 rounded-full px-3 py-1 text-xs font-medium
```

### 5.5 Copy Button

```
Default:  [ Copy Summary ]    bg-stone-800 border border-stone-700 text-stone-400
Copied:   [ Copied! ]         bg-lime-950  border border-lime-800  text-lime-400
```
Reverts after 2 seconds.

---

## 6. Complete User Workflow

### Step 1 — Landing

```
User arrives at repolens.vercel.app
      |
Instant static page load
      |
Input is auto-focused
      |
User sees: amber logo + tagline + input + example links
```

Three example repos clickable below the input: `vercel/next.js`, `facebook/react`, `tailwindlabs/tailwindcss`. Clicking fills the input and flashes `border-amber-500`.

---

### Step 2 — Submitting a URL

```
User types or pastes a GitHub URL
      |
Validation runs on blur
      |
  Valid?
  |-- YES --> Submit button turns amber-500, active
  |-- NO  --> Red underline + error text below input
      |
User presses Enter or clicks submit
      |
Button shows amber spinner, input locks
      |
Router navigates to /analyze?url=...
```

**Validation rules:**
- Must start with `https://github.com/`
- Must have exactly two path segments (owner + repo)
- No trailing slashes or sub-paths (`/tree/`, `/blob/`, etc.)

---

### Step 3 — Loading State

```
/analyze page mounts
      |
Header renders immediately (parsed from URL)
      |
useEffect fires -> POST /api/analyze
      |
Skeleton + cycling status text
      |
API calls chain:
  |-- fetchTree()       -> file list
  |-- fetchFile()       -> package.json, README
  |-- runAnalysis()     -> deps, secrets, score  (after fetch)
  |-- analyzeRepo()     -> Gemini summary        (after analysis)
      |
Response arrives (5-15 seconds typical)
```

---

### Step 4 — Results Render

```
Response received
      |
Skeleton fades out (200ms)
      |
AnalysisResult fades in (300ms)
      |
Overview tab active by default
      |
User reads AI summary, architecture, tech stack, observations
```

---

### Step 5 — Exploring Tabs

```
Overview      -> instant, data already in memory
Structure     -> instant, tree collapsed by default
                 click folder -> children animate open
Dependencies  -> instant, search filters in real time
Graph         -> lazy: fires POST /api/graph on first click
                 amber spinner while loading
                 React Flow renders with zoom-in entrance
                 drag, zoom, click nodes for tooltip
Security      -> instant, badge + checklist + issue cards
```

---

### Step 6 — Secondary Actions

```
"View on GitHub"   -> opens github.com/owner/repo in new tab
"Copy Summary"     -> copies AI text to clipboard
                      button turns lime-400 + "Copied!" for 2s
Logo click         -> back to home, fresh input
```

---

### Full Workflow Diagram

```
[ Home Page / ]
      |
      | Enter GitHub URL + Submit
      v
[ /analyze?url=... mounts ]
      |
      | POST /api/analyze
      v
[ Skeleton + cycling amber status text ]
      |
      |-- GitHub: fetchTree()     --> file list
      |-- GitHub: fetchFile()     --> package.json, README
      |-- lib/analyzer.ts         --> deps, secrets, readiness score
      |-- lib/gemini.ts           --> GeminiSummary
      |
      | AnalyzeResponse assembled
      v
[ Results page renders ]
      |
      |-- [ Overview Tab ]        <- default, instant
      |-- [ Structure Tab ]       <- instant
      |-- [ Dependencies Tab ]    <- instant
      |-- [ Graph Tab ]           <- lazy: POST /api/graph on click
      |-- [ Security Tab ]        <- instant
```

---

## 7. States & Transitions

### Input Field States

| State | Classes |
|---|---|
| Default | `bg-stone-900 border-stone-700 text-stone-50` |
| Focused | `border-amber-500 ring-1 ring-amber-500/30` |
| Invalid | `border-red-500 ring-1 ring-red-500/20` + red error text below |
| Disabled | `opacity-50 cursor-not-allowed` |

### Button States

| State | Classes |
|---|---|
| Default | `bg-amber-500 text-stone-950 font-semibold` |
| Hover | `bg-amber-600` |
| Active | `bg-amber-700 scale-95` |
| Loading | Spinner icon, `opacity-75 cursor-wait` |
| Disabled | `bg-stone-700 text-stone-500 cursor-not-allowed` |

### Tab States

| State | Classes |
|---|---|
| Inactive | `text-stone-500 hover:text-stone-200` |
| Active | `text-amber-400 border-b-2 border-amber-400` |
| Hover | `text-stone-200 bg-stone-800/50` |

### Analysis Page States

| State | Renders |
|---|---|
| `loading` | `<LoadingSkeleton />` + cycling status message |
| `success` | `<AnalysisResult />` |
| `error` | `<ErrorMessage />` with retry button |

---

## 8. Responsive Behavior

### Breakpoints

```
Mobile:   < 768px
Tablet:   768px - 1024px
Desktop:  > 1024px
```

### Layout Changes

| Element | Mobile | Tablet | Desktop |
|---|---|---|---|
| Home input | Full width | `max-w-lg` centered | `max-w-xl` centered |
| Results header | Logo + repo name only | + GitHub button | Full header |
| Tab bar | Horizontally scrollable | All visible | All visible |
| Overview grid | 1 column | 2 columns | 3 columns |
| Tech stack pills | Wrapping flex | Wrapping flex | Wrapping flex |
| Structure tree | Full width | Full width | Full width |
| Dependencies table | Horizontal scroll | Full width | Full width |
| Graph canvas | `h-[350px]` | `h-[480px]` | `h-[600px]` |
| Security tab | Stacked | Stacked | Stacked |

---

## 9. Micro-interactions & Animations

| Interaction | Animation |
|---|---|
| Page load | Instant — no entrance animation |
| Skeleton to results | Skeleton: `opacity-0 duration-200`, Results: `opacity-0 to 100 duration-300` |
| Tab switch | `opacity-0 to 100 duration-150 ease-out` |
| Folder expand | `max-height 0 to auto duration-200 ease-in-out` |
| Button hover | `transition-colors duration-150` |
| Button press | `active:scale-95 duration-75` |
| Copy confirmation | Label swap to lime-400 "Copied!", reverts after 2s |
| Graph node hover | `border-amber-400 shadow-amber-400/20 shadow-xl` |
| Graph render | `scale-95 to 100 opacity-0 to 100 duration-400` |
| Skeleton shimmer | `animate-pulse` |
| Status text cycle | `opacity-0 to 100 to 0` fade, every 4 seconds |
| Example link click | Input fills + `border-amber-500` flash for 300ms |
| Tab underline | `transition-all duration-200` on the active indicator |

---

*RepoLens UI/UX Spec v1.1 — Amber & Lime — March 2026*