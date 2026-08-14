# Pi Finish Checklist

## Mission
Finish Pi as the Personal/Human OS worker behind Agent MAXX without leaking personal context into business workflows.

## Locked role
Pi handles personal life, health-assistive workflows, learning, reminders, household/personal administration, and personal memory. Explicit business work routes to Hermes.

## Checklist
- [ ] Record current `main` SHA and baseline.
- [ ] Preserve the merged Agent MAXX Personal request/result contract.
- [ ] Verify `personal` routing reaches Pi.
- [ ] Verify `business` routing hands off to Hermes.
- [ ] Verify mixed requests disclose only minimum necessary context to Hermes.
- [ ] Keep health behavior assistive/non-diagnostic.
- [ ] Define personal memory namespace and retention policy.
- [ ] Prove personal memory does not contaminate Hermes/business memory.
- [ ] Add explicit side-effect approval/resume semantics.
- [ ] Verify reminders/calendar/email/contact actions use least privilege.
- [ ] Verify failures are resumable and idempotent.
- [ ] Add observability/evidence IDs compatible with Pauli's Place.
- [ ] Let Lightning observe outcomes without receiving unrestricted personal data.
- [ ] Run one golden path: owner request -> Pi -> tool/action -> evidence -> result.
- [ ] Run one boundary path: mixed personal/business request -> Pi -> bounded Hermes handoff -> result.
- [ ] Independent review passes.

## Definition of done
Pi is finished when personal requests execute end to end, mixed requests cross the Hermes boundary safely, personal memory remains isolated, side effects are permissioned, and the user experiences one coherent Agent MAXX surface rather than separate internal agents.
