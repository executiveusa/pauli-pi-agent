/**
 * Sidebar — LibreChat-style left navigation.
 *
 * Contains:
 *   - New Chat button
 *   - Session list (clickable, loads session)
 *   - Skills as action buttons (not slash commands)
 *   - Settings at bottom
 *
 * The sidebar is collapsible on mobile.
 */

import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

export interface SkillAction {
	id: string;
	label: string;
	icon: string;
	description: string;
}

const SKILLS: SkillAction[] = [
	{ id: "watch", label: "Watch Video", icon: "video", description: "Ingest a YouTube video into the knowledge graph" },
	{ id: "scrape", label: "Scrape Web", icon: "globe", description: "Scrape a URL using Bright Data" },
	{ id: "crawl", label: "Crawl Site", icon: "search", description: "Crawl a full site with Firecrawl" },
	{ id: "graph", label: "View Graph", icon: "graph", description: "Open the knowledge graph view" },
	{ id: "brain", label: "Search Brain", icon: "bell", description: "Search your second brain" },
];

@customElement("cosmos-sidebar")
export class CosmosSidebar extends LitElement {
	static override styles = css`
		:host {
			display: flex;
			flex-direction: column;
			height: 100%;
			background: rgba(11, 15, 20, 0.6);
			border-right: 1px solid rgba(103, 247, 200, 0.1);
			color: #cdd6f4;
			font-family: ui-sans-serif, system-ui, sans-serif;
			overflow: hidden;
		}
		.header {
			padding: 12px;
			border-bottom: 1px solid rgba(103, 247, 200, 0.08);
		}
		.new-chat-btn {
			width: 100%;
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 10px 14px;
			background: rgba(103, 247, 200, 0.1);
			border: 1px solid rgba(103, 247, 200, 0.2);
			border-radius: 8px;
			color: #a6e3a1;
			font-size: 13px;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.15s ease;
		}
		.new-chat-btn:hover {
			background: rgba(103, 247, 200, 0.15);
			border-color: rgba(103, 247, 200, 0.3);
		}
		.section-label {
			padding: 12px 14px 6px;
			font-size: 10px;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: #6c7086;
		}
		.sessions {
			flex: 1;
			overflow-y: auto;
			padding: 0 8px;
		}
		.session-item {
			padding: 8px 10px;
			border-radius: 6px;
			font-size: 12px;
			color: #bac2de;
			cursor: pointer;
			transition: background 0.1s ease;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.session-item:hover {
			background: rgba(255, 255, 255, 0.04);
		}
		.session-item.active {
			background: rgba(103, 247, 200, 0.08);
			color: #a6e3a1;
		}
		.skills {
			padding: 0 8px 8px;
			border-top: 1px solid rgba(103, 247, 200, 0.08);
		}
		.skill-btn {
			width: 100%;
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 8px 10px;
			border: none;
			background: transparent;
			border-radius: 6px;
			color: #bac2de;
			font-size: 12px;
			cursor: pointer;
			transition: all 0.1s ease;
			text-align: left;
		}
		.skill-btn:hover {
			background: rgba(255, 255, 255, 0.04);
			color: #cdd6f4;
		}
		.skill-icon {
			width: 14px;
			height: 14px;
			opacity: 0.7;
			flex-shrink: 0;
		}
		.footer {
			padding: 8px;
			border-top: 1px solid rgba(103, 247, 200, 0.08);
		}
		.footer-btn {
			width: 100%;
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 8px 10px;
			border: none;
			background: transparent;
			border-radius: 6px;
			color: #6c7086;
			font-size: 12px;
			cursor: pointer;
			transition: all 0.1s ease;
		}
		.footer-btn:hover {
			background: rgba(255, 255, 255, 0.04);
			color: #cdd6f4;
		}
		.empty {
			padding: 20px 14px;
			font-size: 11px;
			color: #6c7086;
			text-align: center;
		}
	`;

	@property({ type: Array }) sessions: Array<{ id: string; title: string; preview?: string }> = [];
	@property({ type: String }) currentSessionId: string | undefined;
	@property({ type: Function }) onNewChat: () => void = () => {};
	@property({ type: Function }) onLoadSession: (id: string) => void = () => {};
	@property({ type: Function }) onSkill: (skillId: string) => void = () => {};
	@property({ type: Function }) onSettings: () => void = () => {};

	private renderIcon(name: string) {
		const icons: Record<string, string> = {
			video: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
			globe: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
			search:
				'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
			graph: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><line x1="7" y1="7" x2="10" y2="10"/><line x1="14" y1="10" x2="17" y2="7"/><line x1="7" y1="17" x2="10" y2="14"/><line x1="14" y1="14" x2="17" y2="17"/></svg>',
			bell: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
		};
		return icons[name] ?? icons.bell;
	}

	override render() {
		return html`
			<div class="header">
				<button class="new-chat-btn" @click=${() => this.onNewChat()}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
					New Chat
				</button>
			</div>
			<div class="section-label">Conversations</div>
			<div class="sessions">
				${
					this.sessions.length === 0
						? html`<div class="empty">No conversations yet. Start a new chat.</div>`
						: this.sessions.map(
								(s) => html`
								<div
									class="session-item ${s.id === this.currentSessionId ? "active" : ""}"
									@click=${() => this.onLoadSession(s.id)}
									title=${s.title}
								>
									${s.title}
								</div>
							`,
							)
				}
			</div>
			<div class="section-label">Skills</div>
			<div class="skills">
				${SKILLS.map(
					(skill) => html`
						<button
							class="skill-btn"
							@click=${() => {
								this.onSkill(skill.id);
							}}
							title=${skill.description}
						>
							<span class="skill-icon">${this.renderIcon(skill.icon)}</span>
							${skill.label}
						</button>
					`,
				)}
			</div>
			<div class="footer">
				<button class="footer-btn" @click=${() => this.onSettings()}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
					Settings
				</button>
			</div>
		`;
	}
}
