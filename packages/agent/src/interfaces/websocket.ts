/**
 * WebSocket Interface
 * Real-time bi-directional communication
 */

import type { WebSocketClient, WebSocketMessage } from "./types.js";

export class WebSocketServer {
	private isRunning: boolean = false;
	private clients: Map<string, WebSocketClient> = new Map();
	private messageHandlers: Map<string, (message: WebSocketMessage) => Promise<void>> = new Map();
	private messageHistory: WebSocketMessage[] = [];
	private maxHistorySize: number = 1000;

	async start(): Promise<void> {
		this.isRunning = true;
	}

	async stop(): Promise<void> {
		this.isRunning = false;
		this.clients.clear();
	}

	registerMessageHandler(messageType: string, handler: (message: WebSocketMessage) => Promise<void>): void {
		this.messageHandlers.set(messageType, handler);
	}

	async handleClientConnection(clientId: string): Promise<void> {
		if (!this.clients.has(clientId)) {
			this.clients.set(clientId, {
				id: clientId,
				connectedAt: new Date(),
				lastActivity: new Date(),
				isConnected: true,
			});
		}
	}

	async handleClientDisconnection(clientId: string): Promise<void> {
		const client = this.clients.get(clientId);
		if (client) {
			client.isConnected = false;
			this.clients.delete(clientId);
		}
	}

	async handleMessage(message: WebSocketMessage): Promise<void> {
		// Update client activity
		const client = this.clients.get(message.id);
		if (client) {
			client.lastActivity = new Date();
		}

		// Add to history
		this.addToHistory(message);

		// Route to handler
		const handler = this.messageHandlers.get(message.type);
		if (handler) {
			await handler(message);
		}
	}

	private addToHistory(message: WebSocketMessage): void {
		this.messageHistory.push(message);

		if (this.messageHistory.length > this.maxHistorySize) {
			this.messageHistory.shift();
		}
	}

	async broadcastMessage(message: WebSocketMessage): Promise<void> {
		for (const client of this.clients.values()) {
			if (client.isConnected) {
				// In a real implementation, send to client
				this.addToHistory(message);
			}
		}
	}

	async sendToClient(clientId: string, message: WebSocketMessage): Promise<boolean> {
		const client = this.clients.get(clientId);
		if (client?.isConnected) {
			this.addToHistory(message);
			return true;
		}
		return false;
	}

	getConnectedClients(): WebSocketClient[] {
		return Array.from(this.clients.values()).filter((c) => c.isConnected);
	}

	getClientCount(): number {
		return Array.from(this.clients.values()).filter((c) => c.isConnected).length;
	}

	getMessageHistory(limit: number = 50): WebSocketMessage[] {
		return this.messageHistory.slice(-limit);
	}

	clearMessageHistory(): void {
		this.messageHistory = [];
	}

	getClientInfo(clientId: string): WebSocketClient | undefined {
		return this.clients.get(clientId);
	}

	isHealthy(): boolean {
		return this.isRunning;
	}
}

export function createWebSocketServer(_port?: number): WebSocketServer {
	return new WebSocketServer();
}
