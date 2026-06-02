import OpenAI from "openai";
import { canUseFeature, getTenantConfig } from "../tenants/tenant-config.js";
import { StabilityGate } from "../voice/stability-gate.js";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export interface TranscribeRequest {
	tenantId: string;
	audioBase64: string;
	language?: string;
}

export interface TranscribeResponse {
	text: string;
	language: string;
	confidence: number;
}

export async function handleTranscribe(req: TranscribeRequest): Promise<TranscribeResponse> {
	if (!canUseFeature("voice")) {
		throw new Error("Voice feature not enabled for this tenant");
	}

	if (!req.audioBase64) {
		throw new Error("audioBase64 is required");
	}

	const buffer = Buffer.from(req.audioBase64, "base64");

	const transcript = await openai.audio.transcriptions.create({
		file: new File([buffer], "audio.wav", { type: "audio/wav" }),
		model: "whisper-1",
		language: req.language,
	});

	return {
		text: transcript.text,
		language: req.language || "en",
		confidence: 0.95,
	};
}

export interface SpeakRequest {
	tenantId: string;
	text: string;
	voiceName?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
}

export interface SpeakResponse {
	audioBase64: string;
	mimeType: string;
	durationMs: number;
}

export async function handleSpeak(req: SpeakRequest): Promise<SpeakResponse> {
	const config = getTenantConfig();

	if (!canUseFeature("voice")) {
		throw new Error("Voice feature not enabled for this tenant");
	}

	if (!req.text || req.text.trim().length === 0) {
		throw new Error("text is required and cannot be empty");
	}

	const voiceName = req.voiceName || (config.branding.voiceName as any) || "shimmer";

	const mp3 = await openai.audio.speech.create({
		model: process.env.VOICE_TTS_MODEL || "tts-1",
		voice: voiceName,
		input: req.text,
		response_format: "mp3",
	});

	const buffer = Buffer.from(await mp3.arrayBuffer());
	const audioBase64 = buffer.toString("base64");

	return {
		audioBase64,
		mimeType: "audio/mpeg",
		durationMs: Math.ceil((req.text.length / 150) * 1000),
	};
}

export interface VoiceSessionRequest {
	tenantId: string;
	voiceOptions?: {
		autoStartTTS?: boolean;
		maxDuration?: number;
		language?: string;
	};
}

export interface VoiceSessionResponse {
	sessionId: string;
	tenantId: string;
	stabilityGateActive: boolean;
	voiceEnabled: boolean;
}

const activeSessions = new Map<string, { gate: StabilityGate; createdAt: number }>();

export function handleCreateVoiceSession(req: VoiceSessionRequest): VoiceSessionResponse {
	const config = getTenantConfig();

	if (!canUseFeature("voice")) {
		throw new Error("Voice feature not enabled for this tenant");
	}

	const sessionId = `vs_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
	const gate = new StabilityGate();

	activeSessions.set(sessionId, {
		gate,
		createdAt: Date.now(),
	});

	return {
		sessionId,
		tenantId: req.tenantId,
		stabilityGateActive: true,
		voiceEnabled: config.routing.voiceEnabled,
	};
}

export function getVoiceSession(sessionId: string): StabilityGate | null {
	const session = activeSessions.get(sessionId);
	if (!session) return null;

	if (Date.now() - session.createdAt > 3600000) {
		activeSessions.delete(sessionId);
		return null;
	}

	return session.gate;
}

export function closeVoiceSession(sessionId: string): void {
	activeSessions.delete(sessionId);
}
