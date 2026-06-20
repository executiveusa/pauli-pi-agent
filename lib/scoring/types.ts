export interface UDECScore {
	typography: number; // 0-10
	spacing: number; // 0-10
	accessibility: number; // 0-10
	animation: number; // 0-10
	responsiveness: number; // 0-10
	visual_hierarchy: number; // 0-10
	interaction_quality: number; // 0-10
	information_architecture: number; // 0-10
	mobile_quality: number; // 0-10
	user_trust: number; // 0-10
	overall: number; // 0-10 weighted average
	grade: "A" | "B" | "C" | "D" | "F";
	pass: boolean; // true if overall >= 8.5
	recommendations: string[];
}

export interface MOTScore {
	primary_value_clear: number; // 0-10
	load_time_score: number; // 0-10
	first_action_clarity: number; // 0-10
	trust_signals: number; // 0-10
	social_proof: number; // 0-10
	overall: number;
	pass: boolean; // true if overall >= 7.5
}

export interface ACCScore {
	wcag_aa_compliance: number; // 0-10
	color_contrast: number; // 0-10
	keyboard_nav: number; // 0-10
	screen_reader: number; // 0-10
	focus_indicators: number; // 0-10
	alt_text: number; // 0-10
	overall: number;
	pass: boolean; // true if overall >= 8.0
}

export interface OverallScore {
	udec: UDECScore;
	mot: MOTScore;
	acc: ACCScore;
	overall: number; // weighted: udec*0.4 + mot*0.3 + acc*0.3
	grade: "A" | "B" | "C" | "D" | "F";
	pass: boolean; // all three must pass
	auto_rebuild_required: boolean;
}
