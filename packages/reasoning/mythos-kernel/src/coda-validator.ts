import type { CodaValidationResult, CodaOutputPackage } from "./types.js";

export class CodaValidator {
	private secretPatterns = [
		/sk-[a-zA-Z0-9]{48,}/g, // OpenAI keys
		/sk-ant-[a-zA-Z0-9]{90,}/g, // Anthropic keys
		/AKIA[0-9A-Z]{16}/g, // AWS access keys
		/Bearer\s+[a-zA-Z0-9._\-]+/g, // Bearer tokens
		/api[_-]?key[:\s]+[a-zA-Z0-9._\-]+/gi, // API keys
		/password[:\s]+\S+/gi, // Passwords
	];

	validate(content: string): CodaValidationResult {
		const violations: string[] = [];
		const removedSections: string[] = [];
		let sanitized = content;

		// Check for secrets
		const foundSecrets = this.detectSecrets(content);
		if (foundSecrets.length > 0) {
			violations.push("Sensitive credentials detected in output");
			sanitized = this.redactSecrets(sanitized);
			removedSections.push("...redacted sensitive content...");
		}

		// Check for chain-of-thought exposure
		if (this.containsChainOfThought(content)) {
			violations.push("Internal reasoning chain found - should be wrapped in tags");
		}

		// Check for invalid references
		const invalidRefs = this.findInvalidReferences(content);
		if (invalidRefs.length > 0) {
			violations.push(`Invalid references found: ${invalidRefs.join(", ")}`);
		}

		const isValid = violations.length === 0;

		return {
			isValid,
			sanitized,
			violations,
			removedSections,
		};
	}

	validatePackage(pkg: CodaOutputPackage): CodaValidationResult {
		let violations: string[] = [];
		let sanitized = pkg.finalAnswer;
		const removedSections: string[] = [];

		// Validate answer
		const answerValidation = this.validate(pkg.finalAnswer);
		violations = violations.concat(answerValidation.violations);
		sanitized = answerValidation.sanitized;
		removedSections.push(...answerValidation.removedSections);

		// Validate supporting evidence
		for (const evidence of pkg.supportingEvidence) {
			const evidenceValidation = this.validate(evidence.content);
			if (!evidenceValidation.isValid) {
				violations.push(`Evidence item "${evidence.type}" contains violations`);
			}
		}

		// Validate confidence
		if (pkg.confidence < 0 || pkg.confidence > 1) {
			violations.push("Confidence must be between 0 and 1");
		}

		return {
			isValid: violations.length === 0,
			sanitized,
			violations,
			removedSections,
		};
	}

	private detectSecrets(content: string): string[] {
		const found: string[] = [];

		for (const pattern of this.secretPatterns) {
			const matches = content.match(pattern);
			if (matches) {
				found.push(...matches);
			}
		}

		return found;
	}

	private redactSecrets(content: string): string {
		let redacted = content;

		for (const pattern of this.secretPatterns) {
			redacted = redacted.replace(pattern, "[REDACTED]");
		}

		return redacted;
	}

	private containsChainOfThought(content: string): boolean {
		// Check for common thinking indicators
		const thinkers = [
			/<thinking>/i,
			/<analysis>/i,
			/<internal>/i,
			/Let me think about/i,
			/So my reasoning is/i,
		];

		return thinkers.some((pattern) => pattern.test(content));
	}

	private findInvalidReferences(content: string): string[] {
		const invalid: string[] = [];

		// Check for broken markdown links
		const linkPattern = /\[([^\]]+)\]\(([^)]*)\)/g;
		let match;
		while ((match = linkPattern.exec(content)) !== null) {
			const url = match[2];
			if (!url || url.length === 0) {
				invalid.push(`Empty link: [${match[1]}]()`);
			} else if (!this.isValidUrl(url)) {
				invalid.push(`Invalid URL: ${url}`);
			}
		}

		return invalid;
	}

	private isValidUrl(url: string): boolean {
		// Allow relative URLs and standard schemes
		if (url.startsWith("/") || url.startsWith("#")) return true;

		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	sanitizePlanText(text: string): string {
		// Remove internal reasoning markers
		let sanitized = text
			.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
			.replace(/<analysis>[\s\S]*?<\/analysis>/gi, "")
			.replace(/<internal>[\s\S]*?<\/internal>/gi, "");

		// Redact secrets
		sanitized = this.redactSecrets(sanitized);

		// Remove multiple consecutive newlines
		sanitized = sanitized.replace(/\n\n+/g, "\n\n");

		return sanitized.trim();
	}
}
