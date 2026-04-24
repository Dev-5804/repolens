# FUNCTIONAL REQUIREMENTS DOCUMENT (FRD)

## Product Name

Repolens

---

## 1. Overview

This document defines the detailed functional behavior of the Repolens system. It translates the PRD into precise system-level requirements, workflows, inputs/outputs, and processing logic suitable for implementation.

---

## 2. System Actors

### 2.1 Primary Actor

* User (anonymous or authenticated)

### 2.2 External Systems

* GitHub API (REST + GraphQL)
* Database (Supabase/PostgreSQL)
* Cache Layer (Redis or equivalent)

---

## 3. System Modules

1. Input Module
2. API Gateway
3. Analysis Engine
4. Scoring Engine
5. Cache Manager
6. Data Persistence Layer
7. UI Rendering Layer

---

## 4. Functional Workflows

---

## 4.1 Repository Analysis Workflow

### Trigger

User submits repository input

### Input

* `repo`: string (format: owner/repo or full GitHub URL)

### Flow

1. Validate input format
2. Normalize to `owner/repo`
3. Check cache:

   * If exists AND not expired → return cached result
   * Else → proceed to analysis
4. Fetch data from GitHub API
5. Process and transform data
6. Compute metrics
7. Generate score
8. Store result in cache/database
9. Return response

### Output

```json
{
  "status": "success",
  "data": { ...full analysis object... },
  "cached": false
}
```

---

## 4.2 Input Validation Logic

### Accepted Formats

* `https://github.com/{owner}/{repo}`
* `{owner}/{repo}`

### Validation Rules

* Must contain exactly two segments (owner + repo)
* Reject invalid characters
* Reject empty input

### Error Response

```json
{
  "status": "error",
  "code": "INVALID_REPO_FORMAT",
  "message": "Invalid repository format"
}
```

---

## 4.3 Data Fetching Module

### 4.3.1 Metadata Fetch

**Source:** GitHub REST API

Fields:

* name
* description
* stars
* forks
* watchers
* open_issues
* license
* created_at
* updated_at
* default_branch

---

### 4.3.2 Commit Activity Fetch

**Source:** GitHub API

Processing:

* Fetch commits (last 90 days max)
* Aggregate:

  * commits_last_30_days
  * commits_last_90_days
  * last_commit_date

---

### 4.3.3 Contributors Fetch

* Total contributors count
* Top contributors (limit: 10)
* Contribution percentage distribution

---

### 4.3.4 Language Data

* Fetch language breakdown
* Convert to percentage format

---

## 4.4 Repository Structure Analysis

### Input

* Repository tree (limited depth: max 3 levels)

### Detection Rules

| File/Folder  | Condition                         |
| ------------ | --------------------------------- |
| README       | file name contains "readme"       |
| LICENSE      | file name contains "license"      |
| CONTRIBUTING | file name contains "contributing" |
| Tests        | folder name contains "test"       |
| CI Config    | `.github/workflows` exists        |

### Output

```json
{
  "has_readme": true,
  "has_license": true,
  "has_tests": false,
  "has_ci": true
}
```

---

## 4.5 Code Statistics Module

### Logic

**LOC Estimation**

* If API provides → use directly
* Else → estimate via file size heuristics

**File Type Distribution**

* Count extensions
* Group by type

---

## 4.6 Quality Signals Computation

### 4.6.1 Activity Score

Inputs:

* commits_last_30_days
* last_commit_date

Logic:

* Normalize commit frequency (0–100 scale)
* Penalize inactivity (>30 days no commits)

---

### 4.6.2 Maintainability Score

Inputs:

* contributor_count
* commit distribution

Logic:

* Higher score for distributed contributions
* Penalize single-contributor dominance

---

### 4.6.3 Reliability Score

Inputs:

* has_tests
* has_ci

Logic:

* Binary weighted scoring

---

### 4.6.4 Documentation Score

Inputs:

* has_readme
* readme_size
* section count (heuristic)

---

## 4.7 Scoring Engine

### Formula

```
final_score =
  (activity * 0.30) +
  (reliability * 0.25) +
  (maintainability * 0.20) +
  (documentation * 0.15) +
  (structure * 0.10)
```

### Constraints

* All sub-scores must be 0–100
* Final score must be rounded to integer
* Include breakdown in response

---

## 4.8 Cache Management

### Cache Key

`repo:{owner}/{repo}`

### TTL

24 hours

### Logic

IF cache exists AND current_time - last_analyzed < TTL
→ return cached result

ELSE
→ recompute and overwrite cache

---

## 4.9 API Specifications

---

### 4.9.1 Analyze Repository

**Endpoint**
`GET /api/analyze`

**Query Params**

* `repo` (required)

---

### Success Response

```json
{
  "status": "success",
  "cached": false,
  "data": {
    "metadata": {},
    "activity": {},
    "contributors": {},
    "languages": {},
    "structure": {},
    "quality": {},
    "score": {
      "final": 78,
      "breakdown": {}
    }
  }
}
```

---

### Error Response

```json
{
  "status": "error",
  "code": "REPO_NOT_FOUND",
  "message": "Repository does not exist"
}
```

---

## 4.10 Error Handling Logic

| Error Case         | Code                | Behavior                  |
| ------------------ | ------------------- | ------------------------- |
| Invalid input      | INVALID_REPO_FORMAT | Reject request            |
| Repo not found     | REPO_NOT_FOUND      | Return error              |
| Private repo       | PRIVATE_REPO        | Return error              |
| API limit exceeded | RATE_LIMIT          | Retry or partial response |
| Network failure    | NETWORK_ERROR       | Retry once, then fail     |

---

## 4.11 Rate Limit Handling

### Strategy

* Use authenticated GitHub requests
* Implement retry with exponential backoff
* Fallback to cached data if available

---

## 4.12 UI Functional Behavior

### Dashboard Sections

1. Overview
2. Activity
3. Contributors
4. Code Insights
5. Score Breakdown

---

### UI Rules

* Render partial data if full analysis fails
* Show loading state during analysis
* Show cached indicator if applicable

---

## 4.13 Database Interaction

### Write Operation

* Store result after successful analysis

### Read Operation

* Retrieve cached result before analysis

---

## 4.14 Logging Requirements

* Log API failures
* Log analysis duration
* Log cache hits/misses

---

## 4.15 Constraints Enforcement

1. Do not fetch more than 100 commits per request cycle
2. Do not traverse full repository tree
3. Do not execute repository code
4. Do not block event loop with heavy computation
5. All external calls must have timeout

---

## 4.16 Determinism Requirement

* Same input must always produce same output (within cache period)
* No randomness allowed in scoring

---

## 5. Acceptance Criteria

* Valid repo returns structured analysis
* Invalid repo returns error
* Cached response is faster than fresh analysis
* Score breakdown is always present
* System handles API failure gracefully

---

## 6. Future Extension Hooks

* Add dependency analysis module
* Add AI summary module
* Add private repo support
* Add deeper static analysis engine

---

END OF FRD
