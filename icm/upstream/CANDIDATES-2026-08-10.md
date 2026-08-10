# Upstream Pi Harvest Candidates — 2026-08-10

Current Pauli coding-agent baseline: `@mariozechner/pi-coding-agent` 0.67.2.
Current upstream package observed during this audit: `@earendil-works/pi-coding-agent` 0.82.1.

This is a selective port queue, not a request to merge upstream `main`.

## Tier A — inspect/port first

These upstream fixes improve reliability or package/resource handling and are good candidates for isolated backports if their diffs do not depend on the scope/runtime migration.

| Upstream item | Why Pauli should evaluate it | Risk |
|---|---|---|
| v0.74.1: `--resume` session listing concurrency/OOM fix (#4583) | Pauli has long-lived/session-heavy use; safer resume behavior directly supports durable operation. | low-medium |
| v0.74.1: uncaught interactive exception restores terminal (#4426) | Prevents terminal corruption on agent failures. | low |
| v0.74.1: Anthropic early-end auto-retry (#4433) | Improves transient model-stream resilience. | medium/provider |
| v0.74.1: skill diagnostics parent-directory mismatch fix (#4534) | Pauli intentionally has compatibility skill roots and canonical ICM skill locations. | low |
| v0.74.1: resource path collision display fix | Helps multi-root skill/package diagnosis. | low |
| v0.75.4: AgentSession retry/compaction/event settlement fix | Directly relevant to long-running reliable sessions. | medium/core |
| v0.75.4: forked session runtime state alignment (#4799) | Prevents wrong active-session identity after forks. | medium/core |
| v0.75.4: `ctx.abort()` preflight settlement fix (#4276) | Improves cancellation/confirmation correctness. | medium/core |
| v0.75.4: supply-chain hardening/shrinkwrap/lifecycle-script allowlist | Strong security improvement, but may require build/release adaptation. | medium/build |
| v0.75.5: git package ref reconciliation (#4869) | Pauli uses many skills/packages and needs deterministic updates. | low-medium |
| v0.75.5: resource path handling across package locations (#4873) | Useful for Pauli's `.pi`, `.agents`, `.claude`, and canonical `skills/` coexistence. | low-medium |
| v0.75.5: config patterns resolve from correct base directory (#4898) | Reduces context/resource loading mistakes. | low-medium |

## Tier B — useful but not first

- image generation and OpenRouter image support from 0.74.x;
- newer provider/login/auth flows;
- custom adaptive thinking/provider behavior;
- newer model metadata;
- TUI rendering improvements.

These touch provider/UI behavior and need focused compatibility tests against Pauli's custom routing and voice/tool integrations.

## Tier C — dedicated migration only

Do not backport casually:

- v0.74.0 package/repository move to `@earendil-works/*`;
- v0.75.0 Node minimum 22.19.0;
- broad provider/model runtime API migrations;
- changes that alter extension/session schemas or assumptions across all core packages.

## Per-candidate procedure

1. Fetch exact upstream PR/commit and changed files.
2. Compare with Pauli customizations in the same files.
3. If the patch is independent, reproduce/cherry-pick the smallest change on its own branch.
4. Run `npm run check` plus the specific affected test(s).
5. Exercise one Pauli regression path (ICM skill loading, session resume, control bridge, custom provider as relevant).
6. Record accepted/rejected result and upstream provenance.

## Stop condition

If a candidate requires accepting the package-scope migration, Node floor, or broad runtime interface changes, move it to the dedicated upstream migration project instead of expanding the backport slice.
