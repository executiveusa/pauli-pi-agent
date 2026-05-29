/**
 * Knowledge Graph Module
 * Exports: entity extractor, graph manager, types
 */

export { createEntityExtractor, EntityExtractor } from "./extractor.js";
export { createGraphManager, GraphManager } from "./graph.js";
export type {
	Entity,
	ExtractionResult,
	GraphQuery,
	GraphQueryResult,
	KnowledgeGraph,
	Relationship,
} from "./types.js";
