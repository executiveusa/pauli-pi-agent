// scripts/scan-github.mjs
// Inventory your GitHub repos via PAT. Prints counts + categorization, never the token.
import { readFileSync, existsSync } from 'node:fs';

function pick(key, sources) {
  for (const p of sources) {
    try {
      if (!existsSync(p)) continue;
      const m = readFileSync(p, 'utf8').match(new RegExp(`^${key}=(.+)$`, 'm'));
      if (m && m[1].trim()) return m[1].trim().replace(/^["']|["']$/g, '');
    } catch {}
  }
  return '';
}

const token = pick('GH_PAT', [
  'E:\\THE PAULI FILES\\Cosmos_Vault.env',
  'C:\\Users\\execu\\repos\\pauli-pi-agent\\.env',
]);
if (!token) { console.log(JSON.stringify({ error: 'GH_PAT not found' })); process.exit(0); }

async function gql(query, vars = {}) {
  let r;
  try {
    r = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: vars }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) { return { error: String(e) }; }
  const j = await r.json();
  return j;
}

// Page through all repos (100 at a time)
const all = [];
let endCursor = null;
for (let i = 0; i < 12; i++) { // cap at 1200 repos
  const q = `query($after:String){viewer{repositories(first:100, after:$after, ownerAffiliations:[OWNER], isFork:false){pageInfo{endCursor hasNextPage}nodes{name isPrivate primaryLanguage{name} description updatedAt url}}}}`;
  const res = await gql(q, { after: endCursor });
  if (res.errors || !res.data) { console.log(JSON.stringify({ error: res.errors || res })); break; }
  const nodes = res.data.viewer.repositories.nodes;
  all.push(...nodes);
  if (!res.data.viewer.repositories.pageInfo.hasNextPage) break;
  endCursor = res.data.viewer.repositories.pageInfo.endCursor;
}

// Categorize
const byLang = {};
const pauli = [], archonx = [], clientish = [], other = [];
for (const r of all) {
  const lang = r.primaryLanguage?.name || 'Unknown';
  byLang[lang] = (byLang[lang] || 0) + 1;
  const name = r.name.toLowerCase();
  if (name.startsWith('pauli')) pauli.push(r.name);
  else if (name.includes('archonx') || name.includes('archon-x')) archonx.push(r.name);
  else other.push(r.name);
}

const langs = Object.entries(byLang).sort((a, b) => b[1] - a[1]);
console.log(JSON.stringify({
  total_repos: all.length,
  public: all.filter((r) => !r.isPrivate).length,
  private: all.filter((r) => r.isPrivate).length,
  pauli_prefixed: pauli.length,
  archonx: archonx.length,
  other: other.length,
  top_languages: langs.slice(0, 12),
  sample_pauli: pauli.slice(0, 15),
  sample_other: other.slice(0, 15),
  most_recently_updated: [...all].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 10).map((r) => r.name),
}, null, 2));
