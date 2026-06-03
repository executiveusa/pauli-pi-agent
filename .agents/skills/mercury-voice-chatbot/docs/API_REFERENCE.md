# Mercury Voice Chatbot - API Reference

## Overview

The Mercury Voice Chatbot skill provides REST API endpoints for integrating Mercury 2 chat, voice I/O, and tool execution into any application.

All endpoints are server-side only. No API keys or secrets are exposed to browsers.

## Base URL

Development:
```
http://localhost:3000/v1
```

Production:
```
https://your-control-plane.example.com/v1
```

## Authentication

All requests must include tenant context:

```typescript
{
  tenantId: string;     // Required: identifies the client/tenant
  [other params]
}
```

The server verifies the tenant has permission for each feature/tool via `tenant-config`.

---

## Chat Completions

### POST /v1/agent/chat

Stream chat completions using Mercury 2 with optional diffusion reasoning.

#### Request

```typescript
{
  tenantId: string;                                    // Required
  messages: Array<{                                    // Required
    role: "user" | "assistant";
    content: string;
  }>;
  systemPrompt?: string;                               // Default: "You are a helpful assistant."
  maxTokens?: number;                                  // Default: unlimited
  routeTag?: "mercury-fast" | "mercury-voice" | "mercury-diffusion";  // Default: based on plan
}
```

#### Response (Streaming)

```typescript
{
  stream: true;
  data: AsyncIterable<{                                // Streamed chunks
    type: "chunk" | "final" | "error";
    content?: string;
    usage?: { input: number; output: number };
  }>
}
```

#### Example

```bash
curl -X POST http://localhost:3000/v1/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "client_demo",
    "messages": [{"role": "user", "content": "Hello!"}],
    "routeTag": "mercury-fast"
  }'
```

#### Feature Gating

- `mercury-fast`: Available to all plans
- `mercury-voice`: Requires `plan: "voice"` or `plan: "mercury_diffusion"`
- `mercury-diffusion`: Requires `plan: "mercury_diffusion"` and `diffusionEnabled: true`

---

## Voice - Speech-to-Text

### POST /v1/agent/voice/transcribe

Convert speech audio to text using OpenAI Whisper.

#### Request

```typescript
{
  tenantId: string;           // Required
  audio: string;              // Required: base64-encoded audio
  language?: string;          // Default: "en" (auto-detect)
}
```

#### Response

```typescript
{
  text: string;               // Transcribed text
  confidence: number;         // 0.0 - 1.0
  language: string;
}
```

#### Example

```bash
# Convert MP3 to base64 first
AUDIO_BASE64=$(base64 -w 0 audio.mp3)

curl -X POST http://localhost:3000/v1/agent/voice/transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "client_demo",
    "audio": "'$AUDIO_BASE64'",
    "language": "en"
  }'
```

#### Feature Gating

Requires:
- `plan: "voice"` or `plan: "mercury_diffusion"`
- `routing.voiceEnabled: true`

---

## Voice - Text-to-Speech

### POST /v1/agent/voice/speak

Generate speech audio from text using OpenAI TTS.

#### Request

```typescript
{
  tenantId: string;           // Required
  text: string;               // Required: text to speak
  voiceName?: string;         // Default: tenant.branding.voiceName or "shimmer"
}
```

Available voices:
- `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`

#### Response

```
audio/mpeg (binary)           // MP3 audio stream
```

#### Example

```bash
curl -X POST http://localhost:3000/v1/agent/voice/speak \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "client_demo",
    "text": "Hello, world!",
    "voiceName": "shimmer"
  }' \
  -o output.mp3
```

#### Feature Gating

Requires:
- `plan: "voice"` or `plan: "mercury_diffusion"`
- `routing.voiceEnabled: true`

---

## Tools - Execute Tool

### POST /v1/agent/tool-call

Execute a tool with permission checks.

#### Request

```typescript
{
  tenantId: string;           // Required
  toolName: string;           // Required: e.g., "send-email", "generate-image"
}
```

Supported tools (from tenant.permissions):
- `browser-access` → `canUseBrowser`
- `generate-image` → `canGenerateImages`
- `generate-video` → `canGenerateVideo`
- `send-email` → `canSendEmail`
- `book-appointment` → `canBookAppointments`
- `money-movement` → `requiresApprovalForMoneyMovement`

#### Response

```typescript
{
  result: unknown;            // Tool output (depends on tool)
  toolName: string;
  status: "executed" | "pending" | "rejected";
  error?: string;
}
```

#### Example

```bash
curl -X POST http://localhost:3000/v1/agent/tool-call \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "client_demo",
    "toolName": "generate-image"
  }'
```

#### Feature Gating

Requires:
- `plan: "mercury_diffusion"`
- Corresponding permission in tenant config

---

## Tenant - Configuration

### GET /v1/tenant/config

Get public (non-secret) parts of tenant configuration.

#### Query Parameters

```
?tenantId=<tenant_id>         // Required
```

#### Response

```typescript
{
  tenantId: string;
  plan: "clean" | "voice" | "mercury_diffusion";
  branding: {
    botName: string;
    logoUrl?: string;
    primaryColor?: string;    // hex: #rrggbb
    accentColor?: string;     // hex: #rrggbb
    voiceName?: string;
  };
  routing: {
    defaultModel: string;
    reasoningEffort: "instant" | "low" | "medium" | "high";
    diffusionEnabled: boolean;
    voiceEnabled: boolean;
  };
  permissions: {
    canUseBrowser: boolean;
    canGenerateImages: boolean;
    canGenerateVideo: boolean;
    canSendEmail: boolean;
    canBookAppointments: boolean;
    requiresApprovalForMoneyMovement: boolean;
  };
}
```

#### Example

```bash
curl http://localhost:3000/v1/tenant/config?tenantId=client_demo
```

#### Note

This endpoint returns **public** configuration only. Secrets (API keys, billing details, internal routing rules) are never exposed.

---

## Tenant - Usage

### GET /v1/tenant/usage

Get usage metrics and billing information for a tenant.

#### Query Parameters

```
?tenantId=<tenant_id>         // Required
```

#### Response

```typescript
{
  tenantId: string;
  inputTokens: number;        // Cumulative input tokens used
  outputTokens: number;       // Cumulative output tokens used
  estimatedCost: number;      // USD, rough estimate
  model: string;              // Effective model for this tenant
  paidByClient: boolean;      // true if BYOK (client pays)
  timestamp: number;          // Unix timestamp (ms)
}
```

#### Example

```bash
curl http://localhost:3000/v1/tenant/usage?tenantId=client_demo
```

#### Note

Usage data is:
- **Client-safe**: No internal provider details, no raw logs
- **Aggregated**: Sums across all sessions for this tenant
- **Estimated**: Costs are rough estimates; billing runs separately

---

## Error Responses

All endpoints return error responses with appropriate HTTP status codes.

### 400 Bad Request

```typescript
{
  error: "Missing required fields: tenantId, messages"
}
```

### 403 Forbidden

```typescript
{
  error: "Voice feature not available for this tenant plan"
}
```

### 404 Not Found

```typescript
{
  error: "Route not found: POST /v1/unknown"
}
```

### 500 Internal Server Error

```typescript
{
  error: "Transcription failed: API error"
}
```

---

## Environment Variables

Required for operation:

```bash
# Mercury 2 API
INCEPTION_API_KEY=sk-...
MERCURY_MODEL=mercury-2
MERCURY_BASE_URL=https://api.inceptionlabs.ai/v1

# OpenAI Voice APIs
OPENAI_API_KEY=sk-...

# Tenant Configuration
ARCHONX_TENANT_CONFIG_MODE=local     # dev: "local", prod: "remote"
ARCHONX_DEFAULT_TENANT_ID=client_demo

# Optional
ARCHONX_USAGE_LOGGING=true           # Enable usage ledger logging
VOICE_TTS_MODEL=tts-1                # OpenAI TTS model
VOICE_TTS_VOICE=shimmer              # Default voice
```

---

## Integration Example

### Node.js / Express

```typescript
import express from "express";
import { routeRequest, type ApiRequest } from "@mariozechner/pi-agent";

const app = express();
app.use(express.json());

app.post("/api/*", async (req, res) => {
  const apiRequest: ApiRequest = {
    method: req.method as any,
    path: "/v1" + req.path.replace("/api", ""),
    body: req.body,
    headers: req.headers as any,
    query: req.query as any,
  };

  const response = await routeRequest(apiRequest);
  res.status(response.statusCode).json(response.body);
});

app.listen(3000);
```

### React / NextJS

```typescript
import { MercuryAgentShell } from "@mariozechner/pi-web-ui";

export default function Chat() {
  return (
    <MercuryAgentShell
      tenantId="client_demo"
      apiBase="https://your-api.example.com/v1"
      plan="mercury_diffusion"
    />
  );
}
```

---

## Rate Limits

No explicit rate limits are enforced. Implement at your infrastructure layer based on:
- Input tokens per minute
- Request count per minute
- Concurrent streaming connections

---

## See Also

- [Architecture](./MERCURY_VOICE_CHATBOT_ARCHITECTURE.md)
- [Activation Checklist](../activation-checklist.md)
- [Tenant Configuration Schema](../tenant.schema.json)
