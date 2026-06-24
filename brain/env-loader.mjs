// brain/env-loader.mjs
// Loads secrets + vault paths into process.env without EVER echoing values.
// Priority: real process.env > .env file > COSMOS_VAULT (keys only, never printed).
//
// DESIGN (ICM): the agent reads its keys from disk at runtime. We never log values.
// Keys we recognize (added to process.env if present in COSMOS_VAULT but not already set):
const ALLOWED = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'DATABASE_URL',
  'OPEN_ROUTER_API',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'TAILSCALE_API_KEY',
];

import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve the agent repo root from this module's location (brain/ → repo root),
// so .env loads correctly regardless of process.cwd().
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(__dirname);

// Vaults are the agent's knowledge sources (E:\ paths from your machine).
export const VAULTS = [
  { name: 'mental-models', path: 'E:\\MENTAL MODELS' },
  { name: 'obsidian-second-brain', path: 'E:\\OBSIDIAN SECOND BRAIN' },
];

function parseEnvFile(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    // strip matching surrounding quotes
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function readEnvIfPresent(p) {
  try {
    if (existsSync(p)) return parseEnvFile(readFileSync(p, 'utf8'));
  } catch {
    /* ignore unreadable env files */
  }
  return null;
}

export function loadEnv() {
  // 1. Local repo .env (highest priority among files) — resolved from this module, not cwd.
  const localEnv = readEnvIfPresent(join(REPO_ROOT, '.env')) || {};

  // 2. Cosmos vault (the unified secrets file)
  const cosmosCandidates = [
    process.env.COSMOS_VAULT,
    'E:\\THE PAULI FILES\\Cosmos_Vault.env',
    join(homedir(), 'THE PAULI FILES', 'Cosmos_Vault.env'),
  ];
  let cosmos = {};
  for (const p of cosmosCandidates) {
    if (!p) continue;
    const got = readEnvIfPresent(p);
    if (got) {
      cosmos = got;
      break;
    }
  }

  // 3. Merge: real process.env wins, then local .env, then cosmos. ALLOWED keys only.
  for (const key of ALLOWED) {
    if (process.env[key]) continue; // already set by environment
    const v = localEnv[key] ?? cosmos[key];
    if (v && v.length > 0) process.env[key] = v;
  }

  return {
    cosmosFound: Object.keys(cosmos).length > 0,
    localEnvFound: Object.keys(localEnv).length > 0,
    keysLoaded: ALLOWED.filter((k) => !!process.env[k]),
  };
}

// Quick standalone run: prints ONLY which keys are loaded, never values.
import { fileURLToPath as __fmt } from 'node:url';
import { resolve as __resolve } from 'node:path';
const __isMain =
  process.argv[1] &&
  __fmt(import.meta.url).replace(/\\/g, '/') === __resolve(process.argv[1]).replace(/\\/g, '/');
if (__isMain) {
  const r = loadEnv();
  console.log(JSON.stringify({
    cosmosFound: r.cosmosFound,
    localEnvFound: r.localEnvFound,
    keysLoaded: r.keysLoaded,
    vaults: VAULTS.map((v) => ({ name: v.name, path: v.path })),
  }, null, 2));
}
