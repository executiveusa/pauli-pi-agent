import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

export interface AssetItem {
	id: string;
	type: "image" | "video" | "document" | "audio";
	label: string;
	url?: string;
	status: "pending" | "ready" | "error";
	mimeType?: string;
}

/**
 * AssetPanel — generated asset viewer for mercury_diffusion plan.
 *
 * Displays assets generated during the session (images, videos, docs).
 * Only visible when the tenant plan includes asset generation permissions.
 *
 * Usage: <asset-panel .assets=${assets}></asset-panel>
 */
@customElement("asset-panel")
export class AssetPanel extends LitElement {
	static override styles = css`
		:host { display: block; }

		.panel {
			background: rgba(11, 15, 20, 0.7);
			border: 1px solid rgba(103, 247, 200, 0.1);
			border-radius: 10px;
			padding: 12px;
			backdrop-filter: blur(6px);
		}

		.panel-header {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 11px;
			font-family: monospace;
			color: rgba(103, 247, 200, 0.5);
			margin-bottom: 10px;
		}

		.asset-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
			gap: 8px;
		}

		.asset-card {
			background: rgba(255, 255, 255, 0.04);
			border: 1px solid rgba(103, 247, 200, 0.08);
			border-radius: 8px;
			padding: 8px;
			text-align: center;
			font-size: 11px;
			color: rgba(255, 255, 255, 0.6);
		}

		.asset-card.ready {
			border-color: rgba(103, 247, 200, 0.2);
			cursor: pointer;
		}

		.asset-card.pending {
			opacity: 0.5;
		}

		.asset-card.error {
			border-color: rgba(255, 68, 68, 0.3);
			color: rgba(255, 68, 68, 0.7);
		}

		.asset-icon { font-size: 24px; display: block; margin-bottom: 4px; }

		.empty {
			color: rgba(255, 255, 255, 0.25);
			font-size: 12px;
			text-align: center;
			padding: 20px 0;
		}
	`;

	@property({ type: Array }) assets: AssetItem[] = [];
	@property({ type: Boolean }) visible = false;

	private assetIcon(type: AssetItem["type"]): string {
		switch (type) {
			case "image":
				return "🖼";
			case "video":
				return "🎬";
			case "document":
				return "📄";
			case "audio":
				return "🎵";
		}
	}

	private handleAssetClick(asset: AssetItem) {
		if (asset.status !== "ready" || !asset.url) return;
		this.dispatchEvent(new CustomEvent("asset-selected", { detail: asset, bubbles: true }));
	}

	override render() {
		if (!this.visible) return html``;

		return html`
			<div class="panel">
				<div class="panel-header">
					<span>⊞</span> assets
				</div>
				${
					this.assets.length === 0
						? html`<div class="empty">No assets generated yet</div>`
						: html`
						<div class="asset-grid">
							${this.assets.map(
								(asset) => html`
									<div
										class="asset-card ${asset.status}"
										title=${asset.label}
										@click=${() => this.handleAssetClick(asset)}
									>
										<span class="asset-icon">${this.assetIcon(asset.type)}</span>
										<span>${asset.label.slice(0, 16)}${asset.label.length > 16 ? "…" : ""}</span>
									</div>
								`,
							)}
						</div>
					`
				}
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"asset-panel": AssetPanel;
	}
}
