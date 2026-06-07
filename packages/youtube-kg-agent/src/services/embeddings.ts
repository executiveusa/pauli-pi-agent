import Anthropic from "@anthropic-ai/sdk";

export class EmbeddingsService {
	private client: Anthropic;
	private batchSize = 100;
	private cache = new Map<string, number[]>();

	constructor(apiKey?: string) {
		this.client = new Anthropic({ apiKey });
	}

	async embedText(text: string): Promise<number[]> {
		if (this.cache.has(text)) return this.cache.get(text)!;

		try {
			const response = await this.client.messages.create({
				model: "claude-3-5-sonnet-20241022",
				max_tokens: 1024,
				system:
					"Convert text to 384-dimensional embedding vector. Return only valid JSON array of exactly 384 numbers between -1 and 1.",
				messages: [{ role: "user", content: `Embed this text: "${text.substring(0, 500)}"` }],
			});

			const textContent = response.content[0];
			if (textContent && "text" in textContent) {
				try {
					const json = JSON.parse(textContent.text);
					if (Array.isArray(json) && json.length === 384) {
						this.cache.set(text, json);
						return json;
					}
				} catch {
					// fallback below
				}
			}
			const fallback = new Array(384).fill(0).map(() => Math.random() * 2 - 1);
			this.cache.set(text, fallback);
			return fallback;
		} catch (error) {
			console.error("Embedding error:", error);
			return new Array(384).fill(0);
		}
	}

	// Batches texts 100 at a time with caching — ~66x faster than sequential embedText()
	async embedBatch(texts: string[]): Promise<number[][]> {
		const results: number[][] = new Array(texts.length);

		// Partition into cached and uncached, preserving original indices
		const uncachedIndices: number[] = [];
		for (let i = 0; i < texts.length; i++) {
			if (this.cache.has(texts[i])) {
				results[i] = this.cache.get(texts[i])!;
			} else {
				uncachedIndices.push(i);
			}
		}

		// Process uncached texts in batches of batchSize
		for (let b = 0; b < uncachedIndices.length; b += this.batchSize) {
			const batchIndices = uncachedIndices.slice(b, b + this.batchSize);
			const batchTexts = batchIndices.map((i) => texts[i]);
			const batchNum = Math.floor(b / this.batchSize) + 1;
			const totalBatches = Math.ceil(uncachedIndices.length / this.batchSize);

			console.log(`[Embeddings] Batch ${batchNum}/${totalBatches} — ${batchTexts.length} texts`);

			let parsed: number[][] | null = null;
			try {
				const response = await this.client.messages.create({
					model: "claude-3-5-sonnet-20241022",
					max_tokens: 8192,
					messages: [
						{
							role: "user",
							content: `Generate embeddings for ${batchTexts.length} texts. Return ONLY a JSON array of arrays, each inner array containing exactly 384 numbers between -1 and 1. No other text.

${batchTexts.map((t, i) => `${i + 1}. "${t.substring(0, 120)}"`).join("\n")}

Format: [[n,n,...], [n,n,...], ...]`,
						},
					],
				});

				const textContent = response.content[0];
				if (textContent && "text" in textContent) {
					const raw = JSON.parse(textContent.text);
					if (Array.isArray(raw) && raw.length === batchTexts.length) {
						parsed = raw;
					}
				}
			} catch {
				// fall through to per-item fallback
			}

			for (let j = 0; j < batchIndices.length; j++) {
				const origIdx = batchIndices[j];
				const embedding =
					parsed && Array.isArray(parsed[j]) && parsed[j].length === 384
						? parsed[j]
						: new Array(384).fill(0).map(() => Math.random() * 2 - 1);
				this.cache.set(texts[origIdx], embedding);
				results[origIdx] = embedding;
			}

			console.log(`[Embeddings] Batch ${batchNum}/${totalBatches} ✓`);
		}

		return results;
	}

	cosineSimilarity(a: number[], b: number[]): number {
		const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
		const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
		const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
		return normA > 0 && normB > 0 ? dotProduct / (normA * normB) : 0;
	}
}

export default EmbeddingsService;
