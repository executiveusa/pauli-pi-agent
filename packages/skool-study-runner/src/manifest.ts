import type { CourseManifest, CourseManifestLesson, LessonSnapshot } from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} must be a non-empty string`);
  }
  return value;
}

function readPositiveInteger(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error(`${key} must be a positive integer`);
  }
  return value;
}

function readOptionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new Error(`${key} must be a string when provided`);
  return value;
}

function parseManifestLesson(value: unknown): CourseManifestLesson {
  if (!isRecord(value)) throw new Error("Manifest lesson must be an object");
  return {
    lessonIndex: readPositiveInteger(value, "lessonIndex"),
    lessonTitle: readString(value, "lessonTitle"),
    moduleTitle: readOptionalString(value, "moduleTitle"),
    url: readString(value, "url"),
  };
}

export function parseCourseManifest(value: unknown): CourseManifest {
  if (!isRecord(value)) throw new Error("Course manifest must be an object");
  if (value.schemaVersion !== "1.0") throw new Error("Course manifest schemaVersion must be 1.0");
  if (!Array.isArray(value.lessons) || value.lessons.length === 0) {
    throw new Error("Course manifest must contain at least one lesson");
  }

  const lessons = value.lessons.map(parseManifestLesson).sort((a, b) => a.lessonIndex - b.lessonIndex);
  const seen = new Set<number>();
  for (const lesson of lessons) {
    if (seen.has(lesson.lessonIndex)) throw new Error(`Duplicate lessonIndex ${lesson.lessonIndex} in manifest`);
    seen.add(lesson.lessonIndex);
  }

  return {
    schemaVersion: "1.0",
    courseId: readString(value, "courseId"),
    courseTitle: readString(value, "courseTitle"),
    classroomUrl: readString(value, "classroomUrl"),
    capturedAt: readString(value, "capturedAt"),
    lessons,
  };
}

export function parseLessonSnapshot(value: unknown): LessonSnapshot {
  if (!isRecord(value)) throw new Error("Lesson snapshot must be an object");

  const notesValue = value.notes;
  const notes = notesValue === undefined
    ? undefined
    : Array.isArray(notesValue) && notesValue.every((item) => typeof item === "string")
      ? notesValue
      : (() => {
          throw new Error("notes must be a string array when provided");
        })();

  const transcriptValue = value.transcript;
  if (transcriptValue !== undefined && typeof transcriptValue !== "string") {
    throw new Error("transcript must be a string when provided");
  }

  const courseCompleteValue = value.courseComplete;
  if (courseCompleteValue !== undefined && typeof courseCompleteValue !== "boolean") {
    throw new Error("courseComplete must be a boolean when provided");
  }

  return {
    courseId: readString(value, "courseId"),
    courseTitle: readString(value, "courseTitle"),
    moduleTitle: readOptionalString(value, "moduleTitle"),
    lessonIndex: readPositiveInteger(value, "lessonIndex"),
    lessonTitle: readString(value, "lessonTitle"),
    url: readString(value, "url"),
    capturedAt: readString(value, "capturedAt"),
    text: readString(value, "text"),
    transcript: transcriptValue,
    notes,
    courseComplete: courseCompleteValue,
  };
}

export function validateSnapshotForManifest(
  snapshot: LessonSnapshot,
  manifest: CourseManifest,
  expectedLesson: CourseManifestLesson,
): LessonSnapshot {
  if (snapshot.courseId !== manifest.courseId) {
    throw new Error(`Snapshot courseId ${snapshot.courseId} does not match manifest ${manifest.courseId}`);
  }
  if (snapshot.lessonIndex !== expectedLesson.lessonIndex) {
    throw new Error(
      `Snapshot lessonIndex ${snapshot.lessonIndex} does not match expected ${expectedLesson.lessonIndex}`,
    );
  }
  return snapshot;
}
