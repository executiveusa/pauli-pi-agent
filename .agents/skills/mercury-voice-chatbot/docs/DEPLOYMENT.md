# Mercury Voice Chatbot - Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Setup

Create `.env.production`:

```bash
# Mercury 2 API (BYOK from client)
INCEPTION_API_KEY=sk-inceptionlabs-...

# OpenAI APIs
OPENAI_API_KEY=sk-openai-...

# Mercury Configuration
MERCURY_MODEL=mercury-2
MERCURY_BASE_URL=https://api.inceptionlabs.ai/v1

# Tenant Configuration
ARCHONX_TENANT_CONFIG_MODE=remote          # Use database/remote config
ARCHONX_DEFAULT_TENANT_ID=client_demo      # Fallback tenant

# Optional
ARCHONX_USAGE_LOGGING=true
VOICE_TTS_MODEL=tts-1
VOICE_TTS_VOICE=shimmer
```

### 2. Tenant Configuration

Create `.agents/tenants/<client_id>.json` for each client:

```json
{
  "tenantId": "acme-corp",
  "clientName": "ACME Corporation",
  "plan": "mercury_diffusion",
  "branding": {
    "botName": "ACME Assistant",
    "logoUrl": "https://acme.example.com/logo.png",
    "primaryColor": "#2563eb",
    "accentColor": "#0891b2",
    "voiceName": "nova"
  },
  "routing": {
    "defaultModel": "mercury-2",
    "reasoningEffort": "low",
    "diffusionEnabled": true,
    "voiceEnabled": true
  },
  "billing": {
    "mode": "client_byok",
    "usagePaidByClient": true
  },
  "permissions": {
    "canUseBrowser": true,
    "canGenerateImages": true,
    "canGenerateVideo": false,
    "canSendEmail": true,
    "canBookAppointments": true,
    "requiresApprovalForMoneyMovement": true
  }
}
```

See examples:
- `examples/tenant-config.clean.example.json`
- `examples/tenant-config.voice.example.json`
- `examples/tenant-config.mercury-diffusion.example.json`

### 3. API Server Setup

Option A: Express (Recommended)

```typescript
import express from "express";
import { routeRequest, type ApiRequest } from "@mariozechner/pi-agent";

const app = express();
app.use(express.json());

app.all("/v1/*", async (req, res) => {
  const apiRequest: ApiRequest = {
    method: req.method as "GET" | "POST" | "PUT" | "DELETE",
    path: req.path,
    body: req.body,
    headers: req.headers as Record<string, string>,
    query: req.query as Record<string, string>,
  };

  try {
    const response = await routeRequest(apiRequest);
    res.status(response.statusCode).json(response.body);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Mercury Voice Chatbot API running on port 3000");
});
```

Option B: Cloudflare Workers

```typescript
import { routeRequest } from "@mariozechner/pi-agent";
import type { ApiRequest } from "@mariozechner/pi-agent";

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    const apiRequest: ApiRequest = {
      method: request.method as "GET" | "POST" | "PUT" | "DELETE",
      path: url.pathname,
      body,
      headers: Object.fromEntries(request.headers),
      query: Object.fromEntries(url.searchParams),
    };

    const response = await routeRequest(apiRequest);
    return new Response(JSON.stringify(response.body), {
      status: response.statusCode,
      headers: { "Content-Type": "application/json" },
    });
  },
};
```

### 4. Database Setup (Optional)

For multi-tenant production, implement `getTenantConfig` to fetch from your database:

```typescript
// packages/agent/src/tenants/tenant-config.ts

export function getTenantConfig(tenantId: string): TenantConfig {
  const mode = process.env.ARCHONX_TENANT_CONFIG_MODE ?? "local";

  if (mode === "remote") {
    // Query your database
    const tenant = db.query("SELECT * FROM tenants WHERE id = ?", [tenantId]);
    if (!tenant) throw new Error(`Tenant not found: ${tenantId}`);
    return tenant as TenantConfig;
  }

  // Local mode (development)
  if (tenantId === DEMO_TENANT.tenantId) {
    return DEMO_TENANT;
  }

  throw new Error(`Tenant not found: ${tenantId}`);
}
```

### 5. Security Hardening

#### API Key Rotation

Implement key rotation every 90 days:

```bash
# 1. Generate new INCEPTION_API_KEY
# 2. Update all client integrations
# 3. Set new key in INCEPTION_API_KEY
# 4. Monitor logs for key rotation
# 5. Deactivate old key in Inception Labs dashboard
```

#### Rate Limiting

Add rate limiting at the infrastructure level:

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes
  keyGenerator: (req) => req.body.tenantId || req.ip,
});

app.use("/v1/", limiter);
```

#### Audit Logging

Log all tool execution:

```typescript
import { recordUsage } from "@mariozechner/pi-agent/tenants/usage-ledger";

recordUsage({
  tenantId: req.body.tenantId,
  sessionId: generateSessionId(),
  mode: "tool-call",
  model: "mercury-2",
  provider: "inception",
  reasoningEffort: "low",
  diffusionEnabled: false,
  voiceEnabled: false,
  estimatedInputTokens: 100,
  estimatedOutputTokens: 50,
  latencyMs: 1500,
  toolCalls: [toolName],
  errors: [],
  timestamp: Date.now(),
});
```

### 6. Monitoring & Alerting

#### Health Check Endpoint

```typescript
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
```

#### Error Alerting

```typescript
app.use((error: Error, req: express.Request, res: express.Response, _next) => {
  console.error("[ERROR]", error);

  // Alert on critical errors
  if (error.message.includes("INCEPTION_API_KEY")) {
    alerting.critical("Missing INCEPTION_API_KEY", { error });
  }

  res.status(500).json({ error: "Internal server error" });
});
```

#### Metrics

Monitor:
- Request rate (requests/second)
- Error rate (errors/requests)
- Latency (p50, p95, p99)
- Token usage (cumulative)
- Cost estimate (USD)

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/agent/package*.json ./packages/agent/

# Install dependencies
RUN npm ci --production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start server
CMD ["node", "packages/agent/dist/index.js"]
```

### Docker Compose (Dev)

```yaml
version: "3.8"

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      INCEPTION_API_KEY: ${INCEPTION_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ARCHONX_TENANT_CONFIG_MODE: local
      ARCHONX_DEFAULT_TENANT_ID: client_demo
    volumes:
      - .:/app
      - /app/node_modules

  web:
    image: node:20-alpine
    working_dir: /app/packages/web-ui
    volumes:
      - ./packages/web-ui:/app/packages/web-ui
    ports:
      - "5173:5173"
    command: npm run dev
```

---

## Kubernetes Deployment

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mercury-voice-chatbot
data:
  MERCURY_MODEL: "mercury-2"
  MERCURY_BASE_URL: "https://api.inceptionlabs.ai/v1"
  ARCHONX_TENANT_CONFIG_MODE: "remote"
  ARCHONX_DEFAULT_TENANT_ID: "client_demo"
```

### Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mercury-voice-chatbot-secrets
type: Opaque
stringData:
  INCEPTION_API_KEY: "sk-..."
  OPENAI_API_KEY: "sk-..."
```

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mercury-voice-chatbot
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mercury-voice-chatbot
  template:
    metadata:
      labels:
        app: mercury-voice-chatbot
    spec:
      containers:
        - name: api
          image: your-registry/mercury-voice-chatbot:latest
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: mercury-voice-chatbot
            - secretRef:
                name: mercury-voice-chatbot-secrets
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "2000m"
              memory: "2Gi"
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mercury-voice-chatbot
spec:
  selector:
    app: mercury-voice-chatbot
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

---

## Production Smoke Test

```bash
#!/bin/bash

API_URL=${API_URL:-http://localhost:3000}
TENANT_ID=${TENANT_ID:-client_demo}

echo "🚀 Mercury Voice Chatbot Production Smoke Test"
echo "API URL: $API_URL"
echo "Tenant ID: $TENANT_ID"

# Test 1: Health Check
echo -n "✓ Health check... "
curl -s $API_URL/health | grep -q "healthy" && echo "OK" || { echo "FAILED"; exit 1; }

# Test 2: Tenant Config
echo -n "✓ Tenant config... "
curl -s -X GET "$API_URL/v1/tenant/config?tenantId=$TENANT_ID" | grep -q "$TENANT_ID" && echo "OK" || { echo "FAILED"; exit 1; }

# Test 3: Chat Completion
echo -n "✓ Chat completion... "
curl -s -X POST "$API_URL/v1/agent/chat" \
  -H "Content-Type: application/json" \
  -d "{\"tenantId\":\"$TENANT_ID\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}" \
  | grep -q "stream" && echo "OK" || { echo "FAILED"; exit 1; }

# Test 4: Usage Metrics
echo -n "✓ Usage metrics... "
curl -s -X GET "$API_URL/v1/tenant/usage?tenantId=$TENANT_ID" | grep -q "$TENANT_ID" && echo "OK" || { echo "FAILED"; exit 1; }

echo "✅ All smoke tests passed!"
```

---

## Troubleshooting

### Issue: INCEPTION_API_KEY Not Found

```bash
# Check environment
echo $INCEPTION_API_KEY

# Check .env file exists
test -f .env && echo ".env exists" || echo ".env missing"

# Check it's loaded
grep INCEPTION_API_KEY .env
```

### Issue: Tenant Not Found

```bash
# Verify tenant config exists
ls .agents/tenants/

# Check tenant ID matches request
curl http://localhost:3000/v1/tenant/config?tenantId=client_demo

# For remote mode, check database connection
```

### Issue: Voice API Fails

```bash
# Check OPENAI_API_KEY is set
echo $OPENAI_API_KEY | head -c 10

# Test Whisper endpoint directly
curl -s https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F "file=@audio.mp3" \
  -F "model=whisper-1"
```

### Issue: Vercel Deployment Fails

Check:
1. All environment variables set in Vercel dashboard
2. `npm run build` succeeds locally
3. `npm run check` passes locally
4. Node.js version matches Vercel environment
5. Memory limits aren't exceeded

---

## Scaling Considerations

### Horizontal Scaling

The skill is stateless and scales horizontally:
- No in-memory caches between requests
- No persistent connections
- Each instance can handle independent requests

Use a load balancer to distribute across instances.

### Caching

Cache tenant configs to reduce database queries:

```typescript
const _tenantCache = new Map<string, TenantConfig>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getTenantConfig(tenantId: string): TenantConfig {
  const cached = _tenantCache.get(tenantId);
  if (cached) return cached;

  const tenant = loadFromDatabase(tenantId);
  _tenantCache.set(tenantId, tenant);

  // Expire cache
  setTimeout(() => _tenantCache.delete(tenantId), CACHE_TTL);

  return tenant;
}
```

### Connection Pooling

For database connections:

```typescript
import { Pool } from "pg";

const pool = new Pool({
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Rollback Plan

If deployment fails:

1. **Immediate**: Route traffic to previous version
2. **Investigate**: Check logs for error patterns
3. **Fix**: Address root cause in codebase
4. **Test**: Verify fixes locally (npm run check, npm test)
5. **Deploy**: Roll out fixed version

---

See also:
- [API Reference](./API_REFERENCE.md)
- [Architecture](./MERCURY_VOICE_CHATBOT_ARCHITECTURE.md)
- [Activation Checklist](../activation-checklist.md)
