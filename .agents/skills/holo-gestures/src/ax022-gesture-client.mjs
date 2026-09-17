// Client for the AX-022 shared holo-gestures capability served by the
// ax022-gateway (executiveusa/VisionClaw, services/ax022-gateway).
// Pairs a wearable session, then classifies camera-frame hand landmarks
// into gesture events. Engine state persists per session token.

export async function pairGestureSession(gateway, { pairingSecret, tenantId, wearableId, userId, deviceProfile = 'brilliant-halo' }) {
  const res = await fetch(`${gateway}/v1/sessions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pairingSecret, tenantId, wearableId, userId, deviceProfile }),
  });
  const body = await res.json();
  if (!body.ok) throw new Error(`pairing failed: ${body.error ?? res.status}`);
  return body.token;
}

export async function classifyGestureFrames(gateway, token, frames) {
  const res = await fetch(`${gateway}/v1/gestures`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ frames }),
  });
  const body = await res.json();
  if (!body.ok) throw new Error(`classify failed: ${body.error ?? res.status}`);
  return body; // { ok, events, hands, receipt }
}
