# Sandcastle — Multi-Instance Sandbox Runner (Reference)

> **Source:** https://github.com/mattpocock/sandcastle.git
> **Status:** Reference only — NOT cloned into the agent. Lazy-load when needed.
> **Category:** Agent Harness / Sandbox
> **Leverage:** 9/10 · **Confidence:** high

---

## What it is

Sandcastle is Matt Pocock's sandbox runner for spinning up multiple isolated agent instances simultaneously. Each instance runs in its own sandboxed environment, so you can run many agents in parallel without them interfering.

## When to load this skill

- User asks to "run multiple agents at once"
- User wants to "scale the factory" / "run overnight builds in parallel"
- User wants isolated sandboxes for each repo/project
- User asks for "sandcastle" by name

## How it fits the factory

The Pauli factory uses **one agent (Cosmos) with many folders (ICM)**. Sandcastle is the execution layer that lets Cosmos spawn parallel workers — one per repo — when multiple projects need building simultaneously.

```
Cosmos (the brain, one agent)
  ├── Sandcastle instance 1 → builds repo A (free model: Groq Llama)
  ├── Sandcastle instance 2 → builds repo B (free model: Gemini Flash)
  └── Sandcastle instance 3 → builds repo C (GLM-5.2 for big task)
```

## Install (when needed)

```bash
git clone https://github.com/mattpocock/sandcastle.git C:\Users\execu\repos\sandcastle
cd C:\Users\execu\repos\sandcastle
npm install
```

## Usage pattern (when wired)

```bash
# Spawn a sandboxed agent instance for a specific repo
node C:\Users\execu\repos\sandcastle\dist\index.js \
  --repo "E:\ACTIVE PROJECTS-PIPELINE\FACTORY\03_PIPELINE\_0_BACKLOG\my-repo" \
  --model "groq/llama-3.3-70b-versatile" \
  --task "Implement the landing page per AGENTS.md"
```

## Cost control

Each Sandcastle instance should use the smart-router to pick the cheapest model:
- **Tool calls / mechanical work** → Groq Llama (free)
- **Code generation** → DeepSeek Coder (free) or Gemini Flash (free)
- **Big refactors / architecture** → GLM-5.2 (cheap, 1M context)
- **AVOID** → Claude Opus, GPT-5.5 (expensive)

## Relationship to command-code

`command-code` (installed globally) is the project launcher. Sandcastle is the sandbox runner. Together:
1. `command-code` scaffolds a new project
2. Sandcastle runs an agent instance in that project's sandbox
3. The agent uses the smart-router to pick free/cheap models
4. Results flow back to the control bridge for observability

## Confidence note

This is a **reference skill**. Do NOT clone until a task explicitly requires parallel multi-instance execution. For single-agent work (most tasks), the control bridge alone is sufficient.
