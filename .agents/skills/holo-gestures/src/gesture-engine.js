// VENDORED from executiveusa/VisionClaw packages/ax022-core/src/gestures/gesture-engine.js
// (AX-022 shared gesture capability). Do not edit here — edit the canonical
// file in VisionClaw and re-vendor. Rules ported from
// zubair-trabzada/holo-gestures (MIT, (c) 2026 Zubair Trabzada / AI Workshop
// Studio LLC) @ 55626ff.
// AX-022 gesture engine — camera-frame hand landmarks in, semantic gesture events out.
//
// The landmark -> gesture rules are ported from holo-gestures (MIT License),
// https://github.com/zubair-trabzada/holo-gestures @ 55626ff00f6b49c649a407ffdb3cad174479c637
// Copyright (c) 2026 Zubair Trabzada / AI Workshop Studio LLC.
// Field-tuned constants (pinch hysteresis, span gates, hand identity, OneEuro
// smoothing) are preserved from that source; the app shell (DOM, Three.js,
// notes UI) is deliberately NOT ported. This module is dependency-free and
// runs in Node and in the browser, so glasses companion apps, the gateway,
// and fleet agents share one input layer.
//
// Input: MediaPipe-style 21-landmark hands, normalized {x, y} coords
//        (lm[0]=wrist, lm[4]=thumb tip, lm[8]=index tip, lm[9]=middle MCP,
//         lm[12]=middle tip, lm[16]=ring tip, lm[20]=pinky tip).
// Output: semantic events via onEvent callback — see GESTURE_EVENTS.

export const GESTURE_EVENTS = Object.freeze({
  PINCH_START: 'pinch_start',     // thumb+index touch held for PINCH_EARN frames (grab)
  PINCH_END: 'pinch_end',         // pinch released
  TAP: 'tap',                     // quick pinch under TAP_MAX_MS (select/open)
  DRAG: 'drag',                   // cursor moved while pinched (payload carries dx/dy)
  FLICK: 'flick',                 // pinch released with velocity over FLICK_MIN_UNITS_S (throw)
  STRETCH: 'two_hand_stretch',    // both hands pinched, span between them changing (zoom/rotate)
  PEACE: 'peace',                 // peace sign held PEACE_EARN frames (reset)
  POINT: 'point',                 // index extended, others curled (ink/aim)
  FIST: 'fist',                   // all fingers curled
  OPEN_PALM: 'open_palm',         // all fingers extended
  HAND_LOST: 'hand_lost',         // stale hand reaped (camera stall / hand left frame)
});

// Field-tuned on real cameras in holo-gestures (2026-08-26..31 field notes):
// a pinch means FINGERS TOUCHING and must hold PINCH_EARN consecutive frames —
// near-pinches register nothing.
export const PINCH_IN = 0.30;
export const PINCH_OUT = 0.42;
export const PINCH_EARN = 2;
export const SPAN_MIN = 0.025;      // hands smaller than 2.5% of frame = background noise
export const STALE_MS = 280;        // ingest watchdog: drop hands not fed within this window
export const TAP_MAX_MS = 250;
export const FLICK_MIN_UNITS_S = 0.9;  // release velocity (normalized units/sec, ~900px/s on a 1000px feed) that turns a drop into a throw
export const PEACE_EARN = 4;
export const CLAIM_MAX_PX = 260;    // a detection claims the slot whose last palm is NEAREST, within this radius

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Pure per-frame pose classification for one 21-landmark hand.
export function handMetrics(lm) {
  if (!Array.isArray(lm) || lm.length < 21) throw new Error('landmarks_required_21');
  const span = Math.max(1e-4, dist(lm[0], lm[9]));
  const curl = (i) => dist(lm[i], lm[0]) / span;
  const tips = [curl(8), curl(12), curl(16), curl(20)];
  return {
    span,
    tips,                                        // [index, middle, ring, pinky] extension ratios
    pinch: dist(lm[4], lm[8]) / span,
    open: tips.every(t => t > 1.45),
    openish: tips.every(t => t > 1.32),
    fist: tips.every(t => t < 1.05),
    point: tips[0] > 1.45 && tips[1] < 1.15 && tips[2] < 1.15 && tips[3] < 1.15,
    peace: tips[0] > 1.45 && tips[1] > 1.45 && tips[2] < 1.15 && tips[3] < 1.15,
    palm: { x: (lm[0].x + lm[9].x) / 2, y: (lm[0].y + lm[9].y) / 2 },
    tip: { x: lm[8].x, y: lm[8].y },             // the INDEX FINGERTIP is the cursor
  };
}

// One Euro filter (Casiez et al.) — speed-adaptive cutoff: heavy smoothing when
// the hand is still (no jitter), light smoothing when it moves fast (no lag).
class OneEuro {
  constructor(now, raw) { this.t = now; this.x = raw.x; this.y = raw.y; this.dx = 0; this.dy = 0; }
  update(raw, now) {
    const f = this;
    let dt = (now - f.t) / 1000; if (!(dt > 1 / 240)) dt = 1 / 60; if (dt > 0.2) dt = 0.2;
    f.t = now;
    const al = (cut) => { const r = 2 * Math.PI * cut * dt; return r / (r + 1); };
    const ad = al(2.5);
    f.dx += ((raw.x - f.x) / dt - f.dx) * ad;
    f.dy += ((raw.y - f.y) / dt - f.dy) * ad;
    const a = al(1.3 + 0.009 * Math.hypot(f.dx, f.dy));
    f.x += (raw.x - f.x) * a; f.y += (raw.y - f.y) * a;
    return { x: f.x, y: f.y };
  }
  velocity() { return { x: this.dx, y: this.dy }; }
}

function mkHandState() {
  return {
    present: false, seen: 0,
    pinch: false, pinchEarned: 0, pinchT: 0,
    peaceSeen: 0, pointSeen: 0, fistSeen: 0, openSeen: 0,
    lm: null, m: null, smooth: null, cursor: null,
    stretchSpan: null, upT: 0,
  };
}

export class GestureEngine {
  constructor({ onEvent, now } = {}) {
    this.onEvent = typeof onEvent === 'function' ? onEvent : () => {};
    this.now = typeof now === 'function' ? now : () => Date.now();
    this.hands = [mkHandState(), mkHandState()];
    this.lastStretchSpan = null;
  }

  // MediaPipe returns hands in ARBITRARY order that swaps between frames;
  // positional assignment shreds per-hand state on every swap. Each detection
  // claims the slot whose last palm is NEAREST (within CLAIM_MAX_PX), so state
  // survives and a far-away stray cannot steal a live hand's slot.
  assignHands(lms) {
    const HANDS = this.hands;
    const out = [null, null];
    const cand = (lms ?? []).filter(Boolean).slice(0, 2);
    const claimed = [false, false];
    const palmOf = lm => ({ x: (lm[0].x + lm[9].x) / 2, y: (lm[0].y + lm[9].y) / 2 });
    const order = [0, 1].filter(i => HANDS[i].present && HANDS[i].m)
      .sort((a, b) => HANDS[b].seen - HANDS[a].seen);
    for (const i of order) {
      const last = palmOf(HANDS[i].lm);
      let bi = -1, bd = 1e9;
      cand.forEach((lm, k) => {
        if (!lm || claimed[k]) return;
        const d = dist(palmOf(lm), last);
        if (d < bd) { bd = d; bi = k; }
      });
      if (bi >= 0 && bd * 1000 < CLAIM_MAX_PX) { out[i] = cand[bi]; claimed[bi] = true; }
    }
    cand.forEach((lm, k) => {
      if (!lm || claimed[k]) return;
      const slot = out[0] == null && !HANDS[0].present ? 0
        : out[1] == null && !HANDS[1].present ? 1
        : out[0] == null ? 0 : out[1] == null ? 1 : -1;
      if (slot >= 0) { out[slot] = lm; claimed[k] = true; }
    });
    return out;
  }

  dropHand(i, now) {
    const st = this.hands[i];
    if (st.present && st.pinch) this.emit(GESTURE_EVENTS.PINCH_END, i, { ts: now, forced: true });
    Object.assign(st, mkHandState());
    this.emit(GESTURE_EVENTS.HAND_LOST, i, { ts: now });
  }

  reapStale(now) {
    for (let i = 0; i < 2; i++) {
      if (this.hands[i].present && now - this.hands[i].upT > STALE_MS) this.dropHand(i, now);
    }
  }

  emit(type, handId, payload) {
    this.onEvent({ type, handId, ...payload });
  }

  // Feed one camera frame: rawHands = array of 0..2 MediaPipe landmark hands.
  // Returns the events produced for this frame (also delivered via onEvent).
  ingest(rawHands, ts) {
    const now = ts ?? this.now();
    const events = [];
    const sink = this.onEvent;
    this.onEvent = (e) => { events.push(e); sink(e); };
    try {
      this.reapStale(now);
      const assigned = this.assignHands(rawHands);
      for (let i = 0; i < 2; i++) {
        if (!assigned[i]) continue;
        this.ingestHand(i, assigned[i], now);
      }
      this.ingestTwoHand(now);
      return events;
    } finally {
      this.onEvent = sink;
    }
  }

  ingestHand(i, lm, now) {
    const st = this.hands[i];
    const m = handMetrics(lm);
    if (m.span < SPAN_MIN) return;      // span gate: background-noise detections die here
    st.present = true;
    st.seen += 1;
    st.upT = now;
    st.lm = lm;
    st.m = m;
    st.smooth = st.smooth ?? new OneEuro(now, m.tip);
    const prev = st.cursor ?? m.tip;
    st.cursor = st.smooth.update(m.tip, now);

    // pinch lifecycle with hysteresis: enter under PINCH_IN for PINCH_EARN
    // consecutive frames, exit over PINCH_OUT.
    if (!st.pinch && m.pinch < PINCH_IN) {
      st.pinchEarned += 1;
      if (st.pinchEarned >= PINCH_EARN && st.seen >= PINCH_EARN) {
        st.pinch = true;
        st.pinchT = now;
        this.emit(GESTURE_EVENTS.PINCH_START, i, { ts: now, at: st.cursor });
      }
    } else if (m.pinch >= PINCH_IN) {
      st.pinchEarned = 0;
    }
    if (st.pinch && m.pinch > PINCH_OUT) {
      st.pinch = false;
      const vel = st.smooth.velocity();
      const speed = Math.hypot(vel.x, vel.y);
      this.emit(GESTURE_EVENTS.PINCH_END, i, { ts: now, at: st.cursor, heldMs: now - st.pinchT });
      if (now - st.pinchT <= TAP_MAX_MS) this.emit(GESTURE_EVENTS.TAP, i, { ts: now, at: st.cursor });
      else if (speed >= FLICK_MIN_UNITS_S) this.emit(GESTURE_EVENTS.FLICK, i, { ts: now, at: st.cursor, velocity: vel });
    }
    if (st.pinch && st.seen > 1) {
      const dx = st.cursor.x - prev.x, dy = st.cursor.y - prev.y;
      if (dx || dy) this.emit(GESTURE_EVENTS.DRAG, i, { ts: now, at: st.cursor, dx, dy });
    }

    // pose vocabulary — each must be EARNED over consecutive frames, so a
    // single noisy frame never fires a gesture.
    st.peaceSeen = m.peace ? st.peaceSeen + 1 : 0;
    if (st.peaceSeen === PEACE_EARN) this.emit(GESTURE_EVENTS.PEACE, i, { ts: now, at: st.cursor });
    st.pointSeen = m.point ? st.pointSeen + 1 : 0;
    if (st.pointSeen === PEACE_EARN) this.emit(GESTURE_EVENTS.POINT, i, { ts: now, at: st.cursor });
    st.fistSeen = m.fist ? st.fistSeen + 1 : 0;
    if (st.fistSeen === PEACE_EARN) this.emit(GESTURE_EVENTS.FIST, i, { ts: now, at: st.cursor });
    st.openSeen = m.open ? st.openSeen + 1 : 0;
    if (st.openSeen === PEACE_EARN) this.emit(GESTURE_EVENTS.OPEN_PALM, i, { ts: now, at: st.cursor });
  }

  // Two-pinch stretch: both hands pinched, the span between their cursors is
  // the control — grow = zoom in / pull apart, crush = zoom out / summarize.
  ingestTwoHand(now) {
    const [a, b] = this.hands;
    if (a.present && b.present && a.pinch && b.pinch) {
      const span = dist(a.cursor, b.cursor);
      if (this.lastStretchSpan != null && Math.abs(span - this.lastStretchSpan) > 1e-4) {
        this.emit(GESTURE_EVENTS.STRETCH, 0, {
          ts: now, span, delta: span - this.lastStretchSpan,
          hands: [{ x: a.cursor.x, y: a.cursor.y }, { x: b.cursor.x, y: b.cursor.y }],
        });
      }
      this.lastStretchSpan = span;
    } else {
      this.lastStretchSpan = null;
    }
  }

  snapshot() {
    return this.hands.map((st, i) => ({
      handId: i, present: st.present, seen: st.seen, pinch: st.pinch,
      cursor: st.cursor, pose: st.m ? {
        open: st.m.open, fist: st.m.fist, point: st.m.point, peace: st.m.peace, pinchRatio: st.m.pinch,
      } : null,
    }));
  }
}
