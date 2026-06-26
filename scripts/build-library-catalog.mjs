// scripts/build-library-catalog.mjs
// THE AMENTIS LIBRARY — builds the card catalog (Dewey-style).
// Scans every book/file, classifies by title keywords, emits CATALOG.md (human) +
// catalog.json (machine). Files stay where they are; the catalog maps book → shelf.
//
// THE LESSON: a real library doesn't move books to classify them. It writes a card for
// each book saying "this lives on shelf 600." COSMOS reads the catalog to navigate.
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const LIB = 'E:\\ACTIVE PROJECTS-PIPELINE\\ACTIVE PROJECTS-PIPELINE\\THE LIBRARY-AMENTIS LIBRARY';
const SCAN_DIRS = ['BOOKS PDF EPUB', 'MENTAL MODELS', 'MY BOOK WRITING FILES'];
const EXTS = new Set(['.pdf', '.epub', '.mobi', '.md', '.txt', '.json', '.docx', '.odt', '.azw', '.azw3']);

// Dewey-style classification rules: keyword → shelf
const RULES = [
  // 100 — FOUNDATIONS
  { shelf: '100-FOUNDATIONS', re: /thoth|emerald|tablet|enoch|consciousness|spirit|soul|mystery|mystic|esoteric|occult|enlighten|gnosis|hermes|kundalini|chakra|meditat|metaphys|after.?life|life.?after|death|reincarnat|immortal|eternal|wisdom|rumi|sufi|bonaventure|god|divine|prayer|sacred|terabithia/i },
  // 200 — STRATEGY & DOCTRINE
  { shelf: '200-STRATEGY-AND-DOCTRINE', re: /strategy|doctrine|founder|7 rules|power|one thing|leadership|management|startup|business|operating|soul|cynthia|pauli|mental model|pipeline/i },
  // 300 — SOFTWARE FACTORY
  { shelf: '300-SOFTWARE-FACTORY', re: /machine learning|ai |artificial|algorithm|code|coding|software|computer|cfo.?s guide|api|prompt|llm|agent|crypto/i },
  // 400 — CLIENTS & PROJECTS
  { shelf: '400-CLIENTS-AND-PROJECTS', re: /real estate|pizza|stove|grill|oven|restaurant|aquaponic|rocket stove|mexico|vallarta|cdmx|impact city|directory|cookbook|recipe|food|charity|vegan|kitchen|pizza bibel|tomato|sugar|nutri/i },
  // 500 — HEALTH & LIVING
  { shelf: '500-HEALTH-AND-LIVING', re: /sugar|147 ways|nutri|health|wellness|aquaponic|diet|healer|healing|yoga|breath/i },
  // 600 — LITERATURE & CULTURE
  { shelf: '600-LITERATURE-AND-CULTURE', re: /dostoevsky|dostoievski|karamazov|crime.?and.?punishment|gambler|notes from the underground|rumi|fables|story|stories|seagull|chess|sundiata|mali|culture smart|japanese|paterson|crowd|katherine|catherine|gill|bonaly|book of rumi|brothers karamazov|intellectual life|sertillanges|how to take smart notes|flow|optimal|fingerprints|gods|fall of man|greatest story|bridge/i },
  // 700 — FINANCE & SOVEREIGNTY
  { shelf: '700-FINANCE-AND-SOVEREIGNTY', re: /bitcoin|crypto|sovereign|x402|blockchain|decentral|standard|money|finance|economy|banking|stripe|creem|payment/i },
];

function classify(title) {
  for (const r of RULES) if (r.re.test(title)) return r.shelf;
  return '600-LITERATURE-AND-CULTURE'; // default: general literature
}

function walk(dir, depth = 0, acc = []) {
  if (depth > 3) return acc;
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'SHELVES') continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full, depth + 1, acc);
    else if (EXTS.has(extname(e.name).toLowerCase())) acc.push(full);
  }
  return acc;
}

const books = [];
for (const d of SCAN_DIRS) {
  const full = join(LIB, d);
  for (const f of walk(full)) {
    const title = basename(f).replace(/\.[^.]+$/, '').replace(/[_]/g, ' ').replace(/\(.*?\)/g, '').trim();
    const ext = extname(f).toLowerCase().slice(1);
    books.push({
      title: title.slice(0, 120),
      shelf: classify(title),
      ext,
      path: f,
      rel: f.replace(LIB + '\\', ''),
    });
  }
}

// group by shelf
const byShelf = {};
for (const b of books) (byShelf[b.shelf] ||= []).push(b);

// emit JSON
writeFileSync(join(LIB, 'catalog.json'), JSON.stringify({
  generated: new Date().toISOString(),
  total_books: books.length,
  shelves: Object.fromEntries(Object.entries(byShelf).map(([k, v]) => [k, v.length])),
  books,
}, null, 2));

// emit CATALOG.md
let md = `# 📚 THE AMENTIS LIBRARY — Card Catalog\n\n`;
md += `> Generated ${new Date().toISOString()}\n`;
md += `> **${books.length} books** across 7 shelves. Files stay in place; this catalog maps each book to its shelf.\n`;
md += `> COSMOS reads this to navigate. One agent (the librarian), many shelves.\n\n`;
for (const [shelf, list] of Object.entries(byShelf)) {
  md += `## ${shelf} (${list.length})\n\n`;
  md += `| Title | Format | Location |\n|---|---|---|\n`;
  for (const b of list.slice().sort((a, c) => a.title.localeCompare(c.title))) {
    md += `| ${b.title} | ${b.ext} | ${b.rel.split('\\').slice(0, 2).join('/')} |\n`;
  }
  md += `\n`;
}
writeFileSync(join(LIB, 'CATALOG.md'), md);

console.log(JSON.stringify({
  total_books: books.length,
  shelves: Object.fromEntries(Object.entries(byShelf).map(([k, v]) => [k, v.length])),
}, null, 2));
