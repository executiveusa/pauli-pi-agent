export interface ProductionReadinessReport {
	project_id: string;
	timestamp: string;
	scores: {
		security: number; // 0-100
		performance: number; // 0-100
		reliability: number; // 0-100
		maintainability: number; // 0-100
		observability: number; // 0-100
		deployment: number; // 0-100
	};
	overall: number; // weighted average
	critical_blockers: string[];
	warnings: string[];
	recommendations: string[];
	ready_for_production: boolean; // overall >= 80 and no critical blockers
	checklist: ProductionChecklistItem[];
}

export interface ProductionChecklistItem {
	id: string;
	category: string;
	check: string;
	passed: boolean;
	severity: "critical" | "warning" | "info";
	notes?: string;
}
