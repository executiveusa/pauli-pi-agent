// scripts/inventory-repos.mjs
// Pull ALL repos (public + private) from GitHub, categorize + assign owner + emit a
// machine-readable JSON + a human-readable REPO_REGISTRY.md. Token from Cosmos_Vault.
import { readFileSync, writeFileSync } from 'node:fs';

const tok = (readFileSync('E:/THE PAULI FILES/Cosmos_Vault.env', 'utf8')
  .match(/^GH_PAT=(.+)$/m)[1]).trim();

// ── Page all repos via GraphQL ───────────────────────────────────────────────
const all = [];
let endCursor = null;
for (let i = 0; i < 12; i++) {
  const q = `query($after:String){viewer{repositories(first:100, after:$after, ownerAffiliations:[OWNER], isFork:false){pageInfo{endCursor hasNextPage}nodes{name isPrivate primaryLanguage{name} description updatedAt pushedAt url stargazerCount}}}}`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q, variables: { after: endCursor } }),
    signal: AbortSignal.timeout(20000),
  }).then((r) => r.json());
  if (res.errors || !res.data) { console.log(JSON.stringify(res).slice(0, 400)); break; }
  const nodes = res.data.viewer.repositories.nodes;
  all.push(...nodes);
  if (!res.data.viewer.repositories.pageInfo.hasNextPage) break;
  endCursor = res.data.viewer.repositories.pageInfo.endCursor;
}

// ── Categorize + assign owner + status heuristic ─────────────────────────────
// Owner model: Bambu(US) | Akash(India/backend) | Mexico(wife/LatAm) | Cosmos(infra/agent)
function owner(name, desc = '') {
  const n = name.toLowerCase();
  const d = (desc || '').toLowerCase();
  if (/akash|engabha/.test(n + d)) return 'Akash';
  if (/kupuri|monarca|rebana|pizza-cubana|cubana|cdmx|metamorphsis|suelta|vallarta|veracruz|mexico|pina|latam|español|spanish/.test(n + d)) return 'Mexico';
  if (/^pauli|^cosmos|archonx|archon|brain|agent-|skill|vault|secret|mcp|orgo|hermes|shockwave|pipeline|factory|node$/.test(n)) return 'Cosmos';
  return 'Bambu'; // default: client/US projects
}
function category(name, desc = '') {
  const n = name.toLowerCase(); const d = (desc || '').toLowerCase();
  if (/agent|orchestrat|swarm|crew/.test(n + d)) return 'agent-infra';
  if (/skill|tool/.test(n + d)) return 'skill';
  if (/vault|secret|cosmos|infra|deploy|gateway|mcp|orgo/.test(n + d)) return 'infra';
  if (/landing|site|website|portfolio|directory|template/.test(n + d)) return 'website';
  if (/shop|store|ecommerce|commerce|product|order/.test(n + d)) return 'ecommerce';
  if (/blog|media|content|postiz|youtube|podcast|video/.test(n + d)) return 'content';
  if (/crm|lead|funnel|outreach/.test(n + d)) return 'sales';
  return 'project';
}
function status(repo) {
  // heuristic from last push + stars
  const daysSince = (Date.now() - new Date(repo.pushedAt).getTime()) / 86400000;
  if (repo.stargazerCount > 2) return 'active';
  if (daysSince < 14) return 'in-progress';
  if (daysSince < 90) return 'stale';
  return 'dormant';
}

const categorized = all.map((r) => ({
  name: r.name, private: r.isPrivate,
  lang: r.primaryLanguage?.name || 'Unknown',
  desc: (r.description || '').slice(0, 120),
  url: r.url, stars: r.stargazerCount,
  pushed: r.pushedAt?.slice(0, 10),
  owner: owner(r.name, r.description),
  category: category(r.name, r.description),
  status: status(r),
}));

// ── Sort: Cosmos infra first, then by owner, then recent ─────────────────────
const ownerOrder = { Cosmos: 0, Bambu: 1, Akash: 2, Mexico: 3 };
categorized.sort((a, b) =>
  (ownerOrder[a.owner] ?? 9) - (ownerOrder[b.owner] ?? 9) ||
  a.name.localeCompare(b.name));

// ── Stats ────────────────────────────────────────────────────────────────────
const stats = {
  total: categorized.length,
  byOwner: tally(categorized, 'owner'),
  byCategory: tally(categorized, 'category'),
  byStatus: tally(categorized, 'status'),
  byLang: tally(categorized, 'lang'),
  privateCount: categorized.filter((r) => r.private).length,
};

// ── Emit JSON (machine) ──────────────────────────────────────────────────────
writeFileSync('C:/Users/execu/repos/pauli-pi-agent/scripts/repo-inventory.json',
  JSON.stringify({ generated: new Date().toISOString(), stats, repos: categorized }, null, 2));

// ── Emit REPO_REGISTRY.md (human / ICM) ──────────────────────────────────────
let md = `# REPO REGISTRY — The Pauli Effect Software Factory\n\n`;
md += `> **Generated:** ${new Date().toISOString()}\n`;
md += `> **Source of truth** for all ${stats.total} repos. One agent (COSMOS), many folders.\n`;
md += `> Read this FIRST before any multi-repo operation. Never mix repo contexts.\n\n`;
md += `## At a glance\n\n| Metric | Count |\n|---|---:|\n`;
md += `| Total repos | ${stats.total} |\n| Private | ${stats.privateCount} |\n| Public | ${stats.total - stats.privateCount} |\n\n`;
md += `**By owner:** ${Object.entries(stats.byOwner).map(([k, v]) => `${k} (${v})`).join(' · ')}\n\n`;
md += `**By category:** ${Object.entries(stats.byCategory).map(([k, v]) => `${k} (${v})`).join(' · ')}\n\n`;
md += `**By status:** ${Object.entries(stats.byStatus).map(([k, v]) => `${k} (${v})`).join(' · ')}\n\n`;

for (const o of ['Cosmos', 'Bambu', 'Akash', 'Mexico']) {
  const repos = categorized.filter((r) => r.owner === o);
  if (!repos.length) continue;
  md += `## ${o} (${repos.length})\n\n`;
  md += `| Repo | Cat | Status | Lang | Last push | Private |\n|---|---|---|---|---|---|\n`;
  for (const r of repos) {
    md += `| [${r.name}](${r.url}) | ${r.category} | ${r.status} | ${r.lang} | ${r.pushed} | ${r.private ? '🔒' : '🌐'} |\n`;
  }
  md += `\n`;
}

md += `\n---\n## Owner assignment rules (heuristic, edit freely)\n`;
md += `- **Cosmos** = infrastructure, agents, skills, vaults, the factory itself\n`;
md += `- **Bambu (US)** = client projects, default bucket\n`;
md += `- **Akash (India)** = backend, anything matching akash/engabha\n`;
md += `- **Mexico (wife)** = LatAm: kupuri, cdmx, vallarta, spanish, etc.\n`;
writeFileSync('C:/Users/execu/repos/pauli-pi-agent/REPO_REGISTRY.md', md);

console.log(JSON.stringify({ ok: true, ...stats, top10Recent: categorized.slice(0, 10).map(r=>r.name) }, null, 2));

function tally(arr, key) {
  return arr.reduce((m, r) => ((m[r[key]] = (m[r[key]] || 0) + 1), m), {});
}
