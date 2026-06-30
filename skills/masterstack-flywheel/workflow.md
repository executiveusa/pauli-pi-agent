# Masterstack Flywheel Workflow

## 0. Define the Manifest

Before touching any infrastructure, write `stack.manifest.json` for the target deployment. Do not assume the Five Key Stack example applies — most deployments need a subset.

```jsonc
{
  "host_slug": "client-demo-vps-01",
  "orchestrator": {
    "role": "planning / PRD decomposition",
    "model": "REPLACE_WITH_VERIFIED_MODEL_ID",
    "provider": "openrouter",
    "context_window_tokens": 1000000
  },
  "workers": [
    { "name": "site-developer", "role": "codegen", "model": "REPLACE_WITH_VERIFIED_MODEL_ID", "provider": "openrouter" },
    { "name": "speed-copywriter", "role": "content", "model": "REPLACE_WITH_VERIFIED_MODEL_ID", "provider": "local-vllm", "gpu_required": true },
    { "name": "voice-master", "role": "tts", "model": "f5-tts", "provider": "local-docker", "gpu_required": true }
  ],
  "gateway_port": 4000,
  "expose_publicly": false
}
```

Every `model` field must be confirmed against the provider's live catalog before deployment — see `SKILL.md` → "Model Identifiers Are Placeholders".

## 1. Secrets First, Always

Follow `infra/infisical-setup.md` to create (or reuse) an Infisical project, environment, and machine identity scoped to this deployment. Push every credential the manifest implies (`OPENROUTER_API_KEY`, `MINIMAX_API_KEY`, gateway bearer secret, etc.) into Infisical. Confirm with:

```bash
infisical secrets list --env=prod --silent
```

Do not proceed until this returns the expected key names. No value should ever be pasted into chat, a commit, or a log.

## 2. Generate Config From the Manifest

Use `infra/litellm-config.yaml` as a template — fill in `model_name`/`model` pairs from the manifest, leave `api_key` as `os.environ/<VAR>` references (LiteLLM resolves these from process env, which `infisical run` populates).

Use `infra/docker-compose.yml` as a template — add/remove worker services per the manifest. Every `environment:` entry must be `${VAR_NAME}` form, never a literal value.

## 3. Bootstrap the Host (Human Approval Gate)

On a fresh VPS, as a human-approved step:

```bash
git clone <this repo> && cd pauli-pi-agent/skills/masterstack-flywheel/infra
chmod +x bootstrap.sh
INFISICAL_PROJECT_ID=<id> INFISICAL_ENV=prod ./bootstrap.sh
```

`bootstrap.sh` is idempotent — re-running it should not duplicate installs or restart healthy containers unnecessarily. It never writes a plaintext secrets file outside a git-ignored, `chmod 600` path, and only when a downstream tool can't read process env directly.

## 4. Local Sandboxed Verification

Before treating the deployment as production-ready:

1. `docker compose ps` — every service `Up`/`healthy`.
2. Gateway smoke test: `curl -H "Authorization: Bearer $LITELLM_MASTER_KEY" localhost:4000/health`.
3. One real round-trip per worker role (a tiny prompt through the orchestrator, a short TTS clip, etc.) — verify output, not just process status.
4. If anything fails, fix the config and re-run `bootstrap.sh` rather than hand-patching the running container.

## 5. State Machine (Hermes Pattern)

Once verified, the orchestrator drives state transitions for actual build/deploy jobs run *through* the stack (this is the application-level pattern the stack enables, distinct from the one-time infra bootstrap above):

```text
INTAKE -> PLANS_READY -> ASSETS_READY -> MEDIA_COMPLETED -> BUILD_VERIFIED -> DEPLOYED
```

Persist this state in whatever durable store the deployment already has (Postgres/SQLite/Redis) — do not invent a new datastore per deployment. Each transition is triggered by a worker completing its role, not by workers calling each other directly, to avoid context drift and loops.

## 6. Done

Write `factory/flywheel-deployments/<host-slug>/DEPLOY_NOTES.md`:

- What's running, on which ports, behind which gateway key.
- How to rotate each secret (`infisical secrets set ... --env=prod` then `docker compose restart litellm-gateway`).
- How to tear the stack down (`docker compose down`, then revoke the Infisical machine identity if the host is being decommissioned).
