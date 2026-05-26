/**
 * WebSocket Server Tests
 * Verify real-time communication functionality
 */

import { beforeEach, describe, expect, test } from "vitest";
import { WebSocketServer } from "../../src/interfaces/websocket.js";

describe("WebSocketServer", () => {
	let server: WebSocketServer;

	beforeEach(() => {
		server = new WebSocketServer();
	});

	test("creates WebSocket server", () => {
		expect(server).toBeDefined();
	});

	test("starts and stops server", async () => {
		await server.start();
		expect(server.isHealthy()).toBe(true);

		await server.stop();
		expect(server.isHealthy()).toBe(false);
	});

	test("handles client connection", async () => {
		await server.start();
		await server.handleClientConnection("client-1");

		const clients = server.getConnectedClients();

		expect(clients.length).toBeGreaterThan(0);
	});

	test("handles client disconnection", async () => {
		await server.start();
		await server.handleClientConnection("client-1");
		await server.handleClientDisconnection("client-1");

		const clients = server.getConnectedClients();

		expect(clients.find((c) => c.id === "client-1")).toBeUndefined();
	});

	test("registers message handlers", async () => {
		let handlerCalled = false;

		server.registerMessageHandler("test", async () => {
			handlerCalled = true;
		});

		await server.start();
		await server.handleClientConnection("client-1");

		await server.handleMessage({
			type: "test",
			id: "client-1",
			payload: { test: true },
			timestamp: new Date(),
		});

		expect(handlerCalled).toBe(true);
	});

	test("stores message history", async () => {
		await server.start();
		await server.handleClientConnection("client-1");

		await server.handleMessage({
			type: "test",
			id: "client-1",
			payload: { data: "test" },
			timestamp: new Date(),
		});

		const history = server.getMessageHistory(10);

		expect(history.length).toBeGreaterThan(0);
	});

	test("broadcasts message to all clients", async () => {
		await server.start();
		await server.handleClientConnection("client-1");
		await server.handleClientConnection("client-2");

		await server.broadcastMessage({
			type: "broadcast",
			id: "server",
			payload: { message: "hello" },
			timestamp: new Date(),
		});

		const history = server.getMessageHistory(10);

		expect(history.length).toBeGreaterThan(0);
	});

	test("sends message to specific client", async () => {
		await server.start();
		await server.handleClientConnection("client-1");

		const sent = await server.sendToClient("client-1", {
			type: "direct",
			id: "server",
			payload: { message: "hello" },
			timestamp: new Date(),
		});

		expect(sent).toBe(true);
	});

	test("returns false when sending to disconnected client", async () => {
		await server.start();

		const sent = await server.sendToClient("client-unknown", {
			type: "direct",
			id: "server",
			payload: { message: "hello" },
			timestamp: new Date(),
		});

		expect(sent).toBe(false);
	});

	test("gets connected client count", async () => {
		await server.start();
		await server.handleClientConnection("client-1");
		await server.handleClientConnection("client-2");
		await server.handleClientConnection("client-3");

		const count = server.getClientCount();

		expect(count).toBe(3);
	});

	test("gets client info", async () => {
		await server.start();
		await server.handleClientConnection("client-1");

		const info = server.getClientInfo("client-1");

		expect(info).toBeDefined();
		expect(info?.id).toBe("client-1");
		expect(info?.isConnected).toBe(true);
	});

	test("tracks client last activity", async () => {
		await server.start();
		await server.handleClientConnection("client-1");

		const before = new Date();
		await server.handleMessage({
			type: "test",
			id: "client-1",
			payload: { test: true },
			timestamp: new Date(),
		});
		const after = new Date();

		const info = server.getClientInfo("client-1");

		expect(info?.lastActivity.getTime()).toBeGreaterThanOrEqual(before.getTime());
		expect(info?.lastActivity.getTime()).toBeLessThanOrEqual(after.getTime());
	});

	test("limits message history size", async () => {
		await server.start();

		for (let i = 0; i < 1500; i++) {
			await server.broadcastMessage({
				type: "test",
				id: "server",
				payload: { index: i },
				timestamp: new Date(),
			});
		}

		const history = server.getMessageHistory(2000);

		expect(history.length).toBeLessThanOrEqual(1000);
	});

	test("clears message history", async () => {
		await server.start();

		await server.broadcastMessage({
			type: "test",
			id: "server",
			payload: { test: true },
			timestamp: new Date(),
		});

		server.clearMessageHistory();

		const history = server.getMessageHistory(10);

		expect(history.length).toBe(0);
	});

	test("gets connected clients list", async () => {
		await server.start();
		await server.handleClientConnection("client-1");
		await server.handleClientConnection("client-2");

		const clients = server.getConnectedClients();

		expect(clients.length).toBe(2);
		expect(clients.map((c) => c.id)).toContain("client-1");
		expect(clients.map((c) => c.id)).toContain("client-2");
	});
});
