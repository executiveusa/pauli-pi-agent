/**
 * Stability Gate for Mercury TTS output.
 *
 * Problem: Mercury diffusion streams unstable, rapidly-mutating text fragments
 * while "thinking". Speaking these raw fragments would produce nonsense audio.
 *
 * Solution: Buffer incoming text, detect stable sentence boundaries, and only
 * emit stable chunks to the TTS queue. On user interruption, cancel everything.
 *
 * Two output lanes:
 *   Visual lane → receives all text deltas directly (handled by MercuryDiffusionBubble)
 *   Voice lane  → receives only stable chunks emitted by this gate
 *
 * Usage:
 *   const gate = createStabilityGate({ onStableChunk: (text) => speak(text) });
 *   gate.enqueueText(delta);   // call for each text_delta event
 *   gate.flush();              // call on stream done event
 *   gate.cancel();             // call on user interruption
 */

/** Called with each stable sentence chunk ready for TTS. */
export type StableChunkCallback = (chunk: string) => void;

export interface StabilityGateOptions {
	/** Fired when a stable chunk of text is ready for TTS. */
	onStableChunk: StableChunkCallback;
	/**
	 * Debounce interval in ms. After this many ms of no new text, any remaining
	 * buffer is treated as stable and emitted. Default: 300ms.
	 */
	debounceMs?: number;
}

export interface StabilityGate {
	/** Feed a text delta from the stream into the gate. */
	enqueueText(delta: string): void;
	/**
	 * Flush the remaining buffer as a final stable chunk.
	 * Call this on the stream "done" event.
	 */
	flush(): void;
	/**
	 * Cancel all pending speech. Call this when the user speaks again
	 * (interruption) to stop any queued TTS immediately.
	 */
	cancel(): void;
	/** Register the callback to fire on stable chunks (replaces constructor callback). */
	onStableChunk(cb: StableChunkCallback): void;
}

/**
 * Sentence boundary detection pattern.
 * Matches end-of-sentence punctuation followed by whitespace or end of string.
 */
const SENTENCE_BOUNDARY = /[.!?]\s+|[.!?]$/;

/**
 * Minimum character count before we bother checking for sentence boundaries.
 * Prevents emitting single-word fragments.
 */
const MIN_CHUNK_LENGTH = 20;

export function createStabilityGate(options: StabilityGateOptions): StabilityGate {
	let buffer = "";
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let stableChunkCb: StableChunkCallback = options.onStableChunk;
	let cancelled = false;

	function clearDebounce() {
		if (debounceTimer !== null) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
		}
	}

	function emitChunk(text: string) {
		if (cancelled || !text.trim()) return;
		stableChunkCb(text);
	}

	/** Scan buffer for sentence boundaries and emit stable prefix. */
	function scanAndEmit() {
		if (cancelled) return;
		if (buffer.length < MIN_CHUNK_LENGTH) return;

		// Find last complete sentence boundary
		const match = SENTENCE_BOUNDARY.exec(buffer);
		if (!match) return;

		// Everything up to and including the boundary is stable
		const cutAt = match.index + match[0].length;
		const stable = buffer.slice(0, cutAt);
		buffer = buffer.slice(cutAt);

		if (stable.trim()) {
			emitChunk(stable);
		}
	}

	function scheduleDebounce() {
		clearDebounce();
		debounceTimer = setTimeout(() => {
			// After debounce, whatever is in the buffer is treated as stable
			if (buffer.trim() && !cancelled) {
				emitChunk(buffer);
				buffer = "";
			}
		}, options.debounceMs ?? 300);
	}

	return {
		enqueueText(delta: string) {
			if (cancelled) return;
			buffer += delta;
			scanAndEmit();
			scheduleDebounce();
		},

		flush() {
			if (cancelled) return;
			clearDebounce();
			if (buffer.trim()) {
				emitChunk(buffer);
				buffer = "";
			}
		},

		cancel() {
			cancelled = true;
			clearDebounce();
			buffer = "";
		},

		onStableChunk(cb: StableChunkCallback) {
			stableChunkCb = cb;
		},
	};
}
