# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Product Name

Repolens

---

## 1. Objective

Repolens is a web-based analytics platform that generates an instant, read-only dashboard for any public Git repository. The system evaluates repository health, activity, structure, and basic quality signals using lightweight, non-invasive analysis.

The product must prioritize:

* Speed (results within seconds)
* No setup (no repo installation or permissions required beyond public access)
* Clear, explainable metrics (no opaque scoring)

---

## 2. Scope Definition

### 2.1 In Scope (MVP)

* Public repository analysis via URL or search
* Metadata extraction
* Activity tracking
* Contributor insights
* Language and file distribution
* Basic quality signals
* Cached results for performance

### 2.2 Out of Scope (MVP)

* Deep static code analysis (AST parsing across languages)
* Security vulnerability scanning
* Private repository access (initially)
* CI/CD integration
* Real-time webhook updates

---

## 3. Target Users

* Developers evaluating repositories
* Students analyzing open-source projects
* Recruiters reviewing candidate GitHub profiles
* Indie developers comparing projects

---

## 4. Functional Requirements

### 4.1 Input System

**FR-1: Repository Input**

* Accept GitHub repository URL
* Accept owner/repo format
* Validate input format

**FR-2: Search**

* Optional: search repositories using GitHub API

---

### 4.2 Data Fetching Layer

**FR-3: Repository Metadata**

* Stars
* Forks
* Watchers
* Open issues
* Default branch
* License
* Created date
* Last updated date

**FR-4: Commit Data**

* Commit frequency (last 30 days, 90 days)
* Latest commit timestamp

**FR-5: Contributors**

* Total contributors
* Contribution distribution

**FR-6: Language Data**

* Language breakdown (percentage)

---

### 4.3 Analysis Engine

**FR-7: Activity Metrics**

* Commit frequency score
* Recency score

**FR-8: Repository Structure**

* File tree fetch (limited depth)
* Detection of:

  * README
  * LICENSE
  * CONTRIBUTING
  * Tests folder
  * Config files

**FR-9: Code Statistics**

* LOC estimation (via API or lightweight parsing)
* File type distribution

**FR-10: Dependency Signals (Optional Phase 2)**

* Detect package managers:

  * package.json
  * requirements.txt
  * pom.xml
* Basic dependency freshness check

---

### 4.4 Quality Signals (Heuristic-Based)

**FR-11: Maintainability Indicators**

* Recent commits
* Active contributors
* Issue resolution ratio

**FR-12: Reliability Indicators**

* Presence of tests
* CI config detection

**FR-13: Documentation Indicators**

* README presence
* README size threshold
* Section detection (heuristic)

---

### 4.5 Scoring System

**FR-14: Composite Score**

* Must be deterministic and explainable

Example:

* Activity: 30%
* Reliability: 25%
* Maintainability: 20%
* Documentation: 15%
* Structure: 10%

**FR-15: Score Transparency**

* Each score must include:

  * Value
  * Calculation basis
  * Raw metrics used

---

### 4.6 Dashboard UI

**FR-16: Overview Panel**

* Repo name
* Description
* Key stats

**FR-17: Charts**

* Commit activity graph
* Language distribution chart
* Contributor distribution

**FR-18: Insights Panel**

* Highlight strengths
* Highlight risks

**FR-19: Score Breakdown**

* Individual metric cards

---

### 4.7 Caching System

**FR-20: Result Caching**

* Cache analysis results
* TTL: 24 hours

**FR-21: Cache Retrieval**

* If cached result exists → return immediately
* Else → trigger analysis

---

### 4.8 Authentication (Optional Phase 2)

**FR-22: OAuth Login**

* GitHub login
* Google login

**FR-23: User Features**

* Saved repositories
* Analysis history

---

## 5. Non-Functional Requirements

### 5.1 Performance

* Initial response time: < 5 seconds
* Cached response: < 1 second

### 5.2 Scalability

* Must support concurrent requests
* Stateless backend preferred

### 5.3 Reliability

* Graceful failure if API limits reached
* Partial data rendering allowed

### 5.4 Security

* No execution of untrusted code
* No arbitrary repo cloning by default

---

## 6. Technical Architecture

### 6.1 Frontend

* React (SPA)
* Data fetching via API layer
* Chart library (Recharts or Chart.js)

### 6.2 Backend

* Next.js Route Handlers (App Router)

### 6.3 Data Sources

* GitHub REST API
* GitHub GraphQL API

### 6.4 Database

* Supabase (PostgreSQL)

### 6.5 Caching

* Redis or Supabase cache layer

---

## 7. API Design

### 7.1 Endpoint: Analyze Repo

`GET /api/analyze?repo={owner}/{repo}`

Response:

```json
{
  "metadata": {},
  "activity": {},
  "contributors": {},
  "languages": {},
  "quality": {},
  "score": {},
  "cached": true
}
```

---

### 7.2 Endpoint: Get Cached Result

`GET /api/cache?repo={owner}/{repo}`

---

## 8. Data Model

### Table: repositories

```sql
id UUID PRIMARY KEY
full_name TEXT UNIQUE
last_analyzed TIMESTAMP
cached_result JSONB
```

---

## 9. Rate Limiting Strategy

### Problem

GitHub API rate limits

### Solution

* Use authenticated requests (OAuth token)
* Cache aggressively
* Queue requests if needed

---

## 10. Error Handling

### Cases

* Invalid repo
* Private repo
* API rate limit exceeded
* Network failure

### Behavior

* Return structured error response
* Show partial data if available

---

## 11. UX Guidelines

* No login required for basic usage
* Minimal input friction
* Fast loading indicators
* Clear data visualization
* No hidden calculations

---

## 12. Build Phases

### Phase 1 (MVP)

* Repo input
* Metadata + activity
* Basic dashboard
* Caching

### Phase 2

* Quality signals
* Score system
* Improved UI

### Phase 3

* Auth
* Saved repos
* Dependency checks

---

## 13. Constraints

* Must not clone large repositories by default
* Must not exceed API rate limits
* Must avoid heavy computation in request cycle

---

## 14. Success Metrics

* Time to first result
* Number of analyzed repos
* Cache hit rate
* User retention (if auth enabled)

---

## 15. Future Enhancements

* AI-based repo summary
* Pull request insights
* Code smell detection
* Private repo support
* CI/CD integration

---

## 16. Strict Implementation Rules (FOR AI IDE)

1. Do NOT implement deep static analysis.
2. Do NOT clone repositories unless explicitly required.
3. Always check cache before triggering analysis.
4. All scores must be explainable and derived from raw metrics.
5. Avoid blocking operations in request lifecycle.
6. Use pagination or limits when fetching large datasets.
7. Fail gracefully and return partial results when necessary.
8. Keep all computations deterministic.
9. No hardcoded thresholds without documentation.
10. Ensure API responses are consistent in structure.

---

END OF PRD
