# Pauli Cloud Control + Runtime Evidence — 2026-08-10

Live system: Botanic Creations Supabase (`cyxdevcjycmffhmwxojh`)

## Finding

Pauli already has a durable cloud control loop. The principal execution blocker is not missing orchestration; it is an unavailable model runtime because no model-provider credential is configured in the runtime Edge Function.

## Scheduled control loop

Verified active `pg_cron` jobs:

| Job | Schedule | Function |
|---|---|---|
| `pauli-mission-control-tick` | `10 seconds` | `pauli_private.mission_control_tick()` |
| `pauli-runtime-health` | `* * * * *` | `pauli_private.invoke_supabase_runtime({"action":"health"})` |
| `pauli-runtime-recover` | `* * * * *` | `pauli_private.recover_runtime_blocked_missions()` |
| `pauli-midday-brief` | `0 12 * * *` | `pauli_private.midday_strategic_brief()` |
| `pauli-midnight-synthesis` | `0 0 * * *` | `pauli_private.midnight_cognitive_synthesis()` |

The mission-control tick serializes with a Postgres advisory lock so overlapping scheduler calls do not process the same state machine concurrently.

## Deterministic mission state machine

Observed `pauli_private.mission_control_tick()` progression:

```text
INTENT
  -> UNDERSTOOD
  -> PLANNED
  -> STAFFED
  -> PROVISIONED
  -> EXECUTING
```

Behavior verified from the live function definition:

- `INTENT -> UNDERSTOOD`
  - normalizes intent;
  - ensures requested outcome/completion level;
  - captures a policy snapshot;
  - emits `INTENT_ACCEPTED`.

- `UNDERSTOOD -> PLANNED`
  - selects active workflow `agentforge-production-loop-v1`;
  - emits `MISSION_PLANNED`.

- `PLANNED -> STAFFED`
  - materializes sequential durable tasks from the workflow definition;
  - assigns the canonical Pauli agent;
  - emits `MISSION_STAFFED`.

- `STAFFED -> PROVISIONED`
  - requires a runtime provider with `health_status = healthy` and `governed = true`;
  - otherwise sets mission `BLOCKED` with `RUNTIME_UNAVAILABLE` and creates an incident;
  - on success records provider/model routing and emits `MISSION_PROVISIONED`.

- `PROVISIONED -> EXECUTING`
  - marks started time;
  - stores runtime/model choice in execution context;
  - emits `MISSION_EXECUTING`.

The workflow currently materializes the AgentForge production chain:

`SPECIFY -> BUILD -> VERIFY -> INTEGRATE -> EXECUTE -> REPAIR -> VERIFY -> INTEGRATE`

## Safe conversational intake correction

Because the live scheduler consumes every `INTENT` mission within seconds, Mission Control conversational intake was changed on the feature branch to save new outcomes as:

`WAITING_APPROVAL`

with:

- autonomous budget = 0;
- `policy_snapshot.execution_release = explicit_human_start`;
- `policy_snapshot.external_writes = human-gated`.

An authenticated owner/admin/operator must explicitly call the Mission Control start endpoint to release the mission to `INTENT`. Only then can the scheduler plan it.

This prevents future runtime configuration from unexpectedly activating old saved drafts.

## Cloud control Edge Function

Verified ACTIVE function: `pauli-control`, JWT verification enabled.

Actions currently implemented:

- `overview`
- `create_mission`
- `decide_approval`

### Authorization mismatch

The function connects directly to Postgres and therefore relies on its own membership/role checks rather than table RLS for writes.

Observed mismatch:

- `create_mission` verifies membership but does not restrict to owner/admin/operator;
- `decide_approval` permits owner/admin/operator/reviewer;
- canonical Pauli approval RLS permits writes to owner/admin/reviewer, not operator.

Decision: do not make this function the canonical Mission Control write API unchanged. The current feature branch uses authenticated user JWT + table RLS and matches the stricter database role contract.

A hardened cloud-control v2 can later consolidate these paths.

## Runtime Edge Function

Verified ACTIVE function: `pauli-runtime-v2`.

Security boundary:

- `verify_jwt` is disabled because it is a private machine endpoint;
- it requires an internal bearer token;
- `pauli_private.invoke_supabase_runtime()` reads the runtime URL/token from Supabase Vault;
- browser clients never receive the internal token.

Observed actions include:

- health;
- execute;
- complete task;
- model planning;
- evidence writing;
- runtime/tool run accounting;
- usage/cost accounting;
- task/mission state progression.

## Runtime provider state

Canonical provider record:

- `provider_key`: `supabase-openai`
- `kind`: `supabase-edge`
- `governed`: true
- endpoint: private `pauli-runtime-v2` URL
- health: `offline`

A live health invocation was triggered through `pauli_private.invoke_supabase_runtime({"action":"health"})`; Edge Function logs returned HTTP 200 and the provider remained correctly classified offline.

Provider metadata reported:

- OpenAI configured: false
- Anthropic configured: false
- OpenRouter configured: false

Supabase Vault inventory contains the internal Pauli runtime URL/token, but no model-provider secret name was found for OpenAI/OpenRouter/Anthropic/Gemini/Groq/Mistral.

## Human gate

Do not create, rotate, or attach a billable model-provider credential without an explicit credential/spend approval. Once a provider credential is configured, run:

1. runtime health;
2. provider health-status verification;
3. a zero/low-risk test mission;
4. runtime run + tool run + evidence receipt checks;
5. budget enforcement;
6. blocked-mission recovery verification;
7. approval gates for external writes.

## Current control-plane state

Connected now on the feature branch:

- authenticated Mission Control;
- organization/role context through RLS;
- real missions/agents/approvals/events;
- runtime provider + incidents read model;
- held mission intake;
- explicit human release to scheduler;
- approval decisions restricted to owner/admin/reviewer;
- simulated legacy Action Center retired.

Blocked before real model execution:

- model-provider credential/configuration;
- end-to-end owner Auth session test;
- repository-wide `npm run check` from a networked runner;
- current Next.js dependency security update.
