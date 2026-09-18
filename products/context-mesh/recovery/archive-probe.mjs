#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, stat, open } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const target = resolve(process.argv[2] || ".");
const SAMPLE_BYTES = 1024 * 1024;

function entropy(buf) {
  if (!buf.length) return 0;
  const counts = new Array(256).fill(0);
  for (const b of buf) counts[b]++;
  let h = 0;
  for (const count of counts) {
    if (!count) continue;
    const p = count / buf.length;
    h -= p * Math.log2(p);
  }
  return h;
}

function hex(buf, n = 16) {
  return [...buf.subarray(0, n)].map((b) => b.toString(16).padStart(2, "0")).join(" ");
}

function signature(buf) {
  const h = hex(buf, 8);
  if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && [0x03, 0x05, 0x07].includes(buf[2])) return "zip";
  if (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b) return "gzip";
  if (buf.length >= 6 && buf.subarray(0, 6).toString("ascii") === "7z\xbc\xaf\x27\x1c") return "7z";
  if (buf.length >= 3 && buf.subarray(0, 3).toString("ascii") === "BZh") return "bzip2";
  if (buf.length >= 6 && buf.subarray(0, 6).toString("ascii") === "\xfd7zXZ\x00") return "xz";
  const trimmed = buf.subarray(0, 512).toString("utf8").trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json-ish";
  return `unknown (${h})`;
}

async function hashFile(path) {
  return await new Promise((resolveHash, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolveHash(hash.digest("hex")));
  });
}

async function sampleFile(path, size) {
  const fh = await open(path, "r");
  try {
    const len = Math.min(size, SAMPLE_BYTES);
    const buf = Buffer.alloc(len);
    const { bytesRead } = await fh.read(buf, 0, len, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    await fh.close();
  }
}

function zipTest(path) {
  const p = spawnSync("unzip", ["-tqq", path], { encoding: "utf8" });
  if (p.error?.code === "ENOENT") return { available: false, ok: null, detail: "unzip not installed" };
  return {
    available: true,
    ok: p.status === 0,
    detail: (p.stderr || p.stdout || "").trim().slice(0, 500),
  };
}

async function inspect(path) {
  const s = await stat(path);
  if (!s.isFile()) return null;
  const sample = await sampleFile(path, s.size);
  const sig = signature(sample);
  const result = {
    path,
    bytes: s.size,
    sha256: await hashFile(path),
    first16: hex(sample, 16),
    entropy_sample_bits_per_byte: Number(entropy(sample).toFixed(4)),
    signature: sig,
    extension: extname(path).toLowerCase(),
  };
  if (result.extension === ".zip" || sig === "zip") result.zip_test = zipTest(path);
  return result;
}

async function walk(path) {
  const s = await stat(path);
  if (s.isFile()) return [path];
  const entries = await readdir(path, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const p = join(path, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(p)));
    else if (entry.isFile()) files.push(p);
  }
  return files;
}

const files = await walk(target);
const results = [];
for (const file of files) {
  try {
    const r = await inspect(file);
    if (r) results.push(r);
  } catch (error) {
    results.push({ path: file, error: error instanceof Error ? error.message : String(error) });
  }
}

process.stdout.write(JSON.stringify({
  generated_at: new Date().toISOString(),
  target,
  count: results.length,
  results,
}, null, 2) + "\n");
