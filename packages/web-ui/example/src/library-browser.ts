/**
 * LibraryBrowser — ICM shelf browser.
 *
 * Shows the Amentis Library organized by ICM shelves (100-700).
 * Clicking a shelf expands its files. Clicking a file opens it.
 *
 * Reads from the baked-in library index (brain/library-index.json).
 */

import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

interface LibraryEntry {
	path: string;
	category: string;
	shelf: string;
	title: string;
	summary: string;
}

@customElement("library-browser")
export class LibraryBrowser extends LitElement {
	static override styles = css`
		:host {
			display: flex;
			flex-direction: column;
			height: 100%;
			background: rgba(11, 15, 20, 0.4);
			color: #cdd6f4;
			font-family: ui-sans-serif, system-ui, sans-serif;
			overflow: hidden;
		}
		.header {
			padding: 10px 14px;
			border-bottom: 1px solid rgba(103, 247, 200, 0.08);
		}
		.title {
			font-size: 12px;
			font-weight: 600;
			color: #a6e3a1;
		}
		.subtitle {
			font-size: 10px;
			color: #6c7086;
			margin-top: 2px;
		}
		.shelves {
			flex: 1;
			overflow-y: auto;
			padding: 8px;
		}
		.shelf {
			margin-bottom: 4px;
		}
		.shelf-header {
			padding: 6px 10px;
			font-size: 11px;
			font-weight: 600;
			color: #bac2de;
			cursor: pointer;
			border-radius: 6px;
			display: flex;
			justify-content: space-between;
			align-items: center;
			transition: background 0.1s ease;
		}
		.shelf-header:hover {
			background: rgba(255, 255, 255, 0.04);
		}
		.shelf-count {
			font-size: 10px;
			color: #6c7086;
			font-weight: 400;
		}
		.shelf-files {
			padding: 2px 0 4px 14px;
			display: none;
		}
		.shelf-files.open {
			display: block;
		}
		.file-item {
			padding: 4px 10px;
			font-size: 11px;
			color: #6c7086;
			cursor: pointer;
			border-radius: 4px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			transition: all 0.1s ease;
		}
		.file-item:hover {
			background: rgba(103, 247, 200, 0.06);
			color: #cdd6f4;
		}
		.empty {
			padding: 20px 14px;
			font-size: 11px;
			color: #6c7086;
			text-align: center;
		}
	`;

	@property({ type: Array }) entries: LibraryEntry[] = [];
	@property({ type: Function }) onFileClick: (path: string) => void = () => {};

	@state() private expandedShelves: Set<string> = new Set();

	private toggleShelf(shelf: string) {
		if (this.expandedShelves.has(shelf)) {
			this.expandedShelves.delete(shelf);
		} else {
			this.expandedShelves.add(shelf);
		}
		this.expandedShelves = new Set(this.expandedShelves);
	}

	override render() {
		if (this.entries.length === 0) {
			return html`<div class="empty">No library indexed. Run <code>node scripts/scan-library.mjs</code> to index your second brain.</div>`;
		}

		// Group by shelf
		const shelves = new Map<string, LibraryEntry[]>();
		for (const entry of this.entries) {
			if (!shelves.has(entry.shelf)) shelves.set(entry.shelf, []);
			shelves.get(entry.shelf)!.push(entry);
		}

		// Sort shelves: numbered first, then alphabetical
		const sortedShelves = [...shelves.entries()].sort(([a], [b]) => {
			const aNum = parseInt(a, 10) || 999;
			const bNum = parseInt(b, 10) || 999;
			return aNum - bNum;
		});

		return html`
			<div class="header">
				<div class="title">Amentis Library</div>
				<div class="subtitle">${this.entries.length} files · ICM structure</div>
			</div>
			<div class="shelves">
				${sortedShelves.map(
					([shelf, files]) => html`
						<div class="shelf">
							<div class="shelf-header" @click=${() => this.toggleShelf(shelf)}>
								<span>${shelf}</span>
								<span class="shelf-count">${files.length}</span>
							</div>
							<div class="shelf-files ${this.expandedShelves.has(shelf) ? "open" : ""}">
								${files.slice(0, 50).map(
									(f) => html`
										<div class="file-item" @click=${() => this.onFileClick(f.path)} title=${f.path}>
											${f.title || f.path.split("/").pop() || f.path}
										</div>
									`,
								)}
								${files.length > 50 ? html`<div class="file-item" style="opacity:0.5">+ ${files.length - 50} more...</div>` : ""}
							</div>
						</div>
					`,
				)}
			</div>
		`;
	}
}
