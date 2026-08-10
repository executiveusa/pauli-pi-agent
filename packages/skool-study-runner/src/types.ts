export type EvidenceLabel = "SOURCE STATES" | "VISUALLY SHOWN" | "STUDENT INFERENCE" | "UNRESOLVED" | "ACTION PROPOSAL";

export interface CourseManifestLesson {
  lessonIndex: number;
  lessonTitle: string;
  moduleTitle?: string;
  url: string;
}

export interface CourseManifest {
  schemaVersion: "1.0";
  courseId: string;
  courseTitle: string;
  classroomUrl: string;
  capturedAt: string;
  lessons: CourseManifestLesson[];
}

export interface DurableCourseParams {
  courseId: string;
  courseTitle: string;
  classroomUrl: string;
}

export interface LessonSnapshot {
  courseId: string;
  courseTitle: string;
  moduleTitle?: string;
  lessonIndex: number;
  lessonTitle: string;
  url: string;
  capturedAt: string;
  text: string;
  transcript?: string;
  notes?: string[];
  courseComplete?: boolean;
}

export interface KnowledgeUnit {
  id: string;
  lessonIndex: number;
  lessonTitle: string;
  type: "concept" | "procedure" | "claim" | "example" | "tool" | "decision-rule";
  title: string;
  actionableKnowledge: string;
  evidenceLabel: EvidenceLabel;
  evidence: string;
  confidence: number;
  agentUse: string[];
  dependencies: string[];
  failureModes: string[];
}

export interface LessonProvenance {
  sourceHash: string;
  providerBaseUrl: string;
  model: string;
  promptVersion: string;
  generatedAt: string;
}

export interface LessonResult {
  lessonIndex: number;
  lessonTitle: string;
  sourceUrl: string;
  summary: string;
  knowledgeUnits: KnowledgeUnit[];
  actions: string[];
  openQuestions: string[];
  provenance: LessonProvenance;
}

export interface CourseCheckpoint {
  schemaVersion: "1.0";
  courseId: string;
  courseTitle: string;
  checkpointType: "first-three" | "progress" | "final";
  lessonsCompleted: number;
  totalLessonsKnown: number | null;
  generatedAt: string;
  lessons: LessonResult[];
  consolidatedKnowledge: KnowledgeUnit[];
  agentPlaybook: {
    objectives: string[];
    workflows: string[];
    toolRules: string[];
    decisionRules: string[];
    guardrails: string[];
    nextActions: string[];
  };
  runState: {
    continueProcessing: boolean;
    courseComplete: boolean;
    nextExpectedLessonIndex: number;
  };
}
