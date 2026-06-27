// scripts/notion-sync.mjs
// Push the repo inventory into a Notion database so Bambu has a live, browsable client log.
// Creates a "Pauli Repo Registry" database under an accessible parent page, then inserts rows.
import { readFileSync } from 'node:fs';

const tok = (readFileSync('E:/THE PAULI FILES/Cosmos_Vault.env', 'utf8')
  .match(/^NOTION_API_TOKEN=(.+)$/m)[1]).trim();
const H = { Authorization: `Bearer ${tok}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' };

// 1. Find a parent page we can write to (first accessible page)
const search = await fetch('https://api.notion.com/v1/search', {
  method: 'POST', headers: H, body: JSON.stringify({ filter: { value: 'page', property: 'object' }, page_size: 20 }),
}).then((r) => r.json());
const parent = search.results.find((p) => p.parent?.type === 'workspace') || search.results[0];
if (!parent) { console.log('No writable parent page found'); process.exit(0); }
console.log('parent page:', parent.id);

// 2. Create the database
const db = await fetch('https://api.notion.com/v1/databases', {
  method: 'POST', headers: H,
  body: JSON.stringify({
    parent: { page_id: parent.id },
    icon: { type: 'emoji', emoji: '🐙' },
    title: [{ type: 'text', text: { content: 'Pauli Repo Registry' } }],
    properties: {
      Repo: { title: {} },
      Owner: { select: { options: ['Cosmos','Bambu','Akash','Mexico'].map(n=>({name:n})) } },
      Category: { select: { options: ['agent-infra','infra','skill','website','ecommerce','content','sales','project'].map(n=>({name:n})) } },
      Status: { select: { options: ['in-progress','stale','dormant','active'].map(n=>({name:n})) } },
      Language: { select: { options: [] } },
      Private: { checkbox: {} },
      Stars: { number: {} },
      'Last Push': { date: {} },
      URL: { url: {} },
    },
  }),
}).then((r) => r.json());
if (!db.id) { console.log('DB create failed:', JSON.stringify(db).slice(0,300)); process.exit(0); }
console.log('database created:', db.id, db.url);

// 3. Insert repos (batched — Notion rate limits ~3 req/s, so small sleep)
const inventory = JSON.parse(readFileSync('C:/Users/execu/repos/pauli-pi-agent/scripts/repo-inventory.json', 'utf8'));
let inserted = 0, failed = 0;
for (const r of inventory.repos) {
  try {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST', headers: H,
      body: JSON.stringify({
        parent: { database_id: db.id },
        properties: {
          Repo: { title: [{ text: { content: r.name } }] },
          Owner: { select: { name: r.owner } },
          Category: { select: { name: r.category } },
          Status: { select: { name: r.status } },
          Language: { select: r.lang && r.lang !== 'Unknown' ? { name: r.lang } : null },
          Private: { checkbox: !!r.private },
          Stars: { number: r.stars || 0 },
          'Last Push': r.pushed ? { date: { start: r.pushed } } : null,
          URL: { url: r.url },
        },
      }),
    });
    if (res.ok) inserted++; else failed++;
  } catch { failed++; }
  if ((inserted + failed) % 25 === 0) { await new Promise((x) => setTimeout(x, 400)); }
}
console.log(JSON.stringify({ inserted, failed, total: inventory.repos.length, database_url: db.url }));
