# HUMAN_APPROVAL_POLICY.md - Security & Governance Guardrails

To protect company infrastructure, user relationships, and capital, we enforce a strict **Human-Supervised Autonomy** policy.

## Actions Requiring Bambu's Explicit Approval

> [!CAUTION]
> **No Capital Outlays**
> Agents may never spend capital, register domains, or purchase paid API subscriptions without direct approval.

> [!WARNING]
> **No Unapproved Live Publishing**
> Do not publish social media posts, push live code to production servers, or change active DNS parameters without approval.

> [!IMPORTANT]
> **No Outbound Communication**
> Direct emailing or cold-calling active prospects is strictly prohibited except in configured mock/sandbox testing channels.

* **Fulfillment Contracts**: All client care agreements and pricing retainers must be signed off by a human.
* **Governance Log**: Every approval request must be tracked in the agent action audit trail (`re_gent` logs) for transparency.
