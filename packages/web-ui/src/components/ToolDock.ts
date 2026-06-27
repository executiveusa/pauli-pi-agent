import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

export interface ToolDockItem {
	name: string;
	label: string;
	icon: string;
	enabled: boolean;
}

/**
 * ToolDock — plan-gated and permission-gated tool quick-launch panel.
 *
 * Only renders when the tenant plan includes toolDock capability.
 * Each tool item is individually gated by tenant permissions.
 * Disabled items are shown grayed out (not hidden) to indicate they exist
 * but are not available on the current plan.
 *
 * Usage:
 *   <tool-dock
 *     .items=${tools}
 *     @tool-selected=${handleToolSelected}
 *   ></tool-dock>
 */
@customElement("tool-dock")
export class ToolDock extends LitElement {
	static override styles = css`
		:host {
			display: block;
		}

		.dock {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			padding: 10px;
			background: rgba(11, 15, 20, 0.7);
			border: 1px solid rgba(103, 247, 200, 0.1);
			border-radius: 10px;
			backdrop-filter: blur(6px);
		}

		.dock-label {
			width: 100%;
			font-size: 10px;
			font-family: monospace;
			color: rgba(103, 247, 200, 0.4);
			margin-bottom: 4px;
		}

		.tool-btn {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 6px 12px;
			background: rgba(103, 247, 200, 0.05);
			border: 1px solid rgba(103, 247, 200, 0.15);
			border-radius: 6px;
			color: rgba(255, 255, 255, 0.8);
			font-size: 12px;
			cursor: pointer;
			transition: background 0.15s ease, border-color 0.15s ease;
			font-family: inherit;
		}

		.tool-btn:hover:not(:disabled) {
			background: rgba(103, 247, 200, 0.12);
			border-color: rgba(103, 247, 200, 0.4);
		}

		.tool-btn:disabled {
			opacity: 0.35;
			cursor: not-allowed;
		}

		.tool-icon { font-size: 14px; }
	`;

	@property({ type: Array }) items: ToolDockItem[] = [];
	@property({ type: Boolean }) visible = false;

	private handleClick(item: ToolDockItem) {
		if (!item.enabled) return;
		this.dispatchEvent(new CustomEvent("tool-selected", { detail: item, bubbles: true }));
	}

	override render() {
		if (!this.visible || !this.items.length) return html``;

		return html`
			<div class="dock">
				<div class="dock-label">tools</div>
				${this.items.map(
					(item) => html`
						<button
							class="tool-btn"
							?disabled=${!item.enabled}
							title=${item.enabled ? item.label : `${item.label} (not available on your plan)`}
							@click=${() => this.handleClick(item)}
						>
							<span class="tool-icon">${item.icon}</span>
							${item.label}
						</button>
					`,
				)}
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"tool-dock": ToolDock;
	}
}
