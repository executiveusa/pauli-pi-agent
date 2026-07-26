import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { CourseRunResult } from "./types.js";

const writeJson = async (path: string, value: unknown): Promise<void> => {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const toMarkdownList = (items: readonly string[]): string =>
  items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- None";

export const writeCourseRunToIcm = async (outputRoot: string, result: CourseRunResult): Promise<string> => {
  const runDirectory = join(outputRoot, result.missionId);
  const lessonsDirectory = join(runDirectory, "lessons");
  const modulesDirectory = join(runDirectory, "modules");
  const memoryDirectory = join(runDirectory, "candidate-memory");

  await Promise.all([
    mkdir(lessonsDirectory, { recursive: true }),
    mkdir(modulesDirectory, { recursive: true }),
    mkdir(memoryDirectory, { recursive: true }),
  ]);

  await writeJson(join(runDirectory, "course-manifest.json"), result.manifest);
  await writeJson(join(runDirectory, "lesson-jobs.json"), result.jobs);
  await writeFile(
    join(runDirectory, "events.jsonl"),
    `${result.events.map((event) => JSON.stringify(event)).join("\n")}\n`,
    "utf8",
  );

  for (const packet of result.homeworkPackets) {
    const lessonDirectory = join(lessonsDirectory, packet.lessonId);
    await mkdir(lessonDirectory, { recursive: true });
    await writeJson(join(lessonDirectory, "homework-packet.json"), packet);
    await writeFile(
      join(lessonDirectory, "briefing.md"),
      [
        `# ${packet.lessonId} briefing`,
        "",
        "## Summary",
        packet.detailedSummary,
        "",
        "## Action items",
        toMarkdownList(packet.actionItems),
        "",
        "## Unresolved questions",
        toMarkdownList(packet.unresolvedQuestions),
        "",
        "## Limitations",
        toMarkdownList(packet.knownLimitations),
        "",
      ].join("\n"),
      "utf8",
    );
  }

  for (const synthesis of result.moduleSyntheses) {
    await writeJson(join(modulesDirectory, `${synthesis.moduleId}.json`), synthesis);
    await writeFile(
      join(modulesDirectory, `${synthesis.moduleId}.md`),
      [
        `# ${synthesis.title}`,
        "",
        "## Summary",
        synthesis.summary,
        "",
        "## Concepts",
        toMarkdownList(synthesis.concepts),
        "",
        "## Action items",
        toMarkdownList(synthesis.actionItems),
        "",
        "## Unresolved questions",
        toMarkdownList(synthesis.unresolvedQuestions),
        "",
      ].join("\n"),
      "utf8",
    );
  }

  await writeJson(join(runDirectory, "course-synthesis.json"), result.courseSynthesis);
  await writeFile(
    join(runDirectory, "course-synthesis.md"),
    [
      `# ${result.courseSynthesis.title}`,
      "",
      "## Thesis",
      result.courseSynthesis.thesis,
      "",
      "## Completion",
      result.courseSynthesis.completionStatement,
      "",
      "## Core concepts",
      toMarkdownList(result.courseSynthesis.coreConcepts),
      "",
      "## Prioritized actions",
      toMarkdownList(result.courseSynthesis.prioritizedActions),
      "",
      "## Unresolved questions",
      toMarkdownList(result.courseSynthesis.unresolvedQuestions),
      "",
    ].join("\n"),
    "utf8",
  );

  await writeJson(join(memoryDirectory, "candidate-memory.json"), result.candidateMemory);
  await writeFile(
    join(memoryDirectory, "REVIEW_REQUIRED.md"),
    [
      "# Candidate memory review required",
      "",
      "These entries have not been committed to durable second-brain memory.",
      "Approve, edit, defer, or reject each entry before promotion.",
      "",
      ...result.candidateMemory.map(
        (candidate) =>
          `- **${candidate.title}** — ${candidate.summary} (confidence ${candidate.confidence.toFixed(2)})`,
      ),
      "",
    ].join("\n"),
    "utf8",
  );

  await writeFile(
    join(runDirectory, "HANDOFF.md"),
    [
      "# Course run handoff",
      "",
      `- Mission: ${result.missionId}`,
      `- Course: ${result.manifest.title}`,
      `- Lessons completed: ${result.homeworkPackets.length}`,
      `- Modules synthesized: ${result.moduleSyntheses.length}`,
      `- Candidate memory entries: ${result.candidateMemory.length}`,
      "- Durable memory changed: No",
      "- Human approval required: Yes",
      "",
    ].join("\n"),
    "utf8",
  );

  return runDirectory;
};
