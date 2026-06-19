/**
 * Project Audit — Public API
 *
 * Inspects a repository and returns a structured ProjectAudit
 * covering tech stack, completeness, revenue opportunities,
 * security issues, and production readiness signals.
 */

export * from "./types.js";
export { auditProject } from "./auditor.js";
