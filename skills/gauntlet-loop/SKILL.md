---
name: gauntlet-loop
description: Iterative quality-improvement workflow using an independent builder and reviewer against a concrete, fetchable reference bar. Use for design, code, writing, research, media, or product work when the user requests a gauntlet or repeated comparison.
category: qa-iteration
status: active
risk: low
requires_human_approval: false
---

# Gauntlet Loop

Use a real external quality bar, independent review, and repeated improvement until the target is met or a documented blocker/user stop occurs.

This installed skill is adapted from the user-provided `gauntlet-loop-main` package.

## Bar requirements

The reference must be:

- named and specific;
- obtainable by the reviewer;
- directly comparable to our output.

Add measurable criteria when appropriate: pass rate, load time, benchmark, accessibility result, error rate, word count, or other outcome metric.

## Loop

1. Define the goal and acceptance criteria.
2. Obtain the real comparison reference.
3. Split work into independently judgeable pieces.
4. Use separate fresh roles:
   - Builder improves the artifact.
   - Reviewer compares the actual output to the reference without relying on the builder's explanation.
5. The reviewer states which is stronger, the single biggest remaining gap, and the evidence.
6. Feed that gap back into the next build iteration.
7. Continue until ours meets/beats the bar, a real blocker is recorded, or the user stops the run.

Do not exit because an arbitrary round count was reached.

## Evidence rule

Review the real artifact: matching-viewport screenshots for UI, tests/benchmarks for code, actual sources for research, published comparison pieces for writing, real frames/footage for visual media. If the reference cannot be obtained, pick another valid reference or mark the comparison blocked.

## Pauli use

New Look uses this after divergent candidates and quality gates. Full-stack work uses it only after the wiring graph is truthful. Repository QA/security gates remain separate and cannot be replaced by a comparison result. Long runs should persist progress/checkpoints rather than rely on chat memory alone.
