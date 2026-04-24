# UI/UX DESIGN DOCUMENT

## Product Name

Repolens

---

## 1. Design Objective

The interface must replicate the visual familiarity, structure, and interaction patterns of GitHub while presenting analytical insights.

### Primary Goals

* Familiar layout similar to GitHub
* Minimal learning curve
* Data-first presentation
* Fast navigation and readability

---

## 2. Design Principles

1. **Familiarity First**

   * Layout and spacing should closely resemble GitHub
   * Users should intuitively understand navigation without onboarding

2. **Information Density**

   * High data density without clutter
   * Use cards and sections instead of long pages

3. **Consistency**

   * Uniform spacing, typography, and color usage
   * Reusable UI components

4. **Clarity Over Decoration**

   * Avoid unnecessary animations or visual noise
   * Focus on readability and hierarchy

---

## 3. Visual Style Guide

---

## 3.1 Color Palette (GitHub-inspired)

### Base Colors

* Background: `#0d1117`
* Secondary Background: `#161b22`
* Border: `#30363d`

### Text Colors

* Primary: `#c9d1d9`
* Secondary: `#8b949e`
* Muted: `#6e7681`

### Accent Colors

* Blue (primary): `#58a6ff`
* Green (success): `#3fb950`
* Red (error): `#f85149`
* Yellow (warning): `#d29922`

### Rule

* Do NOT introduce new colors unless necessary

---

## 3.2 Typography

* Font Family: system-ui, sans-serif
* Heading: 20–24px
* Subheading: 16–18px
* Body: 14px
* Small text: 12px

### Rules

* Use consistent font weights
* Avoid excessive font size variation

---

## 3.3 Spacing System

* Base unit: 8px
* Common spacing:

  * Small: 8px
  * Medium: 16px
  * Large: 24px

---

## 4. Layout Structure

---

## 4.1 Page Layout

```id="qz8k6u"
-------------------------------------
| Header (Navigation Bar)           |
-------------------------------------
| Repo Info Bar                    |
-------------------------------------
| Tabs Navigation                  |
-------------------------------------
| Main Content Area                |
|   ├── Left (Primary Content)     |
|   └── Right (Sidebar Insights)   |
-------------------------------------
```

---

## 4.2 Header (GitHub-like)

### Components

* Logo (Repolens)
* Search bar
* Optional: Login button

### Behavior

* Sticky top navigation
* Minimal height

---

## 4.3 Repository Info Bar

### Contents

* Repo name (owner/repo)
* Description
* Stats:

  * Stars
  * Forks
  * Issues

### Layout

* Horizontal alignment
* Compact spacing

---

## 4.4 Tabs Navigation

Tabs (GitHub-inspired):

* Overview (default)
* Activity
* Contributors
* Code Insights
* Score

### Behavior

* Active tab highlighted
* No page reload (SPA routing)

---

## 5. Page-Level Designs

---

## 5.1 Overview Page

### Layout

```id="m3p0va"
-------------------------------------
| Summary Cards (Top Row)           |
-------------------------------------
| Activity Chart                   |
-------------------------------------
| Language Distribution           |
-------------------------------------
| Insights + Risks                |
-------------------------------------
```

---

### Components

#### Summary Cards

* Stars
* Commits (30d)
* Contributors
* Score

#### Activity Chart

* Line graph (commits over time)

#### Language Chart

* Pie chart

#### Insights Panel

* Strengths (green)
* Risks (red)

---

## 5.2 Activity Page

### Components

* Commit frequency graph
* Recent commits list
* Activity score

---

## 5.3 Contributors Page

### Components

* Contributor list (top 10)
* Contribution distribution bar

---

## 5.4 Code Insights Page

### Components

* File type distribution
* Repo structure indicators:

  * README
  * Tests
  * CI

---

## 5.5 Score Page

### Components

* Final score (large display)
* Breakdown cards:

  * Activity
  * Reliability
  * Maintainability
  * Documentation
  * Structure

### Rule

* Each score must show explanation

---

## 6. Component Design

---

## 6.1 Cards

### Style

* Background: secondary (`#161b22`)
* Border: subtle
* Border radius: 6px
* Padding: 16px

---

## 6.2 Buttons

### Types

* Primary (blue)
* Secondary (neutral)

### Rules

* No excessive shadows
* Subtle hover states

---

## 6.3 Charts

### Rules

* Minimal grid lines
* Consistent color usage
* Tooltip enabled

---

## 7. Interaction Design

---

## 7.1 Loading States

* Skeleton loaders for cards
* Spinner for full-page loading

---

## 7.2 Error States

* Clear message
* Retry option

---

## 7.3 Empty States

* Informational text
* No blank screens

---

## 8. Responsiveness

### Breakpoints

* Desktop: ≥1024px
* Tablet: 768–1023px
* Mobile: <768px

### Behavior

* Sidebar moves below content on mobile
* Charts resize dynamically

---

## 9. Accessibility

* Sufficient color contrast
* Keyboard navigable
* Semantic HTML usage

---

## 10. Design Constraints

1. Must visually resemble GitHub layout and spacing
2. Must not introduce complex animations
3. Must prioritize readability over aesthetics
4. Must maintain consistent component structure
5. Must avoid overcrowding UI with metrics

---

## 11. Reusable Components List

* Header
* Repo Info Bar
* Tabs
* Card
* Chart Wrapper
* Score Card
* Insight Box
* Loader Skeleton

---

## 12. Future Enhancements

* Dark/light toggle
* Custom dashboards
* Comparison view (multiple repos)

---

END OF DESIGN DOCUMENT
