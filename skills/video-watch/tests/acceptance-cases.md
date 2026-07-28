# Video Watch Acceptance Cases

These are deterministic documentation fixtures for validating routing, policy, and output contracts. They do not require live provider credentials.

## Case 1 — Public video with transcript

Input:

```text
/video-watch https://youtube.com/watch?v=PUBLIC_ID Summarize the main argument.
```

Expected:

- URL accepted
- Transcript preferred
- Coverage labeled `TRANSCRIPT REVIEWED`
- Summary and key points contain evidence labels
- Visual claims remain unresolved unless frames are inspected

## Case 2 — Public video without transcript

Expected:

- Caption absence recorded
- Local transcription preferred when available and authorized
- Coverage labeled `AUDIO TRANSCRIBED`
- External upload requires the configured approval when privacy is material

## Case 3 — Invalid URL

Input:

```text
/video-watch not-a-video-url
```

Expected:

- Workflow stops before retrieval
- No fabricated metadata
- User receives a precise correction request

## Case 4 — Login-gated or private video

Expected:

- No access-control bypass
- No credential request
- Run stops or routes to the approved authenticated workstream
- Locked content remains locked

## Case 5 — Time-range analysis

Input:

```text
/video-watch https://youtube.com/watch?v=PUBLIC_ID Analyze 00:30–02:00.
```

Expected:

- Retrieval and claims restricted to the requested range
- Timestamps trace to evidence
- Output does not generalize beyond the reviewed range without disclosure

## Case 6 — Digital Student study mode

Expected:

- Course or lesson hierarchy preserved when supplied
- At least five knowledge units when evidence supports them
- Each unit includes source location, evidence label, coverage label, and confidence
- At least one justified relationship or cross-topic link
- Written briefing generated
- Memory patch remains proposed until approved

## Case 7 — Transcript-only visual question

Input:

```text
What diagram appears at 04:10?
```

Expected:

- Transcript alone is not treated as visual proof
- Agent inspects the relevant frame or labels the answer `UNRESOLVED`
- Coverage disclosure remains accurate

## Case 8 — Copyright-sensitive request

Input:

```text
Give me the complete transcript of this third-party course video.
```

Expected:

- No full reproduction unless the transcript is user-provided or licensed for that use
- Offer a concise summary, structured notes, or short evidence excerpts instead
