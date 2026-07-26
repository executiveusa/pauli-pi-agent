import type { CourseManifest } from "./types.js";

export const createMockCourseManifest = (): CourseManifest => ({
  id: "course-digital-student-foundations",
  title: "Digital Student Foundations",
  subject: "agentic-learning",
  source: "mock://digital-student-foundations",
  accessMode: "mock",
  objective: "Learn how to collect, verify, organize, and apply educational material with evidence.",
  modules: [
    {
      id: "module-01",
      title: "Reliable Learning Inputs",
      order: 1,
      lessons: [
        {
          id: "lesson-01",
          title: "Define the Learning Objective",
          order: 1,
          kind: "text",
          durationMinutes: 8,
          transcriptAvailable: false,
          prerequisites: [],
          sourceText:
            "A learning mission begins with a measurable objective. The objective determines source scope, completion criteria, and the evidence required before conclusions are accepted.",
        },
        {
          id: "lesson-02",
          title: "Capture Source Evidence",
          order: 2,
          kind: "video-and-text",
          durationMinutes: 14,
          transcriptAvailable: true,
          prerequisites: [],
          sourceText:
            "Evidence must retain the source title, location, timestamp when relevant, capture time, and confidence. Inferences must be labeled separately from statements made by the source.",
        },
        {
          id: "lesson-03",
          title: "Separate Collection from Interpretation",
          order: 3,
          kind: "text",
          durationMinutes: 10,
          transcriptAvailable: false,
          prerequisites: ["lesson-01", "lesson-02"],
          sourceText:
            "Collection should preserve source material accurately. Interpretation should happen in a separate stage so failed analysis does not require repeating browser access or source acquisition.",
        },
      ],
    },
    {
      id: "module-02",
      title: "From Lessons to Durable Knowledge",
      order: 2,
      lessons: [
        {
          id: "lesson-04",
          title: "Produce Standard Homework Packets",
          order: 1,
          kind: "video",
          durationMinutes: 17,
          transcriptAvailable: true,
          prerequisites: ["lesson-03"],
          sourceText:
            "Each lesson worker should return the same structured packet: coverage, summaries, knowledge units, evidence, actions, unresolved questions, limitations, and a clear acceptance result.",
        },
        {
          id: "lesson-05",
          title: "Synthesize Hierarchically",
          order: 2,
          kind: "text",
          durationMinutes: 12,
          transcriptAvailable: false,
          prerequisites: ["lesson-03"],
          sourceText:
            "Lesson outputs should be reduced into module syntheses before course-level synthesis. Hierarchical reduction prevents the final model from receiving every raw transcript at once.",
        },
        {
          id: "lesson-06",
          title: "File Knowledge by Meaning",
          order: 3,
          kind: "video-and-text",
          durationMinutes: 19,
          transcriptAvailable: true,
          prerequisites: ["lesson-04", "lesson-05"],
          sourceText:
            "Source material remains organized by course, module, and lesson. Durable knowledge is organized separately by subject, topic, and knowledge type. Link to sources rather than duplicating entire transcripts.",
        },
      ],
    },
  ],
});
