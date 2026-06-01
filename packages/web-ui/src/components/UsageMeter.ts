import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * UsageMeter — client-safe usage display.
 *
 * Shows only safe, client-facing usage information.
 * Never displays raw provider payloads, API keys, or internal logs.
 *
 * Usage: <usage-meter model="mercury-2" mode="diffusion" inputTokens="1200" outputTokens="340"></usage-meter>
 */
@customElement("usage-meter")
export class UsageMeter extends LitElement {
	static override styles = css`
		:host {
			display: block;
		}

		.meter {
			display: flex;
			flex-direction: column;
			gap: 4px;
			padding: 10px 14px;
			background: rgba(11, 15, 20, 0.6);
			border: 1px solid rgba(103, 247, 200, 0.1);
			border-radius: 8px;
			font-family: monospace;
			font-size: 11px;
			color: rgba(255, 255, 255, 0.5);
		}

		.row {
			display: flex;
			justify-content: space-between;
			gap: 16px;
		}

		.label { color: rgba(103, 247, 200, 0.5); }
		.value { color: rgba(255, 255, 255, 0.7); }

		.warning {
			color: #ff9900;
			font-size: 10px;
			margin-top: 4px;
		}
	`;

	@property({ type: String }) model = "";
	@property({ type: String }) mode = "";
	@property({ type: Number }) inputTokens = 0;
	@property({ type: Number }) outputTokens = 0;
	@property({ type: Number }) sessionCount = 0;
	@property({ type: Number }) limitWarningThreshold = 0.8;
	@property({ type: Number }) monthlyTokenLimit = 0;

	private get isNearLimit(): boolean {
		if (!this.monthlyTokenLimit) return false;
		const total = this.inputTokens + this.outputTokens;
		return total / this.monthlyTokenLimit >= this.limitWarningThreshold;
	}

	override render() {
		const total = this.inputTokens + this.outputTokens;
		return html`
			<div class="meter">
				${
					this.model
						? html`<div class="row"><span class="label">model</span><span class="value">${this.model}</span></div>`
						: ""
				}
				${
					this.mode
						? html`<div class="row"><span class="label">mode</span><span class="value">${this.mode}</span></div>`
						: ""
				}
				<div class="row">
					<span class="label">tokens (est)</span>
					<span class="value">${total.toLocaleString()}</span>
				</div>
				${
					this.sessionCount > 0
						? html`<div class="row">
							<span class="label">turns</span>
							<span class="value">${this.sessionCount}</span>
						</div>`
						: ""
				}
				${this.isNearLimit ? html`<div class="warning">⚠ Approaching session limit</div>` : ""}
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"usage-meter": UsageMeter;
	}
}
