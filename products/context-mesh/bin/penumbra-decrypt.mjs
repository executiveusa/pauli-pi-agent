#!/usr/bin/env node

import { createDecipheriv, createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { rename, rm, stat } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";

function decodeSecret(name, expectedLength) {
  const raw = process.env[name];
  if (!raw) throw new Error(`${name} is required`);

  let value;
  if (/^[0-9a-f]+$/i.test(raw) && raw.length % 2 === 0) {
    value = Buffer.from(raw, "hex");
  } else {
    value = Buffer.from(raw, "base64");
  }

  if (expectedLength && value.length !== expectedLength) {
    throw new Error(
      `${name} decoded to ${value.length} bytes; expected ${expectedLength}`,
    );
  }
  return value;
}

async function sha256(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

const [input, outputArg] = process.argv.slice(2);

if (!input) {
  console.error(
    "usage: PENUMBRA_KEY=... PENUMBRA_IV=... PENUMBRA_AUTH_TAG=... node penumbra-decrypt.mjs <ciphertext> [output]",
  );
  process.exit(2);
}

const key = decodeSecret("PENUMBRA_KEY", 32);
const iv = decodeSecret("PENUMBRA_IV", 12);
const authTag = decodeSecret("PENUMBRA_AUTH_TAG", 16);
const output =
  outputArg || join(dirname(input), `${basename(input)}.decrypted`);
const temp = `${output}.partial-${process.pid}`;

const before = await stat(input);
const inputHash = await sha256(input);
const decipher = createDecipheriv("aes-256-gcm", key, iv);
decipher.setAuthTag(authTag);

try {
  await pipeline(
    createReadStream(input),
    decipher,
    createWriteStream(temp, { flags: "wx" }),
  );
  await rename(temp, output);
} catch (error) {
  await rm(temp, { force: true }).catch(() => {});
  throw new Error(
    `decryption/authentication failed; no output committed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}

const after = await stat(output);
const outputHash = await sha256(output);

console.log(
  JSON.stringify(
    {
      status: "DECRYPTED_AUTHENTICATED",
      input,
      output,
      input_bytes: before.size,
      output_bytes: after.size,
      input_sha256: inputHash,
      output_sha256: outputHash,
      algorithm: "AES-256-GCM",
      iv_bytes: iv.length,
      auth_tag_bytes: authTag.length,
    },
    null,
    2,
  ),
);
