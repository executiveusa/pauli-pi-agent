/**
 * Monetization — Public API
 *
 * Analyzes a ProjectAudit and generates a structured MonetizationStrategy
 * with primary/secondary/tertiary revenue paths, subscription tiers,
 * affiliate programs, lead gen mechanisms, partnerships, and marketplaces.
 */

export * from "./types.js";
export { analyzeMonetization } from "./analyzer.js";
