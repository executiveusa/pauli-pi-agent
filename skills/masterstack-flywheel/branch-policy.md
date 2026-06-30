# Branch Policy

## Folder Boundary

Canonical folder:

```text
skills/masterstack-flywheel/
```

Do not scatter infra files across the repo. Real deployment artifacts (per-VPS manifests, generated `DEPLOY_NOTES.md`, exported secrets) belong outside this skill folder:

```text
factory/flywheel-deployments/<host-slug>/stack.manifest.json
factory/flywheel-deployments/<host-slug>/DEPLOY_NOTES.md
```

Never write real secret values into either location — see `SKILL.md`'s Non-Negotiable Security Rule.

## PI Core Rule

PI is the master agent. This skill is a separate folder, loaded lazily — see `pi-loading-rules.md`. Do not merge this skill into PI's global personality or load it for unrelated application work.

## Registry

This skill is referenced from `skills/SKILLS_REGISTRY.md` under "Agent Harness / Multi-Model Deployment". Do not duplicate its contents into the registry — the registry only links here.
