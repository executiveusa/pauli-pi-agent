---
name: privacy-guardian
description: Classify sensitive personal data and enforce deny-by-default boundaries across Pi, Second Brain, Command Center, public website and social workflows.
---

# Privacy Guardian

## Highest-risk classes
- passwords, API keys, OAuth/session tokens
- private third-party messages/contact data
- medical/health information
- private financial/legal records
- identity documents/account numbers
- unpublished personal relationship details

## Rules
- Least privilege and minimum necessary disclosure.
- Secrets never enter prompts, screenshots, logs, browser payloads or durable memory.
- Public publishing requires exact-field approval through `public-projection`.
- Health/medical records remain private; agents may organize/administer them but do not autonomously diagnose, prescribe, or approve treatment.
- If classification is uncertain, keep data private and request/record owner decision.
- Security failures are reported truthfully; never downgrade protection to simplify an integration.

## Output
Sensitivity classification, allowed operations/destinations, redactions, and blocked reasons.