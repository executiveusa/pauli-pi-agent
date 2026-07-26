import { randomUUID } from "node:crypto";

import type {
  CandidateMemoryEntry,
  CourseLesson,
  CourseManifest,
  CourseRunResult,
  CourseSynthesis,
  HarnessEvent,
  HomeworkPacket,
  LessonJob,
  ModuleSynthesis,
} from "./types.js";
import type { StudentWorker } from "./student-worker.js";

export interface RunCourseOptions {
  workerCount?: number;
  maxAttemptsPerLesson?: number;
  missionId?: string;
}

interface LessonLocation {
  moduleId: string;
  lesson: CourseLesson;
}

const getLessonLocations = (manifest: CourseManifest): Map<string, LessonLocation> => {
  const locations = new Map<string, LessonLocation>();

  for (const module of manifest.modules) {
    for (const lesson of module.lessons) {
      if (locations.has(lesson.id)) {
        throw new Error(`Duplicate lesson id: ${lesson.id}`);
      }
      locations.set(lesson.id, { moduleId: module.id, lesson });
    }
  }

  return locations;
};

const validateManifest = (manifest: CourseManifest, locations: ReadonlyMap<string, LessonLocation>): void => {
  for (const { lesson } of locations.values()) {
    for (const prerequisiteId of lesson.prerequisites) {
      if (!locations.has(prerequisiteId)) {
        throw new Error(`Lesson ${lesson.id} references missing prerequisite ${prerequisiteId}`);
      }
    }
  }
};

const synthesizeModule = (
  manifest: CourseManifest,
  moduleId: string,
  packets: readonly HomeworkPacket[],
): ModuleSynthesis => {
  const module = manifest.modules.find((candidate) => candidate.id === moduleId);
  if (!module) {
    throw new Error(`Unknown module ${moduleId}`);
  }

  const modulePackets = packets.filter((packet) => packet.moduleId === moduleId);
  const expectedLessonIds = module.lessons.map((lesson) => lesson.id);
  const completedLessonIds = new Set(modulePackets.map((packet) => packet.lessonId));

  if (expectedLessonIds.some((lessonId) => !completedLessonIds.has(lessonId))) {
    throw new Error(`Module ${moduleId} cannot be synthesized before every lesson is complete`);
  }

  return {
    moduleId,
    title: module.title,
    lessonIds: expectedLessonIds,
    summary: modulePackets.map((packet) => packet.conciseSummary).join(" "),
    concepts: [...new Set(modulePackets.flatMap((packet) => packet.knowledgeUnits.map((unit) => unit.title)))],
    actionItems: [...new Set(modulePackets.flatMap((packet) => packet.actionItems))],
    unresolvedQuestions: [...new Set(modulePackets.flatMap((packet) => packet.unresolvedQuestions))],
  };
};

const synthesizeCourse = (manifest: CourseManifest, modules: readonly ModuleSynthesis[]): CourseSynthesis => {
  if (modules.length !== manifest.modules.length) {
    throw new Error("Course cannot be synthesized before every module is complete");
  }

  const expectedModuleIds = manifest.modules.map((module) => module.id);
  const completedModuleIds = new Set(modules.map((module) => module.moduleId));
  if (expectedModuleIds.some((moduleId) => !completedModuleIds.has(moduleId))) {
    throw new Error("Course synthesis is missing one or more modules");
  }

  return {
    courseId: manifest.id,
    title: manifest.title,
    moduleIds: expectedModuleIds,
    thesis: `${manifest.title} teaches a controlled path from evidence collection to verified second-brain knowledge.`,
    coreConcepts: [...new Set(modules.flatMap((module) => module.concepts))],
    prioritizedActions: [...new Set(modules.flatMap((module) => module.actionItems))],
    unresolvedQuestions: [...new Set(modules.flatMap((module) => module.unresolvedQuestions))],
    completionStatement: `${modules.length} modules and ${manifest.modules.flatMap((module) => module.lessons).length} lessons completed.`,
  };
};

const createCandidateMemory = (
  manifest: CourseManifest,
  packets: readonly HomeworkPacket[],
): CandidateMemoryEntry[] => {
  const candidates = new Map<string, CandidateMemoryEntry>();

  for (const packet of packets) {
    for (const unit of packet.knowledgeUnits) {
      if (unit.type !== "concept" && unit.type !== "procedure" && unit.type !== "application") {
        continue;
      }

      const key = `${unit.type}:${unit.title.toLowerCase()}`;
      const existing = candidates.get(key);
      if (existing) {
        if (!existing.sourceLessonIds.includes(packet.lessonId)) {
          existing.sourceLessonIds.push(packet.lessonId);
        }
        existing.confidence = Math.max(existing.confidence, unit.confidence);
        continue;
      }

      candidates.set(key, {
        id: `candidate-${unit.id}`,
        subject: manifest.subject,
        topic: unit.relatedTopics[0] ?? manifest.subject,
        title: unit.title,
        summary: unit.summary,
        sourceCourseId: manifest.id,
        sourceLessonIds: [packet.lessonId],
        confidence: unit.confidence,
        approvalStatus: "candidate",
      });
    }
  }

  return [...candidates.values()];
};

export class CourseOrchestrator {
  readonly #studentWorker: StudentWorker;

  constructor(studentWorker: StudentWorker) {
    this.#studentWorker = studentWorker;
  }

  async run(manifest: CourseManifest, options: RunCourseOptions = {}): Promise<CourseRunResult> {
    const workerCount = options.workerCount ?? 2;
    const maxAttemptsPerLesson = options.maxAttemptsPerLesson ?? 2;
    const missionId = options.missionId ?? randomUUID();

    if (!Number.isInteger(workerCount) || workerCount < 1) {
      throw new Error("workerCount must be a positive integer");
    }
    if (!Number.isInteger(maxAttemptsPerLesson) || maxAttemptsPerLesson < 1) {
      throw new Error("maxAttemptsPerLesson must be a positive integer");
    }

    const lessonLocations = getLessonLocations(manifest);
    validateManifest(manifest, lessonLocations);

    const jobs: LessonJob[] = [...lessonLocations.entries()].map(([lessonId, location]) => ({
      id: `job-${lessonId}`,
      missionId,
      courseId: manifest.id,
      moduleId: location.moduleId,
      lessonId,
      status: "queued",
      attemptCount: 0,
      maxAttempts: maxAttemptsPerLesson,
    }));

    const events: HarnessEvent[] = [];
    const homeworkPackets: HomeworkPacket[] = [];
    let sequence = 0;
    const appendEvent = (event: Omit<HarnessEvent, "sequence" | "missionId">): void => {
      sequence += 1;
      events.push({ sequence, missionId, ...event });
    };

    appendEvent({ type: "mission_started", detail: manifest.title });

    while (jobs.some((job) => job.status !== "completed" && job.status !== "failed")) {
      const completedLessonIds = new Set(homeworkPackets.map((packet) => packet.lessonId));
      const readyJobs = jobs
        .filter((job) => job.status === "queued" || job.status === "retry_scheduled")
        .filter((job) => {
          const location = lessonLocations.get(job.lessonId);
          if (!location) {
            throw new Error(`Missing lesson location for ${job.lessonId}`);
          }
          return location.lesson.prerequisites.every((id) => completedLessonIds.has(id));
        })
        .slice(0, workerCount);

      if (readyJobs.length === 0) {
        const failedJobs = jobs.filter((job) => job.status === "failed");
        if (failedJobs.length > 0) {
          throw new Error(`Course blocked by failed lessons: ${failedJobs.map((job) => job.lessonId).join(", ")}`);
        }
        throw new Error("Course dependency graph is deadlocked");
      }

      await Promise.all(
        readyJobs.map(async (job, workerIndex) => {
          const location = lessonLocations.get(job.lessonId);
          if (!location) {
            throw new Error(`Missing lesson location for ${job.lessonId}`);
          }

          job.status = "running";
          job.attemptCount += 1;
          job.assignedWorkerId = `student-${workerIndex + 1}`;
          appendEvent({
            type: "lesson_started",
            lessonId: job.lessonId,
            moduleId: job.moduleId,
            workerId: job.assignedWorkerId,
            attempt: job.attemptCount,
          });

          try {
            const packet = await this.#studentWorker.studyLesson({
              missionId,
              courseId: manifest.id,
              moduleId: job.moduleId,
              lesson: location.lesson,
              workerId: job.assignedWorkerId,
              attempt: job.attemptCount,
            });

            if (!packet.acceptanceCriteriaPassed) {
              throw new Error(`Homework acceptance criteria failed for ${job.lessonId}`);
            }

            if (homeworkPackets.some((existing) => existing.lessonId === packet.lessonId)) {
              throw new Error(`Duplicate homework packet for ${packet.lessonId}`);
            }

            homeworkPackets.push(packet);
            job.status = "completed";
            job.lastError = undefined;
            appendEvent({
              type: "lesson_completed",
              lessonId: job.lessonId,
              moduleId: job.moduleId,
              workerId: job.assignedWorkerId,
              attempt: job.attemptCount,
            });
          } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            job.lastError = detail;
            appendEvent({
              type: "lesson_failed",
              lessonId: job.lessonId,
              moduleId: job.moduleId,
              workerId: job.assignedWorkerId,
              attempt: job.attemptCount,
              detail,
            });

            if (job.attemptCount < job.maxAttempts) {
              job.status = "retry_scheduled";
              appendEvent({
                type: "lesson_retry_scheduled",
                lessonId: job.lessonId,
                moduleId: job.moduleId,
                attempt: job.attemptCount + 1,
              });
            } else {
              job.status = "failed";
            }
          }
        }),
      );
    }

    const failedJobs = jobs.filter((job) => job.status === "failed");
    if (failedJobs.length > 0) {
      throw new Error(`Course failed: ${failedJobs.map((job) => job.lessonId).join(", ")}`);
    }

    const moduleSyntheses = manifest.modules.map((module) => {
      const synthesis = synthesizeModule(manifest, module.id, homeworkPackets);
      appendEvent({ type: "module_synthesized", moduleId: module.id, detail: module.title });
      return synthesis;
    });

    const courseSynthesis = synthesizeCourse(manifest, moduleSyntheses);
    appendEvent({ type: "course_synthesized", detail: manifest.title });

    const candidateMemory = createCandidateMemory(manifest, homeworkPackets);
    for (const candidate of candidateMemory) {
      appendEvent({ type: "memory_candidate_created", detail: candidate.id });
    }

    appendEvent({ type: "mission_completed", detail: courseSynthesis.completionStatement });

    return {
      missionId,
      manifest,
      jobs,
      homeworkPackets,
      moduleSyntheses,
      courseSynthesis,
      candidateMemory,
      events,
    };
  }
}
