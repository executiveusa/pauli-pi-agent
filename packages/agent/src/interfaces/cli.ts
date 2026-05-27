/**
 * CLI Interface
 * Command-line interface for agent control
 */

import type { CLICommand } from "./types.js";

export class CLIInterface {
	private commands: Map<string, CLICommand> = new Map();
	private aliases: Map<string, string> = new Map();
	private history: Array<{ command: string; timestamp: Date; result: string }> = [];
	private maxHistorySize: number = 100;

	registerCommand(command: CLICommand): void {
		this.commands.set(command.name, command);
	}

	registerAlias(alias: string, commandName: string): void {
		this.aliases.set(alias, commandName);
	}

	async executeCommand(input: string): Promise<string> {
		const startTime = Date.now();

		try {
			const parts = input.trim().split(/\s+/);
			let commandName = parts[0];

			// Resolve aliases
			if (this.aliases.has(commandName)) {
				commandName = this.aliases.get(commandName)!;
			}

			const command = this.commands.get(commandName);
			if (!command) {
				return `Unknown command: ${commandName}`;
			}

			// Parse arguments and options
			const args: string[] = [];
			const options: Record<string, unknown> = {};

			for (let i = 1; i < parts.length; i++) {
				const part = parts[i];
				if (part.startsWith("--")) {
					const [key, value] = part.substring(2).split("=");
					options[key] = value || true;
				} else if (part.startsWith("-")) {
					options[part.substring(1)] = true;
				} else {
					args.push(part);
				}
			}

			// Validate required options
			for (const [optName, optConfig] of Object.entries(command.options)) {
				if ((optConfig as any).required && !(optName in options)) {
					return `Missing required option: --${optName}`;
				}
			}

			// Execute command
			await command.execute(args, options);
			const result = `Command '${commandName}' executed successfully`;
			const duration = Date.now() - startTime;

			// Store in history
			this.addToHistory(commandName, `${result} (${duration}ms)`);

			return `${result}`;
		} catch (error) {
			const errorMessage = `Error executing command: ${String(error)}`;
			this.addToHistory(input, errorMessage);
			return errorMessage;
		}
	}

	private addToHistory(command: string, result: string): void {
		this.history.push({ command, timestamp: new Date(), result });

		// Trim history if needed
		if (this.history.length > this.maxHistorySize) {
			this.history.shift();
		}
	}

	listCommands(): string[] {
		return Array.from(this.commands.keys());
	}

	getCommandHelp(commandName: string): string | null {
		const command = this.commands.get(commandName);
		if (!command) return null;

		let help = `Command: ${command.name}\n`;
		help += `Description: ${command.description}\n`;

		if (command.arguments.length > 0) {
			help += `Arguments: ${command.arguments.join(", ")}\n`;
		}

		if (Object.keys(command.options).length > 0) {
			help += "Options:\n";
			for (const [optName, optConfig] of Object.entries(command.options)) {
				help += `  --${optName} (${(optConfig as any).type}): ${(optConfig as any).description}\n`;
			}
		}

		return help;
	}

	getHistory(limit: number = 10): Array<{ command: string; timestamp: Date; result: string }> {
		return this.history.slice(-limit);
	}

	clearHistory(): void {
		this.history = [];
	}
}

export function createCLIInterface(): CLIInterface {
	return new CLIInterface();
}
