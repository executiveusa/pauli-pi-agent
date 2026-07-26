import assert from "node:assert/strict";
import { access, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { CourseOrchestrator } from "../src/course-orchestrator.js";
import { writeCourseRunToIcm } from "../src/icm-writer.js";
import { createMockCourseManifest } from "../src/mock-course.js";
import { MockStudentWorker } from "../src/student-worker.js";

test("fans out six lessons, retries one failure, and fans results into ICM artifacts", async () => {
  const manifest = createMockCourseManifest();
  const orchestrator = new CourseOrchestrator(new MockStudentWorker(["lesson-02"]));

  const result = await orchestrator.run(manifest, {
    missionId: "test-course-run",
    workerCount: 2,
    maxAttemptsPerLesson: 2,
  });

  assert.equal(result.homeworkPackets.length, 6);
  assert.equal(new Set(result.homeworkPackets.map((packet) => packet.lessonId)).size, 6);
  assert.equal(result.moduleSyntheses.length, 2);
  assert.equal(result.courseSynthesis.moduleIds.length, 2);
  assert.match(result.courseSynthesis.completionStatement, /6 lessons completed/);

  const firstCompletionSequence = result.events.find(
    (event) => event.type === "lesson_completed" || event.type === "lesson_failed",
  )?.sequence;
  assert.ok(firstCompletionSequence);
  const initialStarts = result.events.filter(
    (event) => event.type === "lesson_started" && event.sequence < firstCompletionSequence,
  );
  assert.deepEqual(
    initialStarts.map((event) => event.lessonId),
    ["lesson-01", "lesson-02"],
  );

  const retriedJob = result.jobs.find((job) => job.lessonId === "lesson-02");
  assert.ok(retriedJob);
  assert.equal(retriedJob.status, "completed");
  assert.equal(retriedJob.attemptCount, 2);

  const failureEvent = result.events.find(
    (event) => event.type === "lesson_failed" && event.lessonId === "lesson-02",
  );
  const retryEvent = result.events.find(
    (event) => event.type === "lesson_retry_scheduled" && event.lessonId === "lesson-02",
  );
  assert.ok(failureEvent);
  assert.ok(retryEvent);

  assert.ok(result.homeworkPackets.every((packet) => packet.knowledgeUnits.length >= 5));
  assert.ok(result.homeworkPackets.every((packet) => packet.acceptanceCriteriaPassed));
  assert.ok(result.candidateMemory.length > 0);
  assert.ok(result.candidateMemory.every((candidate) => candidate.approvalStatus === "candidate"));

  const outputRoot = await mkdtemp(join(tmpdir(), "pauli-course-run-"));
  const runDirectory = await writeCourseRunToIcm(outputRoot, result);

  await access(join(runDirectory, "course-manifest.json"));
  await access(join(runDirectory, "events.jsonl"));
  await access(join(runDirectory, "lessons", "lesson-02", "homework-packet.json"));
  await access(join(runDirectory, "modules", "module-01.md"));
  await access(join(runDirectory, "modules", "module-02.md"));
  await access(join(runDirectory, "course-synthesis.md"));
  await access(join(runDirectory, "candidate-memory", "candidate-memory.json"));
  await access(join(runDirectory, "candidate-memory", "REVIEW_REQUIRED.md"));

  const handoff = await readFile(join(runDirectory, "HANDOFF.md"), "utf8");
  assert.match(handoff, /Durable memory changed: No/);
  assert.match(handoff, /Human approval required: Yes/);
});

test("stops the course when a lesson exhausts its retry budget", async () => {
  const manifest = createMockCourseManifest();
  const orchestrator = new CourseOrchestrator(new MockStudentWorker(["lesson-02"]));

  await assert.rejects(
    orchestrator.run(manifest, {
      missionId: "test-course-failure",
      workerCount: 2,
      maxAttemptsPerLesson: 1,
    }),
    /Course blocked by failed lessons: lesson-02/,
  );
});
