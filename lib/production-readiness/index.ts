/**
 * Production Readiness — Public API
 *
 * Runs 30+ checks across security, performance, reliability,
 * maintainability, observability, and deployment categories.
 * Returns a scored report with a concrete checklist.
 */

export * from "./types.js";
export { checkProductionReadiness } from "./checker.js";
