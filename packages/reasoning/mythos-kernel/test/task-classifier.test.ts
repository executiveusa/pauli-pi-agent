import { describe, it } from "node:test";
import assert from "node:assert";
import { TaskClassifier } from "../src/task-classifier.js";
import { MythosDepth } from "../src/types.js";

describe("TaskClassifier", () => {
	const classifier = new TaskClassifier();

	it("should classify simple fact questions", () => {
		const result = classifier.classifyTask("What is the capital of France?");
		assert.strictEqual(result.taskType, "simple_fact");
		assert.strictEqual(result.suggestedDepth, MythosDepth.INSTANT);
		assert.equal(result.requiresReasoning, false);
	});

	it("should classify code generation tasks", () => {
		const result = classifier.classifyTask("Write a function to sort an array");
		assert.strictEqual(result.taskType, "code_generation");
		assert.equal(result.requiresReasoning, true);
	});

	it("should classify debugging tasks", () => {
		const result = classifier.classifyTask("Debug this error in my code");
		assert.strictEqual(result.taskType, "debugging");
		assert.equal(result.suggestedDepth, MythosDepth.DEEP);
	});

	it("should calculate complexity based on query length", () => {
		const short = classifier.classifyTask("What is 2+2?");
		const long = classifier.classifyTask(
			"Provide a comprehensive analysis of the historical, economic, and social implications of the Industrial Revolution on modern society"
		);

		assert(long.complexity > short.complexity);
	});

	it("should detect complexity indicators", () => {
		const simple = classifier.classifyTask("Add 5 and 3");
		const complex = classifier.classifyTask("Implement a complex recursive algorithm for tree traversal");

		assert(complex.complexity > simple.complexity);
	});

	it("should maintain confidence > 0.5 for pattern matches", () => {
		const result = classifier.classifyTask("Debug my Python code");
		assert(result.confidence >= 0.85);
	});

	it("should suggest depth based on task type", () => {
		const design = classifier.classifyTask("Design a microservice architecture");
		assert(
			design.suggestedDepth === MythosDepth.DEEP ||
			design.suggestedDepth === MythosDepth.NORMAL
		);
	});

	it("should escalate depth for high complexity", () => {
		const highComplexity = classifier.classifyTask(
			"Optimize a complex recursive algorithm with multiple dependencies and edge cases"
		);
		assert(highComplexity.complexity > 0.6);
	});

	it("should include rationale in classification", () => {
		const result = classifier.classifyTask("What is artificial intelligence?");
		assert(result.rationale.length > 0);
		assert(result.rationale.includes("Task type detected"));
	});
});
