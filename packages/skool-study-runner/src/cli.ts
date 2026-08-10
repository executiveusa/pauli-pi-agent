import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { buildCheckpoint } from "./checkpoint.js";
import { compileLesson } from "./knowledge-compiler.js";
import type { LessonResult, LessonSnapshot } from "./types.js";

const inputDir = process.env.SKOOL_STUDY_INPUT ?? "./skool-study/input";
const outputDir = process.env.SKOOL_STUDY_OUTPUT ?? "./skool-study/output";
const pollMs = Number(process.env.SKOOL_STUDY_POLL_MS ?? 2000);

async function loadSnapshot(path: string): Promise<LessonSnapshot> {
  return JSON.parse(await readFile(path, "utf8")) as LessonSnapshot;
}

async function saveJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main(): Promise<void> {
  await mkdir(inputDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  const completed = new Map<number, LessonResult>();
  let firstThreeWritten = false;
  let courseComplete = false;
  let courseId = "unknown";
  let courseTitle = "Unknown Course";

  console.log(`Skool assisted study runner watching: ${inputDir}`);
  console.log("Navigate lessons manually and save one lesson snapshot JSON per lesson.");
  console.log("The process checkpoints after lesson 3 and continues until a snapshot declares courseComplete=true.");

  while (!courseComplete) {
    const files = (await readdir(inputDir))
      .filter((name) => name.endsWith(".json"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    for (const file of files) {
      const snapshot = await loadSnapshot(join(inputDir, file));
      if (completed.has(snapshot.lessonIndex)) continue;

      courseId = snapshot.courseId;
      courseTitle = snapshot.courseTitle;
      console.log(`Studying lesson ${snapshot.lessonIndex}: ${snapshot.lessonTitle}`);

      const result = await compileLesson(snapshot);
      completed.set(snapshot.lessonIndex, result);
      await saveJson(join(outputDir, `lesson-${String(snapshot.lessonIndex).padStart(3, "0")}.json`), result);

      const ordered = [...completed.values()].sort((a, b) => a.lessonIndex - b.lessonIndex);
      courseComplete = Boolean(snapshot.courseComplete);

      await saveJson(
        join(outputDir, "progress.json"),
        buildCheckpoint({
          courseId,
          courseTitle,
          lessons: ordered,
          checkpointType: courseComplete ? "final" : "progress",
          courseComplete,
        }),
      );

      if (ordered.length >= 3 && !firstThreeWritten) {
        const firstThree = ordered.slice(0, 3);
        await saveJson(
          join(outputDir, "first-three-actionable-knowledge.json"),
          buildCheckpoint({
            courseId,
            courseTitle,
            lessons: firstThree,
            checkpointType: "first-three",
            courseComplete: false,
          }),
        );
        firstThreeWritten = true;
        console.log(`Checkpoint ready: ${join(outputDir, "first-three-actionable-knowledge.json")}`);
      }

      if (courseComplete) {
        await saveJson(
          join(outputDir, "course-complete-actionable-knowledge.json"),
          buildCheckpoint({
            courseId,
            courseTitle,
            lessons: ordered,
            checkpointType: "final",
            courseComplete: true,
          }),
        );
        console.log("Course marked complete. Final actionable knowledge JSON written.");
        break;
      }
    }

    if (!courseComplete) await sleep(pollMs);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
