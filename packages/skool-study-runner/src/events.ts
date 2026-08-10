export const DIGITAL_STUDENT_TASK = "digital-student-course:v1";

export function padLessonIndex(index: number): string {
  return String(index).padStart(3, "0");
}

export function manifestEventName(courseId: string): string {
  return `course.manifest:${courseId}:v1`;
}

export function lessonEventName(courseId: string, lessonIndex: number): string {
  return `lesson.ready:${courseId}:${padLessonIndex(lessonIndex)}:v1`;
}

export function courseTaskIdempotencyKey(courseId: string): string {
  return `digital-student:${courseId}:v1`;
}
