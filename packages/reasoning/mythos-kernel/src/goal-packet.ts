import { z } from "zod";
import type { GoalPacket } from "./types.js";
import { MythosDepth } from "./types.js";

// Validation schema
const GoalPacketSchema = z.object({
	userQuery: z.string().min(1, "Query cannot be empty"),
	taskType: z.string().min(1),
	initialDepth: z.nativeEnum(MythosDepth),
	maxDepth: z.nativeEnum(MythosDepth),
	maxLoops: z.number().int().min(1).max(10),
	tokenBudget: z.number().int().min(1000),
	costBudget: z.number().positive(),
	persona: z.string().optional(),
	constraints: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
	evidenceRequirements: z.array(z.string()).default([]),
});

export class GoalPacketFactory {
	static create(params: {
		userQuery: string;
		taskType: string;
		initialDepth: MythosDepth;
		maxDepth: MythosDepth;
		maxLoops: number;
		tokenBudget: number;
		costBudget: number;
		persona?: string;
		constraints?: Record<string, string | number | boolean>;
		evidenceRequirements?: string[];
	}): GoalPacket {
		// Validate input
		const validated = GoalPacketSchema.parse(params);

		// Ensure depth ordering: initialDepth <= maxDepth
		if (this.depthOrder(validated.initialDepth) > this.depthOrder(validated.maxDepth)) {
			throw new Error(
				`initialDepth (${validated.initialDepth}) cannot exceed maxDepth (${validated.maxDepth})`
			);
		}

		const id = this.generateId();
		const createdAt = new Date();
		const createdTimestamp = Date.now();

		// Create immutable packet
		const packet: GoalPacket = Object.freeze({
			id,
			createdAt,
			userQuery: validated.userQuery,
			taskType: validated.taskType,
			initialDepth: validated.initialDepth,
			maxDepth: validated.maxDepth,
			maxLoops: validated.maxLoops,
			tokenBudget: validated.tokenBudget,
			costBudget: validated.costBudget,
			persona: validated.persona,
			constraints: Object.freeze(validated.constraints || {}) as Record<string, string | number | boolean>,
			evidenceRequirements: [...(validated.evidenceRequirements || [])],
			createdTimestamp,
		});

		return packet;
	}

	static validate(packet: unknown): packet is GoalPacket {
		try {
			GoalPacketSchema.parse(packet);
			return true;
		} catch {
			return false;
		}
	}

	static isImmutable(packet: GoalPacket): boolean {
		return Object.isFrozen(packet) && Object.isFrozen(packet.constraints);
	}

	private static depthOrder(depth: MythosDepth): number {
		const order = [
			MythosDepth.INSTANT,
			MythosDepth.FAST,
			MythosDepth.NORMAL,
			MythosDepth.DEEP,
			MythosDepth.MYTHIC,
		];
		return order.indexOf(depth);
	}

	private static generateId(): string {
		return `goal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	}
}
