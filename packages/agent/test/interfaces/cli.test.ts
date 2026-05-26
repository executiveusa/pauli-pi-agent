/**
 * CLI Interface Tests
 * Verify command-line interface functionality
 */

import { describe, expect, test, beforeEach } from "vitest";
import { CLIInterface } from "../../src/interfaces/cli.js";

describe("CLIInterface", () => {
	let cli: CLIInterface;

	beforeEach(() => {
		cli = new CLIInterface();
	});

	test("creates CLI interface", () => {
		expect(cli).toBeDefined();
	});

	test("registers commands", () => {
		cli.registerCommand({
			name: "test",
			description: "Test command",
			arguments: ["arg1"],
			options: {},
			execute: async () => {},
		});

		const commands = cli.listCommands();
		expect(commands).toContain("test");
	});

	test("executes registered command", async () => {
		cli.registerCommand({
			name: "hello",
			description: "Say hello",
			arguments: [],
			options: {},
			execute: async () => {},
		});

		const result = await cli.executeCommand("hello");

		expect(result).toContain("executed successfully");
	});

	test("returns error for unknown command", async () => {
		const result = await cli.executeCommand("unknown");

		expect(result).toContain("Unknown command");
	});

	test("parses command arguments", async () => {
		let receivedArgs: string[] = [];

		cli.registerCommand({
			name: "process",
			description: "Process data",
			arguments: ["file"],
			options: {},
			execute: async (args) => {
				receivedArgs = args;
			},
		});

		await cli.executeCommand("process data.txt");

		expect(receivedArgs).toContain("data.txt");
	});

	test("parses command options", async () => {
		let receivedOptions: Record<string, unknown> = {};

		cli.registerCommand({
			name: "run",
			description: "Run task",
			arguments: [],
			options: { verbose: { type: "boolean", description: "Verbose output" } },
			execute: async (_args, options) => {
				receivedOptions = options;
			},
		});

		await cli.executeCommand("run --verbose");

		expect(receivedOptions.verbose).toBe(true);
	});

	test("registers command aliases", async () => {
		cli.registerCommand({
			name: "verbose",
			description: "Verbose command",
			arguments: [],
			options: {},
			execute: async () => {},
		});

		cli.registerAlias("v", "verbose");

		const result = await cli.executeCommand("v");

		expect(result).toContain("executed successfully");
	});

	test("lists all commands", () => {
		cli.registerCommand({
			name: "cmd1",
			description: "Command 1",
			arguments: [],
			options: {},
			execute: async () => {},
		});

		cli.registerCommand({
			name: "cmd2",
			description: "Command 2",
			arguments: [],
			options: {},
			execute: async () => {},
		});

		const commands = cli.listCommands();

		expect(commands).toContain("cmd1");
		expect(commands).toContain("cmd2");
	});

	test("gets command help", () => {
		cli.registerCommand({
			name: "test",
			description: "Test description",
			arguments: ["arg1", "arg2"],
			options: {
				verbose: { type: "boolean", description: "Verbose output" },
			},
			execute: async () => {},
		});

		const help = cli.getCommandHelp("test");

		expect(help).toContain("test");
		expect(help).toContain("Test description");
		expect(help).toContain("verbose");
	});

	test("tracks command history", async () => {
		cli.registerCommand({
			name: "test",
			description: "Test",
			arguments: [],
			options: {},
			execute: async () => {},
		});

		await cli.executeCommand("test");

		const history = cli.getHistory(10);

		expect(history.length).toBeGreaterThan(0);
		expect(history[history.length - 1].command).toBe("test");
	});

	test("limits history size", async () => {
		cli.registerCommand({
			name: "test",
			description: "Test",
			arguments: [],
			options: {},
			execute: async () => {},
		});

		for (let i = 0; i < 150; i++) {
			await cli.executeCommand("test");
		}

		const history = cli.getHistory(100);

		expect(history.length).toBeLessThanOrEqual(100);
	});

	test("clears history", async () => {
		cli.registerCommand({
			name: "test",
			description: "Test",
			arguments: [],
			options: {},
			execute: async () => {},
		});

		await cli.executeCommand("test");
		cli.clearHistory();

		const history = cli.getHistory(10);

		expect(history.length).toBe(0);
	});

	test("validates required options", async () => {
		cli.registerCommand({
			name: "test",
			description: "Test",
			arguments: [],
			options: {
				required: { type: "string", description: "Required option", required: true },
			},
			execute: async () => {},
		});

		const result = await cli.executeCommand("test");

		expect(result).toContain("Missing required option");
	});

	test("handles command execution errors", async () => {
		cli.registerCommand({
			name: "fail",
			description: "Failing command",
			arguments: [],
			options: {},
			execute: async () => {
				throw new Error("Command failed");
			},
		});

		const result = await cli.executeCommand("fail");

		expect(result).toContain("Error executing command");
	});

	test("returns help for unknown command", () => {
		const help = cli.getCommandHelp("nonexistent");

		expect(help).toBeNull();
	});
});
