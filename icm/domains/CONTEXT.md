# Capability Domain Router

One job: route a task to the smallest Pauli capability shelf before loading implementation details.

## Domains

| Need | Load |
|---|---|
| Operate Pauli, missions, approvals, health, or job state | `01-control-plane/CONTEXT.md` |
| Agent lifecycle, orchestration, models, tools, sessions | `02-agent-runtime/CONTEXT.md` |
| Repository engineering, code generation, tests, release work | `03-coding/CONTEXT.md` |
| Product design, UI/UX, visual quality, New Look iteration | `04-design/CONTEXT.md` |
| Story, copy, content strategy, publishing | `05-storytelling-content/CONTEXT.md` |
| Video, media analysis, voice/media production | `06-video-media/CONTEXT.md` |
| Research, course learning, knowledge extraction | `07-research-learning/CONTEXT.md` |
| Second brain, graph, evidence, durable memory | `08-memory-knowledge/CONTEXT.md` |
| Browser operation, authenticated workflows, visual QA | `09-browser-automation/CONTEXT.md` |
| External APIs, SaaS, MCP/CLI connections | `10-integrations/CONTEXT.md` |
| Vercel, compute, secrets, deployment, storage | `11-infrastructure-deployment/CONTEXT.md` |
| Security, approvals, QA, governance, audit | `12-security-governance/CONTEXT.md` |
| Revenue systems, companies, offers, delivery | `13-business-revenue/CONTEXT.md` |

## Loading rule

Start with one domain. Add another only when an explicit edge crosses domains. Then load the current stage contract and no more than the selected skills required to execute the task.

## Human check

Before implementation, confirm the chosen domain owns the outcome rather than merely containing a convenient file.