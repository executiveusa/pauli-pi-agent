import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { llmChat } from "../../../lib/llm.js";

// Ensure keys are online and parsed from environment variables
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const file = formData.get("file") as Blob | null;
		const pageTitle = (formData.get("pageTitle") as string) ?? "General Onboarding";
		const contextAnalogy = (formData.get("contextAnalogy") as string) ?? "";

		if (!file) {
			return NextResponse.json({ error: "audio file required" }, { status: 400 });
		}

		// 1. Convert blob to a file object for OpenAI transcription
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// We can pass the buffer directly using a mock file structure or fs write,
		// but the cleanest node-openai way is to pass a custom file object
		const filePayload = await OpenAI.toFile(buffer, "voice.webm", { type: "audio/webm" });

		// 2. Whisper Speech-to-Text
		const transcription = await openai.audio.transcriptions.create({
			file: filePayload,
			model: "whisper-1",
		});

		const transcribedText = transcription.text;
		if (!transcribedText || !transcribedText.trim()) {
			return NextResponse.json({ error: "No speech detected" }, { status: 422 });
		}

		// 3. Smart routing contextual response
		const promptContext = `
      You are Sofia, the bilingual AI concierge avatar for the Future-Proof Autonomous Agency.
      You are helping the user onboard through our visual flipbook.
      Current Flipbook Page: ${pageTitle}
      Page Concept/Analogy: ${contextAnalogy}
      
      User Question: "${transcribedText}"
      
      Respond directly to their question. Keep your answer conversational, helpful, and concise (under 3 sentences) so it translates beautifully to speech.
    `;

		const responseText = await llmChat([{ role: "user", content: promptContext }], {
			task: "fast",
			systemPrompt: "You are Sofia, a warm, professional, bilingual AI concierge.",
		});

		// 4. Text-to-Speech (TTS) response generation
		const speechResponse = await openai.audio.speech.create({
			model: "tts-1",
			voice: "shimmer", // Sofia's warm tone
			input: responseText,
		});

		const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());

		return new NextResponse(audioBuffer, {
			headers: {
				"Content-Type": "audio/mpeg",
				"Content-Length": audioBuffer.length.toString(),
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Voice route failure";
		console.error("Voice route error: ", error);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
