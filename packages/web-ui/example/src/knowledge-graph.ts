/**
 * KnowledgeGraph — Infranodus-style force-directed node graph.
 *
 * Shows the agent's knowledge as a network of connected nodes:
 *   - Library files (from brain/library-index.json)
 *   - Conversation topics
 *   - Brain memories
 *
 * Nodes are positioned with a simple force simulation. Edges connect
 * files in the same shelf (co-occurrence). Clicking a node opens it.
 *
 * Inspired by Infranodus: shows "gaps" (unconnected nodes) to reveal
 * what the agent doesn't know yet.
 */

import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

interface GraphNode {
	id: string;
	label: string;
	shelf: string;
	x: number;
	y: number;
	vx: number;
	vy: number;
	connections: number;
}

interface GraphEdge {
	source: string;
	target: string;
}

@customElement("knowledge-graph")
export class KnowledgeGraph extends LitElement {
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
			display: flex;
			justify-content: space-between;
			align-items: center;
		}
		.title {
			font-size: 12px;
			font-weight: 600;
			color: #a6e3a1;
		}
		.count {
			font-size: 10px;
			color: #6c7086;
		}
		.canvas-container {
			flex: 1;
			position: relative;
			overflow: hidden;
		}
		canvas {
			width: 100%;
			height: 100%;
			cursor: grab;
		}
		canvas:active {
			cursor: grabbing;
		}
		.legend {
			padding: 8px 14px;
			border-top: 1px solid rgba(103, 247, 200, 0.08);
			font-size: 10px;
			color: #6c7086;
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
		}
		.legend-item {
			display: flex;
			align-items: center;
			gap: 4px;
		}
		.legend-dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
		}
		.empty {
			padding: 40px 20px;
			text-align: center;
			font-size: 11px;
			color: #6c7086;
		}
		.tooltip {
			position: absolute;
			background: rgba(17, 24, 39, 0.95);
			border: 1px solid rgba(103, 247, 200, 0.2);
			border-radius: 6px;
			padding: 6px 10px;
			font-size: 10px;
			color: #cdd6f4;
			pointer-events: none;
			z-index: 10;
			max-width: 200px;
			display: none;
		}
	`;

	@property({ type: Array }) nodes: GraphNode[] = [];
	@property({ type: Array }) edges: GraphEdge[] = [];
	@property({ type: Function }) onNodeClick: (nodeId: string) => void = () => {};

	@state() private hoveredNode: string | null = null;
	private canvas: HTMLCanvasElement | null = null;
	private animationFrame: number | null = null;
	private dragging: GraphNode | null = null;

	private readonly SHELF_COLORS: Record<string, string> = {
		"100-Foundations": "#f38ba8",
		"200-Strategy-Doctrine": "#fab387",
		"300-Software-Factory": "#f9e2af",
		"400-Clients-Projects": "#a6e3a1",
		"500-Health-Living": "#94e2d5",
		"600-Literature-Culture": "#89b4fa",
		"700-Finance-Sovereignty": "#cba6f7",
		"Mental-Models": "#f5c2e7",
		Books: "#94e2d5",
		uncategorized: "#6c7086",
	};

	override connectedCallback() {
		super.connectedCallback();
		this.updateComplete.then(() => this.startSimulation());
	}

	override disconnectedCallback() {
		super.disconnectedCallback();
		if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
	}

	private startSimulation() {
		this.canvas = this.renderRoot.querySelector("canvas");
		if (!this.canvas) return;

		// Initialize node positions in a circle
		const cx = this.canvas.width / 2;
		const cy = this.canvas.height / 2;
		const radius = Math.min(cx, cy) * 0.7;
		this.nodes.forEach((node, i) => {
			const angle = (i / this.nodes.length) * Math.PI * 2;
			node.x = cx + Math.cos(angle) * radius;
			node.y = cy + Math.sin(angle) * radius;
			node.vx = 0;
			node.vy = 0;
		});

		this.simulate();
	}

	private simulate() {
		if (!this.canvas || this.nodes.length === 0) return;

		const ctx = this.canvas.getContext("2d");
		if (!ctx) return;

		// Force simulation: repulsion + edge attraction + centering
		const repulsion = 800;
		const attraction = 0.02;
		const centering = 0.005;
		const damping = 0.85;

		// Repulsion between all nodes
		for (let i = 0; i < this.nodes.length; i++) {
			for (let j = i + 1; j < this.nodes.length; j++) {
				const a = this.nodes[i];
				const b = this.nodes[j];
				const dx = b.x - a.x;
				const dy = b.y - a.y;
				const dist = Math.sqrt(dx * dx + dy * dy) || 1;
				const force = repulsion / (dist * dist);
				const fx = (dx / dist) * force;
				const fy = (dy / dist) * force;
				if (a !== this.dragging) {
					a.vx -= fx;
					a.vy -= fy;
				}
				if (b !== this.dragging) {
					b.vx += fx;
					b.vy += fy;
				}
			}
		}

		// Attraction along edges
		for (const edge of this.edges) {
			const a = this.nodes.find((n) => n.id === edge.source);
			const b = this.nodes.find((n) => n.id === edge.target);
			if (!a || !b) continue;
			const dx = b.x - a.x;
			const dy = b.y - a.y;
			const dist = Math.sqrt(dx * dx + dy * dy) || 1;
			const force = (dist - 80) * attraction;
			const fx = (dx / dist) * force;
			const fy = (dy / dist) * force;
			if (a !== this.dragging) {
				a.vx += fx;
				a.vy += fy;
			}
			if (b !== this.dragging) {
				b.vx -= fx;
				b.vy -= fy;
			}
		}

		// Centering + apply velocity
		const cx = this.canvas.width / 2;
		const cy = this.canvas.height / 2;
		for (const node of this.nodes) {
			if (node === this.dragging) continue;
			node.vx += (cx - node.x) * centering;
			node.vy += (cy - node.y) * centering;
			node.vx *= damping;
			node.vy *= damping;
			node.x += node.vx;
			node.y += node.vy;
		}

		// Draw
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Draw edges
		ctx.strokeStyle = "rgba(103, 247, 200, 0.1)";
		ctx.lineWidth = 1;
		for (const edge of this.edges) {
			const a = this.nodes.find((n) => n.id === edge.source);
			const b = this.nodes.find((n) => n.id === edge.target);
			if (!a || !b) continue;
			ctx.beginPath();
			ctx.moveTo(a.x, a.y);
			ctx.lineTo(b.x, b.y);
			ctx.stroke();
		}

		// Draw nodes
		for (const node of this.nodes) {
			const color = this.SHELF_COLORS[node.shelf] ?? "#6c7086";
			const isHovered = node.id === this.hoveredNode;
			const radius = isHovered ? 6 : 4;

			// Highlight gaps (nodes with no connections)
			if (node.connections === 0) {
				ctx.strokeStyle = "rgba(249, 226, 175, 0.4)";
				ctx.lineWidth = 1;
				ctx.setLineDash([2, 2]);
				ctx.beginPath();
				ctx.arc(node.x, node.y, radius + 3, 0, Math.PI * 2);
				ctx.stroke();
				ctx.setLineDash([]);
			}

			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
			ctx.fill();

			if (isHovered) {
				ctx.fillStyle = "rgba(205, 214, 244, 0.9)";
				ctx.font = "10px ui-sans-serif";
				ctx.fillText(node.label.slice(0, 30), node.x + 8, node.y - 8);
			}
		}

		this.animationFrame = requestAnimationFrame(() => this.simulate());
	}

	private onMouseMove(e: MouseEvent) {
		if (!this.canvas) return;
		const rect = this.canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		if (this.dragging) {
			this.dragging.x = x;
			this.dragging.y = y;
			this.dragging.vx = 0;
			this.dragging.vy = 0;
			return;
		}

		// Hover detection
		let found: string | null = null;
		for (const node of this.nodes) {
			const dx = node.x - x;
			const dy = node.y - y;
			if (Math.sqrt(dx * dx + dy * dy) < 8) {
				found = node.id;
				break;
			}
		}
		if (found !== this.hoveredNode) {
			this.hoveredNode = found;
			this.canvas.style.cursor = found ? "pointer" : "grab";
		}
	}

	private onMouseDown(_e: MouseEvent) {
		if (!this.canvas || !this.hoveredNode) return;
		const node = this.nodes.find((n) => n.id === this.hoveredNode);
		if (node) {
			this.dragging = node;
		}
	}

	private onMouseUp() {
		this.dragging = null;
	}

	private onClick(_e: MouseEvent) {
		if (!this.canvas || !this.hoveredNode) return;
		this.onNodeClick(this.hoveredNode);
	}

	override render() {
		if (this.nodes.length === 0) {
			return html`<div class="empty">No knowledge graph data. Run the library scanner to index your second brain.</div>`;
		}
		const shelves = [...new Set(this.nodes.map((n) => n.shelf))];
		return html`
			<div class="header">
				<span class="title">Knowledge Graph</span>
				<span class="count">${this.nodes.length} nodes · ${this.edges.length} edges</span>
			</div>
			<div class="canvas-container">
				<canvas
					width="400"
					height="500"
					@mousemove=${(e: MouseEvent) => this.onMouseMove(e)}
					@mousedown=${(e: MouseEvent) => this.onMouseDown(e)}
					@mouseup=${() => this.onMouseUp()}
					@click=${(e: MouseEvent) => this.onClick(e)}
				></canvas>
			</div>
			<div class="legend">
				${shelves.map(
					(s) => html`
						<div class="legend-item">
							<span class="legend-dot" style="background: ${this.SHELF_COLORS[s] ?? "#6c7086"}"></span>
							${s}
						</div>
					`,
				)}
			</div>
		`;
	}
}
