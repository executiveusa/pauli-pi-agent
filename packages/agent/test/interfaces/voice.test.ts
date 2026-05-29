/**
 * Voice Interface Tests
 * Verify speech recognition and synthesis
 */

import { beforeEach, describe, expect, test } from "vitest";
import { VoiceInterface } from "../../src/interfaces/voice.js";

describe("VoiceInterface", () => {
	let voice: VoiceInterface;

	beforeEach(() => {
		voice = new VoiceInterface();
	});

	test("creates voice interface", () => {
		expect(voice).toBeDefined();
	});

	test("initializes interface", async () => {
		await voice.initialize();

		expect(voice.isReady()).toBe(true);
	});

	test("registers command handlers", () => {
		voice.registerCommandHandler("hello", async () => "Hello there!");

		expect(voice).toBeDefined();
	});

	test("processes voice command", async () => {
		voice.registerCommandHandler("hello", async () => "Hello response");

		const response = await voice.processVoiceCommand({
			text: "hello there",
			confidence: 0.95,
			timestamp: new Date(),
		});

		expect(response).toBeDefined();
		expect(response.text).toContain("Hello response");
	});

	test("returns error for unregistered command", async () => {
		const response = await voice.processVoiceCommand({
			text: "unknown command",
			confidence: 0.9,
			timestamp: new Date(),
		});

		expect(response.text).toContain("I understood");
	});

	test("synthesizes speech from text", async () => {
		const audio = await voice.synthesizeSpeech("Hello world");

		expect(audio).toBeDefined();
		expect(typeof audio).toBe("string");
	});

	test("recognizes speech from audio", async () => {
		const audioData = Buffer.from("mock audio data");

		const command = await voice.recognizeSpeech(audioData);

		expect(command).toBeDefined();
		expect(command.text).toBeDefined();
		expect(command.confidence).toBeGreaterThan(0);
		expect(command.confidence).toBeLessThanOrEqual(1);
	});

	test("tracks conversation history", async () => {
		voice.registerCommandHandler("test", async () => "test response");

		await voice.processVoiceCommand({
			text: "test command",
			confidence: 0.9,
			timestamp: new Date(),
		});

		const history = voice.getConversationHistory(10);

		expect(history.length).toBeGreaterThan(0);
	});

	test("retrieves command history", async () => {
		voice.registerCommandHandler("cmd1", async () => "response 1");
		voice.registerCommandHandler("cmd2", async () => "response 2");

		await voice.processVoiceCommand({
			text: "cmd1",
			confidence: 0.9,
			timestamp: new Date(),
		});

		await voice.processVoiceCommand({
			text: "cmd2",
			confidence: 0.9,
			timestamp: new Date(),
		});

		const history = voice.getConversationHistory(10);

		expect(history.length).toBeGreaterThanOrEqual(2);
	});

	test("clears conversation history", async () => {
		voice.registerCommandHandler("test", async () => "response");

		await voice.processVoiceCommand({
			text: "test",
			confidence: 0.9,
			timestamp: new Date(),
		});

		voice.clearConversationHistory();

		const history = voice.getConversationHistory(10);

		expect(history.length).toBe(0);
	});

	test("gets provider name", () => {
		const voiceWithProvider = new VoiceInterface("google-cloud");

		expect(voiceWithProvider.getProvider()).toBe("google-cloud");
	});

	test("gets supported languages", () => {
		const languages = voice.getSupportedLanguages();

		expect(languages).toBeInstanceOf(Array);
		expect(languages.length).toBeGreaterThan(0);
		expect(languages).toContain("en");
	});

	test("extracts command intent", () => {
		const intent = voice.extractCommandIntent("please analyze the document");

		expect(intent).toBeDefined();
		expect(intent.command).toBeDefined();
		expect(intent.confidence).toBeGreaterThanOrEqual(0);
		expect(intent.parameters).toBeDefined();
	});

	test("recognizes analyze intent", () => {
		const intent = voice.extractCommandIntent("analyze the data");

		expect(intent.command).toBe("analyze");
	});

	test("recognizes process intent", () => {
		const intent = voice.extractCommandIntent("process this file");

		expect(intent.command).toBe("process");
	});

	test("recognizes create intent", () => {
		const intent = voice.extractCommandIntent("create a new document");

		expect(intent.command).toBe("create");
	});

	test("response includes processing time", async () => {
		const response = await voice.processVoiceCommand({
			text: "test",
			confidence: 0.9,
			timestamp: new Date(),
		});

		expect(response.processingTimeMs).toBeGreaterThanOrEqual(0);
	});

	test("response includes timestamp", async () => {
		const response = await voice.processVoiceCommand({
			text: "test",
			confidence: 0.9,
			timestamp: new Date(),
		});

		expect(response.timestamp).toBeInstanceOf(Date);
	});

	test("limits conversation history size", async () => {
		voice.registerCommandHandler("test", async () => "response");

		for (let i = 0; i < 100; i++) {
			await voice.processVoiceCommand({
				text: "test",
				confidence: 0.9,
				timestamp: new Date(),
			});
		}

		const history = voice.getConversationHistory(100);

		expect(history.length).toBeLessThanOrEqual(50);
	});

	test("handles case-insensitive commands", async () => {
		voice.registerCommandHandler("hello", async () => "Hi there");

		const response = await voice.processVoiceCommand({
			text: "HELLO",
			confidence: 0.9,
			timestamp: new Date(),
		});

		expect(response.text).toContain("Hi there");
	});
});
