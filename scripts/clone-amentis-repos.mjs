// scripts/clone-amentis-repos.mjs
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const REPOS = [
  { url: 'https://github.com/heygen-com/skills.git', name: 'heygen-skills' },
  { url: 'https://github.com/heygen-com/heygen-cli.git', name: 'heygen-cli' },
  { url: 'https://github.com/heygen-com/liveavatar-web-sdk.git', name: 'liveavatar-web-sdk' },
  { url: 'https://github.com/heygen-com/hyperframes.git', name: 'hyperframes' },
  { url: 'https://github.com/zarazhangrui/codebase-to-course.git', name: 'codebase-to-course' },
  { url: 'https://github.com/executiveusa/impact-city-2026.git', name: 'impact-city-2026' },
  { url: 'https://github.com/CodaLabs-xyz/Selfx402Framework.git', name: 'Selfx402Framework' },
  { url: 'https://github.com/x402-foundation/x402.git', name: 'x402' },
  { url: 'https://github.com/executiveusa/amentislibrary.git', name: 'amentislibrary' }
];

const TARGET_DIR = 'E:\\ACTIVE PROJECTS-PIPELINE\\ACTIVE PROJECTS-PIPELINE\\THE LIBRARY-AMENTIS LIBRARY\\SHELVES\\300-SOFTWARE-FACTORY';

async function gitClone(url, dest) {
  return new Promise((resolve) => {
    if (existsSync(dest)) {
      console.log(`Repository already exists at ${dest}, skipping...`);
      return resolve(true);
    }
    console.log(`Cloning ${url} to ${dest}...`);
    const p = spawn('git', ['clone', '--depth=1', url, dest], { shell: false, stdio: 'inherit' });
    p.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

async function run() {
  mkdirSync(TARGET_DIR, { recursive: true });
  console.log("=== STARTING RETRIEVAL OF MASTER SOFTWARE WORKFLOWS ===");
  for (const r of REPOS) {
    const dest = join(TARGET_DIR, r.name);
    await gitClone(r.url, dest);
  }
  console.log("=== COMPLETED RETRIEVAL OF ALL DESIGN & PAYMENT RUNWAYS ===");
}

run();
