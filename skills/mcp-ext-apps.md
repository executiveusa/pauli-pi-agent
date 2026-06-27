# Skill: MCP Apps (ext-apps) — Interactive UI in Chat

> **Source:** https://github.com/modelcontextprotocol/ext-apps
> **Status:** Reference only — NOT cloned into the agent. Lazy-load when needed.
> **Category:** MCP / Interactive Apps
> **Leverage:** 9/10 · **Confidence:** high

---

## What it is

MCP Apps is a protocol + SDK for serving **interactive UIs** (charts, forms, design canvases, video players) from MCP servers, rendered inline in compliant chat hosts (Claude, ChatGPT, VS Code, Goose, Postman).

## How it works

1. **Tool definition** — Your MCP tool declares a `ui://` resource containing its HTML interface
2. **Tool call** — The LLM calls the tool on your server
3. **Host renders** — The host fetches the resource and displays it in a sandboxed iframe
4. **Bidirectional comms** — Host passes tool data to the UI via notifications; the UI can call other tools through the host

## SDK packages

| Package | Role |
|---------|------|
| `@modelcontextprotocol/ext-apps` | Build interactive Views (App class, PostMessageTransport) |
| `@modelcontextprotocol/ext-apps/react` | React hooks for Views (useApp, useHostStyles) |
| `@modelcontextprotocol/ext-apps/app-bridge` | Embed and communicate with Views in your chat client |
| `@modelcontextprotocol/ext-apps/server` | Register tools and resources on your MCP server |

## When to load this skill

- User asks to "add interactive UI to my MCP server"
- User wants charts/forms/canvases rendered inline in chat
- User wants to migrate an OpenAI App to MCP Apps
- User wants to turn a web app into a hybrid web + MCP App

## Install (when needed)

```bash
npm install -S @modelcontextprotocol/ext-apps
```

## Agent Skills (for building MCP Apps with AI)

The repo ships four Agent Skills — install via Claude Code plugin marketplace or any agent that supports Agent Skills:

```
/plugin marketplace add modelcontextprotocol/ext-apps
/plugin install mcp-apps@modelcontextprotocol-ext-apps
```

| Skill | What it does | Trigger |
|-------|-------------|---------|
| `create-mcp-app` | Scaffolds a new MCP App with interactive UI from scratch | "Create an MCP App" |
| `migrate-oai-app` | Converts an existing OpenAI App to use MCP Apps | "Migrate from OpenAI Apps SDK" |
| `add-app-to-server` | Adds interactive UI to an existing MCP server's tools | "Add UI to my MCP server" |
| `convert-web-app` | Turns an existing web app into a hybrid web + MCP App | "Add MCP App support to my web app" |

## Relationship to pi-web-ui's native artifacts

The pi-web-ui already has a **native artifacts system** that covers the same use case without MCP:
- `ArtifactsPanel` + `ArtifactElement` — interactive HTML/SVG/Markdown/text artifacts
- `SandboxedIframe` — sandboxed rendering surface
- `ArtifactsRuntimeProvider` — bidirectional comms between agent and artifact

**Decision rule:**
- Use **pi-web-ui native artifacts** for agent-driven asset creation (the agent writes HTML/SVG and the user interacts with it). This is already wired up.
- Use **MCP Apps (ext-apps)** when you need to serve interactive UI from a **separate MCP server** to multiple hosts (Claude, ChatGPT, etc.), not just the pi-web-ui.

## Quickstart reference

- Quickstart: https://apps.extensions.modelcontextprotocol.io/api/documents/Quickstart.html
- API Docs: https://apps.extensions.modelcontextprotocol.io/api/
- Spec (2026-01-26): https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx

## Example: register a tool with UI on an MCP server

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";

const server = new McpServer({ name: "my-server", version: "1.0.0" });

registerAppTool(server, {
  name: "budget-allocator",
  description: "Interactive budget allocator UI",
  ui: "ui://budget-allocator",  // resource URL for the HTML view
  inputSchema: { /* JSON schema for tool params */ },
  handler: async (params) => {
    // Return initial data for the UI
    return { data: params };
  },
});
```

## Run examples locally (when needed)

```bash
git clone https://github.com/modelcontextprotocol/ext-apps.git
cd ext-apps
npm install
npm start
# open http://localhost:8080/
```

## Confidence note

This is a **reference skill**. Do NOT install until a task explicitly requires serving interactive UI from an MCP server to external hosts. The pi-web-ui's native artifacts cover the in-app case.
