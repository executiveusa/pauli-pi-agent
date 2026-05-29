import type { LoopPhaseResult, LoopState } from "./types.js";
import { MythosLoopPhase } from "./types.js";

export interface PhaseHandler {
	(state: LoopState): Promise<LoopPhaseResult>;
}

export class LoopPhaseOrchestrator {
	private phaseHandlers = new Map<MythosLoopPhase, PhaseHandler>();
	private phaseDependencies = new Map<MythosLoopPhase, MythosLoopPhase[]>([
		[MythosLoopPhase.UNDERSTAND, []],
		[MythosLoopPhase.RETRIEVE, [MythosLoopPhase.UNDERSTAND]],
		[MythosLoopPhase.STRUCTURE, [MythosLoopPhase.RETRIEVE]],
		[MythosLoopPhase.ROUTE, [MythosLoopPhase.STRUCTURE]],
		[MythosLoopPhase.CRITIQUE, [MythosLoopPhase.ROUTE]],
		[MythosLoopPhase.SIMULATE, [MythosLoopPhase.CRITIQUE]],
		[MythosLoopPhase.DECIDE, [MythosLoopPhase.SIMULATE]],
		[MythosLoopPhase.VERIFY, [MythosLoopPhase.DECIDE]],
		[MythosLoopPhase.PACKAGE, [MythosLoopPhase.VERIFY]],
	]);

	registerPhaseHandler(phase: MythosLoopPhase, handler: PhaseHandler): void {
		this.phaseHandlers.set(phase, handler);
	}

	async executePhase(phase: MythosLoopPhase, state: LoopState): Promise<LoopPhaseResult> {
		const handler = this.phaseHandlers.get(phase);
		if (!handler) {
			return {
				phase,
				success: false,
				duration: 0,
				tokensUsed: 0,
				confidence: 0,
				output: {},
				errors: [`No handler registered for phase ${phase}`],
			};
		}

		const startTime = Date.now();
		try {
			const result = await handler(state);
			result.duration = Date.now() - startTime;
			return result;
		} catch (error) {
			return {
				phase,
				success: false,
				duration: Date.now() - startTime,
				tokensUsed: 0,
				confidence: 0,
				output: {},
				errors: [error instanceof Error ? error.message : String(error)],
			};
		}
	}

	getPhaseSequence(): MythosLoopPhase[] {
		return [
			MythosLoopPhase.UNDERSTAND,
			MythosLoopPhase.RETRIEVE,
			MythosLoopPhase.STRUCTURE,
			MythosLoopPhase.ROUTE,
			MythosLoopPhase.CRITIQUE,
			MythosLoopPhase.SIMULATE,
			MythosLoopPhase.DECIDE,
			MythosLoopPhase.VERIFY,
			MythosLoopPhase.PACKAGE,
		];
	}

	getDependencies(phase: MythosLoopPhase): MythosLoopPhase[] {
		return this.phaseDependencies.get(phase) || [];
	}

	validatePhaseOrder(phases: MythosLoopPhase[]): boolean {
		for (let i = 0; i < phases.length; i++) {
			const phase = phases[i];
			const dependencies = this.getDependencies(phase);

			// Check if all dependencies appear before this phase
			for (const dep of dependencies) {
				if (!phases.slice(0, i).includes(dep)) {
					return false;
				}
			}
		}
		return true;
	}

	getNextPhase(currentPhase: MythosLoopPhase): MythosLoopPhase | null {
		const sequence = this.getPhaseSequence();
		const currentIndex = sequence.indexOf(currentPhase);

		if (currentIndex === -1 || currentIndex === sequence.length - 1) {
			return null;
		}

		return sequence[currentIndex + 1];
	}

	getPreviousPhase(currentPhase: MythosLoopPhase): MythosLoopPhase | null {
		const sequence = this.getPhaseSequence();
		const currentIndex = sequence.indexOf(currentPhase);

		if (currentIndex <= 0) {
			return null;
		}

		return sequence[currentIndex - 1];
	}

	isPhaseComplete(phase: MythosLoopPhase, state: LoopState): boolean {
		return state.phaseResults.some((result) => result.phase === phase && result.success);
	}

	getPhaseResult(phase: MythosLoopPhase, state: LoopState): LoopPhaseResult | undefined {
		return state.phaseResults.find((result) => result.phase === phase);
	}

	canExecutePhase(phase: MythosLoopPhase, state: LoopState): boolean {
		const dependencies = this.getDependencies(phase);

		// All dependencies must be completed
		for (const dep of dependencies) {
			if (!this.isPhaseComplete(dep, state)) {
				return false;
			}
		}

		return true;
	}
}
