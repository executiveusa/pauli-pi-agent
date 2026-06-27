// scripts/notion-query.mjs
import { readFileSync } from 'node:fs';

const vaultPath = 'E:/THE PAULI FILES/Cosmos_Vault.env';
let tok;
try {
  tok = readFileSync(vaultPath, 'utf8').match(/^NOTION_API_TOKEN=(.+)$/m)[1].trim();
} catch (e) {
  console.error("Failed to load NOTION_API_TOKEN from", vaultPath);
  process.exit(1);
}

const H = {
  Authorization: `Bearer ${tok}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json'
};

async function testNotion() {
  console.log("Searching for DATABASES in Notion...");
  const searchRes = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      filter: { value: 'database', property: 'object' },
      page_size: 100
    }),
  }).then((r) => r.json());

  if (searchRes.errors || !searchRes.results) {
    console.error("Notion search failed:", JSON.stringify(searchRes));
    return;
  }

  console.log(`Found ${searchRes.results.length} databases:`);
  for (const item of searchRes.results) {
    const title = item.title?.[0]?.text?.content || 'Untitled';
    console.log(`- Database ID: ${item.id} | Title: ${title} | URL: ${item.url}`);
  }
}

testNotion();
