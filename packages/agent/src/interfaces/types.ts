/**
 * Interface Layer Types
 * Defines API, CLI, and communication interfaces
 */

export interface ApiRequest {
	method: string;
	path: string;
	query?: Record<string, string>;
	body?: unknown;
	headers: Record<string, string>;
	timestamp: Date;
}

export interface ApiResponse {
	statusCode: number;
	body: unknown;
	headers?: Record<string, string>;
	timestamp: Date;
	processingTimeMs: number;
}

export interface CLICommand {
	name: string;
	description: string;
	arguments: string[];
	options: Record<string, { type: string; description: string; required?: boolean }>;
	execute: (args: string[], options: Record<string, unknown>) => Promise<void>;
}

export interface WebSocketMessage {
	type: string;
	id: string;
	payload: unknown;
	timestamp: Date;
}

export interface VoiceCommand {
	text: string;
	confidence: number;
	language?: string;
	timestamp: Date;
}

export interface VoiceResponse {
	text: string;
	audioUrl?: string;
	timestamp: Date;
	processingTimeMs: number;
}

export interface InterfaceConfig {
	enableCLI?: boolean;
	enableREST?: boolean;
	enableWebSocket?: boolean;
	enableVoice?: boolean;
	restPort?: number;
	wsPort?: number;
	voiceProvider?: string;
}

export interface HealthStatus {
	status: "healthy" | "degraded" | "unhealthy";
	timestamp: Date;
	uptime: number;
	components: Record<string, boolean>;
	metrics: {
		requestsPerSecond: number;
		avgResponseTimeMs: number;
		errorRate: number;
	};
}

export interface LogEntry {
	timestamp: Date;
	level: "debug" | "info" | "warn" | "error";
	message: string;
	context?: Record<string, unknown>;
}
