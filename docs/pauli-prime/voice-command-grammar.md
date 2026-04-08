# Voice Command Grammar (Operator Cockpit)

## Intent Families
- `project.assign`
- `agent.spawn`
- `approval.review`
- `memory.lookup`
- `lane.focus`
- `overnight.plan`

## Examples
- "Assign Hermes relationship graph cleanup to Builder and run preview tests."
- "Spawn tenant agent for Kupuri Media with default policy pack."
- "Show escalations needing approval for public launch."
- "Search memory for Akash Engine deployment failures from last 7 days."

## Structured Parse Output
```json
{
  "intent": "project.assign",
  "target_lane": "hermes_relationship_graph",
  "target_project": "graph-cleanup",
  "agent_role": "builder",
  "constraints": {
    "deploy_mode": "preview_first",
    "require_rollback": true
  }
}
```

## Safety Requirements
- Any parsed secret material must be redacted prior to persistence.
- Intents touching money, public launch, or irreversible changes must create approval requests.
- Transcript chunks must be stored in episodic memory with tenant scope.
