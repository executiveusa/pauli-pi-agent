import type { LessonResult, LessonSnapshot } from "./types.js";

const SYSTEM_PROMPT = `You are the Digital Student knowledge compiler. Convert one authorized lesson into actionable knowledge for another AI agent.

Rules:
- Use only the supplied lesson evidence.
- Do not reproduce a full transcript.
- Separate source statements from inference.
- Prefer procedures, decision rules, tools, constraints, failure modes, and reusable patterns over generic summaries.
- Every knowledge unit must be independently understandable by an AI agent.
- Return strict JSON only, matching this shape:
{
  "lessonIndex": number,
  "lessonTitle": string,
  "sourceUrl": string,
  "summary": string,
  "knowledgeUnits": [{
    "id": string,
    "lessonIndex": number,
    "lessonTitle": string,
    "type": "concept"|"procedure"|"claim"|"example"|"tool"|"decision-rule",
    "title": string,
    "actionableKnowledge": string,
    "evidenceLabel": "SOURCE STATES"|"VISUALLY SHOWN"|"STUDENT INFERENCE"|"UNRESOLVED"|"ACTION PROPOSAL",
    "evidence": string,
    "confidence": number,
    "agentUse": string[],
    "dependencies": string[],
    "failureModes": string[]
  }],
  "actions": string[],
  "openQuestions": string[]
}`;

function stripCodeFence(value: string): string {
  return value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

export async function compileLesson(snapshot: LessonSnapshot): Promise<LessonResult> {
  const baseUrl = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;

  if (!baseUrl || !apiKey || !model) {
    throw new Error("LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL are required");
  }

  const evidence = [snapshot.text, snapshot.transcript ? `TRANSCRIPT:\n${snapshot.transcript}` : ""]
    .filter(Boolean)
    .join("\n\n");

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            metadata: {
              courseId: snapshot.courseId,
              courseTitle: snapshot.courseTitle,
              moduleTitle: snapshot.moduleTitle,
              lessonIndex: snapshot.lessonIndex,
              lessonTitle: snapshot.lessonTitle,
              url: snapshot.url,
            },
            evidence,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM returned no content");

  return JSON.parse(stripCodeFence(content)) as LessonResult;
}
