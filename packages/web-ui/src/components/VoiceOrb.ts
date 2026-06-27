import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

export type VoiceOrbState = "idle" | "listening" | "transcribing" | "thinking" | "speaking" | "interrupted" | "error";

/**
 * VoiceOrb — visual state indicator for voice interaction.
 *
 * States:
 *   idle        — pulsing teal ring, waiting for push-to-talk
 *   listening   — bright teal glow, recording
 *   transcribing — rotating dots, converting speech to text
 *   thinking    — shimmer, waiting for model response
 *   speaking    — animated wave, TTS playing
 *   interrupted — flash then return to idle
 *   error       — red glow
 *
 * Usage: <voice-orb state="idle"></voice-orb>
 */
@customElement("voice-orb")
export class VoiceOrb extends LitElement {
	static override styles = css`
		:host {
			display: inline-flex;
			align-items: center;
			justify-content: center;
		}

		.orb {
			width: 56px;
			height: 56px;
			border-radius: 50%;
			background: var(--archonx-orb-bg, #0b0f14);
			border: 2px solid var(--archonx-accent, #67f7c8);
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			position: relative;
			transition: box-shadow 0.2s ease, border-color 0.2s ease;
			user-select: none;
		}

		/* Idle: subtle pulse */
		.orb.idle {
			box-shadow: 0 0 0 0 rgba(103, 247, 200, 0.4);
			animation: orb-idle-pulse 2.5s ease-in-out infinite;
		}

		/* Listening: bright solid glow */
		.orb.listening {
			border-color: #67f7c8;
			box-shadow: 0 0 0 4px rgba(103, 247, 200, 0.3), 0 0 20px rgba(103, 247, 200, 0.5);
			animation: none;
		}

		/* Transcribing: dimmer ring rotating */
		.orb.transcribing {
			border-color: rgba(103, 247, 200, 0.5);
			animation: orb-spin 1s linear infinite;
		}

		/* Thinking: shimmer effect */
		.orb.thinking {
			border-color: rgba(103, 247, 200, 0.3);
			animation: orb-shimmer 1.4s ease-in-out infinite;
		}

		/* Speaking: energetic wave */
		.orb.speaking {
			border-color: #67f7c8;
			box-shadow: 0 0 0 2px rgba(103, 247, 200, 0.5), 0 0 12px rgba(103, 247, 200, 0.4);
			animation: orb-speaking 0.6s ease-in-out infinite alternate;
		}

		/* Interrupted: red flash */
		.orb.interrupted {
			border-color: #ff6b6b;
			box-shadow: 0 0 12px rgba(255, 107, 107, 0.4);
			animation: none;
		}

		/* Error: steady red glow */
		.orb.error {
			border-color: #ff4444;
			box-shadow: 0 0 8px rgba(255, 68, 68, 0.5);
			animation: none;
		}

		.orb-icon {
			font-size: 20px;
			color: var(--archonx-accent, #67f7c8);
			line-height: 1;
			pointer-events: none;
		}

		.state-label {
			position: absolute;
			bottom: -20px;
			left: 50%;
			transform: translateX(-50%);
			font-size: 10px;
			color: rgba(103, 247, 200, 0.6);
			white-space: nowrap;
			font-family: monospace;
		}

		@keyframes orb-idle-pulse {
			0%, 100% { box-shadow: 0 0 0 0 rgba(103, 247, 200, 0.3); }
			50% { box-shadow: 0 0 0 8px rgba(103, 247, 200, 0); }
		}
		@keyframes orb-spin {
			from { transform: rotate(0deg); }
			to { transform: rotate(360deg); }
		}
		@keyframes orb-shimmer {
			0%, 100% { box-shadow: 0 0 6px rgba(103, 247, 200, 0.2); }
			50% { box-shadow: 0 0 18px rgba(103, 247, 200, 0.5); }
		}
		@keyframes orb-speaking {
			from { box-shadow: 0 0 4px rgba(103, 247, 200, 0.3), 0 0 8px rgba(103, 247, 200, 0.2); }
			to { box-shadow: 0 0 12px rgba(103, 247, 200, 0.7), 0 0 24px rgba(103, 247, 200, 0.3); }
		}
	`;

	@property({ type: String }) state: VoiceOrbState = "idle";
	@property({ type: Boolean }) showLabel = false;

	private get orbIcon(): string {
		switch (this.state) {
			case "idle":
				return "🎙";
			case "listening":
				return "🔴";
			case "transcribing":
				return "⋯";
			case "thinking":
				return "◌";
			case "speaking":
				return "🔊";
			case "interrupted":
				return "✕";
			case "error":
				return "⚠";
			default:
				return "";
		}
	}

	override render() {
		return html`
			<div class="orb ${this.state}" role="button" aria-label="Voice: ${this.state}" tabindex="0">
				<span class="orb-icon" aria-hidden="true">${this.orbIcon}</span>
				${this.showLabel ? html`<span class="state-label">${this.state}</span>` : ""}
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"voice-orb": VoiceOrb;
	}
}
