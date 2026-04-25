# Contributing to Repolens

First off, thank you for considering contributing to Repolens!  
Every contribution - whether it's a bug report, a feature suggestion, or a pull request - is genuinely appreciated.

Please take a moment to read through this guide before you start. It helps us maintain a high-quality codebase and makes the review process much smoother for everyone.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How to Report a Bug](#how-to-report-a-bug)
3. [Suggesting Features](#suggesting-features)
4. [Coding Standards](#coding-standards)
5. [Submitting a Pull Request](#submitting-a-pull-request)
6. [Project Structure](#project-structure)

---

## Code of Conduct

By participating in this project, you agree to be respectful and constructive. We are committed to providing a welcoming environment for contributors of all experience levels.

---

## How to Report a Bug

Found something broken? We want to know about it!

**Before opening an issue**, please:
- Search [existing issues](https://github.com/Dev-5804/repolens/issues) to make sure it hasn't already been reported.
- Confirm that you are using a valid GitHub Personal Access Token.
- Check if the issue is with a specific repository (e.g., private repo, rate-limited account).

**When opening a bug report**, please include:

| Field | Description |
|---|---|
| **Summary** | A short, clear description of the bug |
| **Steps to Reproduce** | Numbered steps to reliably reproduce the issue |
| **Expected Behavior** | What you expected to happen |
| **Actual Behavior** | What actually happened |
| **Screenshots** | If applicable, attach a screenshot of the error |
| **Environment** | Browser name & version, OS |
| **Repository Tested** | The `owner/repo` you were analyzing (if not sensitive) |

> **Note:** Never include your GitHub Personal Access Token in a bug report.

---

## Suggesting Features

Have an idea to make Repolens better? Open a [GitHub Discussion](https://github.com/Dev-5804/repolens/discussions) or an issue with the label `enhancement`.

Please explain:
- **The problem** your feature would solve.
- **Your proposed solution** and why you think it's the right approach.
- Any **alternatives** you considered.

---

## Coding Standards

To keep the codebase consistent and maintainable, we follow these conventions.

### Tools

| Tool | Purpose |
|---|---|
| **ESLint** | Linting JavaScript/TypeScript - run with `npm run lint` |
| **Prettier** | Code formatting - configured via `.prettierrc` |
| **TypeScript** | Strict typing enforced across the entire project |

### Rules

- **Formatting**: All code must be formatted with Prettier before submitting. Run `npx prettier --write .` or configure your editor to format on save.
- **Linting**: All code must pass ESLint with no errors. Run `npm run lint` to verify.
- **TypeScript**: Do not use `any` unless absolutely necessary, and add a comment explaining why if you do.
- **Component Style**: UI components use Tailwind CSS utility classes. Avoid inline `style` props unless for dynamic values that cannot be expressed in Tailwind.
- **No `console.log`**: Remove all `console.log` statements before submitting. Use `console.error` only for genuine error logging in API routes.
- **Naming Conventions**:
  - React components: `PascalCase` (e.g., `ActivityTab.tsx`)
  - Utility functions & hooks: `camelCase` (e.g., `generateScore`, `useQuery`)
  - Constants: `UPPER_SNAKE_CASE` (e.g., `GITHUB_API_URL`)

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>

Examples:
feat(compare): add side-by-side radar chart comparison
fix(api): handle 401 unauthorized token response
docs(readme): update setup instructions
refactor(github): extract token auth into shared helper
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

---

## Submitting a Pull Request

### 1. Fork & Clone

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/repolens.git
cd repolens
```

### 2. Create a Branch

Always create a new branch from `main`. Use a descriptive name:

```bash
git checkout -b feat/shareable-url
# or
git checkout -b fix/radar-chart-data-mapping
```

### 3. Set Up Your Environment

```bash
npm install
```

Copy the example environment file and add your GitHub token for local development:

```bash
cp .env.example .env.local
# Edit .env.local if needed
```

### 4. Make Your Changes

- Keep changes focused. One PR should address one thing (one bug fix, one feature, etc.).
- Add or update comments where the logic is non-obvious.
- If you are changing the scoring algorithm (`lib/scorer.ts`), please document your reasoning in the PR description.

### 5. Verify Before Pushing

```bash
# Ensure linting passes
npm run lint

# Ensure the app builds successfully
npm run build

# Start the dev server and manually verify your change
npm run dev
```

### 6. Push & Open a PR

```bash
git push origin feat/shareable-url
```

Then open a Pull Request on GitHub against the `main` branch.

**In your PR description, please include:**
- A summary of what you changed and why.
- Screenshots or a short screen recording if it's a UI change.
- Any related issue numbers (e.g., `Closes #42`).

### 7. Review Process

- A maintainer will review your PR, typically within a few days.
- You may be asked to make changes - please don't take it personally, it's just part of the process!
- Once approved, your PR will be squash-merged into `main`.

---

## Project Structure

```
repolens/
├── app/                  # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── analyze/      # Main repository analysis endpoint
│   │   └── activity/     # Commit activity endpoint
│   ├── compare/          # Comparison mode page
│   ├── privacy/          # Privacy Policy page
│   └── terms/            # Terms of Service page
├── components/           # React UI components
├── lib/
│   ├── github.ts         # GitHub API helper functions
│   ├── scorer.ts         # Heuristic health scoring logic
│   ├── cache.ts          # In-memory cache layer
│   └── types.ts          # Shared TypeScript interfaces
└── public/               # Static assets
```

---

Thank you for helping make Repolens better!
