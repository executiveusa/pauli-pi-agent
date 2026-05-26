/**
 * Entity Extractor Tests
 * Verify entity and relationship extraction from text
 */

import { describe, expect, test, beforeEach } from "vitest";
import { EntityExtractor } from "../../src/knowledge/extractor.js";

describe("EntityExtractor", () => {
	let extractor: EntityExtractor;

	beforeEach(() => {
		extractor = new EntityExtractor();
	});

	test("creates entity extractor", () => {
		expect(extractor).toBeDefined();
	});

	test("extracts entities from text", async () => {
		const text = "John Smith works at Google in Mountain View";
		const result = await extractor.extract(text, "source-1");

		expect(result).toBeDefined();
		expect(result.entities).toBeInstanceOf(Array);
		expect(result.entities.length).toBeGreaterThan(0);
	});

	test("entity has required properties", async () => {
		const text = "Apple Corporation was founded by Steve Jobs";
		const result = await extractor.extract(text, "source-1");

		for (const entity of result.entities) {
			expect(entity).toHaveProperty("id");
			expect(entity).toHaveProperty("type");
			expect(entity).toHaveProperty("name");
			expect(entity).toHaveProperty("confidence");
			expect(entity).toHaveProperty("sourceIds");
			expect(entity).toHaveProperty("createdAt");
		}
	});

	test("extracts relationships between entities", async () => {
		const text = "John Smith works at Microsoft and lives in Seattle";
		const result = await extractor.extract(text, "source-1");

		expect(result.relationships).toBeInstanceOf(Array);
	});

	test("relationship has required properties", async () => {
		const text = "Alice works at Google in California";
		const result = await extractor.extract(text, "source-1");

		for (const rel of result.relationships) {
			expect(rel).toHaveProperty("id");
			expect(rel).toHaveProperty("sourceEntityId");
			expect(rel).toHaveProperty("targetEntityId");
			expect(rel).toHaveProperty("type");
			expect(rel).toHaveProperty("strength");
			expect(rel).toHaveProperty("evidence");
		}
	});

	test("entity confidence is between 0 and 1", async () => {
		const text = "The company Google operates worldwide";
		const result = await extractor.extract(text, "source-1");

		for (const entity of result.entities) {
			expect(entity.confidence).toBeGreaterThanOrEqual(0);
			expect(entity.confidence).toBeLessThanOrEqual(1);
		}
	});

	test("relationship strength is between 0 and 1", async () => {
		const text = "Bob Smith works at Amazon";
		const result = await extractor.extract(text, "source-1");

		for (const rel of result.relationships) {
			expect(rel.strength).toBeGreaterThanOrEqual(0);
			expect(rel.strength).toBeLessThanOrEqual(1);
		}
	});

	test("extracts batch of texts", async () => {
		const texts = [
			{ text: "John Smith works at Google", id: "doc-1" },
			{ text: "Jane Doe works at Microsoft", id: "doc-2" },
			{ text: "Bob works at Apple", id: "doc-3" },
		];

		const results = await extractor.extractBatch(texts);

		expect(results).toHaveLength(3);
		for (const result of results) {
			expect(result.entities).toBeDefined();
			expect(result.relationships).toBeDefined();
		}
	});

	test("returns extraction confidence", async () => {
		const text = "Company located in city with person";
		const result = await extractor.extract(text, "source-1");

		expect(result.confidence).toBeGreaterThanOrEqual(0);
		expect(result.confidence).toBeLessThanOrEqual(1);
	});

	test("records processing time", async () => {
		const text = "Test text content";
		const result = await extractor.extract(text, "source-1");

		expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
	});

	test("filters entities by confidence", async () => {
		const text = "This is test content with multiple words";
		const result = await extractor.extract(text, "source-1");

		// All returned entities should meet minimum confidence
		for (const entity of result.entities) {
			expect(entity.confidence).toBeGreaterThanOrEqual(0.5);
		}
	});

	test("entity source IDs include source", async () => {
		const text = "Test entity extraction";
		const sourceId = "my-source-123";
		const result = await extractor.extract(text, sourceId);

		for (const entity of result.entities) {
			expect(entity.sourceIds).toContain(sourceId);
		}
	});

	test("get entity type distribution", async () => {
		const text = "John works at Google in New York and California";
		const result = await extractor.extract(text, "source-1");

		const distribution = extractor.getEntityTypeDistribution(result.entities);

		expect(distribution).toBeDefined();
		expect(typeof distribution).toBe("object");
	});

	test("get relationship type distribution", async () => {
		const text = "Person works at Organization in Location";
		const result = await extractor.extract(text, "source-1");

		const distribution = extractor.getRelationshipTypeDistribution(result.relationships);

		expect(distribution).toBeDefined();
		expect(typeof distribution).toBe("object");
	});

	test("entities have unique IDs", async () => {
		const text = "Multiple entities in this text";
		const result = await extractor.extract(text, "source-1");

		const ids = result.entities.map((e) => e.id);
		const uniqueIds = new Set(ids);

		expect(ids.length).toBe(uniqueIds.size);
	});

	test("relationships have unique IDs", async () => {
		const text = "Entity one and entity two are related";
		const result = await extractor.extract(text, "source-1");

		const ids = result.relationships.map((r) => r.id);
		const uniqueIds = new Set(ids);

		expect(ids.length).toBe(uniqueIds.size);
	});

	test("entity name is capitalized", async () => {
		const text = "lowercase entity names";
		const result = await extractor.extract(text, "source-1");

		for (const entity of result.entities) {
			expect(entity.name[0]).toBe(entity.name[0].toUpperCase());
		}
	});

	test("relationship evidence exists", async () => {
		const text = "Alice and Bob work together at XYZ Corp";
		const result = await extractor.extract(text, "source-1");

		for (const rel of result.relationships) {
			expect(rel.evidence).toBeInstanceOf(Array);
			expect(rel.evidence.length).toBeGreaterThan(0);
		}
	});
});
