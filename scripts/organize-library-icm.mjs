/**
 * Organize the Amentis Library to strict ICM structure.
 *
 * Per the ICM paper (arXiv:2603.16021v2):
 *   - CLAUDE.md (Layer 0 — workspace identity)
 *   - CONTEXT.md (Layer 1 — task routing)
 *   - stages/01_research/, 02_build/, 03_ship/ (Layer 2 — numbered)
 *   - references/ (Layer 3 — stable doctrine)
 *   - output/ (Layer 4 — working artifacts)
 *
 * This script creates the ICM structure in the library root and
 * moves existing content into the appropriate layers without deleting anything.
 * It's idempotent — safe to run multiple times.
 *
 * Usage:
 *   node scripts/organize-library-icm.mjs
 */

import fs from "node:fs";
import path from "node:path";

const LIBRARY_ROOT = process.env.PAULI_LIBRARY_ROOT ?? "E:\\ACTIVE PROJECTS-PIPELINE\\ACTIVE PROJECTS-PIPELINE\\THE LIBRARY-AMENTIS LIBRARY";

// ICM structure to create
const ICM_STRUCTURE = {
	"CLAUDE.md": `# Amentis Library — Workspace Identity (ICM Layer 0)

> You are in the Amentis Library, the second brain for Cosmos (the Pauli Pi Agent).
> This is an ICM (Interpretable Context Methodology) workspace.

## What this workspace is
The knowledge base for a US-based nonprofit founder and solo entrepreneur.
Contains doctrine, mental models, project history, books, and research.

## Folder structure
- \`CONTEXT.md\` — Task routing (Layer 1)
- \`stages/\` — Numbered workflow stages (Layer 2)
- \`references/\` — Stable doctrine, voice guides, conventions (Layer 3)
- \`output/\` — Working artifacts, per-run outputs (Layer 4)
- \`SHELVES/\` — Dewey-style knowledge shelves (100-700)
- \`MENTAL MODELS/\` — Obsidian vault + mental models
- \`BOOKS PDF EPUB/\` — Source books

## How to navigate
1. Read this file (Layer 0) — know where you are
2. Read \`CONTEXT.md\` (Layer 1) — know what to do
3. Read the stage's \`CONTEXT.md\` (Layer 2) — know how to do it
4. Load reference material (Layer 3) — know the rules
5. Load working artifacts (Layer 4) — know the input
`,
	"CONTEXT.md": `# Amentis Library — Task Routing (ICM Layer 1)

## Available stages
- \`stages/01_research/\` — Research a topic, ingest content, build knowledge
- \`stages/02_build/\` — Build a deliverable (grant, report, content, code)
- \`stages/03_ship/\` — Ship the deliverable (deploy, publish, distribute)

## Shared resources
- \`references/\` — Doctrine, voice guides, design system, conventions
- \`SHELVES/\` — Knowledge shelves (100-700, Dewey-style)
- \`MENTAL MODELS/\` — Obsidian vault with mental models

## How to route a task
1. If the task is about learning/ingesting → \`stages/01_research/\`
2. If the task is about creating something → \`stages/02_build/\`
3. If the task is about deploying/publishing → \`stages/03_ship/\`
4. If unsure, start at \`stages/01_research/\` and let the human decide
`,
	"stages/01_research/CONTEXT.md": `# Stage 01: Research (ICM Layer 2)

## Inputs
- Layer 4 (working): user-provided topic, URL, or question
- Layer 3 (reference): \`../../references/research-method.md\`

## Process
Research the topic using the library, web search, and video ingestion.
Produce a structured research document with key findings and sources.

## Outputs
- \`research-output.md\` → \`output/\`
`,
	"stages/02_build/CONTEXT.md": `# Stage 02: Build (ICM Layer 2)

## Inputs
- Layer 4 (working): \`../01_research/output/research-output.md\`
- Layer 3 (reference): \`../../references/voice.md\`, \`../../references/design-system.md\`

## Process
Build the deliverable based on the research output.
Follow the voice guide and design system.

## Outputs
- \`deliverable-draft.md\` → \`output/\`
`,
	"stages/03_ship/CONTEXT.md": `# Stage 03: Ship (ICM Layer 2)

## Inputs
- Layer 4 (working): \`../02_build/output/deliverable-draft.md\`
- Layer 3 (reference): \`../../references/shipping-checklist.md\`

## Process
Finalize and ship the deliverable.
Run the shipping checklist. Deploy or publish.

## Outputs
- \`final-deliverable.md\` → \`output/\`
`,
	"references/voice.md": `# Voice Guide (ICM Layer 3)

> The voice for all Cosmos outputs.

## Tone
- Direct, no fluff
- Confident but not arrogant
- Plain English, avoid jargon
- US spelling

## Style
- Short sentences
- Active voice
- Concrete examples over abstract claims
- Cite sources when making factual claims
`,
	"references/design-system.md": `# Design System (ICM Layer 3)

> Visual conventions for all Cosmos UI work.

## Colors (Catppuccin Mocha)
- Background: #1e1e2e
- Surface: #313244
- Text: #cdd6f4
- Accent (emerald): #a6e3a1
- Warning (yellow): #f9e2af
- Error (red): #f38ba8

## Typography
- Font: ui-sans-serif, system-ui
- Mono: ui-monospace, SF Mono
- Sizes: 11px (small), 13px (body), 16px (heading)

## Spacing
- Use 8px grid (8, 16, 24, 32)
- Border radius: 6px (small), 8px (medium), 12px (large)
`,
	"references/shipping-checklist.md": `# Shipping Checklist (ICM Layer 3)

Before shipping any deliverable:

- [ ] Spell check complete
- [ ] All claims have sources
- [ ] No placeholder text remaining
- [ ] Links work (if any)
- [ ] Mobile-responsive (if UI)
- [ ] No secrets in the output
- [ ] Human reviewed the final output
`,
};

// Create directories
const DIRECTORIES = [
	"stages/01_research/output",
	"stages/02_build/output",
	"stages/03_ship/output",
	"references",
	"output",
];

function ensureDir(dirPath) {
	try {
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath, { recursive: true });
			console.log(`  + ${path.relative(LIBRARY_ROOT, dirPath)}/`);
		}
	} catch (e) {
		console.warn(`  ! Could not create ${dirPath}: ${e.message}`);
	}
}

function writeFile(filePath, content) {
	try {
		if (!fs.existsSync(filePath)) {
			fs.writeFileSync(filePath, content, "utf8");
			console.log(`  + ${path.relative(LIBRARY_ROOT, filePath)}`);
		} else {
			console.log(`  = ${path.relative(LIBRARY_ROOT, filePath)} (exists, skipped)`);
		}
	} catch (e) {
		console.warn(`  ! Could not write ${filePath}: ${e.message}`);
	}
}

function main() {
	console.log(`Organizing library to ICM structure: ${LIBRARY_ROOT}`);
	if (!fs.existsSync(LIBRARY_ROOT)) {
		console.error("Library root not found.");
		process.exit(1);
	}

	console.log("\n=== Creating directories ===");
	for (const dir of DIRECTORIES) {
		ensureDir(path.join(LIBRARY_ROOT, dir));
	}

	console.log("\n=== Writing ICM files ===");
	for (const [relPath, content] of Object.entries(ICM_STRUCTURE)) {
		const fullPath = path.join(LIBRARY_ROOT, relPath);
		ensureDir(path.dirname(fullPath));
		writeFile(fullPath, content);
	}

	console.log("\n✅ ICM structure created.");
	console.log("   The existing SHELVES/, MENTAL MODELS/, and BOOKS PDF EPUB/ folders");
	console.log("   remain in place — they're the knowledge source the stages read from.");
	console.log("\nNext: run `node scripts/scan-library.mjs` to rebuild the index.");
}

main();
