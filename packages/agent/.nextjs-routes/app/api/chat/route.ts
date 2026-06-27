import { type NextRequest, NextResponse } from "next/server";
import { type LLMMessage, llmChat, type TaskType } from "../../../lib/llm.js";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const messages = body.messages as LLMMessage[] | undefined;
		const task = (body.task ?? "default") as TaskType;
		const systemPrompt = body.systemPrompt as string | undefined;

		if (!messages?.length) {
			return NextResponse.json({ error: "messages required" }, { status: 400 });
		}

		const reply = await llmChat(messages, { task, systemPrompt });
		return NextResponse.json({ reply });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
