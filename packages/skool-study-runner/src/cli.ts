import { mkdir, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { Absurd } from "absurd-sdk";
import { registerDigitalStudentCourseTask } from "./durable-task.js";
import {
  courseTaskIdempotencyKey,
  DIGITAL_STUDENT_TASK,
  lessonEventName,
  manifestEventName,
} from "./events.js";
import { parseCourseManifest, parseLessonSnapshot } from "./manifest.js";
import type { CourseCheckpoint, CourseManifest } from "./types.js";

const inputDir = process.env.SKOOL_STUDY_INPUT ?? "./skool-study/input";
const outputDir = process.env.SKOOL_STUDY_OUTPUT ?? "./skool-study/output";
const pollMs = Number(process.env.SKOOL_STUDY_POLL_MS ?? 2000);
const queueName = process.env.SKOOL_ABSURD_QUEUE ?? "digital-student";
const workerConcurrency = Number(process.env.SKOOL_ABSURD_CONCURRENCY ?? 1);
const claimTimeout = Number(process.env.SKOOL_ABSURD_CLAIM_TIMEOUT ?? 900);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

async function isCourseComplete(courseId: string): Promise<boolean> {
  try {
    const value = await readJson(join(outputDir, "course-complete-actionable-knowledge.json"));
    if (!isRecord(value)) return false;
    return value.courseId === courseId && value.checkpointType === "final" && value.runState !== undefined;
  } catch {
    return false;
  }
}

async function emitManifest(app: Absurd, manifest: CourseManifest): Promise<string> {
  await app.emitEvent(manifestEventName(manifest.courseId), manifest);
  const spawned = await app.spawn(
    DIGITAL_STUDENT_TASK,
    {
      courseId: manifest.courseId,
      courseTitle: manifest.courseTitle,
      classroomUrl: manifest.classroomUrl,
    },
    {
      maxAttempts: 100,
      retryStrategy: {
        kind: "exponential",
        baseSeconds: 2,
        factor: 2,
        maxSeconds: 300,
      },
      idempotencyKey: courseTaskIdempotencyKey(manifest.courseId),
    },
  );

  console.log(
    `${spawned.created ? "Spawned" : "Resumed"} durable course task ${spawned.taskID} for ${manifest.courseId}`,
  );
  return spawned.taskID;
}

async function main(): Promise<void> {
  await mkdir(inputDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  const app = new Absurd({ queueName });
  registerDigitalStudentCourseTask(app, outputDir);
  const worker = await app.startWorker({
    concurrency: workerConcurrency,
    claimTimeout,
    batchSize: workerConcurrency,
    pollInterval: 0.5,
    fatalOnLeaseTimeout: false,
    onError: (error) => console.error("Absurd worker error:", error),
  });

  const seen = new Set<string>();
  let activeManifest: CourseManifest | null = null;
  let activeTaskID: string | null = null;
  let stopping = false;

  const requestStop = (): void => {
    stopping = true;
  };
  process.once("SIGINT", requestStop);
  process.once("SIGTERM", requestStop);

  console.log(`Skool durable study runner watching: ${inputDir}`);
  console.log(`Absurd queue: ${queueName}`);
  console.log("Capture course-manifest.json once, then feed lesson-###.json snapshots in manifest order.");

  try {
    while (!stopping) {
      const files = (await readdir(inputDir))
        .filter((name) => name.endsWith(".json"))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      if (files.includes("course-manifest.json") && !seen.has("course-manifest.json")) {
        try {
          const manifest = parseCourseManifest(await readJson(join(inputDir, "course-manifest.json")));
          activeManifest = manifest;
          activeTaskID = await emitManifest(app, manifest);
          seen.add("course-manifest.json");
          console.log(`Manifest accepted: ${manifest.lessons.length} lessons expected.`);
        } catch (error: unknown) {
          console.error("Manifest rejected; fix course-manifest.json and retry:", error);
        }
      }

      for (const file of files) {
        if (file === "course-manifest.json" || seen.has(file)) continue;
        try {
          const snapshot = parseLessonSnapshot(await readJson(join(inputDir, file)));
          await app.emitEvent(lessonEventName(snapshot.courseId, snapshot.lessonIndex), snapshot);
          seen.add(file);
          console.log(`Lesson ${snapshot.lessonIndex} submitted durably: ${snapshot.lessonTitle}`);
        } catch (error: unknown) {
          console.error(`Snapshot ${file} rejected; fix it and retry:`, error);
        }
      }

      if (activeManifest && activeTaskID && (await isCourseComplete(activeManifest.courseId))) {
        console.log(`Course complete. Durable task: ${activeTaskID}`);
        console.log(`Final export: ${join(outputDir, "course-complete-actionable-knowledge.json")}`);
        break;
      }

      await sleep(pollMs);
    }
  } finally {
    process.removeListener("SIGINT", requestStop);
    process.removeListener("SIGTERM", requestStop);
    await worker.close();
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
