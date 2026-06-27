# PROJECT AUDIT: {{project_name}}

**Date**: {{timestamp}}
**Audited by**: Pauli Pi Software Factory — Unfinished Project Productionizer
**Auditor Version**: 1.0.0
**Repository**: {{repository_url}}
**Branch**: {{branch}}
**Audit ID**: {{audit_id}}

---

## What Was Being Built

{{what_being_built}}

*Include: the core value proposition, intended users, and what problem it solves.*

---

## Current State

**Status**: {{current_state}}
*(RUNS | PARTIAL_RUN | INSTALL_FAIL | ENV_FAIL | CRASH_ON_START | UNKNOWN)*

**Last Commit**: {{last_commit_date}}
**Staleness**: {{staleness_level}}
*(ACTIVE | RECENT | COOLING | STALE | ABANDONED)*

**Completeness**: {{completeness_score}}%

**Run Attempt Result**:
```
{{run_attempt_output}}
```

---

## Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Language | {{language}} | {{version}} | |
| Framework | {{framework}} | {{version}} | |
| Database | {{database}} | {{version}} | |
| Auth | {{auth_library}} | {{version}} | |
| Styling | {{css_approach}} | {{version}} | |
| UI Components | {{component_library}} | {{version}} | |
| Testing | {{test_framework}} | {{version}} | |
| Deployment | {{deployment_target}} | | |
| Package Manager | {{pkg_manager}} | {{version}} | |

**Dependency Age**: {{dependency_age_assessment}}
*(Up to date | Minor updates available | Major updates available | Dangerously outdated)*

---

## Working Functionality

The following features are confirmed working:

| # | Feature | Description | Notes |
|---|---------|-------------|-------|
| 1 | {{feature}} | {{description}} | |
| 2 | {{feature}} | {{description}} | |
| 3 | {{feature}} | {{description}} | |
| ... | | | |

**Summary**: {{working_summary}}

---

## Missing Functionality

Features that were planned or referenced but not implemented:

| # | Feature | Priority | Effort | Depends On |
|---|---------|----------|--------|------------|
| 1 | {{feature}} | {{P0-P3}} | {{XS-XL}} | {{dependencies}} |
| 2 | {{feature}} | {{P0-P3}} | {{XS-XL}} | {{dependencies}} |
| 3 | {{feature}} | {{P0-P3}} | {{XS-XL}} | {{dependencies}} |
| ... | | | | |

**Missing feature count**: {{missing_count}}
**Estimated total effort to implement**: {{total_effort}}

---

## Broken Functionality

Features that exist in code but do not work correctly:

| # | Feature | Expected Behavior | Actual Behavior | Severity | Root Cause |
|---|---------|------------------|-----------------|----------|-----------|
| 1 | {{feature}} | {{expected}} | {{actual}} | {{CRITICAL/HIGH/MEDIUM/LOW}} | {{cause}} |
| 2 | {{feature}} | {{expected}} | {{actual}} | {{CRITICAL/HIGH/MEDIUM/LOW}} | {{cause}} |
| ... | | | | | |

**Broken feature count**: {{broken_count}}
**Estimated total effort to fix**: {{total_fix_effort}}

---

## Revenue Opportunities

*Full strategy in `/audit-output/monetization-strategy.md`*

**Project Type**: {{project_type}}
**Primary Revenue Model**: {{primary_model}}
**Revenue Score**: {{revenue_score}}/100

**Top 3 Revenue Paths**:
1. {{path_1_name}} — {{path_1_description}} — Est. MRR at 100 customers: ${{mrr_1}}
2. {{path_2_name}} — {{path_2_description}} — Est. MRR at 100 customers: ${{mrr_2}}
3. {{path_3_name}} — {{path_3_description}} — Est. MRR at 100 customers: ${{mrr_3}}

**Time to First Revenue**: {{ttfr_estimate}}

---

## Design Issues

**UDEC Score**: {{udec_score}}/10
**Synthia Standards Compliance**: {{compliance_pct}}%
**Design Verdict**: {{PASS | NEEDS_PATCHES | FAIL_AUTO_REBUILD}}

**Critical Design Issues**:
| # | Issue | Severity | Effort to Fix |
|---|-------|----------|---------------|
| 1 | {{issue}} | {{severity}} | {{effort}} |
| 2 | {{issue}} | {{severity}} | {{effort}} |
| ... | | | |

**Design Recommendations**:
{{design_recommendations}}

---

## Technical Debt

| Category | Description | Severity | Effort |
|----------|-------------|----------|--------|
| Code Duplication | {{description}} | {{severity}} | {{effort}} |
| Missing Types | {{description}} | {{severity}} | {{effort}} |
| Complexity | {{description}} | {{severity}} | {{effort}} |
| Dead Code | {{description}} | {{severity}} | {{effort}} |
| Documentation | {{description}} | {{severity}} | {{effort}} |
| Dependencies | {{description}} | {{severity}} | {{effort}} |

**Technical Debt Score** (lower is better): {{debt_score}}/100
**Estimated effort to address all debt**: {{debt_effort}}

---

## Security Issues

**Overall Security Assessment**: {{PASS | CONCERNS | CRITICAL_ISSUES}}

| # | Issue | Severity | Type | File(s) | Fix |
|---|-------|----------|------|---------|-----|
| 1 | {{issue}} | {{CRITICAL/HIGH/MEDIUM/LOW}} | {{type}} | {{files}} | {{fix}} |
| 2 | {{issue}} | {{CRITICAL/HIGH/MEDIUM/LOW}} | {{type}} | {{files}} | {{fix}} |
| ... | | | | | |

**Critical security issues** (must fix before deployment): {{critical_security_count}}

**Vulnerability Audit**:
```
{{npm_audit_summary or pip_check_output}}
```

---

## Human Blockers

Items that require human input before work can proceed:

| # | Blocker | What Is Needed | Impact if Unresolved | Status |
|---|---------|---------------|---------------------|--------|
| 1 | {{blocker}} | {{what_needed}} | {{impact}} | {{PENDING/RESOLVED}} |
| 2 | {{blocker}} | {{what_needed}} | {{impact}} | {{PENDING/RESOLVED}} |
| ... | | | | |

**Resolution Instructions**: Contact {{human_contact}} via {{contact_method}} with the above items.

---

## Deployment Readiness

**Score**: {{deployment_readiness}}/100

**Breakdown**:
| Category | Score | Max | Notes |
|----------|-------|-----|-------|
| Security | {{score}} | 5 | {{notes}} |
| Reliability | {{score}} | 5 | {{notes}} |
| Performance | {{score}} | 5 | {{notes}} |
| Observability | {{score}} | 5 | {{notes}} |
| Deployment Config | {{score}} | 5 | {{notes}} |
| Scalability | {{score}} | 5 | {{notes}} |

**Deployment Blockers** (must resolve before any deployment):
{{deployment_blockers}}

---

## Production Readiness

**Score**: {{production_readiness}}/100

**Verdict**:
```
Score 90-100: PRODUCTION READY
Score 70-89:  NEARLY READY
Score 50-69:  NEEDS WORK
Score < 50:   NOT READY
```

**Current Verdict**: {{production_verdict}}

**Path to Production Readiness**:
{{production_path_summary}}

---

## Recommended Next Steps

1. **Immediate (before any build work)**: Resolve {{count}} human blockers listed above
2. **P0 (security / data loss)**: {{p0_summary}}
3. **P1 (core functionality)**: {{p1_summary}}
4. **P2 (quality / design)**: {{p2_summary}}
5. **P3 (optional / post-launch)**: {{p3_summary}}

**Estimated total effort to reach production**: {{total_effort_to_production}}
**Estimated timeline**: {{timeline_estimate}}

---

## Audit Appendix

### Directory Structure Summary
```
{{directory_tree}}
```

### File Count by Type
| Type | Count | Lines of Code |
|------|-------|---------------|
| TypeScript/JavaScript | {{count}} | {{loc}} |
| CSS/SCSS | {{count}} | {{loc}} |
| HTML/Templates | {{count}} | {{loc}} |
| Configuration | {{count}} | {{loc}} |
| Tests | {{count}} | {{loc}} |
| Documentation | {{count}} | {{loc}} |

### Git Activity
```
{{git_log_summary}}
```

### Dependencies Summary
```
{{dependency_summary}}
```

---

*Audit generated by Pauli Pi Software Factory — Unfinished Project Productionizer v1.0.0*
*Full workflow: /skills/unfinished-project-productionizer/workflow.md*
