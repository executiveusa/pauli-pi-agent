/**
 * Graph Manager Tests
 * Verify knowledge graph operations and querying
 */

import { describe, expect, test, beforeEach } from "vitest";
import { GraphManager } from "../../src/knowledge/graph.js";
import type { Entity, Relationship } from "../../src/knowledge/types.js";

describe("GraphManager", () => {
	let manager: GraphManager;

	beforeEach(() => {
		manager = new GraphManager("graph-1", "Test Graph");
	});

	test("creates graph manager", () => {
		expect(manager).toBeDefined();
	});

	test("adds entity to graph", async () => {
		const entity: Entity = {
			id: "entity-1",
			type: "PERSON",
			name: "John Smith",
			confidence: 0.95,
			sourceIds: ["source-1"],
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await manager.addEntity(entity);
		const graph = manager.getGraph();

		expect(graph.entities).toContain(entity);
	});

	test("adds relationship to graph", async () => {
		const entity1: Entity = {
			id: "entity-1",
			type: "PERSON",
			name: "John",
			confidence: 0.9,
			sourceIds: ["source-1"],
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const entity2: Entity = {
			id: "entity-2",
			type: "ORGANIZATION",
			name: "Google",
			confidence: 0.9,
			sourceIds: ["source-1"],
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const relationship: Relationship = {
			id: "rel-1",
			sourceEntityId: "entity-1",
			targetEntityId: "entity-2",
			type: "WORKS_AT",
			strength: 0.85,
			evidence: ["John works at Google"],
			createdAt: new Date(),
		};

		await manager.addEntity(entity1);
		await manager.addEntity(entity2);
		await manager.addRelationship(relationship);

		const graph = manager.getGraph();
		expect(graph.relationships).toContain(relationship);
	});

	test("builds graph from text", async () => {
		const text = "John Smith works at Google in Mountain View";
		await manager.buildFromText(text, "source-1");

		const graph = manager.getGraph();
		expect(graph.entities.length).toBeGreaterThan(0);
	});

	test("retrieves entity by ID", async () => {
		const entity: Entity = {
			id: "entity-1",
			type: "PERSON",
			name: "Alice",
			confidence: 0.9,
			sourceIds: ["source-1"],
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await manager.addEntity(entity);
		const retrieved = manager.getEntity("entity-1");

		expect(retrieved).toEqual(entity);
	});

	test("queries graph by starting entity", async () => {
		const text = "John works at Google and Google is in Mountain View";
		await manager.buildFromText(text, "source-1");

		const graph = manager.getGraph();
		if (graph.entities.length > 0) {
			const startEntityId = graph.entities[0].id;
			const result = await manager.query({
				query: "related",
				startEntity: startEntityId,
				maxDepth: 2,
			});

			expect(result.entities).toBeDefined();
			expect(result.relationships).toBeDefined();
		}
	});

	test("queries graph with entity filter", async () => {
		const text = "Person and Organization and Location are mentioned";
		await manager.buildFromText(text, "source-1");

		const result = await manager.query({
			query: "entities",
			entityFilter: "PERSON",
		});

		for (const entity of result.entities) {
			expect(entity.type).toBe("PERSON");
		}
	});

	test("queries graph with relationship filter", async () => {
		const text = "John works at Google and Google located in Mountain View";
		await manager.buildFromText(text, "source-1");

		const result = await manager.query({
			query: "relationships",
			relationshipFilter: "WORKS_AT",
		});

		for (const rel of result.relationships) {
			expect(rel.type).toBe("WORKS_AT");
		}
	});

	test("returns query execution time", async () => {
		const text = "Test content for query";
		await manager.buildFromText(text, "source-1");

		const result = await manager.query({
			query: "test",
		});

		expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
	});

	test("gets entity connections", async () => {
		const text = "Person works at Company in City";
		await manager.buildFromText(text, "source-1");

		const graph = manager.getGraph();
		if (graph.entities.length > 0) {
			const connections = manager.getEntityConnections(graph.entities[0].id);

			expect(connections).toBeInstanceOf(Array);
			for (const connection of connections) {
				expect(connection.entity).toBeDefined();
				expect(connection.relationships).toBeInstanceOf(Array);
			}
		}
	});

	test("gets graph statistics", async () => {
		const text = "John Smith works at Google in Mountain View and Amazon";
		await manager.buildFromText(text, "source-1");

		const stats = manager.getGraphStatistics();

		expect(stats).toHaveProperty("entityCount");
		expect(stats).toHaveProperty("relationshipCount");
		expect(stats).toHaveProperty("entityTypeCount");
		expect(stats).toHaveProperty("relationshipTypeCount");
		expect(stats).toHaveProperty("avgConnectionsPerEntity");
		expect(stats).toHaveProperty("graphDensity");

		expect(stats.entityCount).toBeGreaterThanOrEqual(0);
		expect(stats.relationshipCount).toBeGreaterThanOrEqual(0);
		expect(stats.avgConnectionsPerEntity).toBeGreaterThanOrEqual(0);
		expect(stats.graphDensity).toBeGreaterThanOrEqual(0);
		expect(stats.graphDensity).toBeLessThanOrEqual(1);
	});

	test("merges graphs", async () => {
		const text1 = "John works at Google";
		const text2 = "Jane works at Microsoft";

		await manager.buildFromText(text1, "source-1");

		const manager2 = new GraphManager("graph-2", "Graph 2");
		await manager2.buildFromText(text2, "source-2");

		const graph2 = manager2.getGraph();
		manager.merge(graph2);

		const mergedGraph = manager.getGraph();
		expect(mergedGraph.entities.length).toBeGreaterThanOrEqual(2);
	});

	test("prevents duplicate entities", async () => {
		const entity: Entity = {
			id: "entity-1",
			type: "PERSON",
			name: "Alice",
			confidence: 0.9,
			sourceIds: ["source-1"],
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await manager.addEntity(entity);
		await manager.addEntity(entity);

		const graph = manager.getGraph();
		const count = graph.entities.filter((e) => e.id === "entity-1").length;
		expect(count).toBe(1);
	});

	test("graph has metadata", () => {
		const graph = manager.getGraph();

		expect(graph).toHaveProperty("id");
		expect(graph).toHaveProperty("name");
		expect(graph).toHaveProperty("createdAt");
		expect(graph).toHaveProperty("updatedAt");
	});

	test("query returns paths", async () => {
		const text = "A connects to B connects to C";
		await manager.buildFromText(text, "source-1");

		const result = await manager.query({
			query: "paths",
		});

		expect(result.paths).toBeInstanceOf(Array);
	});

	test("entity type distribution works correctly", async () => {
		const text = "John works at Google in Mountain View and Amazon";
		await manager.buildFromText(text, "source-1");

		const stats = manager.getGraphStatistics();
		const totalEntities = Object.values(stats.entityTypeCount).reduce((a, b) => a + b, 0);

		expect(totalEntities).toBe(stats.entityCount);
	});

	test("relationship type distribution works correctly", async () => {
		const text = "Person at Organization in Location";
		await manager.buildFromText(text, "source-1");

		const stats = manager.getGraphStatistics();
		const totalRelationships = Object.values(stats.relationshipTypeCount).reduce((a, b) => a + b, 0);

		expect(totalRelationships).toBe(stats.relationshipCount);
	});
});
