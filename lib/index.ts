/**
 * Pauli Pi Software Factory — Core Library
 *
 * Re-exports all lib modules for convenient single-import usage:
 *
 *   import { auditProject, calculateOverallScore, validateInBrowser, analyzeMonetization } from '@pi/lib'
 *
 * Module breakdown:
 *   mcp-cli            — Wrappers for all MCP tools (GitHub, Supabase, Vercel, Cloudflare, Browser)
 *   scoring            — UDEC / MOT / ACC scoring (0-10 scales) + overall composite score
 *   project-audit      — Full project audit: tech stack, completeness, debt, security
 *   production-readiness — 30+ production checks across 6 categories
 *   monetization       — Revenue strategy generation from audit data
 *   browser-validation — Chrome DevTools-based browser validation pipeline
 */

// MCP CLI — tool wrappers and registry
export * from "./mcp-cli/index.js";

// Scoring
export * from "./scoring/index.js";

// Project Audit
export * from "./project-audit/index.js";

// Production Readiness
export * from "./production-readiness/index.js";

// Monetization
export * from "./monetization/index.js";

// Browser Validation
export * from "./browser-validation/index.js";
