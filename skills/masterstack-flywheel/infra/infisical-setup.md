# Infisical Setup

This deployment uses [Infisical](https://infisical.com) for every secret — no provider API key, gateway bearer token, or local-service credential is ever stored in a plaintext `.env` file committed to git or left readable on a VPS.

## 1. Create the Project and Environments

In the Infisical dashboard (or `infisical init` against an existing org):

1. Create a project for this deployment (e.g. `masterstack-flywheel-<client>`).
2. Use the default `dev` / `staging` / `prod` environments, or fewer if the deployment doesn't need them.
3. Under each environment, create a secret path matching the service that needs it, e.g. `/gateway`, `/orchestrator`, `/local-workers`. Keep paths narrow — see step 3 (least privilege).

## 2. Push the Secrets the Manifest Implies

For each credential `stack.manifest.json` references (one `infisical secrets set` per key, run locally, never piped through chat or committed to a file):

```bash
infisical secrets set OPENROUTER_API_KEY="<value>" --env=prod
infisical secrets set MINIMAX_API_KEY="<value>" --env=prod
infisical secrets set LITELLM_MASTER_KEY="<value>" --env=prod
```

Verify without ever printing values:

```bash
infisical secrets list --env=prod --silent
```

## 3. Create a Machine Identity (Universal Auth) Scoped to This Deployment

Do not reuse a personal Infisical login on a VPS. Create a dedicated machine identity per host:

1. In the dashboard: Organization Settings → Identities → Create Identity → Universal Auth.
2. Grant it access to this project only, scoped to the environment(s) and secret paths this host actually needs — not the whole org.
3. Copy the generated Client ID and Client Secret immediately into a password manager; the secret is shown once.
4. Pass them to `bootstrap.sh` as `INFISICAL_CLIENT_ID` / `INFISICAL_CLIENT_SECRET` environment variables at invocation time — never write them into a file on the host.

## 4. Inject at Runtime, Never at Rest

```bash
infisical login --method=universal-auth \
  --client-id="$INFISICAL_CLIENT_ID" \
  --client-secret="$INFISICAL_CLIENT_SECRET" \
  --silent --plain   # prints a short-lived token, captured into INFISICAL_TOKEN

infisical run --projectId="$INFISICAL_PROJECT_ID" --env=prod -- \
  docker compose -f infra/docker-compose.yml up -d
```

`infisical run` resolves secrets into the process environment for the duration of that one command only. `docker compose` then resolves its `${VAR}` references from that process environment — nothing is written to disk.

## 5. If a Tool Genuinely Needs a File

Some local tools can't read process env (rare, but possible for legacy containers). If that happens:

```bash
infisical export --projectId="$INFISICAL_PROJECT_ID" --env=prod --format=dotenv > /run/flywheel/.env.generated
chmod 600 /run/flywheel/.env.generated
```

- Write it under `/run` (tmpfs, cleared on reboot) or another path already in `.gitignore`, never inside the repo checkout.
- Delete it as soon as the consuming process has started, or wrap the whole run in a `trap 'rm -f /run/flywheel/.env.generated' EXIT`.
- Never `git add` this file. Confirm `git status` is clean after any run that generates one.

## 6. Rotation

```bash
infisical secrets set OPENROUTER_API_KEY="<new value>" --env=prod
docker compose -f infra/docker-compose.yml restart litellm-gateway
```

Rotate the machine identity's client secret the same way if a host is ever decommissioned or suspected compromised — revoke it from the dashboard immediately, don't wait for a scheduled rotation.
