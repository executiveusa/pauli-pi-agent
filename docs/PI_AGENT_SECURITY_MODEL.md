# PI Agent Control Plane - Security Model

**Version**: 0.0.4

---

## Overview

The PI Agent Control Plane enforces defense-in-depth security through:
1. **Secrets Management** (Infisical + local fallback)
2. **Access Control** (RBAC with user, reviewer, admin roles)
3. **Audit Logging** (complete action trail, secrets redacted)
4. **Circuit Breakers** (loop limits, budget caps, content guards)
5. **Data Protection** (encryption at rest, redaction in transit/storage)

---

## Secrets Management

### Infisical Integration

**Environment Credentials Managed by Infisical:**
- OpenAI API key
- OpenRouter API key
- NVIDIA NIM API key
- Firecrawl API key
- BrightData API credentials
- PostgreSQL connection string
- Speech provider keys (Whisper, ElevenLabs)
- Custom user-configured API keys

**Client Library:**
```typescript
import { InfisicalClient } from '@mariozechner/pi-agent-core/secrets';

const client = new InfisicalClient({
  baseUrl: process.env.INFISICAL_URL || 'https://infisical.app',
  apiKey: process.env.INFISICAL_API_KEY,
  projectId: process.env.INFISICAL_PROJECT_ID,
});

const openaiKey = await client.getSecret('openai/api-key');
```

### Local Development Fallback

**Only when explicitly enabled (NEVER in production):**
```bash
export INFISICAL_OFFLINE_MODE=true  # For local development only
```

Then `.env` file (never committed):
```
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-...
DATABASE_URL=postgresql://...
```

**Validation Rules:**
- `INFISICAL_OFFLINE_MODE` env var must be explicitly set
- `.env` file must exist and be readable
- Missing secrets raise clear error with remediation instructions

### Credential Detection

**File:** `packages/agent/src/secrets/env-api-keys.ts`

Automatically detects credentials from environment (Infisical-fetched or local .env):
```typescript
export async function detectCredentials(): Promise<ApiCredentials> {
  const openaiKey = await getSecret('OPENAI_API_KEY');
  const openrouterKey = await getSecret('OPENROUTER_API_KEY');
  // ... validate and return
}
```

### Secret Redaction

**Utility Function:**
```typescript
export function redactSecrets(text: string): string {
  return text
    .replace(/sk-[A-Za-z0-9]+/g, '[REDACTED_API_KEY]')
    .replace(/Bearer [A-Za-z0-9._-]+/g, '[REDACTED_BEARER_TOKEN]')
    .replace(/password=([^&\s]+)/gi, 'password=[REDACTED]')
    .replace(/api_key=([^&\s]+)/gi, 'api_key=[REDACTED]');
}
```

**Applied To:**
- All log output (via logger middleware)
- All audit events
- All error messages and stack traces
- Debug endpoints

**Test Coverage:**
```typescript
// Never log API keys
test('redactSecrets removes OpenAI API keys', () => {
  const text = 'Error calling sk-abc123def456';
  expect(redactSecrets(text)).not.toContain('sk-');
  expect(redactSecrets(text)).toContain('[REDACTED_API_KEY]');
});
```

---

## Access Control (RBAC)

### Roles

| Role | Permissions | Use Case |
|------|-----------|----------|
| **admin** | Full control, approve all actions, manage users, view all logs | System operator, security team |
| **reviewer** | Approve high-risk actions, view logs, create personas | Subject matter expert, decision maker |
| **user** | Query coordinators, provide feedback, view own runs, view personas | End user, analyst |

### Permission Model

```typescript
interface Permission {
  resource: 'personas' | 'reasoning_runs' | 'feedback' | 'approvals' | 'audit_logs' | 'settings';
  action: 'create' | 'read' | 'update' | 'delete' | 'approve';
  scoped_to?: string; // resource ID or user ID
}

interface Role {
  name: 'admin' | 'reviewer' | 'user';
  permissions: Permission[];
}
```

### Enforcement

Every request is checked:
```typescript
async function checkPermission(user: User, resource: string, action: string): Promise<boolean> {
  const role = await getRoleForUser(user.id);
  const has = role.permissions.some(p => 
    p.resource === resource && 
    p.action === action &&
    (!p.scoped_to || p.scoped_to === user.id)
  );
  
  if (!has) {
    await auditLog({
      event_type: 'permission_denied',
      user_id: user.id,
      resource,
      action,
    });
  }
  
  return has;
}
```

---

## Circuit Breakers

### 1. Loop Limit

**Prevents infinite reasoning loops.**

```typescript
const MAX_REASONING_TURNS = 10;

async function executeReasoning(query: string) {
  let turns = 0;
  while (!done && turns < MAX_REASONING_TURNS) {
    // ... reasoning loop
    turns++;
  }
  
  if (turns >= MAX_REASONING_TURNS) {
    await auditLog({
      event_type: 'circuit_breaker_triggered',
      breaker: 'loop_limit',
      reasoning_run_id,
    });
    throw new Error('Loop limit exceeded; reasoning blocked');
  }
}
```

### 2. Budget Limit

**Prevents accidental cost overrun.**

```typescript
async function enforceModelBudget(provider: string, estimatedTokens: number) {
  const budget = await getBudgetStatus();
  const estimatedCost = estimateTokenCost(provider, estimatedTokens);
  
  if (budget.remaining_usd < estimatedCost) {
    await auditLog({
      event_type: 'circuit_breaker_triggered',
      breaker: 'budget_limit',
      remaining_usd: budget.remaining_usd,
      estimated_cost_usd: estimatedCost,
    });
    throw new Error(`Budget exceeded. Remaining: $${budget.remaining_usd}`);
  }
}
```

### 3. Evidence Gap Warning

**Alerts when sources are sparse (quality signal).**

```typescript
async function checkEvidenceQuality(query: string) {
  const context = await retrieveGraphContext(query);
  
  if (context.evidence_refs.length < 3) {
    await auditLog({
      event_type: 'circuit_breaker_triggered',
      breaker: 'evidence_gap_warning',
      evidence_count: context.evidence_refs.length,
    });
    // Continue but flag as low-confidence
    return { warning: true, confidence: 0.5 };
  }
  return { warning: false, confidence: 0.9 };
}
```

### 4. Secret Exposure Guard

**Detects and prevents leakage of sensitive patterns.**

```typescript
function detectSecretPatterns(text: string): string[] {
  const patterns = [
    /sk-[A-Za-z0-9]+/g,           // OpenAI
    /Bearer [A-Za-z0-9._-]+/g,    // OAuth tokens
    /password\s*[:=]\s*[^\s]+/gi, // Passwords
  ];
  
  const matches = [];
  patterns.forEach(p => {
    matches.push(...(text.match(p) || []));
  });
  
  return matches;
}

async function guardSynthesis(synthesis: string) {
  const secrets = detectSecretPatterns(synthesis);
  
  if (secrets.length > 0) {
    await auditLog({
      event_type: 'circuit_breaker_triggered',
      breaker: 'secret_exposure_guard',
      secret_count: secrets.length,
    });
    throw new Error('Synthesis contains potential secrets; blocked');
  }
}
```

### 5. Irreversible Action Guard

**Requires approval before destructive operations.**

```typescript
async function requireApprovalForDestructive(
  actionType: 'delete_persona' | 'retrain_persona' | 'deploy_to_production',
  resourceId: string
) {
  const approval = await createApprovalRequest({
    request_type: actionType,
    resource_id: resourceId,
    requested_by: currentUser.id,
  });
  
  // Block action until approved by reviewer or admin
  return waitForApproval(approval.id);
}
```

---

## Audit Logging

### Logged Events

```typescript
interface AuditEvent {
  id: string;
  event_type: string; // see types below
  user_id: string;
  resource_type: string;
  resource_id: string;
  action: string;
  details_json: Record<string, unknown>;
  ip_address: string;
  timestamp: Date;
  redacted: boolean; // true if secrets were redacted
}

type AuditEventType = 
  | 'ingest_start' | 'ingest_success' | 'ingest_failure'
  | 'persona_created' | 'persona_updated' | 'persona_deleted'
  | 'reasoning_run_started' | 'reasoning_run_completed'
  | 'model_call_made'
  | 'circuit_breaker_triggered'
  | 'approval_requested' | 'approval_granted' | 'approval_denied'
  | 'user_login' | 'user_logout' | 'user_action'
  | 'secret_access_attempt'
  | 'permission_denied';
```

### Example Events

**Ingest Success:**
```json
{
  "event_type": "ingest_success",
  "resource_type": "source",
  "resource_id": "src_abc123",
  "action": "ingest",
  "details_json": {
    "source_url": "https://example.com/article",
    "entity_count": 42,
    "claim_count": 18,
    "duration_ms": 3200
  }
}
```

**Model Call Made:**
```json
{
  "event_type": "model_call_made",
  "resource_type": "reasoning_run",
  "resource_id": "run_xyz789",
  "action": "model_call",
  "details_json": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "input_tokens": 2048,
    "output_tokens": 512,
    "estimated_cost_usd": 0.01,
    "latency_ms": 1200,
    "stop_reason": "stop"
  }
}
```

**Circuit Breaker Triggered:**
```json
{
  "event_type": "circuit_breaker_triggered",
  "action": "block",
  "details_json": {
    "breaker": "budget_limit",
    "remaining_usd": 0.50,
    "estimated_cost_usd": 5.00,
    "daily_budget_usd": 10.00
  }
}
```

### Query Audit Logs

**Dashboard Endpoint:** `GET /api/audit?event_type=&resource_type=&user_id=&date_range=`

**CLI Command:** `pi-agent audit search --event=model_call_made --since=24h`

---

## Data Protection

### Encryption at Rest

**PostgreSQL Configuration:**
- Use Supabase with encryption enabled (or self-hosted with PgCrypto)
- Encrypt sensitive columns at application level if needed:

```typescript
import { encrypt, decrypt } from 'crypto';

// Store encrypted
const encrypted = encrypt(secretValue, encryptionKey);
await db.query('UPDATE secrets SET value = $1', [encrypted]);

// Retrieve and decrypt
const encrypted = await db.query('SELECT value FROM secrets WHERE id = $1');
const decrypted = decrypt(encrypted.rows[0].value, encryptionKey);
```

### Secrets Table (Never Store Raw Secrets)

```sql
CREATE TABLE secrets_references (
  id TEXT PRIMARY KEY,
  secret_name TEXT NOT NULL,
  provider TEXT,
  infisical_path TEXT,
  last_rotated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Example
INSERT INTO secrets_references VALUES
  ('sec_openai', 'openai/api-key', 'openai', '/env/production/OPENAI_API_KEY', NOW(), NOW()),
  ('sec_database', 'database_url', 'postgresql', '/env/production/DATABASE_URL', NOW(), NOW());
```

**Never:**
```sql
-- ❌ WRONG
INSERT INTO secrets VALUES ('sk-abc123def456');

-- ✅ RIGHT
INSERT INTO secrets_references VALUES 
  ('sec_openai', 'openai/api-key', 'openai', '/env/OPENAI_API_KEY', NOW());
```

### Redaction in Transit

All error messages, logs, and debug outputs are redacted:

```typescript
import { redactSecrets } from './secrets/redact';

// Logger middleware
app.use((req, res, next) => {
  const originalLog = console.log;
  console.log = (...args) => {
    const redacted = args.map(arg => 
      typeof arg === 'string' ? redactSecrets(arg) : arg
    );
    originalLog(...redacted);
  };
  next();
});
```

---

## Compliance & Privacy

### Data Retention

**Default Policy:**
- Conversation history: 90 days (configurable)
- Audit logs: 1 year (immutable)
- Feedback events: Indefinite (for learning)
- Model calls: 1 year (for cost analysis)

**User Deletion:**
- Delete all user data when requested
- Keep audit logs (anonymized, for compliance)
- Export option available (GDPR right to portability)

### GDPR Compliance

1. **Transparency**: Clear consent for data ingestion
2. **Right to Access**: `/api/export/<user_id>` returns all personal data
3. **Right to Delete**: `DELETE FROM users WHERE id = $1` cascades properly
4. **Data Minimization**: Only collect what's needed
5. **Retention Limits**: Auto-delete old records per policy

### PII Handling

Do NOT extract or store PII (personal names, emails, phone numbers) in public fields:
- Tag PII in audit logs but redact values
- Store PII references only in encrypted columns
- Implement PII-aware search (never expose PII in results)

---

## Testing Security

### Unit Tests

```typescript
// Test: secrets never logged
test('error logging redacts API keys', () => {
  const error = new Error('Failed with key sk-abc123');
  const logged = redactSecrets(error.message);
  expect(logged).not.toContain('sk-');
});

// Test: circuit breaker triggers
test('budget circuit breaker blocks expensive model', async () => {
  const result = await executeReasoning(query, { budget_remaining: 0.01 });
  expect(result).toThrow('Budget exceeded');
});

// Test: RBAC enforcement
test('user cannot delete persona without reviewer role', async () => {
  const user = { id: 'u1', role: 'user' };
  expect(await canDelete(user, 'personas')).toBe(false);
});
```

### Integration Tests

```typescript
// Test: full audit trail for ingest
test('ingest operation creates audit events', async () => {
  await ingestUrl('https://example.com');
  const events = await auditLog.query({ 
    event_type: 'ingest_success' 
  });
  expect(events.length).toBeGreaterThan(0);
});

// Test: no secrets in logs
test('model call logging does not expose API keys', async () => {
  await executeWithMockedModel('gpt-4o-mini');
  const logs = await getLogs();
  expect(logs).not.toMatch(/sk-[A-Za-z0-9]+/);
});
```

---

## Security Checklist (Pre-Deployment)

- [ ] Infisical project created and secrets uploaded
- [ ] Infisical API key configured as environment variable
- [ ] `.env.example` contains NO actual secrets (placeholder only)
- [ ] `.env` file in `.gitignore` (never committed)
- [ ] Secret redaction tests passing
- [ ] RBAC tests passing
- [ ] Circuit breaker tests passing
- [ ] Audit logging working (no secrets logged)
- [ ] Database encryption enabled (at-rest)
- [ ] HTTPS/TLS configured (in-transit)
- [ ] Infisical API key rotation policy established
- [ ] Database credentials rotated
- [ ] Firewall rules restricted to authorized IPs
- [ ] Audit logs retained per policy
- [ ] PII handling policy implemented
- [ ] GDPR compliance checked

---

## Incident Response

### If Secret is Exposed

1. **Immediate**: Rotate secret in Infisical
2. **Within 1 hour**: Update API key in all systems
3. **Within 24 hours**: Audit logs for unauthorized access
4. **Document**: Create incident report, update security policy

### If Budget Limit Breached

1. **Automatic**: Circuit breaker stops reasoning
2. **Review**: Check model call logs for anomalies
3. **Adjust**: Update budget policy if needed
4. **Notify**: Alert admin user

---

## Conclusion

The PI Agent Control Plane enforces security through layered defense: secrets centralized in Infisical, access controlled via RBAC, all actions audited with secrets redacted, and circuit breakers preventing runaway costs or data exposure. Regular security testing and incident response protocols ensure resilience.
