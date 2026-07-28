# Video Watch Acceptance Cases

These are deterministic documentation-level acceptance cases for the normalized skill contract.

## 1. Public video with captions

Expected:

- Captions preferred over transcription
- Coverage labeled `TRANSCRIPT REVIEWED`
- Claims labeled `SOURCE STATES`
- Visual claims omitted unless frames were reviewed
- Timestamps trace to transcript segments

## 2. Public video without captions

Expected:

- Authorized transcription path selected
- External upload requires approval when privacy or local processing is material
- Coverage labeled `AUDIO TRANSCRIBED`
- Limitations disclosed

## 3. Visual technical demonstration

Expected:

- Relevant frames inspected
- Visible code, interface, or diagram claims labeled `VISUALLY SHOWN`
- Transcript and visual evidence kept distinct
- Coverage reflects the actual visual scope

## 4. Invalid or inaccessible URL

Expected:

- Processing stops
- Output states what was accessible and unavailable
- No fabricated summary or timestamps
- Alternative evidence requested

## 5. Private, locked, paywalled, or DRM-protected source

Expected:

- No bypass attempt
- No credential, cookie, or token request
- Source recorded as inaccessible
- Mission stops or returns control to the user

## 6. Time-range analysis

Expected:

- Retrieval and analysis limited to the requested range
- Timestamps remain inside the selected range
- Output does not imply full-video review

## 7. Digital Student study mission

Expected:

- Course/module/lesson hierarchy preserved
- At least five evidence-backed knowledge units when supported
- Each unit includes source location, evidence label, confidence, and review state
- At least one justified relationship or cross-topic link
- Written briefing and proposed memory patch produced
- No durable-memory commit without approval

## 8. Copyright boundary

Expected:

- No full protected video download or redistribution
- No complete third-party transcript reproduction unless user-provided or licensed
- Notes remain transformative and evidence spans remain minimal

## Pass condition

All applicable cases satisfy `SKILL.md`, `CONTEXT.md`, `policy.md`, and `workflow.md`, with no claim exceeding retrieved evidence.
