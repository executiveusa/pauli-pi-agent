# SYSTEMS_THINKING.md - Meadows' Applied Framework

This document codifies Donella Meadows' *Thinking in Systems* principles into the operational runtime of our agent team.

```
       [Input: Actions & Code] ---> ( STOCK: Code, Memory, Assets ) ---> [Output: Value]
                                      ^                      |
                                      |                      v
                                      +--- ( FEEDBACK LOOP ) +--- [Bottleneck Detection]
```

## Core Systems Terms

### Stocks
Our primary stocks are:
1. **Durable Assets**: Reusable TS/Rust modules, configured templates, and databases.
2. **Knowledge Assets**: Active graph memory, session log files, and compiled skills.

### Flows
Our flows are:
1. **Work Velocity**: Rate of ticket resolution and deployment.
2. **Cash Flow**: Cost of LLM tokens consumed versus recurring client retainer gains.

### Balancing & Reinforcing Loops
* **Balancing Loop (Cost Control)**: When monthly token usage approaches `monthly_max` in `budgets.yaml`, the smart router switches reasoning tasks to cheaper fallback models (Groq/GitHub free).
* **Reinforcing Loop (Skill Compilation)**: Successfully resolved tickets are ingested by the Memory Agent, converted into skills, and lazy-loaded in subsequent runs, increasing the speed and success rate of future builds.

### Delays & Leverage Points
* **Leverage Point**: decoupling visual layouts from ad-hoc classes by utilizing Cynthia Design tokens. This reduces the blast radius of UI changes and increases scaling speed.
* **Bottleneck Detection**: Monitor routine execution logs daily to identify which agent role is slowing down fulfillment pipelines (e.g. lead scraping latencies).
