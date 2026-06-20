export interface BrowserValidationReport {
	url: string;
	timestamp: string;
	screenshots: Screenshot[];
	broken_links: BrokenLink[];
	console_errors: ConsoleError[];
	accessibility_issues: AccessibilityIssue[];
	performance_metrics: PerformanceMetrics;
	responsive_checks: ResponsiveCheck[];
	form_checks: FormCheck[];
	api_failures: APIFailure[];
	overall_score: number; // 0-100
	critical_issues: string[];
	warnings: string[];
	pass: boolean;
}

export interface Screenshot {
	url: string;
	viewport: { width: number; height: number };
	path: string;
	timestamp: string;
}

export interface BrokenLink {
	url: string;
	found_on: string;
	status_code: number;
	text: string;
}

export interface ConsoleError {
	level: "error" | "warn";
	message: string;
	source: string;
	line?: number;
}

export interface AccessibilityIssue {
	element: string;
	issue: string;
	wcag_criterion: string;
	severity: "critical" | "serious" | "moderate" | "minor";
}

export interface PerformanceMetrics {
	fcp_ms: number; // First Contentful Paint
	lcp_ms: number; // Largest Contentful Paint
	cls: number; // Cumulative Layout Shift
	ttfb_ms: number; // Time to First Byte
	score: number; // 0-100
}

export interface ResponsiveCheck {
	viewport: string;
	width: number;
	height: number;
	layout_broken: boolean;
	overflow_detected: boolean;
	touch_targets_ok: boolean;
}

export interface FormCheck {
	form_id: string;
	fields: number;
	has_validation: boolean;
	has_labels: boolean;
	submission_works: boolean;
}

export interface APIFailure {
	url: string;
	method: string;
	status: number;
	error: string;
}
