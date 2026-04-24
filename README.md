# 🔍 RepoLens

RepoLens is a powerful, modern analytics dashboard that provides deep, actionable insights into public GitHub repositories. Built with a sleek, GitHub-inspired dark mode aesthetic, it allows developers, maintainers, and open-source enthusiasts to instantly assess the health, activity, and structure of any codebase.

## ✨ Core Features & Capabilities

### 📊 Comprehensive Dashboard
- **Instant Search:** Enter any public GitHub repository in the format `owner/repo` to instantly fetch and analyze its data.
- **Responsive Design:** Fully responsive, mobile-first design built with Tailwind CSS that works flawlessly across desktops, tablets, and mobile devices.
- **Rich Visualizations:** Interactive charts and graphs powered by Recharts (Bar, Line, Pie, and Radar charts).

### 📈 Activity Tracking
- **Historical Commit Trends:** View commit frequency and volume over time.
- **Dynamic Date Ranges:** Explore activity with granular filters:
  - Last 30 Days
  - Last 90 Days
  - Last Year
  - All Time
  - **Custom Range:** Select specific start and end dates using HTML5 date pickers.
- **Smart Aggregation:** Charts automatically group data by week or month depending on the selected timeframe to prevent visual clutter.
- **API Protection:** Employs aggressive pagination (fetching up to 500 commits max) for massive date ranges to prevent GitHub API rate limits or timeouts.

### 👥 Contributor Insights
- **Top Contributors Grid:** Displays a visual grid of up to 100 top contributors.
- **Avatars & Metrics:** Shows GitHub profile avatars alongside exact commit counts.
- **Leaderboard Badges:** Highlights the top 3 most active contributors with special 🥇, 🥈, and 🥉 badges.

### 💻 Code Insights & Standards
- **Language Composition:** A responsive Pie Chart breaking down the repository's programming languages by byte size, utilizing official GitHub language colors.
- **Repository Standards Checklist:** Automatically scans the repository tree to ensure adherence to community best practices:
  - Presence of a `README` file.
  - Presence of an open-source `LICENSE`.
  - Presence of testing frameworks (`test/`, `__tests__`, etc.).
  - Presence of CI/CD pipelines (e.g., GitHub Actions workflows).

### 🛡️ Repository Health Score
- **Deterministic Heuristics:** Calculates a composite health score (0-100) based on hard metrics.
- **5-Axis Radar Chart:** Visualizes the breakdown of the score across:
  - **Activity:** Recent commit frequency and momentum.
  - **Maintainability:** Contributor distribution and workload.
  - **Reliability:** Presence of automated testing and CI pipelines.
  - **Documentation:** Quality and existence of READMEs and descriptions.
  - **Structure:** Clean default branches and open-source licensing.

### 🛑 Error Boundaries & Graceful Degradation
RepoLens is built to handle edge cases and GitHub API restrictions gracefully without crashing:
- **Private or Missing Repositories (404):** If a user searches for a private repository or makes a typo, the API returns a custom `REPO_NOT_FOUND` code. The dashboard seamlessly transitions to a user-friendly "Analysis Failed" state, explaining that the repository might be private or misspelled.
- **Rate Limiting (403):** If the GitHub API rate limit is exceeded, the backend intercepts the `403 Forbidden` response and triggers a `RATE_LIMIT` state, prompting the user to try again later.
- **Partial Data Rendering:** The dashboard is designed to render even if certain datasets (like language statistics or contributor avatars) are missing or incomplete from GitHub's payload, preventing cascading UI failures.

## 🛠️ Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **UI Library:** [React](https://reactjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Data Fetching:** [TanStack Query](https://tanstack.com/query) (React Query) for client-side caching and background updates.
- **Data Visualization:** [Recharts](https://recharts.org/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **External API:** GitHub REST API

## 🚀 Getting Started

### Prerequisites
You will need a GitHub Personal Access Token (classic) to avoid harsh API rate limits.

### Environment Variables
Create a `.env.local` file in the root directory and add the following:
```env
GITHUB_TOKEN=your_github_personal_access_token
```

### Installation
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📡 API Routes

RepoLens utilizes Next.js Route Handlers to act as a proxy and protect the GitHub Token:
- `GET /api/analyze?repo=owner/repo`: Fetches the initial payload of metadata, structure, languages, and aggregated stats.
- `GET /api/activity?repo=owner/repo&since=YYYY-MM-DD&until=YYYY-MM-DD`: Fetches specific commit history for dynamic chart rendering.
