import { resolve } from "node:path";

import { CourseOrchestrator } from "../course-orchestrator.js";
import { writeCourseRunToIcm } from "../icm-writer.js";
import { createMockCourseManifest } from "../mock-course.js";
import { MockStudentWorker } from "../student-worker.js";

const outputRoot = resolve(process.cwd(), "../../icm/runs");
const manifest = createMockCourseManifest();
const worker = new MockStudentWorker(["lesson-02"]);
const orchestrator = new CourseOrchestrator(worker);

const result = await orchestrator.run(manifest, {
  missionId: "mock-digital-student-course",
  workerCount: 2,
  maxAttemptsPerLesson: 2,
});

const outputDirectory = await writeCourseRunToIcm(outputRoot, result);

console.log(
  JSON.stringify(
    {
      missionId: result.missionId,
      lessonsCompleted: result.homeworkPackets.length,
      modulesSynthesized: result.moduleSyntheses.length,
      candidateMemoryEntries: result.candidateMemory.length,
      retriedLessons: result.jobs
        .filter((job) => job.attemptCount > 1)
        .map((job) => ({ lessonId: job.lessonId, attempts: job.attemptCount })),
      outputDirectory,
    },
    null,
    2,
  ),
);
