// scripts/scan-github-public.mjs — list public repos via unauthenticated REST API (rate-limited but fine for one user)
const USER = 'executiveusa';
let page = 1;
const all = [];
for (;;) {
  let r;
  try {
    r = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&page=${page}&sort=updated`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'pauli-scan' },
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) { console.log(JSON.stringify({ error: String(e) })); process.exit(0); }
  if (r.status === 403) { console.log(JSON.stringify({ error: 'rate-limited', page })); break; }
  if (!r.ok) { console.log(JSON.stringify({ error: `HTTP ${r.status}` })); process.exit(0); }
  const batch = await r.json();
  if (!batch.length) break;
  all.push(...batch);
  if (batch.length < 100) break;
  page++;
}

const byLang = {};
const buckets = { pauli: [], archonx: [], agent: [], directory: [], vault: [], skill: [], bot: [], mcp: [], other: [] };
for (const r of all) {
  const lang = r.language || 'Unknown';
  byLang[lang] = (byLang[lang] || 0) + 1;
  const name = r.name.toLowerCase();
  if (name.startsWith('pauli')) buckets.pauli.push(r.name);
  else if (name.includes('archon')) buckets.archonx.push(r.name);
  else if (name.includes('agent')) buckets.agent.push(r.name);
  else if (name.includes('direct') || name.includes('directory')) buckets.directory.push(r.name);
  else if (name.includes('vault') || name.includes('secret') || name.includes('cosmos')) buckets.vault.push(r.name);
  else if (name.includes('skill')) buckets.skill.push(r.name);
  else if (name.includes('bot')) buckets.bot.push(r.name);
  else if (name.includes('mcp')) buckets.mcp.push(r.name);
  else buckets.other.push(r.name);
}
const langs = Object.entries(byLang).sort((a, b) => b[1] - a[1]);
console.log(JSON.stringify({
  total_public: all.length,
  top_languages: langs.slice(0, 12),
  buckets: Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, { count: v.length, sample: v.slice(0, 12) }])),
  top_20_most_recent: all.slice(0, 20).map((r) => ({ name: r.name, lang: r.language, pushed: r.pushed_at?.slice(0, 10), stars: r.stargazers_count })),
}, null, 2));
