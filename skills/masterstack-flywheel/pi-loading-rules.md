# PI Loading Rules

## Skill Identity

```yaml
skill_name: masterstack-flywheel
display_name: Masterstack Flywheel Skill
slash_command: /masterstack
owner_agent: PI
status: active
mode: lazy_load
canonical_folder: skills/masterstack-flywheel/
future_subagent_name: FlywheelOpsAgent
```

## When PI Should Load This Skill

Load this skill when the task involves:

1. Deploying a multi-model agent stack to a VPS or bare-metal host
2. Setting up a LiteLLM (or equivalent) gateway that routes across multiple providers/models
3. Standing up local model containers (vLLM, F5-TTS, XTTS, Ollama, etc.) alongside remote API models
4. "Five Key Stack", "masterstack", "flywheel", "Hermes orchestrator", "agent farm" requests
5. Provisioning secrets management for an agent deployment ("use Infisical", "rotate API keys safely")
6. Bootstrapping a fresh server with Docker + GPU drivers for agent workloads
7. Designing a state-machine orchestration pattern between specialized sub-agents/models

## When PI Should NOT Load This Skill

Do not load this skill for:

- in-repo TypeScript/application feature work (use the normal agent loop)
- one-off client website builds (use `revenue-systems-agent` or `webflow-template-forge`)
- content/copy generation that doesn't involve deploying infrastructure
- anything that doesn't touch a VPS, container stack, or model-routing gateway

## PI Execution Pattern

1. User asks PI to deploy/configure a multi-model stack or set up secrets-managed infra.
2. PI loads this skill and reads `workflow.md`.
3. PI asks for or drafts a `stack.manifest.json` describing the models/roles/ports needed (do not assume the Five Key Stack defaults apply unless the user confirms).
4. PI checks the Human Approval Gates in `SKILL.md` before running anything against a real host.
5. PI walks the Infisical setup in `infra/infisical-setup.md` before generating any compose/gateway config with live values.
6. PI never embeds real secrets in committed files, logs, or chat output.
7. PI produces `DEPLOY_NOTES.md` for the target host once the stack is verified healthy.

## Skill Output Contract

Every completed run should produce:

1. Reviewed `stack.manifest.json`
2. Infisical project/environment confirmation (keys present, values never echoed)
3. Healthy `docker compose ps` output
4. Gateway smoke-test result
5. `DEPLOY_NOTES.md`
