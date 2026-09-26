import { afterEach, describe, expect, it } from "vitest";
import { authorizeTerabithia } from "../src/routes/terabithia-route.js";

const TOKEN = "pi-terabithia-test-token-0123456789";

describe("Pi Terabithia ingress", () => {
	afterEach(() => {
		delete process.env.PI_TERABITHIA_TOKEN;
	});

	it("fails closed when PI_TERABITHIA_TOKEN is not configured", () => {
		expect(authorizeTerabithia({ method: "POST", path: "/api/terabithia/invoke" })?.statusCode).toBe(503);
	});

	it("rejects missing, wrong and oversized bearers", () => {
		process.env.PI_TERABITHIA_TOKEN = TOKEN;
		const call = (auth?: string) =>
			authorizeTerabithia({
				method: "POST",
				path: "/api/terabithia/invoke",
				headers: auth ? { Authorization: auth } : {},
			});
		expect(call()?.statusCode).toBe(401);
		expect(call("Bearer wrong")?.statusCode).toBe(401);
		expect(call(`Bearer ${"x".repeat(500)}`)?.statusCode).toBe(401);
		expect(call(`Bearer ${TOKEN}`)).toBeNull();
	});
});
