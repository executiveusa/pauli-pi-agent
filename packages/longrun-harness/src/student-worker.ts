import type { CourseLesson, HomeworkPacket, KnowledgeUnit } from "./types.js";

export interface StudyLessonInput {
  missionId: string;
  courseId: string;
  moduleId: string;
  lesson: CourseLesson;
  workerId: string;
  attempt: number;
}

export interface StudentWorker {
  studyLesson(input: StudyLessonInput): Promise<HomeworkPacket>;
}

const normalizeTopic = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const createKnowledgeUnits = (input: StudyLessonInput): KnowledgeUnit[] => {
  const topic = normalizeTopic(input.lesson.title);
  const sourceLocation = `${input.moduleId}/${input.lesson.id}`;
  const evidence = input.lesson.sourceText;

  return [
    {
      id: `${input.lesson.id}-concept`,
      type: "concept",
      title: input.lesson.title,
      summary: `The lesson's central concept is ${input.lesson.title.toLowerCase()}.`,
      evidence,
      sourceLocation,
      confidence: 0.95,
      relatedTopics: [topic, "digital-student"],
    },
    {
      id: `${input.lesson.id}-claim`,
      type: "claim",
      title: `Why ${input.lesson.title} matters`,
      summary: input.lesson.sourceText,
      evidence,
      sourceLocation,
      confidence: 0.93,
      relatedTopics: [topic, "evidence-backed-learning"],
    },
    {
      id: `${input.lesson.id}-procedure`,
      type: "procedure",
      title: `Apply ${input.lesson.title}`,
      summary: `Use the lesson as a bounded step with explicit inputs, evidence, and completion criteria.`,
      evidence,
      sourceLocation,
      confidence: 0.86,
      relatedTopics: [topic, "workflow"],
    },
    {
      id: `${input.lesson.id}-application`,
      type: "application",
      title: `${input.lesson.title} in the Digital Student harness`,
      summary: `Apply this lesson when processing authorized educational material into the ICM second brain.`,
      evidence,
      sourceLocation,
      confidence: 0.84,
      relatedTopics: [topic, "second-brain"],
    },
    {
      id: `${input.lesson.id}-question`,
      type: "question",
      title: `Verification question for ${input.lesson.title}`,
      summary: `What evidence would prove this lesson was applied correctly in a real course run?`,
      evidence,
      sourceLocation,
      confidence: 0.78,
      relatedTopics: [topic, "verification"],
    },
  ];
};

export class MockStudentWorker implements StudentWorker {
  readonly #failFirstAttemptLessonIds: ReadonlySet<string>;

  constructor(failFirstAttemptLessonIds: Iterable<string> = []) {
    this.#failFirstAttemptLessonIds = new Set(failFirstAttemptLessonIds);
  }

  async studyLesson(input: StudyLessonInput): Promise<HomeworkPacket> {
    if (input.attempt === 1 && this.#failFirstAttemptLessonIds.has(input.lesson.id)) {
      throw new Error(`Injected first-attempt failure for ${input.lesson.id}`);
    }

    const knowledgeUnits = createKnowledgeUnits(input);

    return {
      missionId: input.missionId,
      courseId: input.courseId,
      moduleId: input.moduleId,
      lessonId: input.lesson.id,
      studentWorkerId: input.workerId,
      attempt: input.attempt,
      completedAt: new Date().toISOString(),
      coverage: {
        textReviewed: true,
        transcriptReviewed: input.lesson.transcriptAvailable,
        visualSegmentsReviewed: false,
        fullAudiovisualReview: false,
      },
      conciseSummary: input.lesson.sourceText,
      detailedSummary: `${input.lesson.title}: ${input.lesson.sourceText}`,
      knowledgeUnits,
      actionItems: [`Add ${input.lesson.title.toLowerCase()} to the Digital Student operating workflow.`],
      unresolvedQuestions: [`How should ${input.lesson.title.toLowerCase()} be validated against a live authorized course?`],
      knownLimitations: [
        input.lesson.kind === "text"
          ? "This mock lesson contains text only."
          : "The mock run uses supplied lesson text rather than real audiovisual inspection.",
      ],
      acceptanceCriteriaPassed: knowledgeUnits.length >= 5 && knowledgeUnits.every((unit) => unit.evidence.length > 0),
    };
  }
}
