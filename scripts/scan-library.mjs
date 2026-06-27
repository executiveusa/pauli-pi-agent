/**
 * Library Scanner — indexes THE LIBRARY-AMENTIS LIBRARY into the agent's brain.
 *
 * Walks the ICM library folder structure, extracts metadata from markdown files,
 * and writes a master index (library-index.json + LIBRARY_INDEX.md) that the
 * agent's brain-search can query.
 *
 * The library is the agent's "second brain" — all knowledge it can access.
 *
 * Usage:
 *   node scripts/scan-library.mjs
 *
 * Output:
 *   - brain/library-index.json  (machine-readable)
 *   - brain/LIBRARY_INDEX.md    (human-readable)
 */

import fs from "node:fs";
import path from "node:path";

const LIBRARY_ROOT = process.env.PAULI_LIBRARY_ROOT ?? "E:\\ACTIVE PROJECTS-PIPELINE\\ACTIVE PROJECTS-PIPELINE\\THE LIBRARY-AMENTIS LIBRARY";
const OUTPUT_JSON = path.join(process.cwd(), "brain", "library-index.json");
const OUTPUT_MD = path.join(process.cwd(), "brain", "LIBRARY_INDEX.md");

/**
 * Recursively walk a directory and yield file paths.
 */
async function* walk(dir, depth = 0) {
	if (depth > 5) return; // limit depth
	let entries;
	try {
		entries = await fs.promises.readdir(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		// Skip noise
		if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === ".git") continue;
		if (entry.isDirectory()) {
			yield* walk(fullPath, depth + 1);
		} else if (entry.isFile()) {
			yield fullPath;
		}
	}
}

/**
 * Extract title and summary from a markdown file.
 */
function extractMarkdownMeta(content) {
	const lines = content.split("\n");
	let title = "";
	let summary = "";
	for (const line of lines.slice(0, 30)) {
		if (!title && line.startsWith("# ")) {
			title = line.replace(/^#\s+/, "").trim();
		}
		if (!summary && line.trim() && !line.startsWith("#") && !line.startsWith("---")) {
			summary = line.trim().slice(0, 200);
			break;
		}
	}
	return { title: title || "Untitled", summary };
}

/**
 * Classify a file by its extension and path.
 */
function classify(filePath) {
	const ext = path.extname(filePath).toLowerCase();
	const rel = path.relative(LIBRARY_ROOT, filePath).toLowerCase();
	const category = {
		md: "markdown",
		pdf: "pdf",
		epub: "ebook",
		json: "data",
		js: "code",
		mjs: "code",
		ts: "code",
		py: "code",
		html: "html",
		css: "style",
		env: "config",
		txt: "text",
		zip: "archive",
		png: "image",
		jpg: "image",
		jpeg: "image",
		svg: "image",
	}[ext] ?? "other";

	// Shelf classification (Dewey-style)
	let shelf = "uncategorized";
	if (rel.includes("100-foundations")) shelf = "100-Foundations";
	else if (rel.includes("200-strategy")) shelf = "200-Strategy-Doctrine";
	else if (rel.includes("300-software-factory")) shelf = "300-Software-Factory";
	else if (rel.includes("400-clients")) shelf = "400-Clients-Projects";
	else if (rel.includes("500-health")) shelf = "500-Health-Living";
	else if (rel.includes("600-literature")) shelf = "600-Literature-Culture";
	else if (rel.includes("700-finance")) shelf = "700-Finance-Sovereignty";
	else if (rel.includes("mental models")) shelf = "Mental-Models";
	else if (rel.includes("books pdf epub")) shelf = "Books";
	else if (rel.includes("seeddance")) shelf = "Seedance";
	else if (rel.includes("my book writing")) shelf = "Book-Writing";
	else if (rel.includes("pauli-comic-funnel")) shelf = "Comic-Funnel";
	else if (rel.includes("jarvis")) shelf = "Jarvis";
	else if (rel.includes("notion-cookbook")) shelf = "Notion-Cookbook";
	else if (rel.includes("my-podcast")) shelf = "Podcast";
	else if (rel.includes("x402")) shelf = "Payments-x402";

	return { category, shelf };
}

async function main() {
	console.log(`Scanning library: ${LIBRARY_ROOT}`);
	if (!fs.existsSync(LIBRARY_ROOT)) {
		console.error("Library root not found.");
		process.exit(1);
	}

	const entries = [];
	let count = 0;
	const shelfCounts = {};

	for await (const filePath of walk(LIBRARY_ROOT)) {
		let stat;
		try {
			stat = await fs.promises.stat(filePath);
		} catch {
			// Skip files that can't be stat'd (permission, encoding, etc.)
			continue;
		}
		const rel = path.relative(LIBRARY_ROOT, filePath);
		const { category, shelf } = classify(filePath);
		shelfCounts[shelf] = (shelfCounts[shelf] ?? 0) + 1;

		let meta = { title: path.basename(filePath), summary: "" };
		if (category === "markdown") {
			try {
				const content = await fs.promises.readFile(filePath, "utf8");
				meta = extractMarkdownMeta(content);
			} catch { /* ignore */ }
		}

		entries.push({
			path: rel,
			absPath: filePath,
			category,
			shelf,
			title: meta.title,
			summary: meta.summary,
			sizeBytes: stat.size,
			modified: stat.mtime.toISOString(),
		});
		count++;
		if (count % 500 === 0) console.log(`  scanned ${count} files...`);
	}

	// Write JSON index
	fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
	fs.writeFileSync(OUTPUT_JSON, JSON.stringify({ libraryRoot: LIBRARY_ROOT, totalFiles: count, shelfCounts, entries }, null, 2));

	// Write Markdown index
	const mdLines = [
		"# Library Index — THE AMENTIS LIBRARY",
		"",
		"> Auto-generated by `scripts/scan-library.mjs`. The agent's second brain.",
		"> **Total files:** " + count,
		"> **Library root:** `" + LIBRARY_ROOT + "`",
		"",
		"## Shelves",
		"",
		"| Shelf | Files |",
		"|-------|-------|",
		...Object.entries(shelfCounts)
			.sort((a, b) => b[1] - a[1])
			.map(([shelf, n]) => `| ${shelf} | ${n} |`),
		"",
		"## Notable Markdown Files",
		"",
		...entries
			.filter((e) => e.category === "markdown")
			.slice(0, 100)
			.map((e) => `- **${e.title}** — \`${e.path}\`\n  ${e.summary}`),
		"",
	];
	fs.writeFileSync(OUTPUT_MD, mdLines.join("\n"));

	console.log(`\n✅ Indexed ${count} files`);
	console.log(`   JSON: ${OUTPUT_JSON}`);
	console.log(`   MD:   ${OUTPUT_MD}`);
	console.log(`   Shelves: ${Object.keys(shelfCounts).length}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
