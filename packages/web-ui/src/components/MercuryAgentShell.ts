import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "./MercuryDiffusionBubble.js";
import "./VoiceOrb.js";
import "./ToolDock.js";
import "./UsageMeter.js";
import "./AssetPanel.js";
import type { AssetItem } from "./AssetPanel.js";
import type { DiffusionState } from "./MercuryDiffusionBubble.js";
import type { ToolDockItem } from "./ToolDock.js";
import type { VoiceOrbState } from "./VoiceOrb.js";

export type MercuryShellPlan = "clean" | "voice" | "mercury_diffusion";

/**
 * MercuryAgentShell — top-level ArchonX Mercury Voice Agent wrapper.
 *
 * Composes:
 *   - Chat area (slotted — use the existing ChatPanel or custom content)
 *   - VoiceOrb (plan-gated, voice | mercury_diffusion only)
 *   - MercuryDiffusionBubble (plan-gated, mercury_diffusion only)
 *   - ToolDock (plan-gated, mercury_diffusion only)
 *   - UsageMeter (all plans)
 *   - AssetPanel (plan-gated, mercury_diffusion only)
 *
 * Plan enforcement:
 *   clean            — text chat only, no voice, no diffusion, no tools
 *   voice            — adds VoiceOrb
 *   mercury_diffusion — adds VoiceOrb + DiffusionBubble + ToolDock + AssetPanel
 *
 * SECURITY: No provider API keys in this component.
 * All model calls go through the server agent route.
 *
 * Usage:
 *   <mercury-agent-shell
 *     plan="mercury_diffusion"
 *     botName="Mercury Agent"
 *     tenantId="client_demo"
 *   >
 *     <!-- slotted chat UI goes here -->
 *   </mercury-agent-shell>
 */
@customElement("mercury-agent-shell")
export class MercuryAgentShell extends LitElement {
	static override styles = css`
		:host {
			display: flex;
			flex-direction: column;
			height: 100%;
			background: var(--archonx-bg, #0b0f14);
			color: var(--archonx-text, #e8eaf6);
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
			position: relative;
			overflow: hidden;
		}

		/* Premium dark glass header */
		.shell-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 12px 16px;
			background: rgba(11, 15, 20, 0.9);
			border-bottom: 1px solid rgba(103, 247, 200, 0.1);
			backdrop-filter: blur(10px);
			flex-shrink: 0;
		}

		.brand {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 13px;
			font-weight: 600;
			color: rgba(255, 255, 255, 0.9);
		}

		.brand-dot {
			width: 7px;
			height: 7px;
			border-radius: 50%;
			background: #67f7c8;
			box-shadow: 0 0 6px rgba(103, 247, 200, 0.6);
		}

		.header-controls {
			display: flex;
			align-items: center;
			gap: 10px;
		}

		/* Main content area */
		.shell-body {
			display: flex;
			flex-direction: column;
			flex: 1;
			min-height: 0;
			position: relative;
		}

		/* Slotted chat panel */
		.chat-slot {
			flex: 1;
			min-height: 0;
			overflow: hidden;
		}

		/* Bottom dock: voice orb + tools */
		.shell-footer {
			display: flex;
			flex-direction: column;
			gap: 8px;
			padding: 10px 16px;
			background: rgba(11, 15, 20, 0.85);
			border-top: 1px solid rgba(103, 247, 200, 0.08);
			flex-shrink: 0;
		}

		.footer-row {
			display: flex;
			align-items: center;
			gap: 12px;
		}

		.push-to-talk-hint {
			font-size: 11px;
			color: rgba(103, 247, 200, 0.4);
			font-family: monospace;
		}

		/* Diffusion bubble overlay area */
		.diffusion-area {
			padding: 12px 16px;
			flex-shrink: 0;
		}
	`;

	@property({ type: String }) plan: MercuryShellPlan = "clean";
	@property({ type: String }) botName = "Mercury Agent";
	@property({ type: String }) tenantId = "";
	@property({ type: Array }) toolDockItems: ToolDockItem[] = [];
	@property({ type: Array }) assetItems: AssetItem[] = [];
	@property({ type: Number }) inputTokens = 0;
	@property({ type: Number }) outputTokens = 0;
	@property({ type: Number }) sessionCount = 0;
	@property({ type: String }) model = "mercury-2";

	@state() private _voiceState: VoiceOrbState = "idle";
	@state() private _diffusionState: DiffusionState = "idle";

	private get voiceEnabled(): boolean {
		return this.plan === "voice" || this.plan === "mercury_diffusion";
	}

	private get diffusionEnabled(): boolean {
		return this.plan === "mercury_diffusion";
	}

	/** Update voice orb state from outside (e.g., from voice controller). */
	setVoiceState(state: VoiceOrbState): void {
		this._voiceState = state;
	}

	/** Update diffusion bubble state from outside (e.g., from stream handler). */
	setDiffusionState(state: DiffusionState): void {
		this._diffusionState = state;
	}

	private handleOrbClick() {
		const next: VoiceOrbState = this._voiceState === "idle" ? "listening" : "idle";
		this._voiceState = next;
		this.dispatchEvent(new CustomEvent("voice-toggle", { detail: { state: next }, bubbles: true }));
	}

	private handleToolSelected(e: CustomEvent) {
		this.dispatchEvent(new CustomEvent("tool-selected", { detail: e.detail, bubbles: true }));
	}

	override render() {
		return html`
			<div class="shell-header">
				<div class="brand">
					<div class="brand-dot" aria-hidden="true"></div>
					${this.botName}
				</div>
				<div class="header-controls">
					<usage-meter
						.model=${this.model}
						.mode=${this.plan}
						.inputTokens=${this.inputTokens}
						.outputTokens=${this.outputTokens}
						.sessionCount=${this.sessionCount}
					></usage-meter>
				</div>
			</div>

			<div class="shell-body">
				<div class="chat-slot">
					<slot></slot>
				</div>

				${
					this.diffusionEnabled
						? html`
						<div class="diffusion-area">
							<mercury-diffusion-bubble
								.diffusionState=${this._diffusionState}
							></mercury-diffusion-bubble>
						</div>
					`
						: ""
				}
			</div>

			<div class="shell-footer">
				${
					this.diffusionEnabled
						? html`
						<asset-panel
							.assets=${this.assetItems}
							.visible=${this.assetItems.length > 0}
						></asset-panel>
						<tool-dock
							.items=${this.toolDockItems}
							.visible=${this.toolDockItems.length > 0}
							@tool-selected=${this.handleToolSelected}
						></tool-dock>
					`
						: ""
				}

				${
					this.voiceEnabled
						? html`
						<div class="footer-row">
							<voice-orb
								.state=${this._voiceState}
								@click=${this.handleOrbClick}
							></voice-orb>
							<span class="push-to-talk-hint">
								${this._voiceState === "idle" ? "tap to speak" : this._voiceState}
							</span>
						</div>
					`
						: ""
				}
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"mercury-agent-shell": MercuryAgentShell;
	}
}
