# PAULI-PRIME Cockpit UI/UX

## Design Principles
- Voice-first, thumb-friendly interactions.
- Evidence-first decisions (show proof before approve).
- Minimal operator interruption; batch low-risk actions.
- Cross-tenant context never mixed in the same detail panel.

## Primary Views
1. Dashboard: lane health, active runs, escalations, overnight queue.
2. Projects: normalized ProjectUnit table with next-best action.
3. Agents: parent/child/specialist status and capability grants.
4. Mail: threaded coordination with evidence attachments.
5. Memory: searchable layers with scoped filters.
6. Approvals: queued decisions with risk tags and rollback links.
7. Voice Session: transcript stream, intent extraction, handoff controls.

## Mobile PWA Behavior
- Installable manifest and offline shell.
- Push-to-talk floating action button.
- Low-bandwidth fallback for logs and mail threads.

## Interaction Specs
- Approval card: `Action`, `Risk`, `Policy Reason`, `Evidence`, `Approve`, `Reject`.
- Task card: `Stage`, `Owner Agent`, `Retry Count`, `Last Evidence`, `Escalation Needed`.
- Voice intent card: transcript chunk, confidence, parsed intent, target project.
