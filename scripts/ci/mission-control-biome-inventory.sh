#!/usr/bin/env bash
set +e

npx biome check --write --error-on-warnings --max-diagnostics=200 .
status=$?

echo "BIOME_STATUS=$status"
echo "BIOME_CHANGED_FILES"
git diff --name-status -- . ':(exclude)package-lock.json' ':(exclude)brain-dashboard/package.json'

exit "$status"
