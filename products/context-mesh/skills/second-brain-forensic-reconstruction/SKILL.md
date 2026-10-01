# Second Brain Forensic Reconstruction Skill

## Mission

Recover the real OpenAI/Transcend Second Brain corpus from encrypted or opaque Drive objects without destroying source evidence, guessing chunk order, or graphing unverified bytes.

This skill runs before Graphify, ICM normalization, or temporal graph construction.

## Known source

Google Drive folder:

`16uo1fDUObkFNs241A_BVzac24ZyM4ddo`

Observed source classes:

- 19 numbered `User Online Activity_Conversations...part-0001.zip` through `part-0019.zip`
- later `up_*.zip` objects
- encrypted/opaque files with JSON/CSV-looking names
- `OpenAI_Export_Direct_to_Google_Drive.ipynb`

## Critical discovery

Do not assume these bytes are ordinary ZIP/JSON files.

Transcend's Privacy Center architecture uses client-side decryption. Penumbra decrypts remote resources in the browser and Conflux can stream the decrypted files into a ZIP. Penumbra uses AES-GCM-style decryption inputs consisting of:

- key
- IV
- detached authentication tag

The ciphertext stream can therefore be the same byte length as the plaintext.

The transfer notebook found in Drive did not add encryption. Its attempted raw HTTP pulls failed with HTTP 403 and its final verification cell never passed. A raw signed `streaming.transcend.io` object may therefore be encrypted transport/source material that the browser was expected to decrypt before saving.

## Evidence already proven

Local byte-level checks established:

- `up_932ff7025aa2.zip`
- `User Profile_Payments Customer Profile.json`

are byte-for-byte identical.

Both are 1,427 bytes and both have SHA-256:

`42bda6f94701f7f164c808a321c2ad63b6fb67e41c16958f28f644367f86bac0`

Therefore at least one `up_*` object is a duplicate/alias of a named encrypted source object. Do not count every `up_*` file as an independent source until hashes prove uniqueness.

Additional samples:

- `up_83c0af6bea6d.zip` — SHA-256 `b08c0c5bd59a3baf3b677c7c2995374239d122f0f386b147a9cfba20fe7a4dde`; entropy ~7.998 bits/byte; no normal ZIP header.
- `up_58fa2ddbff82.zip` — SHA-256 `67b3e6049d79bfe9a30631e4f912003141b9d5ed55f45f31513196ac655b1e95`; entropy ~8 bits/byte; no normal ZIP header at byte zero.

## Open-source toolchain

Use the smallest sufficient set.

### Primary recovery layer

1. `transcend-io/penumbra`
   - canonical streaming decrypt implementation
   - use when key + IV + authTag can be recovered
2. `transcend-io/conflux`
   - canonical streaming ZIP layer used with Penumbra

### Forensic identification

3. `ReFirmLabs/binwalk`
   - signature carving
   - entropy analysis
   - embedded stream detection
4. `ip7z/7zip`
   - archive validation and multipart handling
5. `libarchive/libarchive`
   - independent archive parser/validator
6. `gchq/CyberChef`
   - local transform inspection for encodings/ciphers/compression
7. `jessek/hashdeep`
   - evidence hashes and duplicate audit

### Fallback only

8. `simsong/bulk_extractor`
   - recursive forensic scanning when format remains unknown
   - treat as an external recovery utility; do not make it a required embedded product dependency without a separate license review

## Recovery law

Never mutate the original Drive objects.

Run:

```text
HASH
→ CLASSIFY
→ DEDUPLICATE
→ IDENTIFY ENCRYPTION/CONTAINER
→ RECOVER DECRYPTION METADATA
→ DECRYPT ONE FILE
→ VALIDATE PLAINTEXT
→ RECOVER ONE CONVERSATION
→ PROVE PROVENANCE
→ SCALE
```

Do not concatenate files merely because they are numbered.

Do not brute-force AES-GCM keys.

Do not graph ciphertext.

## Required evidence ledger

For every object record:

- Drive file ID
- original name
- byte size
- SHA-256
- duplicate_of
- probable source class
- entropy
- signature/header status
- decrypt metadata status
- extraction status
- quarantine reason
- provenance

## Penumbra recovery path

For each encrypted remote resource, recover or reacquire:

- encrypted object bytes
- AES key
- IV
- detached auth tag
- original file name/path/mimetype when available

Penumbra's `RemoteResource` model expects decryption metadata separately from ciphertext. IV may also be supplied by the `x-penumbra-iv` response header.

Preferred recovery order:

1. inspect preserved Privacy Center request metadata/network artifacts
2. inspect any saved HAR/JSON/session artifacts from the original authenticated download
3. if the Privacy Center request is still accessible, reacquire the authorized file metadata/decryption information through the legitimate user flow
4. use Penumbra-compatible decryption locally on the immutable ciphertext copy
5. validate the resulting plaintext using expected file structure

If the key/authTag are unavailable, mark `BLOCKED_DECRYPTION_METADATA`. Do not pretend the ciphertext can be reconstructed by concatenation alone.

## Plaintext proof gate

Before bulk recovery, one decrypted object must pass all applicable checks:

- JSON parses or archive opens
- expected OpenAI export fields exist
- timestamps are coherent
- conversation/message IDs are present where expected
- content contains real historical user/assistant messages
- source ciphertext hash is recorded
- decryption method/version is recorded

Status can become `VERIFIED` only after one authentic historical conversation is recovered from source bytes.

## Loop Engineering

```text
OBSERVE
→ FORM HYPOTHESIS
→ TEST SMALLEST SAFE SLICE
→ MEASURE
→ PROVE
→ JUDGE
   ├─ FAIL → preserve receipt → next hypothesis
   ├─ BLOCKED → identify exact human/credential gate
   └─ PASS → freeze receipt → scale
```

## Security

Never add these to the general Second Brain graph:

- authentication exports
- cookies
- access/refresh tokens
- private keys
- passwords
- payment credentials
- banking/security records

They may be inventoried and hashed but must remain quarantined from general agent memory.

## Exit condition

The skill exits only when:

- at least one real conversation is recovered and source-proven, or
- the exact missing decryption metadata/credential is identified as the only remaining gate.
