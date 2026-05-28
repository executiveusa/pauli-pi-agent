import type { TaskClassification } from "./types.js";
import { MythosDepth } from "./types.js";

export class TaskClassifier {
	private taskPatterns = new Map<string, RegExp[]>([
		["simple_fact", [/^what is|^who is|^where is|^when was|^how many/i]],
		["calculation", [/\b(?:calculate|compute|add|subtract|multiply|divide|sum)\b/i]],
		["code_generation", [/\b(?:write|generate|create|build|implement).*\b(?:code|function|script|program|class|algorithm|solution|method)\b/i]],
		["debugging", [/\b(?:fix|debug|troubleshoot|error|bug|issue)\b/i]],
		["analysis", [/\b(?:analyze|analyze|explain|why|how does|what causes)\b/i]],
		["design", [/\b(?:design|architect|plan|structure|organize)\b/i]],
		["optimization", [/\b(?:optimize|improve|speed up|make faster|reduce|efficient)\b/i]],
		["creative", [/\b(?:create|imagine|brainstorm|invent|generate idea)\b/i]],
	]);

	classifyTask(query: string): TaskClassification {
		const lowerQuery = query.toLowerCase();
		const queryLength = query.length;
		const wordCount = query.split(/\s+/).length;

		// Detect task type from patterns
		let detectedTaskType = "general";
		let confidence = 0.5;

		for (const [taskType, patterns] of this.taskPatterns) {
			if (patterns.some((pattern) => pattern.test(query))) {
				detectedTaskType = taskType;
				confidence = 0.85; // High confidence for pattern match
				break;
			}
		}

		// Calculate complexity based on query characteristics
		const complexity = this.calculateComplexity(query, detectedTaskType);

		// Determine if reasoning is required
		const requiresReasoning = this.requiresReasoning(detectedTaskType, complexity);

		// Suggest appropriate depth
		const suggestedDepth = this.suggestDepth(detectedTaskType, complexity);

		return {
			taskType: detectedTaskType,
			complexity,
			requiresReasoning,
			suggestedDepth,
			confidence,
			rationale: this.generateRationale(detectedTaskType, complexity, requiresReasoning),
		};
	}

	private calculateComplexity(query: string, taskType: string): number {
		let score = 0.3; // base

		// Word count indicators
		const wordCount = query.split(/\s+/).length;
		if (wordCount > 30) score += 0.2;
		if (wordCount > 50) score += 0.1;

		// Presence of qualifiers indicating complexity
		const complexityIndicators =
			/(complex|advanced|sophisticated|multi-step|recursive|nested|detailed|comprehensive)/i;
		if (complexityIndicators.test(query)) score += 0.2;

		// Task-type complexity baseline
		const baselineComplexity: Record<string, number> = {
			simple_fact: 0.2,
			calculation: 0.3,
			code_generation: 0.6,
			debugging: 0.7,
			analysis: 0.5,
			design: 0.8,
			optimization: 0.7,
			creative: 0.6,
			general: 0.5,
		};

		score = Math.max(score, baselineComplexity[taskType] || 0.5);

		// Special patterns increasing complexity
		if (/\brecursive\b|\bloop\b|\bdependent\b|\bcondition\b/i.test(query)) score += 0.15;
		if (/\berror\b|\bfail\b|\bedge case\b/i.test(query)) score += 0.1;

		return Math.min(1, score);
	}

	private requiresReasoning(taskType: string, complexity: number): boolean {
		const reasoningTasks = ["design", "analysis", "debugging", "optimization", "code_generation"];
		if (reasoningTasks.includes(taskType)) return true;
		if (complexity > 0.6) return true;
		return false;
	}

	private suggestDepth(taskType: string, complexity: number): MythosDepth {
		// Map task types to depths
		const taskDepths: Record<string, MythosDepth> = {
			simple_fact: MythosDepth.INSTANT,
			calculation: MythosDepth.FAST,
			code_generation: MythosDepth.NORMAL,
			debugging: MythosDepth.DEEP,
			analysis: MythosDepth.NORMAL,
			design: MythosDepth.DEEP,
			optimization: MythosDepth.DEEP,
			creative: MythosDepth.NORMAL,
			general: MythosDepth.NORMAL,
		};

		let depth = taskDepths[taskType] || MythosDepth.NORMAL;

		// Adjust depth for complexity
		if (complexity > 0.8 && depth !== MythosDepth.MYTHIC) {
			// Escalate to one level higher
			const depthOrder = [
				MythosDepth.INSTANT,
				MythosDepth.FAST,
				MythosDepth.NORMAL,
				MythosDepth.DEEP,
				MythosDepth.MYTHIC,
			];
			const currentIndex = depthOrder.indexOf(depth);
			if (currentIndex < depthOrder.length - 1) {
				depth = depthOrder[currentIndex + 1];
			}
		}

		return depth;
	}

	private generateRationale(
		taskType: string,
		complexity: number,
		requiresReasoning: boolean
	): string {
		const parts: string[] = [];

		parts.push(`Task type detected: ${taskType}`);
		parts.push(`Complexity score: ${(complexity * 100).toFixed(0)}%`);

		if (requiresReasoning) {
			parts.push("This task requires extended reasoning");
		} else {
			parts.push("This task can be handled with standard processing");
		}

		return parts.join(". ");
	}
}
