import type { PersonaRoutingDecision, GoalPacket } from "./types.js";
import { MythosDepth } from "./types.js";

export interface PersonaDefinition {
	name: string;
	applicableDepths: MythosDepth[];
	systemPrompt: string;
	temperature: number;
	specialties: string[];
}

export class PersonaRouter {
	private personaRegistry = new Map<string, PersonaDefinition>([
		[
			"analyst",
			{
				name: "analyst",
				applicableDepths: [MythosDepth.DEEP, MythosDepth.MYTHIC],
				systemPrompt: "You are a detailed analyst. Provide thorough analysis with evidence.",
				temperature: 0.3,
				specialties: ["analysis", "debugging", "design"],
			},
		],
		[
			"researcher",
			{
				name: "researcher",
				applicableDepths: [MythosDepth.DEEP, MythosDepth.MYTHIC],
				systemPrompt: "You are a research specialist. Explore topics comprehensively.",
				temperature: 0.5,
				specialties: ["research", "exploration", "learning"],
			},
		],
		[
			"engineer",
			{
				name: "engineer",
				applicableDepths: [MythosDepth.DEEP, MythosDepth.MYTHIC],
				systemPrompt: "You are a software engineer. Focus on practical implementations.",
				temperature: 0.2,
				specialties: ["code_generation", "optimization", "debugging"],
			},
		],
		[
			"philosopher",
			{
				name: "philosopher",
				applicableDepths: [MythosDepth.MYTHIC],
				systemPrompt: "You are a philosopher. Consider deeper implications and meanings.",
				temperature: 0.7,
				specialties: ["creative", "analysis", "conceptual"],
			},
		],
		[
			"default",
			{
				name: "default",
				applicableDepths: [
					MythosDepth.INSTANT,
					MythosDepth.FAST,
					MythosDepth.NORMAL,
				],
				systemPrompt: "You are a helpful AI assistant.",
				temperature: 0.5,
				specialties: ["general"],
			},
		],
	]);

	route(goalPacket: GoalPacket, depth: MythosDepth): PersonaRoutingDecision {
		// If persona explicitly set, validate and use it
		if (goalPacket.persona) {
			const persona = this.personaRegistry.get(goalPacket.persona);
			if (persona && persona.applicableDepths.includes(depth)) {
				return {
					recommendedPersona: goalPacket.persona,
					applicableDepths: persona.applicableDepths,
					shouldRoute: true,
					confidence: 0.95,
				};
			}

			// Requested persona not applicable, use default
			return {
				recommendedPersona: "default",
				applicableDepths: this.personaRegistry.get("default")!.applicableDepths,
				shouldRoute: false,
				confidence: 0.6,
			};
		}

		// Auto-route based on task type and depth
		const recommendedPersona = this.recommendPersona(goalPacket.taskType, depth);
		const persona = this.personaRegistry.get(recommendedPersona);

		if (!persona) {
			return {
				recommendedPersona: "default",
				applicableDepths: this.personaRegistry.get("default")!.applicableDepths,
				shouldRoute: false,
				confidence: 0.5,
			};
		}

		return {
			recommendedPersona,
			applicableDepths: persona.applicableDepths,
			shouldRoute: depth === MythosDepth.DEEP || depth === MythosDepth.MYTHIC,
			confidence: 0.8,
		};
	}

	private recommendPersona(taskType: string, depth: MythosDepth): string {
		// Only route for deep/mythic tasks
		if (depth !== MythosDepth.DEEP && depth !== MythosDepth.MYTHIC) {
			return "default";
		}

		// Match task type to persona specialties
		const taskToPersona: Record<string, string> = {
			debugging: "engineer",
			code_generation: "engineer",
			optimization: "engineer",
			analysis: "analyst",
			design: "analyst",
			creative: "philosopher",
			research: "researcher",
		};

		return taskToPersona[taskType] || "default";
	}

	getPersona(personaName: string): PersonaDefinition | undefined {
		return this.personaRegistry.get(personaName);
	}

	registerPersona(persona: PersonaDefinition): void {
		this.personaRegistry.set(persona.name, persona);
	}

	getAvailablePersonas(): PersonaDefinition[] {
		return Array.from(this.personaRegistry.values());
	}

	getPersonasForDepth(depth: MythosDepth): PersonaDefinition[] {
		return Array.from(this.personaRegistry.values()).filter((p) =>
			p.applicableDepths.includes(depth)
		);
	}
}
