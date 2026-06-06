#!/usr/bin/env bash
# Verify Orgo API key and spin up a test computer.
# Usage: ORGO_API_KEY=sk_live_... ./test-connection.sh
# Or:    ./test-connection.sh sk_live_...

set -e

API_KEY="${1:-$ORGO_API_KEY}"

if [[ -z "$API_KEY" ]]; then
  echo "ERROR: No API key. Pass as argument or set ORGO_API_KEY env var."
  exit 1
fi

BASE="https://www.orgo.ai/api"

echo "=== 1. Health check ==="
curl -sf "$BASE/health" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" | jq . || echo "(no /health endpoint — continuing)"

echo ""
echo "=== 2. List workspaces ==="
WORKSPACES=$(curl -sf "$BASE/workspaces" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json")
echo "$WORKSPACES" | jq .
WORKSPACE_ID=$(echo "$WORKSPACES" | jq -r '.[0].id // empty')

if [[ -z "$WORKSPACE_ID" ]]; then
  echo ""
  echo "=== 2b. Create workspace ==="
  WORKSPACE_ID=$(curl -sf -X POST "$BASE/workspaces" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"name":"shopping-agent-test"}' | jq -r '.id')
  echo "Created workspace: $WORKSPACE_ID"
fi

echo ""
echo "=== 3. List computers ==="
curl -sf "$BASE/computers?workspaceId=$WORKSPACE_ID" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" | jq .

echo ""
echo "=== 4. Create test computer ==="
COMPUTER=$(curl -sf -X POST "$BASE/computers" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"workspaceId\":\"$WORKSPACE_ID\",\"name\":\"shopping-agent-verify-$(date +%s)\"}")
echo "$COMPUTER" | jq .
COMPUTER_ID=$(echo "$COMPUTER" | jq -r '.id')

echo ""
echo "=== 5. Take screenshot ==="
sleep 5
curl -sf -X POST "$BASE/computers/$COMPUTER_ID/screenshot" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" | jq '{status: .status, screenshotUrl: .screenshotUrl}'

echo ""
echo "=== CONNECTED ==="
echo "Computer ID: $COMPUTER_ID"
echo "Set this as your default: ORGO_DEFAULT_COMPUTER_ID=$COMPUTER_ID"
echo ""
echo "To clean up: curl -X DELETE $BASE/computers/$COMPUTER_ID -H 'Authorization: Bearer $API_KEY'"
