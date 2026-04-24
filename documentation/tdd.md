# TECHNICAL DESIGN DOCUMENT (TDD)

## Product Name

Repolens

---

## 1. Overview

This document defines the low-level technical design, system architecture, component interactions, data flow, and implementation details required to build Repolens.

The system is designed for:

* Low latency
* High cache efficiency
* Stateless scalability
* Deterministic computation

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
Client (React)
      │
      ▼
API Gateway (Next.js Route Handlers)
      │
      ├── Cache Layer (Redis / Supabase Cache)
      │
      ├── Analysis Engine
      │        ├── GitHub API Client
      │        ├── Data Processor
      │        └── Scoring Engine
      │
      └── Database (PostgreSQL / Supabase)
```

---

## 3. Tech Stack

### Frontend

* React (Vite or Next.js)
* React Query (data fetching + caching)
* Chart.js or Recharts

### Backend

* Next.js Route Handlers (App Router)

### Database

* PostgreSQL (via Supabase)

### Cache

* Redis (preferred) OR Supabase JSON cache

### External APIs

* GitHub REST API
* GitHub GraphQL API

---

## 4. Component Design

---

## 4.1 API Gateway

### Responsibilities

* Request validation
* Routing
* Rate limiting
* Response formatting

### Routes

| Method | Endpoint     | Description         |
| ------ | ------------ | ------------------- |
| GET    | /api/analyze | Analyze repository  |
| GET    | /api/cache   | Fetch cached result |

---

## 4.2 GitHub API Client

### Responsibilities

* Handle all GitHub API calls
* Manage authentication tokens
* Handle retries and failures

### Methods

```js
getRepoMetadata(owner, repo)
getCommitActivity(owner, repo)
getContributors(owner, repo)
getLanguages(owner, repo)
getRepoTree(owner, repo)
```

### Constraints

* Max timeout: 5s per request
* Retry: 1 attempt with exponential backoff

---

## 4.3 Cache Manager

### Responsibilities

* Store and retrieve cached results
* TTL enforcement

### Key Format

```
repo:{owner}/{repo}
```

### Logic

```js
if (cache.exists(key) && !expired) {
  return cache.data
} else {
  result = compute()
  cache.set(key, result, TTL=86400)
}
```

---

## 4.4 Analysis Engine

### Subcomponents

1. Metadata Processor
2. Activity Analyzer
3. Structure Analyzer
4. Code Stats Analyzer

---

### 4.4.1 Metadata Processor

Input:

* Raw GitHub metadata

Output:

```json
{
  "stars": number,
  "forks": number,
  "issues": number,
  "age_days": number
}
```

---

### 4.4.2 Activity Analyzer

Input:

* Commit list

Processing:

* Count commits (30d, 90d)
* Calculate recency

---

### 4.4.3 Structure Analyzer

Input:

* Repo tree (depth-limited)

Processing:

* Pattern matching for key files

---

### 4.4.4 Code Stats Analyzer

Input:

* Language + file tree

Processing:

* Aggregate extensions
* Estimate LOC

---

## 4.5 Scoring Engine

### Responsibilities

* Compute all sub-scores
* Normalize values
* Generate final score

### Input Schema

```json
{
  "activity": {},
  "structure": {},
  "contributors": {},
  "documentation": {}
}
```

---

### Output Schema

```json
{
  "final": number,
  "breakdown": {
    "activity": number,
    "reliability": number,
    "maintainability": number,
    "documentation": number,
    "structure": number
  }
}
```

---

### Normalization Strategy

* Clamp all values between 0–100
* Use linear scaling for:

  * commits
  * contributors
* Use binary scoring for:

  * CI presence
  * tests

---

## 5. Data Flow

### Sequence Diagram

```
User → API → Cache Check
            │
     ┌──────┴──────┐
     │             │
Cache Hit     Cache Miss
     │             │
Return Data   Fetch GitHub Data
                    │
              Process Data
                    │
              Compute Score
                    │
               Store Cache
                    │
                Return Data
```

---

## 6. Database Design

### Table: repositories

```sql
CREATE TABLE repositories (
  id UUID PRIMARY KEY,
  full_name TEXT UNIQUE,
  cached_result JSONB,
  last_analyzed TIMESTAMP
);
```

### Indexes

```sql
CREATE INDEX idx_full_name ON repositories(full_name);
```

---

## 7. Performance Design

### Optimizations

* Parallel API calls using Promise.all
* Cache-first strategy
* Limit payload sizes
* Avoid deep tree traversal

---

### Inefficiency

Sequential API calls

### Correction

Use parallel fetching:

```js
await Promise.all([
  getRepoMetadata(),
  getLanguages(),
  getContributors()
])
```

---

## 8. Rate Limiting Strategy

### Problem

GitHub API limit

### Solution

* Use authenticated tokens
* Implement request batching
* Cache aggressively

---

## 9. Error Handling Design

### Standard Error Object

```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human readable message"
}
```

---

### Retry Strategy

* Retry once for transient failures
* Do not retry 4xx errors

---

## 10. Security Design

* No execution of repository code
* Input sanitization for repo string
* API timeout enforcement
* No storage of sensitive tokens in logs

---

## 11. Deployment Architecture

### Option A (Recommended)

* Frontend: Vercel
* Backend: Next.js API Routes (Serverless Functions)
* DB: Supabase
* Cache: Redis (Upstash)

---

### Option B

* Full backend on VPS (Dockerized)
* Nginx reverse proxy

---

## 12. Scalability Design

* Stateless backend
* Horizontal scaling supported
* Cache reduces compute load

---

## 13. Logging & Monitoring

### Logs

* Request time
* API failures
* Cache hits/misses

### Metrics

* Response time
* Cache hit rate
* Error rate

---

## 14. Configuration

### Environment Variables

```
GITHUB_TOKEN=
DATABASE_URL=
REDIS_URL=
CACHE_TTL=86400
```

---

## 15. Testing Strategy

### Unit Tests

* Scoring functions
* Data transformation

### Integration Tests

* API responses
* GitHub API mocks

### Load Testing

* Concurrent repo analysis requests

---

## 16. Constraints

* Max repo tree depth: 3
* Max commits fetched: 100
* Max API response time: 5s per request
* No synchronous blocking operations

---

## 17. Future Extensibility

* Add job queue (BullMQ) for heavy analysis
* Add microservices separation
* Add AI summarization service
* Add dependency scanning module

---

END OF TDD
