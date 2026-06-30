#!/usr/bin/env bash
# Masterstack Flywheel — idempotent VPS bootstrap.
#
# This script installs Docker, the NVIDIA container toolkit (if a GPU is
# present), and the Infisical CLI, then brings the stack up with secrets
# injected directly into the docker compose process — never written to a
# plaintext .env file on disk.
#
# HUMAN APPROVAL GATE: read this whole script before running it as root on a
# real host. Do not run it unattended on production infrastructure.
#
# Required environment (export these yourself, or pass on the command line —
# never hardcode them here or commit them anywhere):
#   INFISICAL_PROJECT_ID   Infisical project to pull secrets from
#   INFISICAL_ENV          Infisical environment slug (e.g. dev, staging, prod)
#   INFISICAL_CLIENT_ID    Machine identity client ID (Universal Auth)
#   INFISICAL_CLIENT_SECRET Machine identity client secret (Universal Auth)
#
# Usage:
#   INFISICAL_PROJECT_ID=... INFISICAL_ENV=prod \
#   INFISICAL_CLIENT_ID=... INFISICAL_CLIENT_SECRET=... \
#   ./bootstrap.sh [--gpu]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"
GPU_PROFILE=""

for arg in "$@"; do
	case "$arg" in
	--gpu) GPU_PROFILE="--profile gpu-worker" ;;
	*)
		echo "Unknown argument: $arg" >&2
		exit 1
		;;
	esac
done

for var in INFISICAL_PROJECT_ID INFISICAL_ENV INFISICAL_CLIENT_ID INFISICAL_CLIENT_SECRET; do
	if [ -z "${!var:-}" ]; then
		echo "Missing required env var: $var" >&2
		exit 1
	fi
done

echo "==> Checking Docker..."
if ! command -v docker &>/dev/null; then
	echo "==> Installing Docker (official convenience script, https://get.docker.com)..."
	curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
	sudo sh /tmp/get-docker.sh
	rm -f /tmp/get-docker.sh
else
	echo "    Docker already installed: $(docker --version)"
fi

if [ -n "$GPU_PROFILE" ]; then
	echo "==> GPU profile requested — checking NVIDIA Container Toolkit..."
	if ! dpkg -s nvidia-container-toolkit &>/dev/null; then
		sudo apt-get update -y
		sudo apt-get install -y nvidia-container-toolkit
		sudo nvidia-ctk runtime configure --runtime=docker
		sudo systemctl restart docker
	else
		echo "    nvidia-container-toolkit already installed."
	fi
fi

echo "==> Checking Infisical CLI..."
if ! command -v infisical &>/dev/null; then
	echo "==> Installing Infisical CLI (official repo, artifacts-cli.infisical.com)..."
	curl -1sLf 'https://artifacts-cli.infisical.com/setup.deb.sh' | sudo -E bash
	sudo apt-get install -y infisical
else
	echo "    Infisical CLI already installed: $(infisical --version)"
fi

echo "==> Authenticating Infisical machine identity (Universal Auth, no token written to disk)..."
export INFISICAL_TOKEN
INFISICAL_TOKEN="$(infisical login --method=universal-auth \
	--client-id="$INFISICAL_CLIENT_ID" \
	--client-secret="$INFISICAL_CLIENT_SECRET" \
	--silent --plain)"

mkdir -p "${SCRIPT_DIR}/shared_assets/voice_references" \
	"${SCRIPT_DIR}/shared_assets/generated_audio" \
	"${SCRIPT_DIR}/production_sites"

echo "==> Bringing up the stack with secrets injected from Infisical (env: ${INFISICAL_ENV})..."
# shellcheck disable=SC2086
infisical run --projectId="$INFISICAL_PROJECT_ID" --env="$INFISICAL_ENV" --silent -- \
	docker compose -f "$COMPOSE_FILE" $GPU_PROFILE up -d

unset INFISICAL_TOKEN

echo "==> Stack status:"
docker compose -f "$COMPOSE_FILE" ps

echo "==> Done. Run a gateway smoke test before treating this host as production-ready:"
echo '    curl -H "Authorization: Bearer <LITELLM_MASTER_KEY>" http://127.0.0.1:4000/health'
