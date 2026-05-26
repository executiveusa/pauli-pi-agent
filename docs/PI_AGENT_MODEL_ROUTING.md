# PI Agent Model Routing - Policy & Implementation

**Version**: 0.0.4

---

## Overview

Model routing enforces **Free Mode first**, with explicit approval required for paid model fallback. No silent upgrades from free to paid APIs.

---

## Routing Policies

### Free Mode (DEFAULT)

**Selects only free or self-hosted providers:**

1. **Ollama** (local, always available)
   - Requires: `OLLAMA_BASE_URL` (http://localhost:11434)
   - Models: Any model installed in Ollama
   - Cost: $0

2. **OpenRouter Free Tier**
   - Requires: `OPENROUTER_API_KEY`
   - Models: Free models only (marked with `free: true` in provider config)
   - Cost: $0

3. **NVIDIA NIM**
   - Requires: `NVIDIA_API_KEY`
   - Models: Qwen, Mistral, Llama (self-hosted NIM)
   - Cost: $0 (free tier for inference)

4. **Local vLLM / LM Studio**
   - Requires: OpenAI-compatible endpoint
   - Cost: $0

**Fallback Logic:**
```
if (model_policy === 'free') {
  try {
    return routeToOllama();
  } catch {
    try {
      return routeToOpenRouterFree();
    } catch {
      try {
        return routeToNVIDIANIM();
      } catch {
        return MODEL_ROUTE_BLOCKED;
      }
    }
  }
}
```

**Error Returned:**
```json
{
  "status": "MODEL_ROUTE_BLOCKED",
  "reason": "No free model available matching requirements",
  "available_modes": ["balanced", "premium"],
  "message": "Free Mode cannot fulfill request. Require human approval for paid model upgrade."
}
```

### Balanced Mode

**Prefers low-cost providers but allows some paid models:**

1. **OpenRouter Cheap Models** (Claude 3 Haiku, GPT-4o-mini)
   - Cost: ~$0.001-0.01 per request

2. **Groq API** (free with rate limit or paid)
   - Cost: $0.50-2.50 per million tokens

3. **Cerebras** (free during limited availability)
   - Cost: $0 (limited) or ~$0.01 per request

4. **Mistral API** (cheap models)
   - Cost: ~$0.15 per million input tokens

**Policy Check:**
```typescript
if (estimated_cost > daily_budget_remaining) {
  throw new Error('Budget exhausted; cannot route');
}
```

### Premium Mode

**Allows expensive models for best quality:**

1. **OpenAI** (GPT-4o, GPT-4o-mini)
   - Cost: $0.03-0.30 per request

2. **Anthropic** (Claude 3.5 Sonnet, Opus)
   - Cost: $0.015-0.30 per request

3. **Google Vertex AI** (Gemini 2.0)
   - Cost: ~$0.075 per 1M tokens

4. **Azure OpenAI** (GPT-4, GPT-4o)
   - Cost: $0.03-0.30 per request (Azure pricing)

**Requires Explicit Approval:**
```typescript
if (estimated_cost > premium_cost_threshold) {
  await createApprovalRequest({
    request_type: 'expensive_model_route',
    estimated_cost_usd,
    model,
    provider,
  });
}
```

### Local-Only Mode

**No internet provider calls, only local/self-hosted:**

- Ollama
- vLLM
- LM Studio
- Local transformers.js

---

## Router Decision Object

Every model call returns a routing decision:

```typescript
interface ModelRoute {
  route_id: string;                    // Unique ID for this routing decision
  mode: 'free' | 'balanced' | 'premium' | 'local_only';
  selected_provider: string;           // e.g., 'ollama', 'openai', 'openrouter'
  selected_model: string;              // e.g., 'gpt-4o-mini', 'mistral:7b'
  reason: string;                      // Why this route was selected
  estimated_cost_usd: number;          // Estimated cost for this call
  fallback_allowed: boolean;           // Can fall back to paid if free unavailable
  blocked: boolean;                    // True if route blocked (e.g., budget exceeded)
  
  // If blocked
  block_reason?: string;               // Why blocked
  available_fallback_modes?: string[]; // Other modes that could work
  
  // Metadata
  created_at: Date;
  reasoning_run_id?: string;           // Link to reasoning run if applicable
}
```

### Example Output

```json
{
  "route_id": "route_abc123",
  "mode": "free",
  "selected_provider": "ollama",
  "selected_model": "mistral:7b",
  "reason": "Free policy and Ollama available locally",
  "estimated_cost_usd": 0.0,
  "fallback_allowed": false,
  "blocked": false,
  "created_at": "2026-05-26T21:42:00Z"
}
```

### Blocked Example

```json
{
  "route_id": "route_xyz789",
  "mode": "free",
  "selected_provider": null,
  "selected_model": null,
  "reason": null,
  "estimated_cost_usd": 0.0,
  "fallback_allowed": false,
  "blocked": true,
  "block_reason": "No free models available; budget insufficient for paid model; approval required",
  "available_fallback_modes": ["balanced", "premium"],
  "created_at": "2026-05-26T21:42:15Z"
}
```

---

## Implementation Pattern

### Router Service

```typescript
// packages/agent/src/model-routing/router.ts

export class ModelRouter {
  constructor(
    private policy: 'free' | 'balanced' | 'premium' | 'local_only',
    private budgets: BudgetManager,
  ) {}

  async route(
    requirements: {
      min_tokens?: number;
      needs_vision?: boolean;
      needs_tool_calling?: boolean;
      preferred_latency?: 'fast' | 'balanced' | 'quality';
    }
  ): Promise<ModelRoute> {
    if (this.policy === 'free') {
      return this.routeFree(requirements);
    } else if (this.policy === 'balanced') {
      return this.routeBalanced(requirements);
    } else if (this.policy === 'premium') {
      return this.routePremium(requirements);
    } else {
      return this.routeLocalOnly(requirements);
    }
  }

  private async routeFree(requirements): Promise<ModelRoute> {
    // Try each free provider in order
    for (const provider of ['ollama', 'openrouter_free', 'nvidia_nim']) {
      const model = await this.selectModelFromProvider(provider, requirements);
      if (model) {
        return {
          route_id: generateId(),
          mode: 'free',
          selected_provider: provider,
          selected_model: model,
          reason: `Selected ${model} from ${provider} (free mode)`,
          estimated_cost_usd: 0,
          fallback_allowed: false,
          blocked: false,
          created_at: new Date(),
        };
      }
    }

    // No free model available
    return {
      route_id: generateId(),
      mode: 'free',
      selected_provider: null,
      selected_model: null,
      reason: null,
      estimated_cost_usd: 0,
      fallback_allowed: false,
      blocked: true,
      block_reason: 'No free models available',
      available_fallback_modes: ['balanced', 'premium'],
      created_at: new Date(),
    };
  }

  private async routeBalanced(requirements): Promise<ModelRoute> {
    // Try cheap models first, then expensive
    const candidates = [
      { provider: 'openrouter', model: 'gpt-4o-mini', cost: 0.001 },
      { provider: 'groq', model: 'mixtral-8x7b', cost: 0.01 },
      { provider: 'anthropic', model: 'claude-3-haiku', cost: 0.015 },
    ];

    for (const { provider, model, cost } of candidates) {
      const budget_ok = await this.budgets.canAfford(cost);
      if (budget_ok) {
        return {
          route_id: generateId(),
          mode: 'balanced',
          selected_provider: provider,
          selected_model: model,
          reason: `Selected ${model} from ${provider} (balanced mode, low cost)`,
          estimated_cost_usd: cost,
          fallback_allowed: true, // Can try next candidate if needed
          blocked: false,
          created_at: new Date(),
        };
      }
    }

    return {
      route_id: generateId(),
      mode: 'balanced',
      selected_provider: null,
      selected_model: null,
      blocked: true,
      block_reason: 'Budget insufficient for any balanced model',
      available_fallback_modes: ['premium'],
      created_at: new Date(),
    };
  }

  private async routePremium(requirements): Promise<ModelRoute> {
    // Allow any model
    const model = await this.selectBestModel(requirements);
    const cost = await this.estimateCost(model);

    // Check if approval needed
    if (cost > PREMIUM_COST_THRESHOLD) {
      const approval = await this.approvalManager.createRequest({
        type: 'expensive_model_route',
        model,
        cost,
      });
      // Block until approved
      await this.approvalManager.waitForApproval(approval.id);
    }

    return {
      route_id: generateId(),
      mode: 'premium',
      selected_provider: model.provider,
      selected_model: model.name,
      reason: `Selected ${model.name} from ${model.provider} (premium mode, quality-first)`,
      estimated_cost_usd: cost,
      fallback_allowed: true,
      blocked: false,
      created_at: new Date(),
    };
  }

  private async routeLocalOnly(requirements): Promise<ModelRoute> {
    // Only Ollama, vLLM, LM Studio
    const local_providers = ['ollama', 'vllm', 'lm_studio'];
    for (const provider of local_providers) {
      const model = await this.selectModelFromProvider(provider, requirements);
      if (model) {
        return {
          route_id: generateId(),
          mode: 'local_only',
          selected_provider: provider,
          selected_model: model,
          reason: `Selected ${model} from ${provider} (local-only mode)`,
          estimated_cost_usd: 0,
          fallback_allowed: false,
          blocked: false,
          created_at: new Date(),
        };
      }
    }

    return {
      route_id: generateId(),
      mode: 'local_only',
      selected_provider: null,
      selected_model: null,
      blocked: true,
      block_reason: 'No local models available',
      created_at: new Date(),
    };
  }
}
```

---

## Configuration & Environment

**Router Policy (Set at Startup):**
```bash
PI_MODEL_POLICY=free  # free | balanced | premium | local_only
```

**Provider Credentials (Infisical or .env):**
```bash
# Free providers
OLLAMA_BASE_URL=http://localhost:11434
OPENROUTER_API_KEY=sk-or-...
NVIDIA_API_KEY=nvapi-...

# Balanced providers
GROQ_API_KEY=gsk-...
CEREBRAS_API_KEY=...

# Premium providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# Budget
DAILY_BUDGET_USD=10.00
MONTHLY_BUDGET_USD=100.00
```

**Fallback Policy:**
```bash
PI_ALLOW_PAID_FALLBACK=false  # Never fallback silently
PI_PREMIUM_COST_THRESHOLD=1.00  # Require approval if > $1
```

---

## Logging & Auditing

Every routing decision is logged:

```typescript
await auditLog({
  event_type: 'model_routing_decision',
  resource_type: 'reasoning_run',
  resource_id: reasoning_run_id,
  details: {
    route_id: modelRoute.route_id,
    policy: modelRoute.mode,
    selected_provider: modelRoute.selected_provider,
    selected_model: modelRoute.selected_model,
    estimated_cost: modelRoute.estimated_cost_usd,
    blocked: modelRoute.blocked,
    block_reason: modelRoute.block_reason,
  },
});
```

---

## Testing

### Unit Tests

```typescript
test('free mode blocks paid fallback', async () => {
  const router = new ModelRouter('free', budgets);
  
  // Mock all free providers as unavailable
  jest.spyOn(ollama, 'models').mockRejectedValue('unavailable');
  jest.spyOn(openrouter, 'getFreeModels').mockResolvedValue([]);
  
  const route = await router.route({});
  
  expect(route.blocked).toBe(true);
  expect(route.block_reason).toContain('No free models');
  expect(route.selected_provider).toBeNull();
});

test('budget limit enforced', async () => {
  const router = new ModelRouter('balanced', budgets);
  budgets.remaining = 0.001; // Only 0.1 cent left
  
  const route = await router.route({});
  
  expect(route.blocked).toBe(true);
  expect(route.block_reason).toContain('Budget');
});

test('premium approval required for expensive model', async () => {
  const router = new ModelRouter('premium', budgets);
  
  // Mock expensive model selection
  jest.spyOn(router, 'selectBestModel')
    .mockResolvedValue({ provider: 'openai', name: 'gpt-4', cost: 5.00 });
  
  const approvalSpy = jest.spyOn(approvalManager, 'createRequest');
  
  await router.route({});
  
  expect(approvalSpy).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'expensive_model_route' })
  );
});
```

### Integration Tests

```typescript
test('routing decision recorded in audit log', async () => {
  const route = await router.route({});
  
  const audit = await auditLog.query({
    event_type: 'model_routing_decision',
    resource_id: reasoning_run_id,
  });
  
  expect(audit).toHaveLength(1);
  expect(audit[0].details.route_id).toBe(route.route_id);
});
```

---

## Conclusion

The PI Agent Control Plane enforces Free Mode by default with explicit approval gates for paid models. No silent fallback. All routing decisions logged and traceable. Budget enforcement prevents cost surprises.
