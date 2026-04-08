# Portfolio Operator Playbook (PAULI-PRIME)

## Objective
Run a multi-tenant portfolio operator loop with strict isolation, evidence-first execution, and minimal human interruption.

## Inputs
- Operator profile (principal, lanes, escalation policy).
- Canonical project source (Notion by default).
- Secret manager reference (Infisical or equivalent vault).

## Daily Loop
1. Pull canonical project truth from integration source.
2. Normalize to project units and refresh lane queue.
3. Score queue with weighted prioritization.
4. Assign work to tenant or specialist agents.
5. Enforce policy checks before any sensitive action.
6. Persist episodic memory and evidence records.
7. Promote stable patterns into procedural memory.
8. Publish overnight run summary by lane and risk.

## Escalation Discipline
Escalate only when one of the configured triggers is present:
- secret risk
- billing/payment action
- irreversible action
- public launch
- ambiguous business decision
- multi-service deploy over threshold

## Required Evidence Blocks
- policy decision logs
- task run outputs
- repository diff summaries
- deployment rollback plan
- mail thread references
