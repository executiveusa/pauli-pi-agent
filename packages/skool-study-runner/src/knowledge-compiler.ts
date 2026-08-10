import { createHash } from "node:crypto";
import type { EvidenceLabel, KnowledgeUnit, LessonResult, LessonSnapshot } from "./types.js";

const PROMPT_VERSION = "digital-student-compiler:v2";

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

const EVIDENCE_LABELS = new Set<EvidenceLabel>([
  "SOURCE STATES",
  "VISUALLY SHOWN",
  "STUDENT INFERENCE",
  "UNRESOLVED",
  "ACTION PROPOSAL",
]);

const KNOWLEDGE_TYPES = new Set<KnowledgeUnit["type"]>([
  "concept",
  "procedure",
  "claim",
  "example",
  "tool",
  "decision-rule",
]);

function stripCodeFence(value: string): string {
  return value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string") throw new Error(`LLM result field ${key} must be a string`);
  return value;
}

function readNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`LLM result field ${key} must be a finite number`);
  }
  return value;
}

function readStringArray(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`LLM result field ${key} must be a string array`);
  }
  return value;
}

function parseKnowledgeUnit(value: unknown): KnowledgeUnit {
  if (!isRecord(value)) throw new Error("LLM knowledge unit must be an object");

  const evidenceLabel = readString(value, "evidenceLabel");
  if (!EVIDENCE_LABELS.has(evidenceLabel as EvidenceLabel)) {
    throw new Error(`Unsupported evidence label: ${evidenceLabel}`);
  }

  const type = readString(value, "type");
  if (!KNOWLEDGE_TYPES.has(type as KnowledgeUnit["type"])) {
    throw new Error(`Unsupported knowledge unit type: ${type}`);
  }

  const confidence = readNumber(value, "confidence");
  if (confidence < 0 || confidence > 1) throw new Error("Knowledge confidence must be between 0 and 1");

  return {
    id: readString(value, "id"),
    lessonIndex: readNumber(value, "lessonIndex"),
    lessonTitle: readString(value, "lessonTitle"),
    type: type as KnowledgeUnit["type"],
    title: readString(value, "title"),
    actionableKnowledge: readString(value, "actionableKnowledge"),
    evidenceLabel: evidenceLabel as EvidenceLabel,
    evidence: readString(value, "evidence"),
    confidence,
    agentUse: readStringArray(value, "agentUse"),
    dependencies: readStringArray(value, "dependencies"),
    failureModes: readStringArray(value, "failureModes"),
  };
}

function parseLessonResult(value: unknown, snapshot: LessonSnapshot): Omit<LessonResult, "provenance"> {
  if (!isRecord(value)) throw new Error("LLM lesson result must be an object");

  const knowledgeUnitsValue = value.knowledgeUnits;
  if (!Array.isArray(knowledgeUnitsValue)) throw new Error("LLM result knowledgeUnits must be an array");

  const lessonIndex = readNumber(value, "lessonIndex");
  if (lessonIndex !== snapshot.lessonIndex) {
    throw new Error(`LLM returned lessonIndex ${lessonIndex}; expected ${snapshot.lessonIndex}`);
  }

  return {
    lessonIndex,
    lessonTitle: readString(value, "lessonTitle"),
    sourceUrl: readString(value, "sourceUrl"),
    summary: readString(value, "summary"),
    knowledgeUnits: knowledgeUnitsValue.map(parseKnowledgeUnit),
    actions: readStringArray(value, "actions"),
    openQuestions: readStringArray(value, "openQuestions"),
  };
}

function hashSource(snapshot: LessonSnapshot): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        courseId: snapshot.courseId,
        lessonIndex: snapshot.lessonIndex,
        lessonTitle: snapshot.lessonTitle,
        url: snapshot.url,
        text: snapshot.text,
        transcript: snapshot.transcript ?? "",
      }),
    )
    .digest("hex");
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
              promptVersion: PROMPT_VERSION,
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

  const core = parseLessonResult(JSON.parse(stripCodeFence(content)) as unknown, snapshot);

  return {
    ...core,
    provenance: {
      sourceHash: hashSource(snapshot),
      providerBaseUrl: baseUrl,
      model,
      promptVersion: PROMPT_VERSION,
      generatedAt: new Date().toISOString(),
    },
  };
}
