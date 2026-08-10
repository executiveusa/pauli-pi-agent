# Mission Control Auth + Context Evidence — 2026-08-10

Branch: `feat/mission-control-auth-context`
Parent: `fix/control-plane-secret-boundary`
Latest verified application commit: `601eee68e86442fc35993047b0b435762400e74a`

## Goal

Replace the static/demo Mission Control with a real authenticated Pauli control surface that reads organization-scoped state from the existing Botanic Creations data plane and provides one safe first control action: create an internal mission intent from plain language.

## Live data-plane evidence

Verified against Supabase project `botanic-creations` (`cyxdevcjycmffhmwxojh`).

Canonical schemas already exist:

- `pauli`
- `pauli_private`

Relevant `pauli` tables have RLS enabled and include:

- `organizations`
- `memberships`
- `agents`
- `missions`
- `mission_tasks`
- `mission_events`
- `approvals`
- `runtime_runs`
- `tool_runs`
- `checkpoints`
- `evidence_receipts`
- `memory_entries`
- `integration_connections`

Verified RLS roles:

- organization members can read organization/mission/task/event/agent/approval state;
- owner/admin/operator can create/update missions, tasks, events and agents;
- owner/admin/reviewer can create/update approvals;
- owner/admin retain destructive membership/agent controls.

Verified private helpers include membership and role checks plus runtime/control functions. Privileged runtime helpers are not exposed as anonymous browser operations.

## Bootstrap/auth state

At inspection time:

- `auth.users`: 0
- `pauli.memberships`: 0
- `pauli_private.owner_allowlist`: 1 owner entry

Auth user insert/update triggers call `pauli_private.bootstrap_allowlisted_membership()`. Therefore the empty membership table is expected before the first allowlisted owner completes Supabase Auth. No manual membership record was inserted.

## Authentication implementation

### Browser client

`brain-dashboard/lib/pauli-supabase.ts`

- uses the Botanic project URL and a browser-safe Supabase publishable key;
- environment values override the built-in public project configuration;
- persists and refreshes the user's Supabase session;
- contains no service-role credential.

### Mission Control gate

`brain-dashboard/components/mission-control/MissionControlAuthGate.tsx`

- magic-link email sign-in through Supabase Auth;
- session listener and sign-out;
- loads `/api/pauli/context` with the authenticated user's access token;
- blocks the product if the authenticated user has no active Pauli membership;
- exposes authorized Pauli context to the dashboard through React context.

### Authenticated read endpoint

`brain-dashboard/app/api/pauli/context/route.ts`

- requires bearer authentication;
- verifies the user with `auth.getUser()`;
- requires an active `pauli.memberships` row;
- reads organizations, agents, missions, approvals and recent mission events through the user's JWT and RLS;
- does not use a service-role bypass.

## Demo-data removal

`MissionControlDashboard.tsx` no longer uses the old `DEMO_AGENTS`, fake projects, fake build queue, fake judge decisions or fake watcher alerts.

The canonical screen now renders only authoritative state:

- Pauli agents;
- missions;
- pending approvals;
- mission event stream;
- derived system state based on actual agent/mission statuses.

Current seed state should render as degraded because the seed mission is blocked and the seeded Pauli agent is not actively running.

## First live control action — mission intent

### Endpoint

`POST /api/pauli/missions`

The endpoint:

- requires a valid Supabase user token;
- resolves active organization membership;
- requires owner/admin/operator role;
- validates intent length and mission enums;
- defaults new missions to `INTENT`;
- defaults autonomous budget to `$0`;
- records the authenticated user as `created_by`;
- records a UUID correlation/request ID;
- writes source/interface provenance in metadata;
- writes a correlated `MISSION_CREATED` event with a database-enforced event idempotency key.

The endpoint does **not** invoke runtime execution, spend money, deploy, publish, contact a person, alter credentials, or approve consequential actions.

### Interface

The top of Mission Control now asks:

`What do you want Pauli to accomplish?`

Submitting the outcome creates only the internal mission intent and refreshes the real mission/event state. Consequential controls remain visibly gated rather than simulated.

## Build/type evidence

Feature-branch `vercel.json` temporarily points the Vercel preview at the Next.js `brain-dashboard` so Mission Control can be verified without changing production `main`.

The strict type gate was restored by removing `typescript.ignoreBuildErrors` from `brain-dashboard/next.config.ts`.

The first strict build exposed the historical `brain-dashboard/lib/supabase.ts` custom type shim as broken. That shim was repaired instead of disabling type checks again.

Vercel deployment for commit `601eee68e86442fc35993047b0b435762400e74a`:

- deployment: `dpl_8xsfB6BfUVxKGvCkW2NpNbw2R4kf`
- state: `READY`
- Next compile: PASS
- lint/type validity: PASS
- page-data collection: PASS
- static generation: PASS
- `/api/pauli/context`: generated
- `/api/pauli/missions`: generated
- `/mission-control`: generated

This is strong application build/type evidence, but it is not a substitute for the repository-wide `npm run check` required by `AGENTS.md`.

## Remaining verification gaps

1. **End-to-end owner login is not yet proven.** There were no Supabase Auth users at audit time and this automated pass did not send a magic-link email on the owner's behalf.
2. **Auth redirect allowlist/site configuration is not verified.** Dynamic preview URLs may require an allowed Supabase Auth redirect before the magic link returns to `/mission-control` correctly.
3. **Cross-organization RLS denial has been verified structurally from policies, not through two live authenticated test users.**
4. **Mission-intake POST has compiled and is RLS-scoped but has not yet been exercised with a real authenticated owner session.**
5. **Mission insert + event insert are not one database transaction.** Event failure is surfaced as a warning; a future RPC/transaction can make the receipt atomic.
6. **Mission correlation ID is not database-unique.** The route checks for an existing matching mission before insert; a concurrent race could still duplicate mission rows. Event idempotency itself is database-enforced.
7. **Approval decisions, runtime start/stop, spending, deployment and external actions remain intentionally unwired.**
8. **Repository-wide `npm run check` remains blocked in this execution environment because local DNS cannot resolve GitHub/npm infrastructure.**
9. **Mission Control currently depends on Next.js 15.3.3.** Vercel flags that release as vulnerable; upgrade must be handled in a reproducible dependency/lockfile slice before production promotion.

## Release decision

`NOT READY FOR MAIN / PRODUCTION`

The branch is now a real, reviewable Mission Control preview rather than a demo dashboard, but it must remain a feature branch until:

- owner login + redirect works;
- authenticated RLS read/write tests pass;
- repository-wide checks pass;
- the Next.js security update is completed;
- consequential control endpoints are separately specified and verified.
