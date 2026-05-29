import type { GoalPacket, LoopState, MythosKernelConfig, CodaOutputPackage } from "./types.js";
import { MythosDepth, MythosLoopPhase, MythosRiskLevel } from "./types.js";
import { TaskClassifier } from "./task-classifier.js";
import { GoalPacketFactory } from "./goal-packet.js";
import { DepthPolicy, type PolicyConstraints } from "./depth-policy.js";
import { TokenBudgeter } from "./token-budgeter.js";
import { LoopPhaseOrchestrator, type PhaseHandler } from "./loop-phases.js";
import { HaltPolicy } from "./halt-policy.js";
import { StabilityGuard } from "./stability-guard.js";
import { PersonaRouter } from "./persona-router.js";
import { EvidencePolicy } from "./evidence-policy.js";
import { CodaValidator } from "./coda-validator.js";
import { TraceRecorder } from "./trace-recorder.js";

export class MythosKernelController {
	private taskClassifier: TaskClassifier;
	private depthPolicy: DepthPolicy;
	private tokenBudgeter: TokenBudgeter;
	private phaseOrchestrator: LoopPhaseOrchestrator;
	private haltPolicy: HaltPolicy;
	private stabilityGuard: StabilityGuard;
	private personaRouter: PersonaRouter;
	private evidencePolicy: EvidencePolicy;
	private codaValidator: CodaValidator;
	private traceRecorder: TraceRecorder;
	private config: MythosKernelConfig;

	constructor(config: MythosKernelConfig) {
		this.taskClassifier = new TaskClassifier();
		this.depthPolicy = new DepthPolicy();
		this.tokenBudgeter = new TokenBudgeter();
		this.phaseOrchestrator = new LoopPhaseOrchestrator();
		this.haltPolicy = new HaltPolicy();
		this.stabilityGuard = new StabilityGuard();
		this.personaRouter = new PersonaRouter();
		this.evidencePolicy = new EvidencePolicy();
		this.codaValidator = new CodaValidator();
		this.traceRecorder = new TraceRecorder();
		this.config = config;

		this.setupPhaseHandlers();
	}

	private setupPhaseHandlers(): void {
		// Register default no-op handlers for each phase
		for (const phase of this.phaseOrchestrator.getPhaseSequence()) {
			this.phaseOrchestrator.registerPhaseHandler(
				phase,
				async (state: LoopState) => ({
					phase,
					success: true,
					duration: 0,
					tokensUsed: 0,
					confidence: 0.5,
					output: {},
				})
			);
		}
	}

	async initializeGoalPacket(userQuery: string): Promise<GoalPacket> {
		// Classify task
		const classification = this.taskClassifier.classifyTask(userQuery);

		// Create goal packet
		const goalPacket = GoalPacketFactory.create({
			userQuery,
			taskType: classification.taskType,
			initialDepth: classification.suggestedDepth,
			maxDepth: this.config.defaultDepth,
			maxLoops: this.config.maxLoops,
			tokenBudget: 10000, // Default, can be customized
			costBudget: 0.5, // Default, can be customized
			evidenceRequirements: [],
		});

		return goalPacket;
	}

	async initializeLoopState(goalPacket: GoalPacket): Promise<LoopState> {
		const tokenBudget = this.tokenBudgeter.createBudget(goalPacket.tokenBudget);

		const state: LoopState = {
			loopNumber: 1,
			currentPhase: MythosLoopPhase.UNDERSTAND,
			depth: goalPacket.initialDepth,
			phaseResults: [],
			accumulatedMessages: [],
			tokenBudget,
			riskLevel: MythosRiskLevel.LOW,
			shouldContinue: true,
		};

		return state;
	}

	registerPhaseHandler(phase: MythosLoopPhase, handler: PhaseHandler): void {
		this.phaseOrchestrator.registerPhaseHandler(phase, handler);
	}

	async executePhase(phase: MythosLoopPhase, state: LoopState, goalPacket: GoalPacket): Promise<void> {
		// Check if phase can execute
		if (!this.phaseOrchestrator.canExecutePhase(phase, state)) {
			throw new Error(
				`Cannot execute phase ${phase}: dependencies not satisfied`
			);
		}

		// Execute phase
		const result = await this.phaseOrchestrator.executePhase(phase, state);
		state.phaseResults.push(result);

		// Record trace if enabled
		if (this.config.traceEnabled) {
			this.traceRecorder.recordTrace(
				goalPacket,
				state.loopNumber,
				phase,
				state.depth,
				JSON.stringify(result.output),
				result.duration,
				result.tokensUsed
			);
		}

		// Update token budget
		this.tokenBudgeter.recordPhaseUsage(state.tokenBudget, phase, result.tokensUsed);

		// Move to next phase
		const nextPhase = this.phaseOrchestrator.getNextPhase(phase);
		if (nextPhase) {
			state.currentPhase = nextPhase;
		}
	}

	evaluateHalt(
		goalPacket: GoalPacket,
		loopState: LoopState,
		elapsedTime: number
	): { shouldHalt: boolean; reason: string } {
		const criteria = this.haltPolicy.getHaltCriteria(goalPacket);
		const decision = this.haltPolicy.evaluateHalt(goalPacket, loopState, elapsedTime, criteria);

		return {
			shouldHalt: decision.shouldHalt,
			reason: decision.reason,
		};
	}

	evaluateStability(
		initialGoalPacket: GoalPacket,
		currentGoalPacket: GoalPacket,
		loopState: LoopState
	): { isStable: boolean; violations: string[] } {
		const evaluation = this.stabilityGuard.evaluate(
			initialGoalPacket,
			currentGoalPacket,
			loopState
		);

		return {
			isStable: evaluation.isStable,
			violations: evaluation.violations,
		};
	}

	async buildOutput(
		goalPacket: GoalPacket,
		loopState: LoopState,
		finalAnswer: string,
		confidence: number
	): Promise<CodaOutputPackage> {
		// Validate output
		const validation = this.codaValidator.validate(finalAnswer);

		const pkg: CodaOutputPackage = {
			goalPacketId: goalPacket.id,
			finalAnswer: validation.sanitized,
			supportingEvidence: [],
			confidence: Math.min(confidence, 1),
			depth: loopState.depth,
			loopsUsed: loopState.loopNumber,
			tokensUsed: loopState.tokenBudget.total - loopState.tokenBudget.remaining,
			cost: 0, // Should be calculated
		};

		return pkg;
	}

	getConfig(): MythosKernelConfig {
		return this.config;
	}

	updateConfig(updates: Partial<MythosKernelConfig>): void {
		this.config = { ...this.config, ...updates };
	}
}
