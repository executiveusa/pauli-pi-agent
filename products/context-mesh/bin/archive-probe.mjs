#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename } from "node:path";

const SIGNATURES = [
  ["zip_local", Buffer.from("504b0304", "hex")],
  ["zip_eocd", Buffer.from("504b0506", "hex")],
  ["zip_spanned", Buffer.from("504b0708", "hex")],
  ["gzip", Buffer.from("1f8b08", "hex")],
  ["7z", Buffer.from("377abcaf271c", "hex")],
  ["rar4", Buffer.from("526172211a0700", "hex")],
  ["rar5", Buffer.from("526172211a070100", "hex")],
  ["zstd", Buffer.from("28b52ffd", "hex")],
  ["xz", Buffer.from("fd377a585a00", "hex")],
  ["bzip2", Buffer.from("425a68", "hex")],
  ["openssl_salted", Buffer.from("53616c7465645f5f", "hex")],
];

function entropy(buffer) {
  if (!buffer.length) return 0;
  const counts = new Uint32Array(256);
  for (const byte of buffer) counts[byte] += 1;
  let value = 0;
  for (const count of counts) {
    if (!count) continue;
    const probability = count / buffer.length;
    value -= probability * Math.log2(probability);
  }
  return value;
}

async function probe(path) {
  const metadata = await stat(path);
  const hash = createHash("sha256");
  const headParts = [];
  const tail = Buffer.alloc(Math.min(4096, metadata.size));
  let tailFilled = 0;
  const sampleParts = [];
  let sampled = 0;
  let offset = 0;
  const signatureHits = [];

  for await (const chunk of createReadStream(path, { highWaterMark: 1024 * 1024 })) {
    hash.update(chunk);

    if (offset < 4096) {
      headParts.push(chunk.subarray(0, Math.min(chunk.length, 4096 - offset)));
    }

    if (chunk.length >= tail.length) {
      chunk.copy(tail, 0, chunk.length - tail.length);
      tailFilled = tail.length;
    } else if (tail.length) {
      const overflow = Math.max(0, tailFilled + chunk.length - tail.length);
      if (overflow) tail.copyWithin(0, overflow, tailFilled);
      const start = Math.max(0, tailFilled - overflow);
      chunk.copy(tail, start);
      tailFilled = Math.min(tail.length, tailFilled + chunk.length);
    }

    if (sampled < 8 * 1024 * 1024) {
      const take = chunk.subarray(
        0,
        Math.min(chunk.length, 8 * 1024 * 1024 - sampled),
      );
      sampleParts.push(take);
      sampled += take.length;
    }

    for (const [name, signature] of SIGNATURES) {
      const index = chunk.indexOf(signature);
      if (index !== -1) signatureHits.push({ name, offset: offset + index });
    }

    offset += chunk.length;
  }

  const head = Buffer.concat(headParts).subarray(0, 4096);
  const sample = Buffer.concat(sampleParts);
  const sampleEntropy = entropy(sample);

  return {
    file: path,
    name: basename(path),
    size: metadata.size,
    sha256: hash.digest("hex"),
    size_mod_16: metadata.size % 16,
    head_hex: head.subarray(0, 64).toString("hex"),
    tail_hex: tail
      .subarray(Math.max(0, tailFilled - 64), tailFilled)
      .toString("hex"),
    entropy_sample_bits_per_byte: Number(sampleEntropy.toFixed(6)),
    signature_hits: signatureHits.slice(0, 100),
    assessment: signatureHits.some((hit) => hit.offset === 0)
      ? "recognized_container_or_stream"
      : sampleEntropy > 7.95
        ? "opaque_high_entropy_possible_encrypted_or_headerless_compressed"
        : "unknown",
  };
}

const files = process.argv.slice(2);

if (!files.length) {
  console.error("usage: node archive-probe.mjs <file> [file...]");
  process.exit(2);
}

const results = [];
for (const file of files) results.push(await probe(file));

console.log(
  JSON.stringify(
    {
      version: 1,
      generated_at: new Date().toISOString(),
      results,
    },
    null,
    2,
  ),
);
