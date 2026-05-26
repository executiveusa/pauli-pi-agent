/**
 * API Server Tests
 * Verify REST API functionality and health checks
 */

import { describe, expect, test, beforeEach } from "vitest";
import { ApiServer } from "../../src/interfaces/api.js";

describe("ApiServer", () => {
	let server: ApiServer;

	beforeEach(() => {
		server = new ApiServer(3000);
	});

	test("creates API server", () => {
		expect(server).toBeDefined();
		expect(server.getPort()).toBe(3000);
	});

	test("starts and stops server", async () => {
		await server.start();
		expect(server).toBeDefined();

		await server.stop();
		expect(server).toBeDefined();
	});

	test("handles health check request", async () => {
		await server.start();

		const response = await server.handleRequest({
			method: "GET",
			path: "/health",
			headers: {},
			timestamp: new Date(),
		});

		expect(response.statusCode).toBe(200);
		expect(response.body).toBeDefined();
		expect(typeof response.body).toBe("object");
	});

	test("returns 404 for unknown routes", async () => {
		const response = await server.handleRequest({
			method: "GET",
			path: "/unknown",
			headers: {},
			timestamp: new Date(),
		});

		expect(response.statusCode).toBe(404);
	});

	test("registers custom routes", async () => {
		server.registerRoute("/custom", async () => ({
			statusCode: 200,
			body: { custom: true },
			timestamp: new Date(),
			processingTimeMs: 0,
		}));

		const response = await server.handleRequest({
			method: "GET",
			path: "/custom",
			headers: {},
			timestamp: new Date(),
		});

		expect(response.statusCode).toBe(200);
		expect((response.body as any).custom).toBe(true);
	});

	test("tracks request count", async () => {
		await server.handleRequest({
			method: "GET",
			path: "/health",
			headers: {},
			timestamp: new Date(),
		});

		const metrics = server.getMetrics();
		expect(metrics.requestCount).toBeGreaterThan(0);
	});

	test("measures response time", async () => {
		const response = await server.handleRequest({
			method: "GET",
			path: "/health",
			headers: {},
			timestamp: new Date(),
		});

		expect(response.processingTimeMs).toBeGreaterThanOrEqual(0);
	});

	test("gets health status", async () => {
		await server.start();

		const health = server.getHealthStatus();

		expect(health).toHaveProperty("status");
		expect(health).toHaveProperty("timestamp");
		expect(health).toHaveProperty("uptime");
		expect(health).toHaveProperty("components");
		expect(health).toHaveProperty("metrics");
	});

	test("health includes component status", async () => {
		await server.start();

		const health = server.getHealthStatus();

		expect(health.components).toHaveProperty("api");
		expect(health.components).toHaveProperty("database");
		expect(health.components).toHaveProperty("cache");
	});

	test("health includes metrics", async () => {
		const response = await server.handleRequest({
			method: "GET",
			path: "/health",
			headers: {},
			timestamp: new Date(),
		});

		const health = (response.body as any);
		expect(health.metrics).toHaveProperty("requestsPerSecond");
		expect(health.metrics).toHaveProperty("avgResponseTimeMs");
		expect(health.metrics).toHaveProperty("errorRate");
	});

	test("tracks error count", async () => {
		server.registerRoute("/error", async () => {
			throw new Error("Test error");
		});

		await server.handleRequest({
			method: "GET",
			path: "/error",
			headers: {},
			timestamp: new Date(),
		});

		const metrics = server.getMetrics();
		expect(metrics.errorCount).toBeGreaterThan(0);
	});

	test("calculates error rate", async () => {
		server.registerRoute("/error", async () => {
			throw new Error("Test error");
		});

		await server.handleRequest({
			method: "GET",
			path: "/error",
			headers: {},
			timestamp: new Date(),
		});

		const metrics = server.getMetrics();
		expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
	});

	test("handles status endpoint", async () => {
		const response = await server.handleRequest({
			method: "GET",
			path: "/status",
			headers: {},
			timestamp: new Date(),
		});

		expect(response.statusCode).toBe(200);
		expect((response.body as any).running).toBeDefined();
	});

	test("handles metrics endpoint", async () => {
		await server.handleRequest({
			method: "GET",
			path: "/health",
			headers: {},
			timestamp: new Date(),
		});

		const response = await server.handleRequest({
			method: "GET",
			path: "/metrics",
			headers: {},
			timestamp: new Date(),
		});

		expect(response.statusCode).toBe(200);
		expect((response.body as any).requestCount).toBeDefined();
	});

	test("determines health based on error rate", async () => {
		await server.start();

		const health = server.getHealthStatus();
		const isHealthy = health.status === "healthy";

		expect(isHealthy).toBe(health.metrics.errorRate < 5);
	});

	test("isHealthy method", async () => {
		await server.start();

		const healthy = server.isHealthy();

		expect(typeof healthy).toBe("boolean");
	});

	test("includes timestamp in response", async () => {
		const response = await server.handleRequest({
			method: "GET",
			path: "/health",
			headers: {},
			timestamp: new Date(),
		});

		expect(response.timestamp).toBeInstanceOf(Date);
	});
});
