# Handoff: Installing and Running the Mercury Voice Chatbot Skill

## What Has Been Completed

The ArchonX Mercury Voice Chatbot Skill has been structured and documented. This document guides you through installation and activation.

### Deliverables

1. **Skill Structure** (`.agents/skills/mercury-voice-chatbot/`)
   - ✅ SKILL.md - Mission and feature overview
   - ✅ README.md - Quick start and integration guide
   - ✅ tenant.schema.json - JSON Schema for tenant validation
   - ✅ tool-permissions.yaml - Permission matrix and approval workflows
   - ✅ examples/webflow-embed.html - Webflow embed contract
   - ✅ examples/nextjs-demo-client.md - NextJS client example
   - ✅ examples/tenant-config.example.json - Sample tenant configs
   - ✅ docs/MERCURY_VOICE_CHATBOT_ARCHITECTURE.md - Detailed architecture
   - ✅ docs/HANDOFF_FOR_MERCURY_VOICE_AGENT.md - This file

2. **Environment Configuration**
   - ✅ .env.example updated with Mercury variables

3. **Implementation Plan** (Ready for development)
   - Server-side components (Mercury client, stability gate, tenant config)
   - Web UI components (Diffusion bubble, voice orb, tool dock, usage meter)
   - API routes
   - LLM routing updates

## Phase 1: Verify Existing System (Now)

Before adding Mercury, confirm the existing setup works:

```bash
# 1. Install dependencies
npm install

# 2. Build all packages
npm run build

# 3. Run type check
npm run check

# 4. Verify existing web UI works
cd packages/web-ui/example
npm install
npm run dev

# Visit http://localhost:5173
# You should see a working chat interface
```

## Phase 2: Environment Setup

### 1. Get API Keys

You need three API keys:

1. **Inception Labs (Mercury 2)**
   - Sign up at https://inception.ai or contact ExecutiveUSA
   - Set: `INCEPTION_API_KEY`

2. **OpenAI (for STT/TTS and fallback)**
   - Get from https://platform.openai.com/api-keys
   - Set: `OPENAI_API_KEY`

3. **Anthropic (optional fallback)**
   - Get from https://console.anthropic.com
   - Set: `ANTHROPIC_API_KEY`

### 2. Create .env File

```bash
# Copy from .env.example and fill in
cp .env.example .env

# Edit and add your keys
INCEPTION_API_KEY=your_inception_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Mercury configuration
MERCURY_MODEL=mercury-2
MERCURY_BASE_URL=https://api.inceptionlabs.ai/v1
MERCURY_DEFAULT_REASONING=low
MERCURY_VOICE_REASONING=instant
MERCURY_DIFFUSION_ENABLED=true

# Voice providers
VOICE_STT_PROVIDER=openai
VOICE_TTS_PROVIDER=openai
VOICE_TTS_MODEL=tts-1
VOICE_TTS_VOICE=shimmer
```

## Phase 3: Implement Server Components

The following files need to be created in `packages/agent/src/`:

### 1. Stability Gate (`packages/agent/src/voice/stability-gate.ts`)

```typescript
/**
 * Stability Gate for Voice Output
 * Prevents speaking unstable diffusion fragments
 */

export class StabilityGate {
  private buffer: string = '';
  private callbacks: Array<(text: string) => void> = [];

  enqueue(text: string): void {
    this.buffer += text;
  }

  flush(force: boolean = false): string | null {
    const boundary = this.detectBoundary();
    if (boundary === -1 && !force) {
      return null;
    }

    const stable = force ? this.buffer : this.buffer.substring(0, boundary);
    this.buffer = this.buffer.substring(stable.length);

    if (stable.trim()) {
      this.callbacks.forEach(cb => cb(stable));
      return stable;
    }

    return null;
  }

  private detectBoundary(): number {
    // Find sentence boundary (., !, ?, newline)
    const match = this.buffer.match(/[.!?\n]/);
    if (!match) return -1;
    return this.buffer.indexOf(match[0]) + 1;
  }

  cancel(): void {
    this.buffer = '';
  }

  onStableChunk(callback: (text: string) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }
}
```

### 2. Mercury Client (`packages/agent/src/mercury/mercury-client.ts`)

```typescript
/**
 * Mercury 2 Client (OpenAI-compatible)
 */

import OpenAI from 'openai';

export interface MercuryStreamOptions {
  diffusing?: boolean;
  reasoning_effort?: 'instant' | 'low' | 'medium' | 'high';
  stream?: boolean;
}

export function createMercuryClient(apiKey: string): OpenAI {
  return new OpenAI({
    baseURL: process.env.MERCURY_BASE_URL || 'https://api.inceptionlabs.ai/v1',
    apiKey,
    defaultHeaders: {
      'user-agent': 'archonx-mercury-voice-chatbot/1.0',
    },
  });
}

export async function streamMercuryChat(
  client: OpenAI,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: MercuryStreamOptions = {}
) {
  const stream = options.stream ?? true;
  
  const params: OpenAI.Chat.ChatCompletionCreateParamsStreaming = {
    model: process.env.MERCURY_MODEL || 'mercury-2',
    messages,
    stream: true,
  };

  if (options.diffusing) {
    (params as any).diffusing = true;
  }

  if (options.reasoning_effort) {
    params.reasoning_effort = options.reasoning_effort;
  }

  return await client.chat.completions.create(params);
}

export function mapReasoningEffort(
  level: 'instant' | 'low' | 'medium' | 'high'
): 'low' | 'medium' | 'high' {
  if (level === 'instant') return 'low';
  return level === 'high' ? 'high' : level;
}
```

### 3. Tenant Configuration (`packages/agent/src/tenants/tenant-config.ts`)

```typescript
/**
 * Runtime Tenant Configuration
 */

import type { TenantConfig } from './tenant-schema.js';

let currentTenant: TenantConfig | null = null;

export function setTenantConfig(config: TenantConfig): void {
  currentTenant = config;
}

export function getTenantConfig(): TenantConfig {
  if (!currentTenant) {
    throw new Error('Tenant config not set');
  }
  return currentTenant;
}

export function canUseFeature(feature: 'voice' | 'diffusion' | 'tools'): boolean {
  const config = getTenantConfig();
  
  switch (feature) {
    case 'voice':
      return config.routing.voiceEnabled && ['voice', 'mercury_diffusion'].includes(config.plan);
    case 'diffusion':
      return config.routing.diffusionEnabled && config.plan === 'mercury_diffusion';
    case 'tools':
      return config.plan === 'mercury_diffusion';
  }
}

export function getPermission(permission: keyof TenantConfig["permissions"]): boolean {
  const config = getTenantConfig();
  return config.permissions[permission];
}
```

### 4. Update LLM Routing (`packages/agent/src/lib/llm.ts`)

Add these task routes to `TASK_ROUTES`:

```typescript
"mercury-fast": {
  model: "mercury-2",
  direct: true,
  provider: "https://api.inceptionlabs.ai/v1",
  apiKeyEnv: "INCEPTION_API_KEY",
  maxTokens: 2048,
},
"mercury-voice": {
  model: "mercury-2",
  direct: true,
  provider: "https://api.inceptionlabs.ai/v1",
  apiKeyEnv: "INCEPTION_API_KEY",
  maxTokens: 1024,
},
"mercury-diffusion": {
  model: "mercury-2",
  direct: true,
  provider: "https://api.inceptionlabs.ai/v1",
  apiKeyEnv: "INCEPTION_API_KEY",
  maxTokens: 4096,
},
```

### 5. Create API Routes

Add routes to your agent server (e.g., `packages/agent/src/api/routes.ts`):

```typescript
// POST /v1/agent/chat
export async function handleChat(req, res) {
  const { tenantId, message, history, stream } = req.body;
  
  // Load tenant config
  const tenant = await loadTenantConfig(tenantId);
  setTenantConfig(tenant);

  // Route to appropriate model
  const task = tenant.routing.diffusionEnabled ? 'mercury-diffusion' : 'mercury-fast';
  
  // Stream or return response
  // Implementation depends on your server framework
}

// POST /v1/agent/voice/transcribe
export async function handleTranscribe(req, res) {
  const { tenantId } = req.body;
  const audioFile = req.file;
  
  // Use OpenAI Whisper to transcribe
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const transcript = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
  });

  res.json({ text: transcript.text });
}

// POST /v1/agent/voice/speak
export async function handleSpeak(req, res) {
  const { tenantId, text, voiceName } = req.body;
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const speech = await openai.audio.speech.create({
    model: process.env.VOICE_TTS_MODEL || 'tts-1',
    voice: voiceName || (process.env.VOICE_TTS_VOICE as any) || 'shimmer',
    input: text,
  });

  res.contentType('audio/mpeg');
  res.send(await speech.arrayBuffer());
}
```

## Phase 4: Implement Web UI Components

Create components in `packages/web-ui/src/components/`:

### 1. VoiceOrb Component

A component that:
- Shows voice recording state (idle, listening, thinking, speaking, error)
- Handles microphone access
- Shows waveform animation while listening
- Calls transcribe endpoint

### 2. MercuryDiffusionBubble Component

A component that:
- Renders assistant message with streaming text
- Applies diffusion visual effect (text replacement in place)
- Manages two output lanes (visual and voice)

### 3. ToolDock Component

A component that:
- Shows available tools for the tenant
- Checks plan (mercury_diffusion only)
- Checks permissions
- Lets user invoke tools
- Routes tool calls to `/v1/agent/tool-call`

### 4. UsageMeter Component

A component that:
- Shows token usage and estimated cost
- Respects `usagePaidByClient` flag
- Updates after each message

### 5. MercuryAgentShell Component

Top-level component that combines:
- VoiceOrb (top)
- Chat messages (center)
- ToolDock (right sidebar, plan-gated)
- UsageMeter (bottom)

## Phase 5: Testing

### 1. Type Checking

```bash
npm run check
```

Should pass with no errors or type warnings.

### 2. Manual Testing

```bash
# Terminal 1: Agent server
cd packages/agent
npm run dev

# Terminal 2: Web UI
cd packages/web-ui/example
npm run dev

# Browser: http://localhost:5173
# Test:
# 1. Text chat (should work with existing UI)
# 2. Check that Mercury routes exist (no 404s)
# 3. Voice input (if VoiceOrb implemented)
# 4. Diffusion text (if MercuryDiffusionBubble implemented)
```

### 3. Verify No Secrets Exposed

```bash
npm run check:browser-smoke
```

Should verify no API keys appear in browser bundles.

## Phase 6: Deployment

### Local Production Test

```bash
npm run build
npm run check

# Start production server
NODE_ENV=production node packages/agent/dist/index.js
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-slim

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "packages/agent/dist/index.js"]
```

## Verification Checklist

Before moving to next phase:

- [ ] Existing web UI chat still works
- [ ] Existing artifacts panel still works
- [ ] Mercury env vars are set and valid
- [ ] API routes are accessible (no 404s)
- [ ] No API keys in browser bundles (`npm run check:browser-smoke`)
- [ ] Type checking passes (`npm run check`)
- [ ] Tenant config loads correctly
- [ ] Voice transcription works (if implemented)
- [ ] Voice speech synthesis works (if implemented)
- [ ] Diffusion visual effect works (if implemented)
- [ ] Tool permissions are enforced
- [ ] Usage metrics are tracked

## Troubleshooting

### "Missing API key env: INCEPTION_API_KEY"

Make sure `.env` file has:
```
INCEPTION_API_KEY=your_key_here
```

### "Mercury API returned 401"

The API key is invalid or expired. Get a new one from Inception Labs.

### "OpenAI API key missing"

Make sure `.env` has:
```
OPENAI_API_KEY=your_key_here
```

### "Voice input not working"

- Check browser has microphone permission
- Check VOICE_STT_PROVIDER is set to "openai"
- Check OPENAI_API_KEY is valid

### "No diffusion effect visible"

- Check MERCURY_DIFFUSION_ENABLED=true in .env
- Check tenant config has diffusionEnabled: true
- Check tenant plan is "mercury_diffusion"
- Check browser console for errors

## Next: Build Vercel Demo Client (Future)

After this Mercury skill is working, you can:

1. Create a separate Vercel project
2. Use this skill's API as backend
3. Build a Next.js demo client (see `examples/nextjs-demo-client.md`)
4. Deploy to Vercel with environment pointing to ArchonX server

This keeps the **source of truth in this pi-agent repo**, and Vercel is just a **demo shell**.

## Support & Resources

- SKILL.md - Feature overview and control plane rules
- README.md - Quick start and deployment checklist
- MERCURY_VOICE_CHATBOT_ARCHITECTURE.md - Deep dive into design
- examples/ - Sample configs and client code
- tool-permissions.yaml - Permission and approval matrix
- tenant.schema.json - Tenant config validation schema

## Questions?

Refer to:
1. This document
2. SKILL.md for design decisions
3. Architecture doc for deep technical details
4. Examples for implementation patterns
