# Agent Self-Awareness: Free LLM Fallback System

## Overview

Your agents (Pauli, Hermes, Pi) are now **self-aware** of:
- When to switch to free models (budget exceeded, demo mode, cost control active)
- Which free providers are available (based on configured API keys)
- Which models are optimal for their use case

This enables **demos on free models** while maintaining capability to use premium models.

---

## The 6 Free LLM Providers (awesome-free-llm-apis)

### 1. **Google Gemini (Free Tier)** 🟢
- **Best for:** Multimodal demos, complex reasoning
- **Cost:** $0/run
- **Rate:** 15 RPM (Gemini 3.5 Flash)
- **Context:** 1M tokens | Max Output: 65K
- **Model:** `gemini-3.5-flash`
- **Setup:** Get key at https://aistudio.google.com/app/apikey
- **Env Var:** `GOOGLE_GEMINI_API_KEY`

### 2. **Mistral AI (Free Experiment)** 🟢
- **Best for:** Content generation, coding, balanced demos
- **Cost:** $0/run (~1B tokens/month)
- **Rate:** ~1 RPS, 500K TPM
- **Context:** 128K-256K | Max Output: 128K-256K
- **Model:** `mistral-nemo-12b` (12B, fast) or `mistral-small-4`
- **Setup:** Get key at https://console.mistral.ai/api-keys
- **Env Var:** `MISTRAL_API_KEY`

### 3. **Cohere (Free Trial)** 🟡
- **Best for:** Low-volume production, API testing
- **Cost:** $0/run (1,000 calls/month limit)
- **Rate:** 20 RPM
- **Context:** 128K-256K | Max Output: 4K
- **Model:** `command-r7b` or `command-r`
- **Setup:** Get key at https://dashboard.cohere.com/api-keys
- **Env Var:** `COHERE_API_KEY`

### 4. **Cerebras (Free Tier)** ⚡
- **Best for:** Ultra-fast inference, high throughput
- **Cost:** $0/run (1M tokens/day cap)
- **Rate:** Unlimited (ultra-fast: ~2,600 tok/s)
- **Context:** 8K (limited) | Max Output: 4K
- **Model:** `llama-3.1-70b`
- **Setup:** Get key at https://cloud.cerebras.ai/
- **Env Var:** `CEREBRAS_API_KEY`

### 5. **Aion Labs (Permanent Free)** 🟢
- **Best for:** Roleplay, storytelling, creative content
- **Cost:** $0/run
- **Rate:** 15 RPM
- **Context:** 128K | Max Output: 32K
- **Model:** `aion-2.5`
- **Setup:** Get key at https://www.aionlabs.ai
- **Env Var:** `AION_API_KEY`
- **Special:** No credit card required, truly permanent

### 6. **Z AI / Zhipu (Free Models)** 🟢
- **Best for:** Large context, long documents, multilingual
- **Cost:** $0/run
- **Rate:** 1 concurrent request
- **Context:** 200K | Max Output: 128K
- **Model:** `glm-4.7-flash`
- **Setup:** Get key at https://open.bigmodel.cn/usercenter/apikeys
- **Env Var:** `ZAI_API_KEY`

---

## Agent-Specific Preferences

### Cascadia Atlas
**Preferred Fallbacks:** Google Gemini → Mistral → Cerebras → Cohere
- **Why:** Cascadia needs multimodal for demo features
- **Demo Mode:** Default to Gemini (best quality for 3D viz)
- **Budget Mode:** Fall back to Mistral (good content generation)

### Pauli Effect
**Preferred Fallbacks:** Mistral → Google Gemini → Cerebras → Aion
- **Why:** Pauli focuses on short-form content (TikTok/Reels)
- **Demo Mode:** Mistral is well-balanced for Pauli's voice
- **Budget Mode:** Can use Aion for creative storytelling

### Hermes (Macs Digital)
**Preferred Fallbacks:** Google Gemini → Mistral → Cerebras → Cohere
- **Why:** Hermes handles B2B content (LinkedIn/YouTube)
- **Demo Mode:** Gemini for multimodal LinkedIn posts
- **Budget Mode:** Mistral for consistent quality

---

## How Agents Self-Trigger Fallback

### Triggers that activate free model switching:

1. **Budget Exceeded** 💰
   ```
   Monthly cost exceeds MAX_MONTHLY_SPEND_USD
   → Switch to free provider automatically
   ```

2. **Demo Mode** 🎬
   ```
   Running demo or test flow
   → Use free model to showcase features
   ```

3. **Primary Unavailable** ⚠️
   ```
   Primary API key missing or rate limited
   → Fall back to available free provider
   ```

4. **Cost Control Active** 🎛️
   ```
   PROMPT_FOR_MODEL_SELECTION=true
   → User can choose free or paid each run
   ```

---

## Configuration

### Quick Setup: Add to `.env.local`

```bash
# Free LLM API Keys (pick one or more)
GOOGLE_GEMINI_API_KEY=your_gemini_key_here
MISTRAL_API_KEY=your_mistral_key_here
COHERE_API_KEY=your_cohere_key_here
CEREBRAS_API_KEY=your_cerebras_key_here
AION_API_KEY=your_aion_key_here
ZAI_API_KEY=your_zai_key_here

# Cost Control Settings
MAX_MONTHLY_SPEND_USD=50
COST_WARNING_ENABLED=true
PROMPT_FOR_MODEL_SELECTION=true
```

### For Cascadia Specifically:

```bash
# Cascadia demo mode always prompts
PROMPT_FOR_MODEL_SELECTION=true

# Set budget threshold
MAX_MONTHLY_SPEND_USD=50

# Optional: override to always use Mistral Free
# CASCADIA_MODEL_OVERRIDE=mistral-free
```

---

## Code Integration

### Check which free models are available (from your agent):

```typescript
import { getAvailableFreeLLMs } from 'packages/content-engine/src/model-selector';
import { getAgentFreeFallback, detectFallbackNeeded } from 'packages/secrets/src/agent-context';

const secrets = loader.get();
const agent = 'cascadia';

// Which free models can we use?
const available = getAvailableFreeLLMs(secrets);
console.log('Available free models:', available);

// Which is best for Cascadia?
const fallback = getAgentFreeFallback(agent, secrets);
console.log('Optimal fallback for Cascadia:', fallback);

// Should we activate fallback now?
const needsFallback = detectFallbackNeeded(agent, secrets, 'demo');
if (needsFallback) {
  console.log('Demo mode active - switching to free model');
}
```

### Agent sees available options:

```typescript
import { listFreeModelsForAgent } from 'packages/content-engine/src/model-selector';

const options = listFreeModelsForAgent('pauli', secrets);
console.log(options);
// Output:
// 🆓 Free LLM Options Available for pauli:
//   1. Google Gemini (Free Tier)
//      Quality: best | Speed: Medium
//      Rate: 15 RPM | Cost: $0/run
//      Best for: demos, multimodal content, complex reasoning
//   ...
```

---

## Usage Example: Cascadia in Demo Mode

```bash
# Set environment
export GOOGLE_GEMINI_API_KEY=sk-...
export PROMPT_FOR_MODEL_SELECTION=true
export MAX_MONTHLY_SPEND_USD=50

# Run Cascadia
npx tsx packages/content-engine/src/runner.ts

# Agent automatically:
# 1. Detects demo mode active
# 2. Lists available free models: [Gemini, Mistral, Cerebras, Cohere]
# 3. Defaults to Gemini (best quality for demos)
# 4. Shows: "Estimating cost: $0/run | Quality: Best"
# 5. Generates content using Gemini free tier
```

---

## Fallback Chain: How Agents Pick

When primary model unavailable:

```
Cascadia:
  1. Try primary (DeepSeek-4)
  2. Fall back to DeepSeek-Flash
  3. Check free options: Gemini? → Mistral? → Cerebras? → Cohere?
  4. Use first available free model
  5. If all paid unavailable, use Mistral Free (fastest fallback)

Pauli:
  1. Try primary (Claude Haiku)
  2. Check free options: Mistral? → Gemini? → Cerebras? → Aion?
  3. Mistral is optimal for Pauli's TikTok voice
  4. Fall back to Mistral Free if Anthropic unavailable

Hermes:
  1. Try primary (NousResearch Hermes)
  2. Check free options: Gemini? → Mistral? → Cerebras? → Cohere?
  3. Gemini best for B2B multimodal content
  4. Fall back to Gemini if NousResearch unavailable
```

---

## Monitoring Agent Fallback

### Log when agent switches to free model:

```
🤖 Cascadia Agent Starting
📍 Primary: DeepSeek-4 ($0.05/run)
💾 Budget: $50/month, $42 spent so far
⚠️ This run would exceed budget
🆓 Switching to free tier: Google Gemini
✅ Estimated cost: $0/run | Quality: Best
🚀 Invoking Gemini...
```

### Check free model costs:

```
Cascadia completed:
  Model: Google Gemini Free
  Posts: 5
  Cost: $0.00
  Total Monthly: $42.00 / $50.00 budget
  Next: Will remain in free tier until budget resets
```

---

## Source & License

Free LLM registry sourced from:
- **awesome-free-llm-apis**: https://github.com/mnfst/awesome-free-llm-apis
- **comimi** (visual display): https://github.com/yui540/comimi

All free models are production-ready with no credit card required (except Cohere trial, which just needs verification).

---

## Next Steps

1. **Get free API keys** from one or more providers above
2. **Add to `.env.local`** with appropriate `_API_KEY` vars
3. **Agents automatically detect** and self-route to free models when appropriate
4. **Monitor** monthly spend vs. budget threshold
5. **Demo freely** knowing cost is $0 when not using premium models

Your agents are now cost-conscious and self-aware. 🧠✨
