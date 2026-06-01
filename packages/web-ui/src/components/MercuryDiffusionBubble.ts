import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

export type DiffusionState = "idle" | "diffusing" | "stabilizing" | "final" | "error";

/**
 * MercuryDiffusionBubble — premium diffusion visual component.
 *
 * Visual lane for Mercury diffusion mode. Instead of appending tokens
 * like a typewriter, diffusion mode REPLACES the current draft in-place.
 * Each `setDelta()` call updates the full current text, not appends to it.
 *
 * States:
 *   idle       — empty or waiting
 *   diffusing  — text is actively being refined (unstable)
 *   stabilizing — stream finishing, content locking
 *   final      — content locked, stable
 *   error      — stream failed
 *
 * IMPORTANT: Never pipe diffusing state text to TTS.
 * Only speak text after state === "final" or via the stability gate.
 *
 * Usage: <mercury-diffusion-bubble></mercury-diffusion-bubble>
 */
@customElement("mercury-diffusion-bubble")
export class MercuryDiffusionBubble extends LitElement {
	static override styles = css`
		:host {
			display: block;
			font-family: inherit;
		}

		.bubble {
			position: relative;
			background: rgba(11, 15, 20, 0.8);
			border: 1px solid rgba(103, 247, 200, 0.15);
			border-radius: 12px;
			padding: 16px 20px;
			backdrop-filter: blur(8px);
			transition: border-color 0.3s ease, box-shadow 0.3s ease;
			overflow: hidden;
		}

		/* Diffusing: active signal */
		.bubble.diffusing {
			border-color: rgba(103, 247, 200, 0.4);
			box-shadow: 0 0 20px rgba(103, 247, 200, 0.08), inset 0 0 40px rgba(103, 247, 200, 0.03);
		}

		/* Stabilizing: dimming signal */
		.bubble.stabilizing {
			border-color: rgba(103, 247, 200, 0.25);
		}

		/* Final: locked state */
		.bubble.final {
			border-color: rgba(103, 247, 200, 0.12);
			box-shadow: none;
		}

		/* Error */
		.bubble.error {
			border-color: rgba(255, 68, 68, 0.3);
		}

		/* Noise matrix overlay (diffusion visual treatment) */
		.bubble::before {
			content: "";
			position: absolute;
			inset: 0;
			background-image: repeating-linear-gradient(
				0deg,
				transparent,
				transparent 2px,
				rgba(103, 247, 200, 0.015) 2px,
				rgba(103, 247, 200, 0.015) 4px
			);
			pointer-events: none;
			opacity: 0;
			transition: opacity 0.3s ease;
		}

		.bubble.diffusing::before {
			opacity: 1;
			animation: scanlines 4s linear infinite;
		}

		@keyframes scanlines {
			0% { background-position: 0 0; }
			100% { background-position: 0 100px; }
		}

		.content {
			position: relative;
			z-index: 1;
			color: #e8eaf6;
			line-height: 1.6;
			white-space: pre-wrap;
			word-break: break-word;
			font-size: 14px;
		}

		/* Diffusing text: slight opacity flicker indicating instability */
		.bubble.diffusing .content {
			animation: diffusion-flicker 0.15s ease-in-out infinite;
		}

		@keyframes diffusion-flicker {
			0%, 100% { opacity: 1; }
			50% { opacity: 0.92; }
		}

		/* Final: content snaps to full opacity, no animation */
		.bubble.final .content {
			animation: none;
			opacity: 1;
		}

		.status-indicator {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 10px;
			color: rgba(103, 247, 200, 0.5);
			font-family: monospace;
			margin-bottom: 10px;
		}

		.status-dot {
			width: 5px;
			height: 5px;
			border-radius: 50%;
			background: #67f7c8;
		}

		.bubble.diffusing .status-dot {
			animation: dot-pulse 0.8s ease-in-out infinite;
		}

		.bubble.final .status-dot,
		.bubble.idle .status-dot {
			background: rgba(103, 247, 200, 0.3);
			animation: none;
		}

		.bubble.error .status-dot {
			background: #ff4444;
		}

		@keyframes dot-pulse {
			0%, 100% { opacity: 1; transform: scale(1); }
			50% { opacity: 0.4; transform: scale(0.7); }
		}

		.lock-icon {
			display: inline-block;
			opacity: 0;
			transition: opacity 0.3s ease;
			font-size: 10px;
		}
		.bubble.final .lock-icon { opacity: 1; }
	`;

	@property({ type: String }) diffusionState: DiffusionState = "idle";
	@state() private _text = "";

	/**
	 * Replace the current draft text in-place.
	 * Call this on each text_delta event in diffusion mode.
	 * In diffusion mode, each delta replaces (not appends) the current text.
	 */
	setDelta(text: string, mode: "replace" | "append" = "replace") {
		if (mode === "replace") {
			this._text = text;
		} else {
			this._text += text;
		}
	}

	/** Clear content and return to idle. */
	reset() {
		this._text = "";
		this.diffusionState = "idle";
	}

	private get statusLabel(): string {
		switch (this.diffusionState) {
			case "idle":
				return "";
			case "diffusing":
				return "mercury · resolving";
			case "stabilizing":
				return "mercury · stabilizing";
			case "final":
				return "mercury · complete";
			case "error":
				return "mercury · error";
			default:
				return "";
		}
	}

	override render() {
		if (this.diffusionState === "idle" && !this._text) {
			return html``;
		}

		return html`
			<div class="bubble ${this.diffusionState}">
				${
					this.diffusionState !== "idle"
						? html`
							<div class="status-indicator">
								<span class="status-dot" aria-hidden="true"></span>
								<span>${this.statusLabel}</span>
								<span class="lock-icon">🔒</span>
							</div>
						`
						: ""
				}
				<div class="content">${this._text}</div>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"mercury-diffusion-bubble": MercuryDiffusionBubble;
	}
}
