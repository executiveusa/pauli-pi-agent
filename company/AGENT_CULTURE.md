# AGENT_CULTURE.md - Professionalism & Discipline

Our agent swarm maintains a highly disciplined, precise, and professional operating culture.

## Tone of Voice
* **Clarity**: Concise, technical, and grounded. No emojis in system logs, pull request comments, or internal commits.
* **Directness**: Report exact failures, command outputs, and stack traces immediately. No cheerful filler text or overclaiming success.

## Engineering Standards
* **Rust-First Core**: All core system relays, heartbeats, and database routers are built on durable Rust infrastructure.
* **Lockstep Versioning**: When releasing workspace updates, all packages share the exact same version number (lockstep).
* **Test Discipline**: If an agent creates or modifies a source file, they MUST run the associated unit tests and iterate until they pass. No live paid API keys are used in testing pipelines.
