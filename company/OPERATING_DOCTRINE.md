# OPERATING_DOCTRINE.md - Swarm Coordination & Cost Discipline

## Core Doctrines

### 1. Revenue-Driven Target
Every agent action, ticket creation, or routine execution must trace back to the company mission, an active client goal, or a direct revenue hypothesis.

### 2. Task Ownership & Budgets
No task is left ownerless. Each routine is assigned a responsible agent ID. Every model request runs under strict budget caps tracked in `budgets.yaml` to prevent runaway API billing.

### 3. Session Contraction & Reusability
Avoid quick scratch scripts that get abandoned. If a custom workflow succeeds (e.g. lead scraping, translation, mock posting), it must be modularized and compiled into `skills.md`.

### 4. Logging & Continuity
All decisions, costs, and token consumption are logged in JSON-compatible formats inside the SQLite database or active reports folder to preserve memory across sessions.
