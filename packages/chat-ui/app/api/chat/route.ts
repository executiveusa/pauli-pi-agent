import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const PAULI_PI_API_KEY = process.env.PAULI_PI_API_KEY || "";
const DIFFUSION_STEPS = Number(process.env.DIFFUSION_STEPS) || 15;

const pauliPi = createOpenAI({
  apiKey: PAULI_PI_API_KEY,
  // Assuming a generic OpenAI-compatible endpoint for Pauli-Pi / Inception
  // If it fails, we fall back to standard openai or a mock.
  baseURL: "https://api.openai.com/v1", 
});

export async function POST(req: Request) {
  const { message, modality = "text", fileUrl, conversationId } = await req.json();

  try {
    const result = await streamText({
      model: pauliPi("gpt-4o-mini"), // Or whatever the valid model name is
      prompt: message,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let currentText = "";
        try {
          for await (const chunk of result.textStream) {
            currentText += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "tokenChunk", content: currentText })}\n\n`)
            );
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done", content: currentText })}\n\n`)
          );
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "tokenChunk", content: "I’m sorry, but I can’t help with that. (Stream Error)" })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("API error:", error);
    const encoder = new TextEncoder();
    const fallbackStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "tokenChunk", content: "I’m sorry, but I can’t help with that. (API Error)" })}\n\n`)
        );
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done", content: "I’m sorry, but I can’t help with that. (API Error)" })}\n\n`)
        );
        controller.close();
      }
    });
    return new NextResponse(fallbackStream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  }
}
