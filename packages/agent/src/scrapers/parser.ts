/**
 * Document Parser
 * Parses and normalizes documents in various formats
 */

export interface DocumentMetadata {
	title?: string;
	author?: string;
	description?: string;
	keywords?: string[];
	language?: string;
	contentType: string;
	sourceUrl?: string;
	fetchedAt: Date;
	wordCount: number;
	readingTimeMinutes: number;
}

export interface ParsedDocument {
	id: string;
	content: string;
	cleanContent: string;
	metadata: DocumentMetadata;
	sections: Array<{
		heading: string;
		content: string;
		level: number;
	}>;
	links: Array<{
		text: string;
		url: string;
	}>;
	images: Array<{
		src: string;
		alt: string;
	}>;
}

export class DocumentParser {
	private readonly minSectionLength: number = 50;

	parse(content: string, contentType: string, metadata?: Partial<DocumentMetadata>): ParsedDocument {
		const id = this.generateId();
		const cleanContent = this.cleanContent(content, contentType);
		const sections = this.extractSections(cleanContent);
		const links = this.extractLinks(content);
		const images = this.extractImages(content);

		const wordCount = this.countWords(cleanContent);
		const readingTimeMinutes = Math.ceil(wordCount / 200);

		const fullMetadata: DocumentMetadata = {
			title: metadata?.title || "Untitled",
			author: metadata?.author,
			description: metadata?.description,
			keywords: metadata?.keywords,
			language: metadata?.language || "en",
			contentType,
			sourceUrl: metadata?.sourceUrl,
			fetchedAt: metadata?.fetchedAt || new Date(),
			wordCount,
			readingTimeMinutes,
		};

		return {
			id,
			content,
			cleanContent,
			metadata: fullMetadata,
			sections,
			links,
			images,
		};
	}

	parseMarkdown(markdown: string, sourceUrl?: string): ParsedDocument {
		const cleanContent = this.cleanMarkdown(markdown);
		const sections = this.extractMarkdownSections(markdown);
		const links = this.extractMarkdownLinks(markdown);

		const wordCount = this.countWords(cleanContent);
		const readingTimeMinutes = Math.ceil(wordCount / 200);

		return {
			id: this.generateId(),
			content: markdown,
			cleanContent,
			metadata: {
				title: "Markdown Document",
				contentType: "text/markdown",
				sourceUrl,
				fetchedAt: new Date(),
				wordCount,
				readingTimeMinutes,
			},
			sections,
			links,
			images: [],
		};
	}

	private cleanContent(content: string, contentType: string): string {
		let cleaned = content;

		// Remove HTML tags if HTML
		if (contentType.includes("html")) {
			cleaned = cleaned.replace(/<[^>]+>/g, "");
		}

		// Remove extra whitespace
		cleaned = cleaned.replace(/\s+/g, " ");

		// Remove control characters
		cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

		return cleaned.trim();
	}

	private cleanMarkdown(markdown: string): string {
		let cleaned = markdown;
		// Remove markdown formatting
		cleaned = cleaned.replace(/^#+\s+/gm, ""); // Remove headings
		cleaned = cleaned.replace(/[*_`~]/g, ""); // Remove formatting marks
		cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // Convert links to plain text
		cleaned = cleaned.replace(/\s+/g, " "); // Normalize whitespace
		return cleaned.trim();
	}

	private extractSections(content: string): Array<{
		heading: string;
		content: string;
		level: number;
	}> {
		const sections: Array<{ heading: string; content: string; level: number }> = [];

		// Simple section detection based on line patterns
		const lines = content.split("\n");
		let currentHeading = "";
		let currentLevel = 0;
		let currentContent = "";

		for (const line of lines) {
			// Detect heading patterns
			if (line.match(/^[A-Z][A-Z\s]{5,}$/)) {
				if (currentContent.length > this.minSectionLength) {
					sections.push({
						heading: currentHeading,
						content: currentContent,
						level: currentLevel,
					});
				}
				currentHeading = line;
				currentLevel = 1;
				currentContent = "";
			} else if (line.match(/^[A-Z]\w+.*[.!?]$/)) {
				currentContent += `${line} `;
			}
		}

		// Add last section
		if (currentContent.length > this.minSectionLength) {
			sections.push({
				heading: currentHeading,
				content: currentContent,
				level: currentLevel,
			});
		}

		return sections;
	}

	private extractMarkdownSections(markdown: string): Array<{
		heading: string;
		content: string;
		level: number;
	}> {
		const sections: Array<{ heading: string; content: string; level: number }> = [];

		const lines = markdown.split("\n");
		let currentHeading = "";
		let currentLevel = 0;
		let currentContent = "";

		for (const line of lines) {
			const headingMatch = line.match(/^(#+)\s+(.*)/);

			if (headingMatch) {
				if (currentContent.length > this.minSectionLength) {
					sections.push({
						heading: currentHeading,
						content: currentContent,
						level: currentLevel,
					});
				}
				currentLevel = headingMatch[1].length;
				currentHeading = headingMatch[2];
				currentContent = "";
			} else if (line.trim()) {
				currentContent += line + " ";
			}
		}

		// Add last section
		if (currentContent.length > this.minSectionLength) {
			sections.push({
				heading: currentHeading,
				content: currentContent,
				level: currentLevel,
			});
		}

		return sections;
	}

	private extractLinks(content: string): Array<{ text: string; url: string }> {
		const links: Array<{ text: string; url: string }> = [];
		const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

		let match = linkRegex.exec(content);
		while (match !== null) {
			links.push({
				text: match[1],
				url: match[2],
			});
			match = linkRegex.exec(content);
		}

		return links;
	}

	private extractMarkdownLinks(markdown: string): Array<{ text: string; url: string }> {
		return this.extractLinks(markdown);
	}

	private extractImages(content: string): Array<{ src: string; alt: string }> {
		const images: Array<{ src: string; alt: string }> = [];
		const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;

		let match = imgRegex.exec(content);
		while (match !== null) {
			images.push({
				alt: match[1],
				src: match[2],
			});
			match = imgRegex.exec(content);
		}

		return images;
	}

	private countWords(text: string): number {
		return text.split(/\s+/).filter((word) => word.length > 0).length;
	}

	private generateId(): string {
		return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

export function createDocumentParser(): DocumentParser {
	return new DocumentParser();
}
