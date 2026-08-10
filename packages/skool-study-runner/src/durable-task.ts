import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Absurd } from "absurd-sdk";
import { buildCheckpoint } from "./checkpoint.js";
import { DIGITAL_STUDENT_TASK, lessonEventName, manifestEventName, padLessonIndex } from "./events.js";
import { compileLesson } from "./knowledge-compiler.js";
import { parseCourseManifest, parseLessonSnapshot, validateSnapshotForManifest } from "./manifest.js";
import type { CourseCheckpoint, CourseManifest, DurableCourseParams, LessonResult } from "./types.js";

async function saveJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function assertManifestMatchesParams(manifest: CourseManifest, params: DurableCourseParams): void {
  if (manifest.courseId !== params.courseId) {
    throw new Error(`Manifest courseId ${manifest.courseId} does not match task ${params.courseId}`);
  }
  if (manifest.courseTitle !== params.courseTitle) {
    throw new Error(`Manifest courseTitle ${manifest.courseTitle} does not match task ${params.courseTitle}`);
  }
}

export function registerDigitalStudentCourseTask(app: Absurd, outputDir: string): void {
  app.registerTask<DurableCourseParams>(
    {
      name: DIGITAL_STUDENT_TASK,
      defaultMaxAttempts: 100,
    },
    async (params, ctx) => {
      await mkdir(outputDir, { recursive: true });

      const rawManifest = await ctx.awaitEvent(manifestEventName(params.courseId), {
        stepName: "course:await-manifest:v1",
      });
      const manifest = await ctx.step("course:validate-manifest:v1", async () => {
        const parsed = parseCourseManifest(rawManifest);
        assertManifestMatchesParams(parsed, params);
        return parsed;
      });

      const completed: LessonResult[] = [];
      let firstThreeCheckpoint: CourseCheckpoint | null = null;

      for (const expectedLesson of manifest.lessons) {
        const paddedIndex = padLessonIndex(expectedLesson.lessonIndex);
        const rawSnapshot = await ctx.awaitEvent(lessonEventName(params.courseId, expectedLesson.lessonIndex), {
          stepName: `lesson:${paddedIndex}:await-source:v1`,
        });

        const snapshot = await ctx.step(`lesson:${paddedIndex}:validate-source:v1`, async () => {
          return validateSnapshotForManifest(parseLessonSnapshot(rawSnapshot), manifest, expectedLesson);
        });

        await ctx.heartbeat(900);
        const result = await ctx.step(`lesson:${paddedIndex}:compile:v2`, async () => {
          return await compileLesson(snapshot);
        });
        completed.push(result);

        // JSON is an export, not the source of truth. Re-materialize it on replay
        // from the durable checkpoint so a restarted worker can recover local files.
        await saveJson(join(outputDir, `lesson-${paddedIndex}.json`), result);

        const progress = await ctx.step(`checkpoint:progress:${paddedIndex}:v2`, async () => {
          return buildCheckpoint({
            courseId: manifest.courseId,
            courseTitle: manifest.courseTitle,
            lessons: [...completed],
            checkpointType: "progress",
            courseComplete: false,
            totalLessonsKnown: manifest.lessons.length,
          });
        });
        await saveJson(join(outputDir, "progress.json"), progress);

        if (completed.length === 3) {
          firstThreeCheckpoint = await ctx.step("checkpoint:first-three:v2", async () => {
            return buildCheckpoint({
              courseId: manifest.courseId,
              courseTitle: manifest.courseTitle,
              lessons: completed.slice(0, 3),
              checkpointType: "first-three",
              courseComplete: false,
              totalLessonsKnown: manifest.lessons.length,
            });
          });
          await saveJson(join(outputDir, "first-three-actionable-knowledge.json"), firstThreeCheckpoint);
        }
      }

      const finalCheckpoint = await ctx.step("checkpoint:course-complete:v2", async () => {
        return buildCheckpoint({
          courseId: manifest.courseId,
          courseTitle: manifest.courseTitle,
          lessons: completed,
          checkpointType: "final",
          courseComplete: true,
          totalLessonsKnown: manifest.lessons.length,
        });
      });

      if (firstThreeCheckpoint) {
        await saveJson(join(outputDir, "first-three-actionable-knowledge.json"), firstThreeCheckpoint);
      }
      await saveJson(join(outputDir, "progress.json"), finalCheckpoint);
      await saveJson(join(outputDir, "course-complete-actionable-knowledge.json"), finalCheckpoint);

      return finalCheckpoint;
    },
  );
}
