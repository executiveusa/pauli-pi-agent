/**
 * Browser Validation — Public API
 *
 * Orchestrates Chrome DevTools MCP to validate a deployed URL:
 * screenshots at all viewports, broken link detection, console error
 * collection, accessibility DOM inspection, performance timing,
 * form validation, and API failure monitoring.
 */

export * from "./types.js";
export { validateInBrowser } from "./validator.js";
