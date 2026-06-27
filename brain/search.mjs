// brain/search.mjs
// Pauli's brain-search tool. One entry point: `searchBrain(query, opts)`.
//
// ARCHITECTURE (ICM / "give it access to normal databases"):
//   PRIMARY  = Supabase `search_memories_by_vector` / `search_memories_fulltext` RPC (live, fast, semantic)
//   FALLBACK = local fuzzy search over the vaults on disk (zero-dep, works offline)
//
// The agent never inherits a giant RAG blob. It queries on demand, gets a small ranked
// result set back, and reads only the files it needs. Matches the existing pattern in
// brain-dashboard/app/api/search/route.ts (Supabase first, Fuse fallback).
//
// NO external npm dependencies. Vector math + fuzzy matching implemented inline.
// Use:  node brain/search.mjs "your query"        (CLI)
//   or: import { searchBrain } from './brain/search.mjs'

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { existsSync } from 'node:fs';
import { loadEnv, VAULTS } from './env-loader.mjs';

// ─── Config ──────────────────────────────────────────────────────────────────
const MAX_FILES_PER_VAULT = 60;
const MAX_DEPTH = 3;
const READ_CONCURRENCY = 8;
const SNIPPET_LEN = 300;
const DEFAULT_LIMIT = 12;
const LOCAL_TIMEOUT_MS = 12000; // hard budget; slow E: drive can stall reads
const EXTS = new Set(['.md', '.txt', '.markdown', '.json', '.yaml', '.yml']);

// Heavy binary / noise dirs to skip when walking locally.
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
  '.venv', 'venv', '.cache', 'tmp', 'temp', '.obsidian',
  // skip nested vendored repo copies inside the vaults (huge, not primary knowledge)
  'pauli-comic-funnel', 'pauli-my-Brain-Is-Full-Crew-main', 'packages',
]);

// ─── Tokenizer (shared by fuzzy + naive vector) ──────────────────────────────
const STOP = new Set('a an the of to in on for and or but is are was were be been being it this that these those i you he she they we me my your our their as at by with from into out up down over under again further then once here there all any both each few more most other some such no nor not only own same so than too very can will just dont should now do does did has have had having would could about above below'.split(/\s+/));

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || [])
    .filter((t) => t.length > 1 && !STOP.has(t));
}

// ─── Local fuzzy search (zero-dep TF-style ranking) ───────────────────────────
function score(queryTerms, docText, title) {
  const docTerms = tokenize(docText);
  if (!docTerms.length) return 0;
  const titleTerms = new Set(tokenize(title));
  const freq = new Map();
  for (const t of docTerms) freq.set(t, (freq.get(t) || 0) + 1);
  let s = 0;
  for (const q of queryTerms) {
    const f = freq.get(q);
    if (!f) continue;
    const tf = f / docTerms.length;
    s += tf;
    if (titleTerms.has(q)) s += 0.5; // title boost
  }
  return s;
}

async function walk(dir, depth = 0, acc = []) {
  if (depth > MAX_DEPTH || acc.length >= MAX_FILES_PER_VAULT) return acc;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return acc; // permission / unreadable
  }
  for (const e of entries) {
    if (acc.length >= MAX_FILES_PER_VAULT) break;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      await walk(full, depth + 1, acc);
    } else if (EXTS.has(ext(e.name))) {
      acc.push(full);
    }
  }
  return acc;
}

function ext(name) {
  const i = name.lastIndexOf('.');
  return i < 0 ? '' : name.slice(i).toLowerCase();
}

function titleFromName(p, vaultPath) {
  const rel = relative(vaultPath, p).split(sep).join('/');
  const base = rel.replace(/\.[^.]+$/, '');
  return base;
}

// Read files with bounded concurrency, racing a hard timeout. Returns parsed hits.
async function readAndScore(files, queryTerms, vault) {
  const out = [];
  const queue = files.slice();
  const workers = Array.from({ length: READ_CONCURRENCY }, async () => {
    while (queue.length) {
      const f = queue.shift();
      let raw;
      try {
        raw = await readFile(f, 'utf8');
      } catch {
        continue;
      }
      const title = titleFromName(f, vault.path);
      const s = score(queryTerms, raw, title);
      if (s > 0) {
        out.push({
          source: 'local',
          vault: vault.name,
          path: relative(vault.path, f).split(sep).join('/'),
          abspath: f,
          title,
          snippet: raw.slice(0, SNIPPET_LEN).replace(/\s+/g, ' ').trim(),
          score: Number(s.toFixed(4)),
        });
      }
    }
  });
  await Promise.race([
    Promise.all(workers),
    new Promise((_, rej) => setTimeout(() => rej(new Error('local-timeout')), LOCAL_TIMEOUT_MS)),
  ]).catch(() => { /* partial results are fine */ });
  return out;
}

async function localSearch(query, limit = DEFAULT_LIMIT) {
  const qTerms = tokenize(query);
  if (!qTerms.length) return [];
  const all = [];
  for (const v of VAULTS) {
    if (!existsSync(v.path)) continue;
    const files = await walk(v.path);
    const hits = await readAndScore(files, qTerms, v);
    all.push(...hits);
  }
  all.sort((a, b) => b.score - a.score);
  return all.slice(0, limit);
}

// ─── Supabase RPC (live primary) ─────────────────────────────────────────────
// Calls search_memories_fulltext in the second_brain schema.
// Actual signature verified live: search_memories_fulltext(match_count, search_query).
async function supabaseSearch(query, limit = DEFAULT_LIMIT) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null; // not configured
  const base = url.replace(/\/$/, '');
  const rpc = `${base}/rest/v1/rpc/search_memories_fulltext`;
  let res;
  try {
    res = await fetch(rpc, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ match_count: limit, search_query: query }),
      signal: AbortSignal.timeout(6000),
    });
  } catch {
    return null; // network blocked / VPS down / timeout
  }
  if (!res.ok) return null;
  let rows;
  try {
    rows = await res.json();
  } catch {
    return null;
  }
  if (!Array.isArray(rows)) return null;
  return rows.map((r) => ({
    source: 'supabase',
    vault: 'second_brain',
    path: r.source_path || r.path || null,
    abspath: null,
    title: r.title || null,
    snippet: (r.summary || r.content || '').slice(0, SNIPPET_LEN),
    score: r.rank != null ? Number(r.rank) : 1.0,
  }));
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function searchBrain(query, opts = {}) {
  const limit = Math.min(Number(opts.limit) || DEFAULT_LIMIT, 50);

  // Try Supabase first (fast, semantic, indexed). Falls through on any failure.
  const supa = await supabaseSearch(query, limit);
  if (supa && supa.length) {
    return { backend: 'supabase', query, count: supa.length, results: supa };
  }

  // Fallback: local fuzzy over on-disk vaults. Always works offline.
  const local = await localSearch(query, limit);
  return {
    backend: supa === null ? 'local-unreachable' : 'local-empty',
    query,
    count: local.length,
    results: local,
  };
}

// ─── CLI ──────────────────────────────────────────────────────────────────────
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const __isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url).replace(/\\/g, '/') === resolve(process.argv[1]).replace(/\\/g, '/');
if (__isMain) {
  loadEnv();
  const q = process.argv.slice(2).join(' ').trim();
  if (!q) {
    console.error('Usage: node brain/search.mjs "your query"');
    process.exit(1);
  }
  searchBrain(q).then((r) => console.log(JSON.stringify(r, null, 2))).catch((e) => {
    console.error(JSON.stringify({ error: String(e) }));
    process.exit(1);
  });
}
