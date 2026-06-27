import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const app = express();
app.use(express.json({ limit: "2mb" }));

const CONTROL_DIR = path.dirname(fileURLToPath(import.meta.url));
const JOB_DIR = path.join(CONTROL_DIR, "jobs");

const PORT = Number(process.env.PORT || 8787);
const TOKEN = process.env.PAULI_CONTROL_TOKEN;
const WORKSPACE_ROOT = path.resolve(process.env.PAULI_WORKSPACE_ROOT || process.cwd());
const PAULI_REPO_ROOT = path.resolve(process.env.PAULI_REPO_ROOT || WORKSPACE_ROOT);
const PI_BIN = process.env.PI_BIN || "pi";
const ALLOW_WRITE = process.env.ALLOW_WRITE === "1";
const ALLOW_SHIP = process.env.ALLOW_SHIP === "1";
const DEFAULT_THINKING = process.env.DEFAULT_THINKING || "high";

if (!TOKEN || TOKEN.length < 32) {
  throw new Error("PAULI_CONTROL_TOKEN is missing or too short.");
}

fs.mkdirSync(JOB_DIR, { recursive: true });

const running = new Map();

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${TOKEN}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function safeRepoPath(repoInput = ".") {
  const repo = String(repoInput || ".").trim();

  if (repo === "." || repo === "pauli-pi-agent") {
    return PAULI_REPO_ROOT;
  }

  const resolved = path.resolve(WORKSPACE_ROOT, repo);

  if (resolved !== WORKSPACE_ROOT && !resolved.startsWith(WORKSPACE_ROOT + path.sep)) {
    throw new Error("Repo path blocked. It must stay inside PAULI_WORKSPACE_ROOT.");
  }

  if (!fs.existsSync(resolved)) {
    throw new Error(`Repo path does not exist: ${resolved}`);
  }

  return resolved;
}

function jobPath(id) {
  return path.join(JOB_DIR, `${id}.json`);
}

function saveJob(job) {
  fs.writeFileSync(jobPath(job.id), JSON.stringify(job, null, 2));
}

function readJob(id) {
  const file = jobPath(id);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function clip(text, max = 50000) {
  if (!text) return "";
  return text.length > max ? text.slice(text.length - max) : text;
}

function buildPrompt({ mode, task, repoPath }) {
  const modeRules = {
    plan: "PLAN MODE: inspect and propose only. Do not edit files. Do not run destructive commands.",
    read: "READ MODE: inspect files and summarize findings only. Do not edit files.",
    write: "WRITE MODE: make focused edits only. Do not commit, push, deploy, delete folders, rotate secrets, or change credentials.",
    ship: "SHIP MODE: only commit, push, or deploy if the task explicitly asks for it."
  };

  return [
    "You are PAULI — the autonomous agent of THE PAULI EFFECT (a faceless social-purpose",
    "company led by a sasquatch named Pauli). You are one agent with many folders; you do",
    "not spawn a multi-agent framework. Read PAULI.md first for identity + navigation, then",
    "the relevant company/*.md doctrine (INDEX.md maps them) before acting.",
    "",
    "Identity in brief: no slop (Cynthia Design doctrine, UDEC >= 8.5), humans (Bambu) stand",
    "at the gates, revenue-driven, memory-first (query brain/search.mjs, never dump context).",
    "Speak in technical prose; no fluff, no emojis in commits/code.",
    "",
    `Repository path: ${repoPath}`,
    modeRules[mode],
    "",
    "Hard rules:",
    "- Read PAULI.md then AGENTS.md first when present and follow them.",
    "- Never commit unless the user explicitly asks.",
    "- Never expose secrets, API keys, tokens, private env values, or credentials.",
    "- Never delete project directories or run destructive cleanup unless explicitly requested.",
    "- Prefer small, reversible edits.",
    "- When changing code, report exact files changed and the checks you ran.",
    "- If blocked by auth, missing dependencies, failing tests, or unclear repo state, stop and report the blocker.",
    "",
    "User task:",
    task
  ].join("\n");
}

function toolsForMode(mode) {
  if (mode === "plan" || mode === "read") {
    return "read,grep,find,ls";
  }

  if (mode === "write") {
    if (!ALLOW_WRITE) {
      throw new Error("Write mode is disabled. Set ALLOW_WRITE=1 in .env and restart the bridge.");
    }
    return "read,grep,find,ls,edit,write,bash";
  }

  if (mode === "ship") {
    if (!ALLOW_SHIP) {
      throw new Error("Ship mode is disabled. Set ALLOW_SHIP=1 in .env and restart the bridge.");
    }
    return "read,grep,find,ls,edit,write,bash";
  }

  throw new Error("Invalid mode. Use plan, read, write, or ship.");
}

function piCommandArgs(args) {
  if (PI_BIN === "npx") {
    return {
      command: "npx",
      args: ["-y", "@mariozechner/pi-coding-agent", ...args]
    };
  }

  return {
    command: PI_BIN,
    args
  };
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "pauli-control-bridge",
    workspaceRoot: WORKSPACE_ROOT,
    pauliRepoRoot: PAULI_REPO_ROOT,
    piBin: PI_BIN,
    allowWrite: ALLOW_WRITE,
    allowShip: ALLOW_SHIP
  });
});

app.get("/agents", requireAuth, (_req, res) => {
  res.json({
    agents: [
      {
        id: "pauli-pi-agent",
        kind: "pi-coding-agent",
        modes: ["plan", "read", "write", "ship"],
        defaultMode: "plan",
        defaultRepo: "pauli-pi-agent"
      }
    ]
  });
});

app.post("/run", requireAuth, (req, res) => {
  try {
    const body = req.body || {};
    const mode = body.mode || "plan";
    const task = String(body.task || "").trim();
    const repo = body.repo || ".";
    const model = body.model ? String(body.model) : "";
    const provider = body.provider ? String(body.provider) : "";
    const thinking = body.thinking ? String(body.thinking) : DEFAULT_THINKING;
    const timeoutMinutes = Math.min(Number(body.timeoutMinutes || 30), 120);

    if (!task) {
      return res.status(400).json({ error: "Missing task." });
    }

    const repoPath = safeRepoPath(repo);
    const tools = toolsForMode(mode);
    const id = crypto.randomUUID();

    const prompt = buildPrompt({ mode, task, repoPath });

    const baseArgs = [
      "--tools",
      tools,
      "--thinking",
      thinking,
      "-p",
      prompt
    ];

    if (provider) baseArgs.unshift("--provider", provider);
    if (model) baseArgs.unshift("--model", model);

    const { command, args } = piCommandArgs(baseArgs);

    const job = {
      id,
      status: "running",
      mode,
      repo,
      repoPath,
      model: model || null,
      provider: provider || null,
      tools,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      exitCode: null,
      stdout: "",
      stderr: "",
      command,
      argsPreview: args.map((arg) => (arg === prompt ? "[PROMPT]" : arg))
    };

    saveJob(job);

    const child = spawn(command, args, {
      cwd: repoPath,
      shell: true,
      env: {
        ...process.env,
        PI_TELEMETRY: "0"
      }
    });

    running.set(id, child);

    const killTimer = setTimeout(() => {
      job.status = "timeout";
      job.stderr = clip(`${job.stderr}\nTimed out after ${timeoutMinutes} minutes.`);
      job.finishedAt = new Date().toISOString();
      saveJob(job);
      child.kill("SIGTERM");
    }, timeoutMinutes * 60 * 1000);

    child.stdout.on("data", (chunk) => {
      job.stdout = clip(job.stdout + chunk.toString());
      saveJob(job);
    });

    child.stderr.on("data", (chunk) => {
      job.stderr = clip(job.stderr + chunk.toString());
      saveJob(job);
    });

    child.on("close", (code) => {
      clearTimeout(killTimer);
      running.delete(id);
      job.exitCode = code;
      job.finishedAt = new Date().toISOString();
      if (job.status !== "timeout") {
        job.status = code === 0 ? "success" : "error";
      }
      saveJob(job);
    });

    res.json({
      jobId: id,
      status: job.status,
      mode,
      repoPath,
      message: "Pauli job started."
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/runs/:jobId", requireAuth, (req, res) => {
  const job = readJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: "Job not found." });
  }
  res.json(job);
});

app.post("/runs/:jobId/stop", requireAuth, (req, res) => {
  const child = running.get(req.params.jobId);
  if (!child) {
    return res.status(404).json({ error: "Running job not found. It may already be finished." });
  }
  child.kill("SIGTERM");
  res.json({ ok: true, message: "Stop signal sent." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Pauli Control Bridge listening on http://0.0.0.0:${PORT}`);
});
