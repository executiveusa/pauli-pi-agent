/**
 * Knowledge Graph Module
 * Exports: entity extractor, graph manager, types
 */

export { EntityExtractor, createEntityExtractor } from "./extractor.js";
export { GraphManager, createGraphManager } from "./graph.js";
export type {
	Entity,
	Relationship,
	KnowledgeGraph,
	ExtractionResult,
	GraphQuery,
	GraphQueryResult,
} from "./types.js";
