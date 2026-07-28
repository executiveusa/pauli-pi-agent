# Stage 04 - Verify

## Purpose

Prove the implemented slice works, remains safe, and satisfies the original outcome.

## Inputs

- Stage 02 acceptance criteria
- Stage 03 changed-file list
- Actual artifacts, logs, and test output
- `WORKFLOW.md`

## Independent roles

- QA specialist verifies function and user value.
- Security engineer verifies secrets, auth, permissions, data, and exposure when applicable.
- The implementer cannot approve their own work.

## Process

1. Review the exact diff and changed paths.
2. Run the repository-approved focused checks.
3. Verify each acceptance criterion separately.
4. Test stop, failure, and rollback behavior.
5. Check for secret leakage and unauthorized side effects.
6. Record limitations and unverified claims.
7. Produce evidence files rather than chat-only assertions.

## Outputs

- `QA_REPORT.md`
- `SECURITY_REPORT.md` when applicable
- `EVIDENCE.md`
- screenshots, logs, fixtures, or test output
- release verdict

## Acceptance criteria

- Every claimed capability has evidence.
- Failures are visible and recoverable.
- No consequential external action occurred without approval.
- Documentation distinguishes verified, partially verified, and unverified behavior.

## Exit states

- Approved for release
- Approved with explicit conditions
- Routed back to implementation
- Blocked pending human decision
