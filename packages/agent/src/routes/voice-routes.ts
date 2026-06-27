/**
 * Voice (STT/TTS) routing and processing
 *
 * Handles:
 * - Speech-to-text via OpenAI Whisper
 * - Text-to-speech via OpenAI TTS
 * - Voice session management
 *
 * SECURITY: API keys resolved server-side. No keys exposed to browser.
 */

export interface VoiceSession {
	sessionId: string;
	tenantId: string;
	createdAt: number;
	expiresAt: number;
}

export interface TranscribeOptions {
	audio: string; // base64 encoded
	language?: string;
	apiKey?: string;
}

export interface TranscribeResult {
	text: string;
	confidence: number;
	language: string;
}

export interface SpeakOptions {
	text: string;
	voiceName?: string;
	apiKey?: string;
}

/**
 * Convert speech audio to text using OpenAI Whisper
 */
export async function handleVoiceTranscribe(options: TranscribeOptions): Promise<TranscribeResult> {
	const { audio, language, apiKey } = options;

	if (!apiKey) {
		throw new Error("OPENAI_API_KEY not configured");
	}

	if (!audio) {
		throw new Error("Audio data required");
	}

	try {
		// Decode base64 to buffer
		const audioBuffer = Buffer.from(audio, "base64");

		// Build multipart form data for Whisper API
		const formData = new FormData();
		const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });
		formData.append("file", audioBlob, "audio.mp3");
		formData.append("model", "whisper-1");
		if (language) {
			formData.append("language", language);
		}

		// Call OpenAI Whisper API
		const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
			},
			body: formData,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
		}

		const result = (await response.json()) as { text: string };

		return {
			text: result.text,
			confidence: 0.95,
			language: language || "en",
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Transcription failed: ${message}`);
	}
}

/**
 * Generate speech audio from text using OpenAI TTS
 */
export async function handleVoiceSpeak(options: SpeakOptions): Promise<Buffer> {
	const { text, voiceName, apiKey } = options;

	if (!apiKey) {
		throw new Error("OPENAI_API_KEY not configured");
	}

	if (!text) {
		throw new Error("Text required");
	}

	try {
		// Call OpenAI TTS API
		const response = await fetch("https://api.openai.com/v1/audio/speech", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: process.env.VOICE_TTS_MODEL || "tts-1",
				voice: voiceName || process.env.VOICE_TTS_VOICE || "shimmer",
				input: text,
				response_format: "mp3",
			}),
		});

		if (!response.ok) {
			throw new Error(`TTS API error: ${response.status}`);
		}

		const arrayBuffer = await response.arrayBuffer();
		return Buffer.from(arrayBuffer);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Speech synthesis failed: ${message}`);
	}
}

/**
 * Create a new voice session for a tenant
 */
export function createVoiceSession(tenantId: string, durationSeconds: number = 3600): VoiceSession {
	const now = Date.now();
	return {
		sessionId: `vs_${Date.now()}_${Math.random().toString(36).substring(7)}`,
		tenantId,
		createdAt: now,
		expiresAt: now + durationSeconds * 1000,
	};
}

/**
 * Validate if a voice session is still active
 */
export function isVoiceSessionActive(session: VoiceSession): boolean {
	return Date.now() < session.expiresAt;
}
