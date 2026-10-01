# Authorized OpenAI Privacy Export Capture

## Purpose

Use this procedure when the stored September 2026 OpenAI Privacy Center objects are encrypted Transcend source resources and the original Penumbra decryption metadata is no longer available.

The goal is to acquire a **fresh authorized export** and save the **browser-decrypted output**, not the raw encrypted `streaming.transcend.io` resources.

## Security rule

Never paste or store these in chat, Git, logs, screenshots, or normal agent memory:

- OAuth tokens
- session cookies
- Penumbra AES keys
- IVs
- authentication tags
- authorization headers

If network inspection is required, store the raw capture only in an encrypted/private recovery workspace and immediately derive a redacted metadata receipt.

## Preferred path — save decrypted output

1. Authenticate to the OpenAI Privacy Center as the data subject.
2. Open the completed export report.
3. Use the Privacy Center's normal **Download** action.
4. Allow Penumbra to perform client-side decryption.
5. Allow Conflux/browser download to finish.
6. Save the resulting user-visible ZIP directly to the sovereign recovery workspace or to a private Drive folder.
7. Compute SHA-256 immediately.
8. Run:
   - `file`
   - `7z t`
   - `unzip -t`
   - `node bin/archive-probe.mjs`
9. Extract only into staging.
10. Prove one historical conversation before bulk ingestion.

This is the safest route because the cryptographic key material remains inside the authorized browser flow and does not need to be exported.

## Fallback path — controlled Penumbra metadata capture

Only use this if the normal browser-decrypted download cannot be saved reliably.

Capture the authorized Privacy Center network/API response that describes a Penumbra `RemoteResource`.

Required per-resource data:

- ciphertext URL or stable source identifier
- original filename/path/mimetype
- key
- IV or `x-penumbra-iv`
- detached authTag

Treat the key/IV/authTag as secrets.

Do not commit them.

Store them in a secrets manager or protected local environment, then run:

```bash
PENUMBRA_KEY='...' \
PENUMBRA_IV='...' \
PENUMBRA_AUTH_TAG='...' \
node bin/penumbra-decrypt.mjs encrypted-object.bin recovered-object
```

The decryptor commits output only when AES-GCM authentication succeeds.

After successful decryption, delete temporary plaintext copies not needed for the approved corpus and securely remove exported key material once the recovery receipt is complete.

## Evidence receipt

For every recovered source record:

- source provider
- source object ID
- ciphertext SHA-256
- plaintext SHA-256
- plaintext byte size
- detected format
- original filename
- recovery timestamp
- decryptor version/commit
- validation result
- ingestion policy result

Do not record the secret key, IV, authTag, cookie, token, or authorization header in the receipt.

## Proof gate

A fresh export is valid only when:

1. the downloaded output has a recognized archive signature;
2. archive integrity tests pass;
3. expected OpenAI export structures exist;
4. a real historical conversation can be extracted;
5. provenance links the conversation to the recovered archive;
6. authentication/payment/security exports remain quarantined.

## Then resume Loop Engineering

```text
1 proven conversation
→ complete one archive
→ 3 archives
→ 5 archives
→ all approved conversation archives
→ ICM normalization
→ Graphify
→ temporal graph
→ Context Mesh
→ cross-agent proof
```
