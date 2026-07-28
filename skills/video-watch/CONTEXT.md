# Video Watch — ICM Context Contract

## Purpose

Route authorized video analysis through a consistent evidence, safety, and output contract.

## Inputs

| Input | Required | Notes |
|---|---:|---|
| Video URL or embedded lesson source | Yes | Must be accessible under the active authorization mode |
| User question or mission objective | No | Default to concise summary when absent |
| Analysis mode | No | `summary`, `content`, `competitor`, `technical`, `business`, or `study` |
| Time range | No | Restrict evidence collection when provided |
| Workstream | No | Default `standalone`; may be `digital-student`, client, prospect, or research |
| Save destination | No | Must be inside an approved working-artifact folder |

## Dependencies

Load only what the mission requires:

- Browser or web retrieval capability
- Platform captions or transcript access
- Approved speech-to-text capability when captions are unavailable
- Frame or screenshot inspection when visuals materially matter
- `skills/video-watch/policy.md`
- `skills/video-watch/workflow.md`
- `icm/workstreams/digital-student/CONTEXT.md` for educational ingestion

## Stage Routing

### Inspect

Determine platform, accessibility, authorization, duration, available evidence, and whether visual review is required.

### Specify

Define analysis mode, time range, evidence standard, output location, acceptance criteria, and stop conditions.

### Build

Retrieve evidence, analyze it, create the requested output, and write only to approved working-artifact locations.

### Verify

Check source traceability, timestamp accuracy, evidence labels, coverage disclosure, policy compliance, and completeness.

### Release

Return or publish the approved artifact. Durable memory, client delivery, public publication, or downstream execution follows the active approval policy.

## Output Locations

Standalone analyses:

```text
factory/video-watch/
```

Client or prospect work:

```text
clients/{slug}/video-analysis/
prospects/{slug}/video-analysis/
```

Digital Student working artifacts:

```text
icm/workstreams/digital-student/output/
```

Source-derived subject artifacts may be routed to the configured second-brain workspace only after the candidate-memory review step.

## Approval Boundaries

Automatic:

- Read public or explicitly authorized accessible material
- Retrieve available metadata and captions
- Analyze selected frames
- Produce private working notes

Approval required:

- Uploading source media to an external transcription provider when local processing is available or privacy is material
- Downloading an authorized resource file
- Writing to durable second-brain memory
- Publishing or sending analysis externally

Blocked:

- Credential collection
- Cookie or token export
- Authentication bypass
- CAPTCHA bypass
- DRM circumvention
- Private-content access without authorization
- Full-video redistribution
- Bulk platform crawling unrelated to a selected mission

## Acceptance Criteria

A completed run must:

1. State what source evidence was available.
2. Assign an accurate coverage label.
3. Separate source statements, visual observations, and inference.
4. Answer the user’s actual question.
5. Include limitations and unresolved claims.
6. Preserve authorization and copyright boundaries.
7. For Digital Student, produce candidate knowledge with traceable evidence and no silent durable-memory commit.

## Stop Conditions

Stop when:

- Authorization is absent or uncertain
- The source is private, locked, paywalled, or DRM-protected
- A security challenge or automation warning appears
- Evidence is too incomplete to support the requested claim
- The requested operation would redistribute protected source content
- The mission attempts an unapproved write, publication, purchase, or account change
