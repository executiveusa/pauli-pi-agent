/**
 * Infisical Client Tests
 * Verify secret resolution with fallback chain
 */

import { beforeEach, describe, expect, test } from "vitest";
import { InfisicalClient } from "../../src/secrets/infisical-client.js";

describe("InfisicalClient", () => {
	beforeEach(() => {
		// Clear environment for each test
		delete process.env.OPENAI_API_KEY;
		delete process.env.DATABASE_URL;
		delete process.env.INFISICAL_ENABLED;
	});

	test("initializes with default configuration", async () => {
		const client = new InfisicalClient();
		await client.initialize();

		const status = client.getStatus();
		expect(status.initialized).toBe(true);
	});

	test("resolves secret from environment variable", async () => {
		process.env.OPENAI_API_KEY = "sk-test-key-12345";

		const client = new InfisicalClient();
		const result = await client.resolveSecret("OPENAI_API_KEY");

		expect(result.value).toBe("sk-test-key-12345");
		expect(result.source).toBe("env");
	});

	test("returns not_found when secret does not exist", async () => {
		const client = new InfisicalClient();
		const result = await client.resolveSecret("NONEXISTENT_SECRET");

		expect(result.value).toBe("");
		expect(result.source).toBe("not_found");
	});

	test("throws error when required secret is missing", async () => {
		const client = new InfisicalClient();

		await expect(client.getSecret("NONEXISTENT_SECRET", undefined, true)).rejects.toThrow(
			"Missing secret: NONEXISTENT_SECRET",
		);
	});

	test("returns empty string for optional missing secret", async () => {
		const client = new InfisicalClient();
		const result = await client.getSecret("NONEXISTENT_SECRET", undefined, false);

		expect(result).toBe("");
	});

	test("provides helpful error message for missing secrets", async () => {
		const client = new InfisicalClient();

		try {
			await client.getSecret("DATABASE_URL", "secret/database", true);
			expect.fail("Should have thrown");
		} catch (error) {
			const message = (error as Error).message;
			expect(message).toContain("Missing secret: DATABASE_URL");
			expect(message).toContain("DATABASE_URL=<value>");
			expect(message).toContain(".env.local");
		}
	});

	test("retrieves multiple secrets at once", async () => {
		process.env.OPENAI_API_KEY = "sk-openai-123";
		process.env.ANTHROPIC_API_KEY = "sk-anthropic-456";

		const client = new InfisicalClient();
		const result = await client.getSecrets([
			{ name: "OPENAI_API_KEY", required: true },
			{ name: "ANTHROPIC_API_KEY", required: true },
			{ name: "MISSING_KEY", required: false },
		]);

		expect(result.OPENAI_API_KEY).toBe("sk-openai-123");
		expect(result.ANTHROPIC_API_KEY).toBe("sk-anthropic-456");
		expect(result.MISSING_KEY).toBe("");
	});

	test("verifies required secrets are available", async () => {
		process.env.DATABASE_URL = "postgres://localhost/db";
		process.env.REDIS_URL = "redis://localhost";

		const client = new InfisicalClient();
		const result = await client.verifySecrets(["DATABASE_URL", "REDIS_URL", "MISSING"]);

		expect(result.ok).toBe(false);
		expect(result.missing).toEqual(["MISSING"]);
	});

	test("returns all missing secrets in verification", async () => {
		const client = new InfisicalClient();
		const result = await client.verifySecrets(["SECRET1", "SECRET2", "SECRET3"]);

		expect(result.ok).toBe(false);
		expect(result.missing.length).toBe(3);
	});

	test("clears cached secrets", async () => {
		process.env.TEST_SECRET = "test-value";

		const client = new InfisicalClient();
		let result = await client.resolveSecret("TEST_SECRET");
		expect(result.value).toBe("test-value");

		client.clearCache();
		// Cache should be cleared but env still available
		result = await client.resolveSecret("TEST_SECRET");
		expect(result.value).toBe("test-value");
	});

	test("handles infisical configuration status", async () => {
		const client = new InfisicalClient({
			enabled: true,
			clientId: "client-123",
			clientSecret: "secret-456",
			projectId: "proj-789",
		});

		await client.initialize();
		const status = client.getStatus();

		expect(status.infisicalEnabled).toBe(true);
		expect(status.infisicalConfigured).toBe(true);
	});

	test("recognizes when infisical is not configured", async () => {
		const client = new InfisicalClient({
			enabled: true,
			// Missing clientId/clientSecret
		});

		await client.initialize();
		const status = client.getStatus();

		expect(status.infisicalEnabled).toBe(true);
		expect(status.infisicalConfigured).toBe(false);
	});

	test("respects INFISICAL_ENABLED environment variable", async () => {
		process.env.INFISICAL_ENABLED = "false";

		const client = new InfisicalClient();
		const status = client.getStatus();

		expect(status.infisicalEnabled).toBe(false);
	});

	test("single initialize call is idempotent", async () => {
		const client = new InfisicalClient();

		await client.initialize();
		await client.initialize();
		await client.initialize();

		const status = client.getStatus();
		expect(status.initialized).toBe(true);
	});
});

describe("InfisicalClient - Error Handling", () => {
	test("handles missing environment gracefully", async () => {
		delete process.env.OPENAI_API_KEY;
		delete process.env.DATABASE_URL;

		const client = new InfisicalClient();

		try {
			await client.getSecret("NONEXISTENT", undefined, true);
			expect.fail("Should throw");
		} catch (error) {
			expect((error as Error).message).toContain("Missing secret");
		}
	});

	test("partial failure in batch secret resolution", async () => {
		process.env.AVAILABLE_SECRET = "value";

		const client = new InfisicalClient();

		try {
			await client.getSecrets([
				{ name: "AVAILABLE_SECRET", required: true },
				{ name: "MISSING_REQUIRED", required: true },
			]);
			expect.fail("Should throw");
		} catch (error) {
			expect((error as Error).message).toContain("Missing secret");
		}
	});
});

describe("InfisicalClient - .env.local Loading", () => {
	test("attempts to load .env.local if present", async () => {
		const client = new InfisicalClient();
		// This test verifies the function runs without error
		// Actual .env.local existence depends on test setup
		await client.initialize();

		const status = client.getStatus();
		expect(status.initialized).toBe(true);
	});
});
