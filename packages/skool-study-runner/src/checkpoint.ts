import type { CourseCheckpoint, KnowledgeUnit, LessonResult } from "./types.js";

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

export function buildCheckpoint(params: {
  courseId: string;
  courseTitle: string;
  lessons: LessonResult[];
  checkpointType: CourseCheckpoint["checkpointType"];
  courseComplete: boolean;
  totalLessonsKnown?: number | null;
}): CourseCheckpoint {
  const knowledge = params.lessons.flatMap((lesson) => lesson.knowledgeUnits);
  const byType = (type: KnowledgeUnit["type"]) => knowledge.filter((unit) => unit.type === type);

  return {
    schemaVersion: "1.0",
    courseId: params.courseId,
    courseTitle: params.courseTitle,
    checkpointType: params.checkpointType,
    lessonsCompleted: params.lessons.length,
    totalLessonsKnown: params.totalLessonsKnown ?? null,
    generatedAt: new Date().toISOString(),
    lessons: params.lessons,
    consolidatedKnowledge: knowledge,
    agentPlaybook: {
      objectives: unique(knowledge.map((unit) => unit.agentUse[0] ?? "")),
      workflows: unique(byType("procedure").map((unit) => unit.actionableKnowledge)),
      toolRules: unique(byType("tool").map((unit) => unit.actionableKnowledge)),
      decisionRules: unique(byType("decision-rule").map((unit) => unit.actionableKnowledge)),
      guardrails: unique(knowledge.flatMap((unit) => unit.failureModes)),
      nextActions: unique(params.lessons.flatMap((lesson) => lesson.actions)),
    },
    runState: {
      continueProcessing: !params.courseComplete,
      courseComplete: params.courseComplete,
      nextExpectedLessonIndex: params.lessons.length + 1,
    },
  };
}
