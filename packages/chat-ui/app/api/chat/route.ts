import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

// Mercury by Inception Labs — OpenAI-compatible API
const MERCURY_API_KEY = process.env.MERCURY_API_KEY || process.env.PAULI_PI_API_KEY || "";

const mercury = createOpenAI({
  apiKey: MERCURY_API_KEY,
  baseURL: "https://api.inceptionlabs.ai/v1",
});

export async function POST(req: Request) {
  const { message, messages: history, conversationId } = await req.json();

  // Build messages array — support conversation history if provided
  const chatMessages = history && Array.isArray(history)
    ? history
    : [{ role: "user" as const, content: message }];

  try {
    const result = await streamText({
      model: mercury("mercury-coder-small"),
      messages: chatMessages,
      system: "You are Pauli-Pi, a helpful diffusion-based AI assistant. Be concise, clear and friendly.",
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let currentText = "";
        try {
          for await (const chunk of result.textStream) {
            currentText += chunk;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "tokenChunk", content: currentText })}\n\n`
              )
            );
          }
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", content: currentText })}\n\n`
            )
          );
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", content: "Stream error occurred. Please try again." })}\n\n`
            )
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
        "X-Conversation-ID": conversationId || "",
      },
    });
  } catch (error: unknown) {
    console.error("Mercury API error:", error);
    const encoder = new TextEncoder();
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    const fallbackStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", content: `API Error: ${errMsg}` })}\n\n`
          )
        );
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", content: `API Error: ${errMsg}` })}\n\n`
          )
        );
        controller.close();
      },
    });
    return new NextResponse(fallbackStream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  }
}
