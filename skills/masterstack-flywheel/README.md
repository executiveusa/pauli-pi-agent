# Masterstack Flywheel

Deploy any multi-model "agent flywheel" stack — orchestrator + worker models behind a unified LiteLLM gateway, with optional local GPU workers — to a VPS, with every secret managed by [Infisical](https://infisical.com). See `SKILL.md` for the full mission and approval gates, `workflow.md` for the step-by-step process.

## Origin and a Security Correction

This skill generalizes two source patterns supplied for this project:

1. **"The Five Key Stack"** — an orchestrator model (GLM-5.2 / MiniMax M3 class), a code-generation worker (Kimi K2.7 Code class), an avatar/video worker (Hailuo 2.3 class), a local TTS container (F5-TTS), and a local fast-copy worker (Qwen 2.5-14B), coordinated by a "Hermes Agent" state machine.
2. **[Dicklesworthstone's Agentic Coding Flywheel Setup (ACFS)](https://github.com/Dicklesworthstone/agentic_coding_flywheel_setup)** — local agent-tooling conventions (session search, destructive-command guarding, agent-to-agent mail, dependency visualization) for running multiple concurrent coding agents.

**The originally supplied ACFS "one-click install" command is not a valid URL** (`https://githubusercontent.com(date +%s)` has no path and uses shell-interpolation syntax outside a real shell context) and is **not included anywhere in this skill**. This repo's standing rule is to never embed unverified or auto-generated URLs, and never pipe an unread remote script into `bash` as root. Use the documented `git clone` + read-before-run method in `SKILL.md` instead if you want ACFS's local agent tooling alongside this stack.

The model identifiers from the original spec (`GLM-5.2`, `MiniMax M3`, `Kimi K2.7 Code`, `Hailuo 2.3 Video`) are kept as **placeholders** in `infra/litellm-config.yaml` — they came from the user's own notes and have not been verified against a live model catalog. Replace them before any real deployment.

## What's Different From the Original Spec

- **No plaintext `.env`.** The original `deploy.sh` wrote real API keys into a checked-in-looking `.env` file. This version uses `infisical run` to inject secrets directly into the `docker compose` process; see `infra/infisical-setup.md`.
- **Gateway bound to localhost by default.** The original compose file published port `4000` to all interfaces. This version binds `127.0.0.1:4000:4000` — exposing it further is a Human Approval Gate item in `SKILL.md`.
- **No blind curl-pipe-to-bash.** `bootstrap.sh` only fetches from two well-known, official install endpoints (`get.docker.com` for Docker, `artifacts-cli.infisical.com` for the Infisical CLI) and is meant to be read before it's run, not auto-executed.
- **Manifest-driven, not hardcoded to five specific models.** `stack.manifest.json` (see `workflow.md`) lets a deployment use however many orchestrator/worker roles it actually needs.

## Files

| File | Purpose |
|---|---|
| `SKILL.md` | Mission, security rules, approval gates, done criteria |
| `pi-loading-rules.md` | When PI should load this skill |
| `branch-policy.md` | Folder boundaries |
| `workflow.md` | Step-by-step provisioning workflow + Hermes-pattern state machine |
| `infra/docker-compose.yml` | Gateway + optional local GPU workers, secrets via process env only |
| `infra/litellm-config.yaml` | Model routing config template |
| `infra/bootstrap.sh` | Idempotent VPS bootstrap, Infisical-driven |
| `infra/infisical-setup.md` | How to create the Infisical project/environment/machine identity |
