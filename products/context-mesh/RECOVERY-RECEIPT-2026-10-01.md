# Second Brain Recovery Receipt — 2026-10-01

## Decision

The September 2026 OpenAI Privacy Center corpus is **not approved for graph ingestion yet**.

Current status:

`BLOCKED_DECRYPTION_METADATA`

The evidence supports a client-side Transcend/Penumbra decryption path more strongly than the earlier generic "corrupt ZIP" or "split ZIP" hypotheses.

## Source inventory evidence

Source Drive folder:

`16uo1fDUObkFNs241A_BVzac24ZyM4ddo`

Observed:

- 19 numbered ChatGPT conversation objects, part-0001 through part-0019
- later `up_*.zip` objects
- named JSON/CSV exports
- OpenAI transfer notebook
- transfer-test folder

The large conversation files exist and are non-empty. The current chat-side Drive transport cannot download a ~1 GB part because of its 256 MiB single-file limit; recovery should run on the VPS/authorized browser path.

## Hard byte proof

The following two Drive objects are identical byte-for-byte:

1. `up_932ff7025aa2.zip`
2. `User Profile_Payments Customer Profile.json`

Size:

`1427 bytes`

SHA-256:

`42bda6f94701f7f164c808a321c2ad63b6fb67e41c16958f28f644367f86bac0`

This proves at least one `up_*` file is a duplicate/alias of a named opaque source object.

Therefore:

- do not blindly concatenate `up_*`
- deduplicate every object by cryptographic hash
- filenames/extensions cannot be trusted as plaintext format indicators

Additional sampled opaque objects:

### up_83c0af6bea6d.zip

- bytes: 95,485
- SHA-256: `b08c0c5bd59a3baf3b677c7c2995374239d122f0f386b147a9cfba20fe7a4dde`
- entropy: ~7.998 bits/byte
- normal ZIP magic at byte zero: absent

### up_58fa2ddbff82.zip

- bytes: 200,243,941
- SHA-256: `67b3e6049d79bfe9a30631e4f912003141b9d5ed55f45f31513196ac655b1e95`
- entropy: ~8 bits/byte
- normal ZIP magic at byte zero: absent

## Transfer-notebook evidence

The saved Colab notebook attempted direct downloads from `streaming.transcend.io` and raw resumable uploads to Google Drive.

The saved execution contains HTTP 403 failures, and its final `TRANSFER VERIFIED` gate did not complete.

The notebook itself did not add encryption.

## Transcend/Penumbra model

Open-source Penumbra code shows an encrypted `RemoteResource` carries its ciphertext URL separately from:

- AES key
- IV
- detached authentication tag

Penumbra decrypts the response stream before presenting/saving the user-visible file. Conflux can assemble multiple decrypted resources into a ZIP.

Important implementation details confirmed from the open-source code:

- generated key size: 256 bits
- generated IV size: 96 bits / 12 bytes
- authentication tag is detached
- decryption uses key + IV + authTag
- IV may be read from `x-penumbra-iv`

This model is consistent with ciphertext having the same byte count as its plaintext.

## Gmail evidence

OpenAI Privacy Center completion email exists:

- date: 2026-09-12
- subject: `Your Download all my data request report is ready`
- report availability stated: 4 days
- report link is a generic Privacy Center login URL

The email does not preserve the Penumbra key/IV/authTag.

OpenAI also recorded Transcend as the authenticated application during the September 15 export work, consistent with the Privacy Center flow.

## Recovery tooling added

- `skills/second-brain-forensic-reconstruction/SKILL.md`
- `bin/archive-probe.mjs`
- `bin/penumbra-decrypt.mjs`
- `RECOVERY-KNOWLEDGE.md`

The decryptor uses authenticated AES-256-GCM and never commits output if authentication fails.

Synthetic round-trip verification:

`PASS`

The test encrypted known plaintext with AES-256-GCM, ran the recovery decryptor with separate key/IV/authTag, and reproduced the original plaintext exactly.

## What remains

To recover the existing ciphertext, obtain legitimate decryption metadata for at least one encrypted source object:

- key
- IV
- authTag

Preferred routes:

1. preserved Privacy Center network/session metadata, if any exists
2. an authorized current Privacy Center session that exposes the resource metadata
3. a fresh OpenAI Privacy Center export, this time saving the browser-decrypted output rather than raw signed ciphertext

Do not ask the user to paste credentials, keys, session cookies, or tokens into chat.

## Proof gate

Full graph ingestion remains blocked until:

1. one source object decrypts successfully
2. its plaintext parses as the expected source format
3. one authentic historical ChatGPT conversation is extracted
4. provenance is recorded back to the source ciphertext SHA-256

After that:

`1 file → 1 archive → 3 archives → 5 archives → full approved corpus → ICM → Graphify → temporal graph → Context Mesh`
