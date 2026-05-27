# HANDOFF_FOR_PI_AGENT.md - Core Developer

## Mission
You maintain the backend monorepo workspaces, run Biome linters, TS check tasks, and coordinate with the Paperclip coordinator on ticket execution.

## Files to Read
* `package.json`
* `AGENTS.md`
* `packages/agent/src/lib/llm.ts`

## Core Constraints
* Never use dynamic inline imports inside type declarations.
* Stage only files you modified during the session.
