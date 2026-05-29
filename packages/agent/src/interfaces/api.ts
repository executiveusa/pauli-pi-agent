/**
 * REST API Server
 * Provides HTTP interface to agent functionality
 */

import type { ApiRequest, ApiResponse, HealthStatus } from "./types.js";

export class ApiServer {
	private port: number;
	private isRunning: boolean = false;
	private requestCount: number = 0;
	private totalResponseTime: number = 0;
	private errorCount: number = 0;
	private startTime: Date = new Date();
	private routes: Map<string, (req: ApiRequest) => Promise<ApiResponse>> = new Map();

	constructor(port: number = 3000) {
		this.port = port;
		this.setupDefaultRoutes();
	}

	private setupDefaultRoutes(): void {
		this.registerRoute("/health", async () => ({
			statusCode: 200,
			body: this.getHealthStatus(),
			timestamp: new Date(),
			processingTimeMs: 0,
		}));

		this.registerRoute("/status", async () => ({
			statusCode: 200,
			body: { running: this.isRunning, requestCount: this.requestCount },
			timestamp: new Date(),
			processingTimeMs: 0,
		}));

		this.registerRoute("/metrics", async () => ({
			statusCode: 200,
			body: this.getMetrics(),
			timestamp: new Date(),
			processingTimeMs: 0,
		}));
	}

	registerRoute(path: string, handler: (req: ApiRequest) => Promise<ApiResponse>): void {
		this.routes.set(path, handler);
	}

	async handleRequest(request: ApiRequest): Promise<ApiResponse> {
		const startTime = Date.now();

		try {
			const handler = this.routes.get(request.path);
			if (!handler) {
				return {
					statusCode: 404,
					body: { error: "Not found" },
					timestamp: new Date(),
					processingTimeMs: Date.now() - startTime,
				};
			}

			const response = await handler(request);
			this.requestCount++;
			const processingTime = Date.now() - startTime;
			this.totalResponseTime += processingTime;

			return {
				...response,
				processingTimeMs: processingTime,
			};
		} catch (error) {
			this.errorCount++;
			return {
				statusCode: 500,
				body: { error: String(error) },
				timestamp: new Date(),
				processingTimeMs: Date.now() - startTime,
			};
		}
	}

	async start(): Promise<void> {
		this.isRunning = true;
		this.startTime = new Date();
	}

	async stop(): Promise<void> {
		this.isRunning = false;
	}

	getHealthStatus(): HealthStatus {
		const uptime = this.isRunning ? Date.now() - this.startTime.getTime() : 0;
		const avgResponseTime = this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0;
		const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;

		return {
			status: this.isRunning ? (errorRate < 5 ? "healthy" : "degraded") : "unhealthy",
			timestamp: new Date(),
			uptime,
			components: {
				api: this.isRunning,
				database: true,
				cache: true,
			},
			metrics: {
				requestsPerSecond: this.requestCount > 0 ? (this.requestCount * 1000) / uptime : 0,
				avgResponseTimeMs: avgResponseTime,
				errorRate,
			},
		};
	}

	getMetrics(): Record<string, unknown> {
		return {
			requestCount: this.requestCount,
			errorCount: this.errorCount,
			totalResponseTime: this.totalResponseTime,
			avgResponseTime: this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0,
			errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
			uptime: this.isRunning ? Date.now() - this.startTime.getTime() : 0,
		};
	}

	getPort(): number {
		return this.port;
	}

	isHealthy(): boolean {
		const health = this.getHealthStatus();
		return health.status !== "unhealthy";
	}
}

export function createApiServer(port?: number): ApiServer {
	return new ApiServer(port);
}
