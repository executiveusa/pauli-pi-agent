# PI Agent Control Plane - Coolify Deployment Guide

**Version**: 0.0.4

---

## Deployment Target

**Environment**: Hostinger VPS  
**Container Orchestrator**: Coolify  
**Database**: PostgreSQL 15+ (self-hosted or external)  
**Secrets**: Infisical  

---

## Prerequisites

- Hostinger VPS with SSH access (2GB+ RAM, 2+ vCPU recommended)
- Ubuntu 20.04+ or Debian 11+
- Docker and Docker Compose installed
- Coolify installed (see https://coolify.io/docs)
- Infisical project created (see PI_AGENT_SECURITY_MODEL.md)
- GitHub repository with this codebase pushed

---

## Deployment Files

### 1. Dockerfile

**Location:** `packages/agent/Dockerfile` (or root)

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and monorepo structure
COPY package*.json ./
COPY tsconfig*.json ./
COPY packages ./packages

# Install and build
RUN npm ci --ignore-scripts
RUN npm run build --workspaces

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts and node_modules
COPY --from=builder /app/packages/agent/dist ./dist
COPY --from=builder /app/packages/agent/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Non-root user
RUN addgroup -g 1001 -S app && adduser -S app -u 1001
USER app

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { if (r.statusCode !== 200) throw new Error(r.statusCode) })"

CMD ["node", "dist/main.js"]
```

### 2. docker-compose.coolify.yml

**Location:** `docker-compose.coolify.yml` (root)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: pi-agent-postgres
    environment:
      POSTGRES_USER: pi_agent
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: pi_agent_db
      POSTGRES_INITDB_ARGS: "-c shared_preload_libraries=vector"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./ops/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pi_agent"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: packages/agent/Dockerfile
    container_name: pi-agent-app
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://pi_agent:${DATABASE_PASSWORD}@postgres:5432/pi_agent_db
      INFISICAL_URL: ${INFISICAL_URL}
      INFISICAL_API_KEY: ${INFISICAL_API_KEY}
      PI_MODEL_POLICY: ${PI_MODEL_POLICY:-free}
      DAILY_BUDGET_USD: ${DAILY_BUDGET_USD:-10}
      MONTHLY_BUDGET_USD: ${MONTHLY_BUDGET_USD:-100}
    ports:
      - "3000:3000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  postgres_data:
```

### 3. .env.example

**Location:** `.env.example` (root)

```bash
# PostgreSQL (auto-generated if using docker-compose)
DATABASE_PASSWORD=your-secure-database-password-here

# Infisical (Centralized Secrets)
INFISICAL_URL=https://infisical.app  # or self-hosted URL
INFISICAL_API_KEY=your-infisical-api-key-here
INFISICAL_PROJECT_ID=your-project-id-here

# Model Routing Policy
PI_MODEL_POLICY=free  # free | balanced | premium | local_only
PI_ALLOW_PAID_FALLBACK=false

# Budget Limits
DAILY_BUDGET_USD=10.00
MONTHLY_BUDGET_USD=100.00

# Ollama (for Free Mode)
OLLAMA_BASE_URL=http://localhost:11434

# Optional: Local development overrides (NEVER in production)
# INFISICAL_OFFLINE_MODE=false
```

---

## Coolify Setup

### Step 1: Connect GitHub Repository

1. Log into Coolify
2. Create New Project → GitHub
3. Select this repository
4. Choose main branch

### Step 2: Configure Environment

1. In Coolify dashboard, go to Project Settings → Environment Variables
2. Add each variable from `.env.example`
3. For secrets, mark as `secret` type (Coolify encrypts them)
4. Critical secrets:
   - `INFISICAL_API_KEY` (load from Infisical)
   - `DATABASE_PASSWORD` (generate strong password)
   - API keys from Infisical (don't duplicate here)

### Step 3: Configure Services

1. **PostgreSQL Service**:
   - Use `docker-compose.coolify.yml` PostgreSQL service
   - OR use external database (Supabase, AWS RDS)
   - If external, set `DATABASE_URL` environment variable

2. **App Service**:
   - Build from `docker-compose.coolify.yml`
   - Port: 3000
   - Health check: `/health`

### Step 4: Run Migrations

Before first deployment, run migrations:

```bash
# SSH into Coolify container
docker-compose -f docker-compose.coolify.yml exec app npm run migrate
```

Or create a one-off migration service:

```yaml
migrate:
  image: pi-agent-app:latest
  depends_on:
    postgres:
      condition: service_healthy
  environment:
    DATABASE_URL: postgresql://pi_agent:${DATABASE_PASSWORD}@postgres:5432/pi_agent_db
  entrypoint: npm run migrate
```

### Step 5: Deploy

1. In Coolify, click "Deploy"
2. Monitor build logs
3. Verify health check passes (green checkmark)
4. Check logs: `docker-compose -f docker-compose.coolify.yml logs -f app`

---

## Health & Readiness Endpoints

### /health

**Simple liveness probe (Kubernetes-style):**

```typescript
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
```

### /ready

**Readiness probe (includes dependency checks):**

```typescript
app.get('/ready', async (req, res) => {
  try {
    // Check database connectivity
    await db.query('SELECT 1');
    
    // Check Infisical connectivity (if configured)
    if (process.env.INFISICAL_API_KEY) {
      await infisical.getSecret('openai/api-key').catch(() => {
        throw new Error('Infisical unreachable');
      });
    }
    
    res.json({ status: 'ready', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ 
      status: 'not_ready', 
      error: error.message 
    });
  }
});
```

---

## PostgreSQL Backup & Restore

### Automated Backups (Recommended)

Use Hostinger's backup service or cron job:

```bash
# Daily backup script: /usr/local/bin/backup-pi-agent-db.sh
#!/bin/bash
BACKUP_DIR=/backups/pi-agent
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

docker-compose -f /opt/pi-agent/docker-compose.coolify.yml exec \
  -T postgres pg_dump -U pi_agent pi_agent_db | gzip > \
  $BACKUP_DIR/pi-agent-db-$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

Add to crontab:
```
0 2 * * * /usr/local/bin/backup-pi-agent-db.sh
```

### Manual Restore

```bash
# List backups
ls /backups/pi-agent/

# Restore from backup
gunzip -c /backups/pi-agent/pi-agent-db-20260526_020000.sql.gz | \
  docker-compose -f docker-compose.coolify.yml exec -T postgres \
  psql -U pi_agent pi_agent_db

# Verify
docker-compose -f docker-compose.coolify.yml exec postgres \
  psql -U pi_agent pi_agent_db -c "SELECT COUNT(*) FROM personas;"
```

---

## Monitoring & Logs

### Access Logs

```bash
# Live app logs
docker-compose -f docker-compose.coolify.yml logs -f app

# Database logs
docker-compose -f docker-compose.coolify.yml logs -f postgres

# Last 100 lines
docker-compose -f docker-compose.coolify.yml logs --tail=100
```

### Metrics

Monitor via Coolify dashboard:
- Memory usage
- CPU usage
- Network I/O
- Container health status

Or use external monitoring (Prometheus, DataDog, etc.):

```bash
# Expose Prometheus metrics endpoint (optional)
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(promClient.register.metrics());
});
```

---

## Zero-Downtime Deployments

Coolify supports rolling updates with health checks:

1. New container spins up
2. Health checks wait for readiness
3. Old container traffic redirects to new container
4. Old container stops gracefully

**Configuration in docker-compose:**

```yaml
app:
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3000/ready"]
    interval: 10s
    timeout: 5s
    retries: 3
    start_period: 30s
  deploy:
    update_config:
      parallelism: 1
      delay: 10s
```

---

## Optional CDN with Cloudflare

### DNS Setup

1. Update domain DNS to Cloudflare nameservers
2. Create CNAME record:
   ```
   api.yourdomain.com → your-coolify-host.com
   ```

### Page Rules (Cache)

1. Pattern: `api.yourdomain.com/static/*`
   - Cache Level: Cache Everything
   - TTL: 1 month

2. Pattern: `api.yourdomain.com/api/*`
   - Cache Level: Bypass
   - (Don't cache API responses)

### SSL/TLS

- Full (strict) encryption enabled
- Automatic certificate renewal

---

## Troubleshooting

### App Not Starting

```bash
# Check logs
docker-compose -f docker-compose.coolify.yml logs app

# Common issues:
# - DATABASE_URL invalid: Check PostgreSQL service health
# - INFISICAL_API_KEY invalid: Check Infisical project
# - Port 3000 already in use: Change port in docker-compose
```

### Database Connection Errors

```bash
# Test connection
docker-compose -f docker-compose.coolify.yml exec postgres \
  psql -U pi_agent pi_agent_db -c "SELECT 1"

# Check credentials
echo $DATABASE_PASSWORD  # Should not be empty
```

### High Memory Usage

```bash
# Monitor memory
docker-compose -f docker-compose.coolify.yml stats

# Reduce Node.js heap if needed
export NODE_OPTIONS="--max-old-space-size=512"
# In docker-compose: add to environment
```

### Slow Queries

```bash
# Enable slow query logging in PostgreSQL
docker-compose -f docker-compose.coolify.yml exec postgres \
  psql -U pi_agent -c "ALTER SYSTEM SET log_min_duration_statement = 1000;" && \
  docker-compose restart postgres
```

---

## Rollback Procedure

If deployment fails:

1. In Coolify, view deployment history
2. Click "Rollback" on previous successful deployment
3. Verify health check passes
4. Check logs for any issues

---

## Security Checklist

- [ ] All secrets in Infisical (not in .env or code)
- [ ] `.env.example` contains NO actual values
- [ ] HTTPS/TLS enabled (Cloudflare or Let's Encrypt)
- [ ] Database firewall restricted to app container only
- [ ] SSH key-based auth only (no password SSH)
- [ ] Automatic backups configured
- [ ] Audit logs persistent and retained
- [ ] CORS configured appropriately
- [ ] Rate limiting enabled on API endpoints

---

## Conclusion

Coolify provides a simple, Kubernetes-free deployment pipeline. With proper health checks, automated backups, and Infisical integration, the PI Agent Control Plane is production-ready on Hostinger VPS.
