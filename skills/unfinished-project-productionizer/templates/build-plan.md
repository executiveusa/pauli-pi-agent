# BUILD PLAN: {{project_name}}

**Created**: {{timestamp}}
**Approved by**: {{human_approver}} at {{approval_timestamp}}
**Estimated Timeline**: {{timeline_estimate}}
**Total Tasks**: {{total_task_count}}
**Factory Run ID**: {{factory_run_id}}

---

## Summary

| Priority | Count | Total Effort | Status |
|----------|-------|--------------|--------|
| P0 — Critical (security/data loss) | {{p0_count}} | {{p0_effort}} | {{status}} |
| P1 — High (core functionality) | {{p1_count}} | {{p1_effort}} | {{status}} |
| P2 — Medium (quality/design) | {{p2_count}} | {{p2_effort}} | {{status}} |
| P3 — Optional (post-launch) | {{p3_count}} | {{p3_effort}} | {{status}} |
| **TOTAL** | **{{total}}** | **{{total_effort}}** | |

**Critical Path**: {{critical_path_description}}
**Earliest possible completion**: {{earliest_completion}}

---

## Timeline Calculation

```
Raw effort (all tasks): {{raw_effort_hours}} hours
Parallel execution factor (0.6): {{adjusted_hours}} hours
Buffer (30%): {{buffered_hours}} hours
Calendar days (8hr/day): {{calendar_days}} days

Milestone 1 (P0 complete): Day {{day_p0}}
Milestone 2 (P1 complete): Day {{day_p1}}
Milestone 3 (P2 complete / Judge review): Day {{day_p2}}
Milestone 4 (Deployment): Day {{day_deploy}}
```

---

## P0 — CRITICAL TASKS

These tasks block all deployment. Execute first, in dependency order.

---

### TASK-{{id}}
**Category**: {{SECURITY | BUG | INFRA}}
**Priority**: P0
**Effort**: {{XS (<1hr) | S (1-4hr) | M (4-8hr) | L (1-2d) | XL (3-5d)}}
**Assigned Agent**: {{Backend | Frontend | Design | Deployment | Master}}
**Dependencies**: {{[TASK-IDs] or "none"}}
**Status**: {{PENDING | IN_PROGRESS | COMPLETE | BLOCKED | FAILED}}

**Description**:
{{detailed_description}}

**Implementation Notes**:
{{implementation_approach}}

**Files to Modify**:
```
{{file_1}}
{{file_2}}
```

**Acceptance Criteria**:
- [ ] {{criterion_1}}
- [ ] {{criterion_2}}
- [ ] {{criterion_3}}

**Verification**:
```bash
{{verification_command_or_description}}
```

**Completed at**: {{completion_timestamp}} *(filled in during execution)*
**Completed by**: {{agent_or_human}} *(filled in during execution)*

---

*(Repeat TASK block for each P0 task)*

---

## P1 — HIGH PRIORITY TASKS

Core functionality. Must complete before production deployment.

---

### TASK-{{id}}
**Category**: {{FEATURE | BUG | INFRA}}
**Priority**: P1
**Effort**: {{effort}}
**Assigned Agent**: {{agent}}
**Dependencies**: {{dependencies}}
**Status**: PENDING

**Description**:
{{description}}

**Implementation Notes**:
{{notes}}

**Files to Modify**:
```
{{files}}
```

**Acceptance Criteria**:
- [ ] {{criterion_1}}
- [ ] {{criterion_2}}

**Completed at**: *(pending)*

---

*(Repeat for each P1 task)*

---

## P2 — MEDIUM PRIORITY TASKS

Quality, design, and production readiness improvements.

---

### TASK-{{id}}
**Category**: {{DESIGN | FEATURE | INFRA | DOCS}}
**Priority**: P2
**Effort**: {{effort}}
**Assigned Agent**: {{agent}}
**Dependencies**: {{dependencies}}
**Status**: PENDING

**Description**:
{{description}}

**Acceptance Criteria**:
- [ ] {{criterion_1}}

**Completed at**: *(pending)*

---

*(Repeat for each P2 task)*

---

## P3 — OPTIONAL / POST-LAUNCH TASKS

Nice to have. Can ship without these.

---

### TASK-{{id}}
**Category**: {{category}}
**Priority**: P3
**Effort**: {{effort}}
**Assigned Agent**: {{agent}}
**Dependencies**: {{dependencies}}
**Status**: DEFERRED

**Description**:
{{description}}

**Why Deferred**: {{reason}}

---

*(Repeat for each P3 task)*

---

## Dependency Map

```
Execution Order (topological sort):

PHASE A (parallel group — no inter-dependencies):
  TASK-001 → TASK-002 → TASK-003

PHASE B (can start after Phase A completes):
  TASK-004, TASK-005 (parallel)
  TASK-006, TASK-007 (parallel)

PHASE C (can start after Phase B completes):
  TASK-008 → TASK-009

PHASE D (final integration):
  TASK-010

Critical Path: TASK-001 → TASK-004 → TASK-008 → TASK-010
Critical Path Length: {{critical_path_hours}} hours
```

---

## Agent Assignment Summary

| Agent | Tasks Assigned | Priority Tasks | Effort |
|-------|---------------|---------------|--------|
| Backend Agent | {{tasks}} | P0: {{n}}, P1: {{n}} | {{effort}} |
| Frontend Agent | {{tasks}} | P0: {{n}}, P1: {{n}} | {{effort}} |
| Design Agent | {{tasks}} | P1: {{n}}, P2: {{n}} | {{effort}} |
| Deployment Agent | {{tasks}} | P1: {{n}} | {{effort}} |
| Master Agent | {{tasks}} | P0: {{n}} | {{effort}} |

---

## Human Decisions Required

Items where human input was requested during planning:

| # | Decision Needed | Impact | Requested At | Resolved At | Decision |
|---|----------------|--------|-------------|------------|---------|
| 1 | {{decision}} | {{impact}} | {{timestamp}} | {{timestamp}} | {{decision_made}} |
| 2 | {{decision}} | {{impact}} | {{timestamp}} | | PENDING |
| ... | | | | | |

---

## Risk Register

| Risk | Probability | Impact | Mitigation | Owner |
|------|------------|--------|-----------|-------|
| {{risk_1}} | {{LOW/MED/HIGH}} | {{LOW/MED/HIGH}} | {{mitigation}} | {{agent/human}} |
| {{risk_2}} | {{probability}} | {{impact}} | {{mitigation}} | {{owner}} |
| UDEC score fails to reach 8.5 | {{probability}} | HIGH | Design Agent auto-rebuild | Design Agent |
| Third-party API integration fails | MEDIUM | HIGH | Implement mock fallback first | Backend Agent |
| Human blocker unresolved > 48h | MEDIUM | MEDIUM | Parallel-track non-blocked tasks | Watcher |
| | | | | |

---

## Execution Log

*This section is filled in during Phase 7 (Implementation)*

| Time | Task | Agent | Action | Result |
|------|------|-------|--------|--------|
| {{timestamp}} | TASK-{{id}} | {{agent}} | Started | — |
| {{timestamp}} | TASK-{{id}} | {{agent}} | Completed | PASS |
| {{timestamp}} | TASK-{{id}} | {{agent}} | Failed | {{reason}} |
| {{timestamp}} | TASK-{{id}} | {{agent}} | Retried | PASS |
| ... | | | | |

**Integration Checkpoint Log**:

| Checkpoint | Time | Tests | Browser QA | Watcher Alerts | Status |
|-----------|------|-------|-----------|---------------|--------|
| CP-1 (after 5 tasks) | {{time}} | {{result}} | {{result}} | {{count}} | {{status}} |
| CP-2 (after 10 tasks) | {{time}} | {{result}} | {{result}} | {{count}} | {{status}} |
| ... | | | | | |

---

## Build Plan Amendments

Changes to the plan after initial human approval (each requires Watcher notification):

| Amendment # | Date | Change | Reason | Approved By |
|------------|------|--------|--------|------------|
| {{n}} | {{date}} | {{change}} | {{reason}} | {{approver}} |

---

## Completion Summary

*Filled in after Phase 7 completes*

**Completed Tasks**: {{completed}}/{{total}}
**Blocked Tasks**: {{blocked}} (human acknowledged)
**Failed Tasks**: {{failed}} (deferred or escalated)
**Actual Timeline**: {{actual_days}} days vs. {{estimated_days}} days estimated
**Deviation from plan**: {{deviation}}%

---

*Build Plan generated by Pauli Pi Software Factory — Unfinished Project Productionizer v1.0.0*
*Workflow reference: /skills/unfinished-project-productionizer/workflow.md*
