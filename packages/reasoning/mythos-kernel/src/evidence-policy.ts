import type { EvidencePolicyState, GoalPacket } from "./types.js";

export interface EvidenceRequirement {
	id: string;
	description: string;
	priority: "must" | "should" | "nice";
	satisfied: boolean;
}

export class EvidencePolicy {
	createState(goalPacket: GoalPacket): EvidencePolicyState {
		const requirements = goalPacket.evidenceRequirements;
		const collected = new Map<string, string[]>();

		// Initialize collected evidence map
		for (const req of requirements) {
			collected.set(req, []);
		}

		return {
			requirements,
			collectedEvidence: collected,
			satisfactionLevel: 0,
			capConfidence: 1.0,
		};
	}

	recordEvidence(state: EvidencePolicyState, requirement: string, evidence: string): void {
		const existing = state.collectedEvidence.get(requirement) || [];
		existing.push(evidence);
		state.collectedEvidence.set(requirement, existing);

		// Update satisfaction level
		this.updateSatisfactionLevel(state);
	}

	private updateSatisfactionLevel(state: EvidencePolicyState): void {
		if (state.requirements.length === 0) {
			state.satisfactionLevel = 1.0;
			return;
		}

		let satisfied = 0;
		for (const req of state.requirements) {
			const evidence = state.collectedEvidence.get(req) || [];
			if (evidence.length > 0) {
				satisfied++;
			}
		}

		state.satisfactionLevel = satisfied / state.requirements.length;
	}

	getConfidenceCap(state: EvidencePolicyState): number {
		// Confidence is capped by evidence satisfaction
		// If evidence is incomplete, cap the confidence we can claim
		if (state.requirements.length === 0) {
			return 1.0;
		}

		// Linear scaling: 0% satisfaction = 0.5 cap, 100% = 1.0 cap
		const cap = 0.5 + state.satisfactionLevel * 0.5;
		state.capConfidence = cap;
		return cap;
	}

	enforceConfidenceCap(confidence: number, state: EvidencePolicyState): number {
		const cap = this.getConfidenceCap(state);
		return Math.min(confidence, cap);
	}

	getSatisfiedRequirements(state: EvidencePolicyState): string[] {
		return state.requirements.filter(
			(req) => (state.collectedEvidence.get(req) || []).length > 0
		);
	}

	getUnsatisfiedRequirements(state: EvidencePolicyState): string[] {
		return state.requirements.filter(
			(req) => (state.collectedEvidence.get(req) || []).length === 0
		);
	}

	getSatisfactionSummary(state: EvidencePolicyState): string {
		const satisfied = this.getSatisfiedRequirements(state).length;
		const total = state.requirements.length;

		if (total === 0) return "No evidence requirements";
		return `${satisfied}/${total} evidence requirements satisfied (${(state.satisfactionLevel * 100).toFixed(0)}%)`;
	}

	areAllRequiredSatisfied(state: EvidencePolicyState): boolean {
		return state.satisfactionLevel === 1.0;
	}

	getEvidenceForRequirement(state: EvidencePolicyState, requirement: string): string[] {
		return state.collectedEvidence.get(requirement) || [];
	}
}
