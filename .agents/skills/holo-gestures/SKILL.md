---
name: holo-gestures
description: Shared hand-gesture input layer for the agent fleet (VisionClaw AX-022 glasses, phone, or webcam). Use when the user wants hand-gesture control on camera - pinch, tap, drag, flick, two-hand stretch, peace-sign reset, point, fist, open palm - or asks what their hands are doing on a live feed. Canonical engine lives in executiveusa/VisionClaw; this skill is the Pi-side caller.
---

# Holo Gestures (AX-022 shared capability)

Hand landmarks in, semantic gesture events out. The glasses wearer pinches in
mid-air, this skill classifies it, and the Pi agent decides what the gesture
means in context.

## Source and license

Gesture rules ported from
[zubair-trabzada/holo-gestures](https://github.com/zubair-trabzada/holo-gestures)
(MIT License, (c) 2026 Zubair Trabzada / AI Workshop Studio LLC) at commit
`55626ff`. Only the gesture layer - the paywalled "Jarvis brain" and the notes
UI are excluded. Canonical implementation:
`executiveusa/VisionClaw` -> `packages/ax022-core/src/gestures/`.

## How to call it

The capability is served by the AX-022 gateway. `src/ax022-gesture-client.mjs`:

```js
import { pairGestureSession, classifyGestureFrames } from './src/ax022-gesture-client.mjs';

const token = await pairGestureSession(GATEWAY_URL, {
  pairingSecret: process.env.AX022_PAIRING_SECRET, // deployment config, never chat
  tenantId: 'macs', wearableId: 'rayban-001', userId: 'bambu',
});
const { events } = await classifyGestureFrames(GATEWAY_URL, token, frames);
```

Events: `pinch_start`, `pinch_end`, `tap`, `drag`, `flick`,
`two_hand_stretch`, `peace`, `point`, `fist`, `open_palm`, `hand_lost`.
Feed frames in order - engine state persists per session token.

For offline classification without the gateway, `src/gesture-engine.js` is a
vendored copy of the canonical engine (see its header - do not edit here).

## Gesture -> action safety

Classification is L0 (read-tier). A gesture that triggers a consequential
action must pass the agent's existing approval/policy gates. This skill never
executes actions itself.
