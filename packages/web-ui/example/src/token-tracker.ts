/**
 * Token Tracker — real-time token usage + cost warning component.
 *
 * Shows a small floating widget that tracks:
 *   - Tokens used in the current session
 *   - % of model context window used
 *   - Estimated cost (USD)
 *   - Warning when approaching context limit (75% warn, 90% critical)
 *
 * Mounts as a fixed-position element in the bottom-left corner.
 */

import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { getTokenBudget, type TokenBudget } from "./smart-router.js";

@customElement("token-tracker")
export class TokenTracker extends LitElement {
	static override styles = css`
		:host {
			position: fixed;
			bottom: 16px;
			left: 16px;
			z-index: 9999;
			font-family: ui-monospace, "SF Mono", Menlo, monospace;
			pointer-events: auto;
		}
		.widget {
			background: rgba(11, 15, 20, 0.92);
			border: 1px solid rgba(103, 247, 200, 0.2);
			border-radius: 10px;
			padding: 10px 14px;
			backdrop-filter: blur(8px);
			color: #cdd6f4;
			font-size: 11px;
			min-width: 200px;
			box-shadow: 0 4px 16px rgba(0,0,0,0.4);
		}
		.widget.warn { border-color: rgba(249, 226, 175, 0.5); }
		.widget.critical { border-color: rgba(243, 139, 168, 0.6); box-shadow: 0 0 20px rgba(243,139,168,0.2); }
		.row { display: flex; justify-content: space-between; margin: 2px 0; }
		.label { color: #6c7086; }
		.value { color: #cdd6f4; font-weight: 600; }
		.bar {
			height: 4px;
			background: rgba(255,255,255,0.1);
			border-radius: 2px;
			margin-top: 6px;
			overflow: hidden;
		}
		.bar-fill {
			height: 100%;
			border-radius: 2px;
			transition: width 0.3s ease, background 0.3s ease;
		}
		.bar-fill.safe { background: #a6e3a1; }
		.bar-fill.warn { background: #f9e2af; }
		.bar-fill.critical { background: #f38ba8; }
		.warning {
			margin-top: 6px;
			padding: 4px 6px;
			border-radius: 4px;
			font-size: 10px;
			display: none;
		}
		.warning.show { display: block; }
		.warning.warn { background: rgba(249, 226, 175, 0.15); color: #f9e2af; }
		.warning.critical { background: rgba(243, 139, 168, 0.15); color: #f38ba8; }
	`;

	@state() private model = "claude-sonnet-4-6";
	@state() private used = 0;
	@state() private costCents = 0;
	@state() private budget: TokenBudget | null = null;

	override connectedCallback() {
		super.connectedCallback();
		this.updateBudget();
		// Listen for token usage events from the agent
		window.addEventListener("agent-token-usage", ((e: CustomEvent) => {
			this.used += e.detail.inputTokens + e.detail.outputTokens;
			this.costCents += e.detail.costCents ?? 0;
			this.model = e.detail.model ?? this.model;
			this.updateBudget();
		}) as EventListener);
	}

	private updateBudget() {
		this.budget = getTokenBudget(this.model, this.used);
	}

	override render() {
		if (!this.budget) return html``;
		const b = this.budget;
		const costUsd = (this.costCents / 100).toFixed(4);
		const barColor = b.warningLevel === "critical" ? "critical" : b.warningLevel === "warn" ? "warn" : "safe";
		return html`
			<div class="widget ${b.warningLevel === "safe" ? "" : b.warningLevel}">
				<div class="row">
					<span class="label">Model</span>
					<span class="value">${this.model}</span>
				</div>
				<div class="row">
					<span class="label">Tokens</span>
					<span class="value">${this.used.toLocaleString()} / ${b.maxContext.toLocaleString()}</span>
				</div>
				<div class="row">
					<span class="label">Context</span>
					<span class="value">${b.percentUsed.toFixed(1)}%</span>
				</div>
				<div class="row">
					<span class="label">Cost</span>
					<span class="value">$${costUsd}</span>
				</div>
				<div class="bar">
					<div class="bar-fill ${barColor}" style="width: ${Math.min(100, b.percentUsed)}%"></div>
				</div>
				${
					b.warningLevel !== "safe"
						? html`<div class="warning show ${b.warningLevel}">
							${
								b.warningLevel === "critical"
									? "⚠️ CRITICAL: Context window nearly full. Start a new session."
									: "⚠️ WARNING: Approaching context limit."
							}
						</div>`
						: html``
				}
			</div>
		`;
	}
}

declare global {
	interface WindowEventMap {
		"agent-token-usage": CustomEvent<{
			inputTokens: number;
			outputTokens: number;
			costCents?: number;
			model?: string;
		}>;
	}
}
