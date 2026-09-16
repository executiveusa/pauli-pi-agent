#!/usr/bin/env node

import { appendFile, mkdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import readline from "node:readline";

const SERVER_NAME = "context-mesh";
const SERVER_VERSION = "0.1.0";
const DEFAULT_GRAPH = resolve(process.env.CONTEXT_MESH_GRAPH || "graphify-out/graph.json");
const DEFAULT_EVENTS = resolve(
  process.env.CONTEXT_MESH_EVENTS || `${homedir()}/.contextmesh/events.jsonl`,
);

function normalize(value) {
  return String(value ?? "").toLowerCase();
}

function words(value) {
  return normalize(value)
    .split(/[^a-z0-9_@./:-]+/i)
    .filter((part) => part.length > 1);
}

function nodeId(node, index) {
  return String(node?.id ?? node?.name ?? node?.label ?? `node-${index}`);
}

function nodeLabel(node) {
  return String(node?.label ?? node?.name ?? node?.title ?? node?.id ?? "unknown");
}

function edgeSource(edge) {
  return String(edge?.source ?? edge?.from ?? edge?.source_id ?? "");
}

function edgeTarget(edge) {
  return String(edge?.target ?? edge?.to ?? edge?.target_id ?? "");
}

function edgeRelation(edge) {
  return String(edge?.relation ?? edge?.type ?? edge?.label ?? "related_to");
}

async function loadGraph() {
  try {
    const raw = await readFile(DEFAULT_GRAPH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
      edges: Array.isArray(parsed.edges) ? parsed.edges : [],
      graphPath: DEFAULT_GRAPH,
      available: true,
    };
  } catch (error) {
    return {
      nodes: [],
      edges: [],
      graphPath: DEFAULT_GRAPH,
      available: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function loadEvents() {
  try {
    const raw = await readFile(DEFAULT_EVENTS, "utf8");
    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

function compactNode(node, index) {
  return {
    id: nodeId(node, index),
    label: nodeLabel(node),
    type: node.type ?? node.kind ?? null,
    community: node.community ?? null,
    source_file: node.source_file ?? node.source ?? node.file ?? null,
    provenance: node.provenance ?? node.confidence ?? node.status ?? null,
  };
}

function scoreText(queryTerms, text) {
  const haystack = normalize(text);
  let score = 0;
  for (const term of queryTerms) {
    if (haystack.includes(term)) score += term.length > 5 ? 3 : 1;
  }
  return score;
}

async function searchBrain(query, limit = 12) {
  const graph = await loadGraph();
  const events = await loadEvents();
  const terms = words(query);
  const nodeResults = graph.nodes
    .map((node, index) => {
      const compact = compactNode(node, index);
      const score = scoreText(
        terms,
        `${compact.label} ${compact.type ?? ""} ${compact.source_file ?? ""} ${JSON.stringify(node)}`,
      );
      return { score, node: compact };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const eventResults = events
    .map((event) => ({
      score: scoreText(terms, JSON.stringify(event)),
      event,
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    query,
    graph_available: graph.available,
    graph_path: graph.graphPath,
    nodes: nodeResults,
    events: eventResults,
  };
}

async function findEntity(name) {
  const graph = await loadGraph();
  const needle = normalize(name);
  const indexedNodes = graph.nodes.map((node, index) => ({ node, index, id: nodeId(node, index) }));
  let hit = indexedNodes.find(({ node, id }) => normalize(nodeLabel(node)) === needle || normalize(id) === needle);
  if (!hit) {
    hit = indexedNodes.find(({ node, id }) => normalize(nodeLabel(node)).includes(needle) || normalize(id).includes(needle));
  }
  if (!hit) return { found: false, query: name };

  const connected = graph.edges
    .filter((edge) => edgeSource(edge) === hit.id || edgeTarget(edge) === hit.id)
    .slice(0, 100)
    .map((edge) => ({
      source: edgeSource(edge),
      relation: edgeRelation(edge),
      target: edgeTarget(edge),
      provenance: edge.provenance ?? edge.confidence ?? edge.status ?? null,
      source_file: edge.source_file ?? edge.file ?? null,
    }));

  return {
    found: true,
    node: compactNode(hit.node, hit.index),
    edges: connected,
  };
}

async function findPath(fromName, toName, maxHops = 6) {
  const graph = await loadGraph();
  const nodes = graph.nodes.map((node, index) => ({ node, index, id: nodeId(node, index) }));
  const resolveName = (value) => {
    const needle = normalize(value);
    return (
      nodes.find(({ node, id }) => normalize(nodeLabel(node)) === needle || normalize(id) === needle) ??
      nodes.find(({ node, id }) => normalize(nodeLabel(node)).includes(needle) || normalize(id).includes(needle))
    );
  };
  const start = resolveName(fromName);
  const goal = resolveName(toName);
  if (!start || !goal) {
    return { found: false, reason: "entity_not_found", from: fromName, to: toName };
  }

  const adjacency = new Map();
  for (const edge of graph.edges) {
    const source = edgeSource(edge);
    const target = edgeTarget(edge);
    if (!source || !target) continue;
    const forward = { from: source, relation: edgeRelation(edge), to: target };
    const reverse = { from: target, relation: `<-${edgeRelation(edge)}-`, to: source };
    adjacency.set(source, [...(adjacency.get(source) ?? []), forward]);
    adjacency.set(target, [...(adjacency.get(target) ?? []), reverse]);
  }

  const queue = [{ id: start.id, steps: [] }];
  const seen = new Set([start.id]);
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    if (current.id === goal.id) {
      return { found: true, from: start.id, to: goal.id, hops: current.steps.length, path: current.steps };
    }
    if (current.steps.length >= maxHops) continue;
    for (const next of adjacency.get(current.id) ?? []) {
      if (seen.has(next.to)) continue;
      seen.add(next.to);
      queue.push({ id: next.to, steps: [...current.steps, next] });
    }
  }
  return { found: false, reason: "no_path_within_budget", from: start.id, to: goal.id, max_hops: maxHops };
}

async function remember({ text, kind = "event", project = null, tags = [], source = "agent" }) {
  await mkdir(dirname(DEFAULT_EVENTS), { recursive: true });
  const event = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    occurred_at: new Date().toISOString(),
    kind,
    project,
    tags,
    source,
    text,
  };
  await appendFile(DEFAULT_EVENTS, `${JSON.stringify(event)}\n`, "utf8");
  return event;
}

async function recent(limit = 20, project = null) {
  const events = await loadEvents();
  const filtered = project
    ? events.filter((event) => normalize(event.project) === normalize(project))
    : events;
  return filtered.slice(-limit).reverse();
}

async function sourcesFor(entity) {
  const result = await findEntity(entity);
  if (!result.found) return result;
  const sources = new Set();
  if (result.node.source_file) sources.add(result.node.source_file);
  for (const edge of result.edges) {
    if (edge.source_file) sources.add(edge.source_file);
  }
  return { entity: result.node, sources: [...sources] };
}

async function contextPack(query, budget = 6000) {
  const search = await searchBrain(query, 24);
  const payload = {
    query,
    nodes: search.nodes,
    events: search.events,
  };
  const serialized = JSON.stringify(payload, null, 2);
  if (serialized.length <= budget) return payload;
  return {
    query,
    truncated: true,
    budget_chars: budget,
    context: serialized.slice(0, budget),
  };
}

const tools = [
  {
    name: "brain_search",
    description: "Search the shared context graph and append-only agent memory without vector RAG.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 12 },
      },
      required: ["query"],
    },
  },
  {
    name: "brain_entity",
    description: "Resolve an entity and return its directly connected graph relationships.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    },
  },
  {
    name: "brain_path",
    description: "Trace a graph path between two entities using bounded breadth-first traversal.",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string" },
        to: { type: "string" },
        max_hops: { type: "integer", minimum: 1, maximum: 12, default: 6 },
      },
      required: ["from", "to"],
    },
  },
  {
    name: "brain_sources",
    description: "Return source files/provenance references attached to an entity.",
    inputSchema: {
      type: "object",
      properties: { entity: { type: "string" } },
      required: ["entity"],
    },
  },
  {
    name: "brain_recent",
    description: "Read the newest append-only memory events, optionally scoped to a project.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        project: { type: ["string", "null"] },
      },
    },
  },
  {
    name: "brain_remember",
    description: "Append a durable memory event. Use for decisions, task outcomes, changes, and verified facts; never store secrets.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        kind: { type: "string", default: "event" },
        project: { type: ["string", "null"] },
        tags: { type: "array", items: { type: "string" }, default: [] },
        source: { type: "string", default: "agent" },
      },
      required: ["text"],
    },
  },
  {
    name: "brain_context",
    description: "Assemble a compact just-in-time context pack for an agent question.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        budget_chars: { type: "integer", minimum: 1000, maximum: 30000, default: 6000 },
      },
      required: ["query"],
    },
  },
  {
    name: "brain_status",
    description: "Report configured graph/event stores and basic counts.",
    inputSchema: { type: "object", properties: {} },
  },
];

function textResult(value) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

async function callTool(name, args = {}) {
  switch (name) {
    case "brain_search":
      return textResult(await searchBrain(args.query, args.limit ?? 12));
    case "brain_entity":
      return textResult(await findEntity(args.name));
    case "brain_path":
      return textResult(await findPath(args.from, args.to, args.max_hops ?? 6));
    case "brain_sources":
      return textResult(await sourcesFor(args.entity));
    case "brain_recent":
      return textResult(await recent(args.limit ?? 20, args.project ?? null));
    case "brain_remember":
      return textResult(await remember(args));
    case "brain_context":
      return textResult(await contextPack(args.query, args.budget_chars ?? 6000));
    case "brain_status": {
      const graph = await loadGraph();
      const events = await loadEvents();
      return textResult({
        server: `${SERVER_NAME}@${SERVER_VERSION}`,
        graph: { path: graph.graphPath, available: graph.available, nodes: graph.nodes.length, edges: graph.edges.length },
        events: { path: DEFAULT_EVENTS, count: events.length },
      });
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function selfTest() {
  const status = await callTool("brain_status", {});
  process.stdout.write(`${status.content[0].text}\n`);
}

if (process.argv.includes("--self-test")) {
  await selfTest();
  process.exit(0);
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of rl) {
  if (!line.trim()) continue;
  let request;
  try {
    request = JSON.parse(line);
  } catch {
    continue;
  }

  if (request.method?.startsWith("notifications/")) continue;
  const id = request.id;
  try {
    let result;
    switch (request.method) {
      case "initialize":
        result = {
          protocolVersion: request.params?.protocolVersion ?? "2025-11-25",
          capabilities: { tools: {} },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        };
        break;
      case "ping":
        result = {};
        break;
      case "tools/list":
        result = { tools };
        break;
      case "tools/call":
        result = await callTool(request.params?.name, request.params?.arguments ?? {});
        break;
      default:
        throw Object.assign(new Error(`Method not found: ${request.method}`), { code: -32601 });
    }
    process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
  } catch (error) {
    process.stdout.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        id,
        error: {
          code: error?.code ?? -32000,
          message: error instanceof Error ? error.message : String(error),
        },
      })}\n`,
    );
  }
}
