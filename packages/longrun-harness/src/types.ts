export type LessonKind = "text" | "video" | "video-and-text";

export type LessonJobStatus =
  | "queued"
  | "running"
  | "retry_scheduled"
  | "completed"
  | "failed";

export interface CourseLesson {
  id: string;
  title: string;
  order: number;
  kind: LessonKind;
  durationMinutes: number;
  transcriptAvailable: boolean;
  prerequisites: string[];
  sourceText: string;
}

export interface CourseModule {
  id: string;
  title: string;
  order: number;
  lessons: CourseLesson[];
}

export interface CourseManifest {
  id: string;
  title: string;
  subject: string;
  source: string;
  accessMode: "mock" | "public" | "authenticated-read-only" | "owner-authorized";
  objective: string;
  modules: CourseModule[];
}

export type KnowledgeUnitType =
  | "concept"
  | "claim"
  | "procedure"
  | "framework"
  | "example"
  | "warning"
  | "question"
  | "application";

export interface KnowledgeUnit {
  id: string;
  type: KnowledgeUnitType;
  title: string;
  summary: string;
  evidence: string;
  sourceLocation: string;
  confidence: number;
  relatedTopics: string[];
}

export interface HomeworkPacket {
  missionId: string;
  courseId: string;
  moduleId: string;
  lessonId: string;
  studentWorkerId: string;
  attempt: number;
  completedAt: string;
  coverage: {
    textReviewed: boolean;
    transcriptReviewed: boolean;
    visualSegmentsReviewed: boolean;
    fullAudiovisualReview: boolean;
  };
  conciseSummary: string;
  detailedSummary: string;
  knowledgeUnits: KnowledgeUnit[];
  actionItems: string[];
  unresolvedQuestions: string[];
  knownLimitations: string[];
  acceptanceCriteriaPassed: boolean;
}

export interface LessonJob {
  id: string;
  missionId: string;
  courseId: string;
  moduleId: string;
  lessonId: string;
  status: LessonJobStatus;
  attemptCount: number;
  maxAttempts: number;
  assignedWorkerId?: string;
  lastError?: string;
}

export interface ModuleSynthesis {
  moduleId: string;
  title: string;
  lessonIds: string[];
  summary: string;
  concepts: string[];
  actionItems: string[];
  unresolvedQuestions: string[];
}

export interface CourseSynthesis {
  courseId: string;
  title: string;
  moduleIds: string[];
  thesis: string;
  coreConcepts: string[];
  prioritizedActions: string[];
  unresolvedQuestions: string[];
  completionStatement: string;
}

export interface CandidateMemoryEntry {
  id: string;
  subject: string;
  topic: string;
  title: string;
  summary: string;
  sourceCourseId: string;
  sourceLessonIds: string[];
  confidence: number;
  approvalStatus: "candidate";
}

export interface HarnessEvent {
  sequence: number;
  type:
    | "mission_started"
    | "lesson_started"
    | "lesson_failed"
    | "lesson_retry_scheduled"
    | "lesson_completed"
    | "module_synthesized"
    | "course_synthesized"
    | "memory_candidate_created"
    | "mission_completed";
  missionId: string;
  lessonId?: string;
  moduleId?: string;
  workerId?: string;
  attempt?: number;
  detail?: string;
}

export interface CourseRunResult {
  missionId: string;
  manifest: CourseManifest;
  jobs: LessonJob[];
  homeworkPackets: HomeworkPacket[];
  moduleSyntheses: ModuleSynthesis[];
  courseSynthesis: CourseSynthesis;
  candidateMemory: CandidateMemoryEntry[];
  events: HarnessEvent[];
}
