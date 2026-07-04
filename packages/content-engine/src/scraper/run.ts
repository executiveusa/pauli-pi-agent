/**
 * Viral Content Discovery Run
 * Cron: every 6 hours (0 * /6 * * *)
 *
 * Scrapes trending content across platforms and geos,
 * writes raw signals to companies/{co}/_signals/raw/
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { Geo } from "../types.js";
import { GEO_PLATFORM_MAP, scrapePlatform } from "./platforms.js";
import { rankSignals } from "../scorer/score.js";
import {
  synthesizeCompanyBrief,
  writeBriefToSignalsFolder,
} from "../synthesizer/synthesize.js";
import type { Company } from "../types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "../../../../");

const COMPANY_GEO_MAP: Record<Company, Geo> = {
  "macs-digital": "us",
  "pauli-effect": "us",
  "kupuri-media": "mx",
  cheggie: "rs",
  "myweb-lane": "in",
  "cascadia-atlas": "us",
};

const run = async () => {
  console.log(`[content-engine] Starting discovery run: ${new Date().toISOString()}`);

  const geos: Geo[] = ["us", "mx", "rs", "in"];
  const allSignals = [];

  for (const geo of geos) {
    const platforms = GEO_PLATFORM_MAP[geo];
    for (const platform of platforms) {
      console.log(`  Scraping ${platform} / ${geo}...`);
      const raw = await scrapePlatform({ platform, geo, maxResults: 25 });
      const scored = rankSignals(raw);
      allSignals.push(...scored);

      // Write raw signals to file for debugging
      const rawDir = path.join(REPO_ROOT, "packages/content-engine/_signals");
      fs.mkdirSync(rawDir, { recursive: true });
      fs.writeFileSync(
        path.join(rawDir, `${geo}-${platform}-${Date.now()}.json`),
        JSON.stringify(scored.slice(0, 10), null, 2),
      );
    }
  }

  console.log(`  Scored ${allSignals.length} total signals`);

  // Generate company briefs
  const companies = Object.keys(COMPANY_GEO_MAP) as Company[];
  const today = new Date().toISOString().split("T")[0];

  for (const company of companies) {
    const brief = synthesizeCompanyBrief(company, allSignals, today);
    writeBriefToSignalsFolder(brief, REPO_ROOT);
    console.log(`  ✓ Brief written for ${company} (${brief.rawSignalCount} signals)`);
  }

  console.log(`[content-engine] Discovery run complete`);
};

run().catch((err) => {
  console.error("[content-engine] Run failed:", err);
  process.exit(1);
});
