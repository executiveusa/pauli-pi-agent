# Masterstack Flywheel Skill

## Mission

Provision, configure, and deploy a multi-model "agent flywheel" stack onto any VPS — a state-machine orchestrator (Hermes-pattern) sitting in front of a unified LiteLLM gateway that routes between remote frontier models and local self-hosted models, with every secret managed by Infisical instead of plaintext `.env` files.

This skill generalizes two source patterns the studio standardized on:

1. **The Five Key Stack** — a worked example: an orchestrator model (planning), a code-generation model (site builds), a video/avatar model, a local TTS container, and a local high-speed copy model, all unified behind one gateway.
2. **Dicklesworthstone's Agentic Coding Flywheel (ACFS)** — local agent-tooling conventions (session search, destructive-command guarding, agent-to-agent messaging, dependency visualization) layered on top of the deployed stack.

The deliverable is not tied to those five specific models — `stack.manifest.json` (see `workflow.md`) defines whatever models/roles a given deployment actually needs.

## Non-Negotiable Security Rule

**No plaintext secrets, ever, in this skill's output.**

- No API keys, tokens, or credentials are hardcoded in `infra/docker-compose.yml`, `infra/litellm-config.yaml`, or `infra/bootstrap.sh`.
- Compose/gateway configs reference secrets only as `${VAR_NAME}` resolved from the **process environment at runtime**, injected by `infisical run -- ...`. They are never read from a checked-in `.env` file.
- If a tool genuinely requires a `.env` file on disk (some local model servers do), `bootstrap.sh` generates it via `infisical export` into a path that is git-ignored, `chmod 600`, and torn down at the end of a one-shot run — never committed.
- See `infra/infisical-setup.md` for the secrets workflow.

## Security Note on the ACFS One-Liner

The originally supplied "one-click install" command —

```
curl -fsSL "https://githubusercontent.com(date +%s)" | bash -s -- --yes --mode vibe
```

— is **not a valid, resolvable URL** (missing path, and `(date +%s)` isn't shell-interpolated outside `$()`). Per this repo's URL-safety rule, this skill does not embed it. Use the verified alternative instead, gated by human review of the script contents before execution:

```bash
git clone https://github.com/Dicklesworthstone/agentic_coding_flywheel_setup.git
cd agentic_coding_flywheel_setup
less acfs.sh        # read it before running anything as root on a VPS
./acfs.sh
```

Never pipe a remote script straight into `bash` on a production host without reading it first.

## Components

```text
skills/masterstack-flywheel/
  SKILL.md                  this file
  pi-loading-rules.md       when PI should load this skill
  branch-policy.md          folder/branch boundaries
  workflow.md                step-by-step provisioning workflow + state machine
  infra/
    docker-compose.yml      gateway + local model containers, secrets via process env only
    litellm-config.yaml     model_list routing config (model slugs are placeholders — verify against live catalogs)
    bootstrap.sh             idempotent VPS bootstrap, Infisical-driven, no plaintext secrets
    infisical-setup.md       how to create the Infisical project/environments/machine identity
```

## Model Identifiers Are Placeholders

`GLM-5.2`, `MiniMax M3`, `Kimi K2.7 Code`, `Hailuo 2.3 Video`, and similar slugs in this skill's example config came from the user's own spec and may not match current OpenRouter/MiniMax catalog names. Before any real deployment, confirm exact model IDs against the provider's live model list — do not assume the placeholder strings in `litellm-config.yaml` are deployable as-is.

## Human Approval Gates

Required before any of the following:

- Running `bootstrap.sh` against a real VPS (it installs Docker, the NVIDIA container toolkit, and the Infisical CLI as root).
- Creating or rotating real Infisical projects/secrets/machine identities.
- Running `infisical run -- docker compose up -d` with real provider API keys.
- Exposing the LiteLLM gateway port (`4000`) or any model container port beyond `localhost`/an internal network.
- Cloning and executing any third-party bootstrap script (including ACFS's `acfs.sh`) — read it first.

## Done Criteria

A provisioning run is complete when it has produced:

1. A reviewed `stack.manifest.json` for the target deployment (which models, which roles, which ports).
2. An Infisical project + environment holding every credential the stack needs (`infisical secrets list --env=<env>` confirms expected keys, no values printed to logs).
3. `docker compose up -d` healthy (`docker compose ps` all `Up`/`healthy`).
4. A LiteLLM gateway smoke test (`curl localhost:4000/health` or equivalent) passing with the injected bearer key.
5. A short `DEPLOY_NOTES.md` for that VPS: what's running, which ports, how to rotate secrets, how to tear it down.
