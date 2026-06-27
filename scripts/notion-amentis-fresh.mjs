// scripts/notion-amentis-fresh.mjs
// THE AMENTIS LIBRARY — Unified fresh start and synchronization.
// Wipes existing databases and creates a clean parent section "THE AMENTIS LIBRARY".
// Deploys three relational databases: Card Catalog, Software Pipeline, Payments Gateway.
// Synergized under the ICM Model (one agent, many folders) with Cosmos as Librarian.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

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

const SLEEP = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("=== 🐙 STARTING NOTION FROM SCRATCH ===");

  // 1. Discover all databases/pages accessible to the Token
  console.log("Scanning Notion workspace for existing objects...");
  const searchRes = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ page_size: 100 }),
  }).then((r) => r.json());

  if (searchRes.errors || !searchRes.results) {
    console.error("Search scan failed:", searchRes);
    process.exit(1);
  }

  // 2. Clear old databases/pages
  const dispensable = searchRes.results.filter(item => 
    item.title?.[0]?.text?.content?.includes("Pauli") ||
    item.title?.[0]?.text?.content?.includes("Amentis") ||
    item.properties?.title?.title?.[0]?.text?.content?.includes("Pauli") ||
    item.properties?.Name?.title?.[0]?.text?.content?.includes("Pauli")
  );

  if (dispensable.length > 0) {
    console.log(`Wiping ${dispensable.length} legacy/test objects...`);
    for (const item of dispensable) {
      console.log(`Archiving [${item.object}]: ${item.id}`);
      try {
        await fetch(`https://api.notion.com/v1/blocks/${item.id}`, {
          method: 'DELETE',
          headers: H
        });
      } catch (err) {
        console.error(`Could not delete block ${item.id}:`, err);
      }
      await SLEEP(200);
    }
  } else {
    console.log("No legacy Pauli/Amentis objects detected to delete.");
  }

  // Find a parent workspace page or use first page found as nesting anchor
  const parentPage = searchRes.results.find(p => p.object === 'page' && p.parent?.type === 'workspace') || searchRes.results.find(p => p.object === 'page');
  if (!parentPage) {
    console.error("No writable parent page found to nest the library parent page.");
    process.exit(1);
  }
  console.log(`Using Parent Page Anchor: ${parentPage.id}`);

  // 3. Create THE MASTER LIBRARIAN PARENT PAGE
  console.log("Creating MASTER parent page...");
  const masterPage = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      parent: { page_id: parentPage.id },
      icon: { type: 'emoji', emoji: '📚' },
      cover: { type: 'external', external: { url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66' } },
      properties: {
        title: {
          title: [{ type: 'text', text: { content: 'THE AMENTIS LIBRARY — Master Control' } }]
        }
      }
    })
  }).then(r => r.json());

  if (!masterPage.id) {
    console.error("Failed to create MASTER parent page:", masterPage);
    process.exit(1);
  }
  console.log(`Created Master Control Node: ${masterPage.url}`);

  // 4. Create Card Catalog Database (Database 1)
  console.log("Creating database: AMENTIS LIBRARY CARD CATALOG...");
  const catalogDb = await fetch('https://api.notion.com/v1/databases', {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      parent: { page_id: masterPage.id },
      icon: { type: 'emoji', emoji: '📖' },
      title: [{ type: 'text', text: { content: '📚 Card Catalog' } }],
      properties: {
        Title: { title: {} },
        Shelf: { select: { options: [
          { name: '100-FOUNDATIONS', color: 'purple' },
          { name: '200-STRATEGY-AND-DOCTRINE', color: 'blue' },
          { name: '300-SOFTWARE-FACTORY', color: 'green' },
          { name: '400-CLIENTS-AND-PROJECTS', color: 'orange' },
          { name: '500-HEALTH-AND-LIVING', color: 'pink' },
          { name: '600-LITERATURE-AND-CULTURE', color: 'gray' },
          { name: '700-FINANCE-AND-SOVEREIGNTY', color: 'yellow' }
        ]}},
        Format: { select: { options: [
          { name: 'pdf', color: 'red' },
          { name: 'epub', color: 'purple' },
          { name: 'mobi', color: 'blue' },
          { name: 'md', color: 'green' },
          { name: 'txt', color: 'orange' },
          { name: 'json', color: 'yellow' },
          { name: 'docx', color: 'brown' }
        ]}},
        Location: { rich_text: {} },
        'Last Synced': { date: {} }
      }
    })
  }).then(r => r.json());

  if (!catalogDb.id) {
    console.error("Failed to create Catalog DB:", catalogDb);
    process.exit(1);
  }
  console.log(`Database created: ${catalogDb.url}`);

  // 5. Create Swarm Pipeline Database (Database 2)
  console.log("Creating database: COGNITIVE SWARM PIPELINE...");
  const pipelineDb = await fetch('https://api.notion.com/v1/databases', {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      parent: { page_id: masterPage.id },
      icon: { type: 'emoji', emoji: '🚦' },
      title: [{ type: 'text', text: { content: '🚦 Swarm Pipeline (Octopus Nodes)' } }],
      properties: {
        Project: { title: {} },
        Category: { select: { options: [
          { name: 'agent-infra', color: 'red' },
          { name: 'skill', color: 'yellow' },
          { name: 'infra', color: 'blue' },
          { name: 'website', color: 'pink' },
          { name: 'ecommerce', color: 'green' },
          { name: 'content', color: 'purple' },
          { name: 'sales', color: 'orange' },
          { name: 'project', color: 'gray' }
        ]}},
        Status: { select: { options: [
          { name: '0_BACKLOG', color: 'red' },
          { name: '1_SANDBOX_STAGING', color: 'orange' },
          { name: '2_TESTING', color: 'yellow' },
          { name: '3_PRODUCTION', color: 'blue' },
          { name: '4_EARNING', color: 'green' }
        ]}},
        Librarian: { select: { options: [
          { name: 'Cosmos', color: 'blue' },
          { name: 'Bambu', color: 'purple' },
          { name: 'Akash', color: 'red' },
          { name: 'Mexico', color: 'pink' }
        ]}},
        Priority: { select: { options: [
          { name: 'P0-CRITICAL', color: 'red' },
          { name: 'P1-HIGH', color: 'orange' },
          { name: 'P2-MEDIUM', color: 'yellow' },
          { name: 'P3-LOW', color: 'blue' },
          { name: 'DORMANT', color: 'gray' }
        ]}},
        URL: { url: {} }
      }
    })
  }).then(r => r.json());

  if (!pipelineDb.id) {
    console.error("Failed to create Pipeline DB:", pipelineDb);
    process.exit(1);
  }
  console.log(`Database created: ${pipelineDb.url}`);

  // 6. Create Payment Gateway Database (Database 3)
  console.log("Creating database: SOVEREIGN PAYMENTS GATEWAY...");
  const paymentDb = await fetch('https://api.notion.com/v1/databases', {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      parent: { page_id: masterPage.id },
      icon: { type: 'emoji', emoji: '💳' },
      title: [{ type: 'text', text: { content: '💳 Sovereign Payments Gateway' } }],
      properties: {
        Integration: { title: {} },
        Type: { select: { options: [
          { name: 'Stripe', color: 'blue' },
          { name: 'Creem.io', color: 'purple' },
          { name: 'Selfx402 (Crypto)', color: 'orange' },
          { name: 'Bitcoin Standard', color: 'yellow' }
        ]}},
        Status: { select: { options: [
          { name: 'Active-Live', color: 'green' },
          { name: 'Sandbox-Test', color: 'yellow' },
          { name: 'Draft-Setup', color: 'orange' },
          { name: 'Pending-Key', color: 'red' }
        ]}},
        'Credential Reference': { rich_text: {} }
      }
    })
  }).then(r => r.json());

  if (!paymentDb.id) {
    console.error("Failed to create Payments DB:", paymentDb);
    process.exit(1);
  }
  console.log(`Database created: ${paymentDb.url}`);

  // 7. Populating Card Catalog (Limit 438, batch insert)
  console.log("Populating Card Catalog from catalog.json...");
  const catalogPath = 'E:/ACTIVE PROJECTS-PIPELINE/ACTIVE PROJECTS-PIPELINE/THE LIBRARY-AMENTIS LIBRARY/catalog.json';
  if (existsSync(catalogPath)) {
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
    console.log(`Loaded ${catalog.books.length} records. Syncing entries...`);
    let inserted = 0;
    for (const b of catalog.books) {
      try {
        const payload = {
          parent: { database_id: catalogDb.id },
          properties: {
            Title: { title: [{ text: { content: b.title } }] },
            Shelf: { select: { name: b.shelf } },
            Format: { select: { name: b.ext } },
            Location: { rich_text: [{ text: { content: b.rel } }] },
            'Last Synced': { date: { start: new Date().toISOString().slice(0, 10) } }
          }
        };

        const res = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: H,
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          inserted++;
          if (inserted % 20 === 0) {
            console.log(`Synced ${inserted}/${catalog.books.length} books...`);
          }
        }
      } catch (err) {
        console.error(`Failed to sync book: ${b.title}`, err);
      }
      // Notion rate limiting buffer
      await SLEEP(150);
    }
    console.log(`Completed Library sync. Successfully populated ${inserted} catalog books.`);
  } else {
    console.warn("catalog.json not found. Skipping population.");
  }

  // 8. Populating Swarm Pipeline
  console.log("Populating Swarm Pipeline from repo-inventory.json...");
  const inventoryPath = 'C:/Users/execu/repos/pauli-pi-agent/scripts/repo-inventory.json';
  if (existsSync(inventoryPath)) {
    const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8'));
    console.log(`Loaded ${inventory.repos.length} repos. Populating active swarm items...`);
    let count = 0;
    // We populate the active, in-progress, or stale ones first (maintaining a curated pipeline)
    for (const r of inventory.repos) {
      if (r.status === 'dormant' && count >= 30) continue; // Skip deep backlog to avoid API abuse
      try {
        const payload = {
          parent: { database_id: pipelineDb.id },
          properties: {
            Project: { title: [{ text: { content: r.name } }] },
            Category: { select: { name: r.category } },
            Status: { select: { name: r.status === 'active' || r.status === 'in-progress' ? '3_PRODUCTION' : '0_BACKLOG' } },
            Librarian: { select: { name: r.owner } },
            Priority: { select: { name: r.status === 'active' ? 'P0-CRITICAL' : r.status === 'in-progress' ? 'P1-HIGH' : 'P3-LOW' } },
            URL: { url: r.url }
          }
        };

        const res = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: H,
          body: JSON.stringify(payload)
        });
        if (res.ok) count++;
      } catch (err) {
        console.error(`Failed to sync repo node: ${r.name}`, err);
      }
      await SLEEP(150);
    }
    console.log(`Successfully mapped ${count} swarm repo nodes to Notion.`);
  } else {
    console.warn("repo-inventory.json not found. Skipping population.");
  }

  // 9. Populating Payment Gateways
  console.log("Populating Sovereign Payments Gateways...");
  const gateways = [
    { name: 'Stripe Global Checkout', type: 'Stripe', status: 'Draft-Setup', ref: 'Cosmos_Vault.env -> NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY' },
    { name: 'Creem.io Monetization Platform', type: 'Creem.io', status: 'Sandbox-Test', ref: 'Cosmos_Vault.env -> CREEM_API_TOKEN' },
    { name: 'Selfx402 Sovereign Checkout', type: 'Selfx402 (Crypto)', status: 'Active-Live', ref: 'Cosmos_Vault.env -> NEXT_PUBLIC_STRIPE_KEY' }
  ];

  for (const g of gateways) {
    try {
      await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: H,
        body: JSON.stringify({
          parent: { database_id: paymentDb.id },
          properties: {
            Integration: { title: [{ text: { content: g.name } }] },
            Type: { select: { name: g.type } },
            Status: { select: { name: g.status } },
            'Credential Reference': { rich_text: [{ text: { content: g.ref } }] }
          }
        })
      });
    } catch (err) {
      console.error(`Failed payment gateway popup: ${g.name}`, err);
    }
  }
  console.log("Finished sovereign payment gateways compilation.");
  console.log("=== 🐙 NOTION SCRATCH SYNCHRONIZATION COMPLETE ===");
  console.log(`Master hub is live at: ${masterPage.url}`);
}

main();
