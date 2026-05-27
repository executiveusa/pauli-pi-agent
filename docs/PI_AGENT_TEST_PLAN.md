# PI Agent Control Plane - Test Plan

**Version**: 0.0.4

---

## Test Strategy

**Philosophy**: Comprehensive test coverage using:
- **Unit tests** for individual services
- **Integration tests** with fixture data
- **Policy tests** for security guardrails
- **E2E smoke tests** for critical workflows
- **Zero live API calls** in tests

---

## Test Categories

### Unit Tests

#### Model Router Tests

**File:** `packages/agent/test/model-router.test.ts`

```typescript
describe('ModelRouter', () => {
  describe('free mode', () => {
    test('selects ollama when available', async () => {
      const router = new ModelRouter('free', budgets);
      mockOllamaAvailable();
      const route = await router.route({});
      expect(route.selected_provider).toBe('ollama');
      expect(route.estimated_cost_usd).toBe(0);
    });

    test('blocks if no free models available', async () => {
      const router = new ModelRouter('free', budgets);
      mockAllFreeProvidersUnavailable();
      const route = await router.route({});
      expect(route.blocked).toBe(true);
      expect(route.block_reason).toContain('No free models');
    });

    test('never silently falls back to paid', async () => {
      const router = new ModelRouter('free', budgets);
      mockOllamaUnavailable();
      const route = await router.route({});
      expect(route.blocked).toBe(true);
      expect(route.selected_provider).not.toBe('openai');
    });
  });

  describe('balanced mode', () => {
    test('selects cheapest available model', async () => {
      const router = new ModelRouter('balanced', budgets);
      mockMultipleModelsAvailable();
      const route = await router.route({});
      expect(estimateCost(route.selected_model)).toBeLessThan(0.01);
    });

    test('enforces daily budget', async () => {
      const router = new ModelRouter('balanced', budgets);
      budgets.remaining = 0.001; // Only $0.001 left
      const route = await router.route({});
      expect(route.blocked).toBe(true);
      expect(route.block_reason).toContain('Budget');
    });
  });

  describe('premium mode', () => {
    test('approves expensive model request', async () => {
      const router = new ModelRouter('premium', budgets);
      mockExpensiveModelSelection();
      const approveSpy = jest.spyOn(approvalManager, 'createRequest');
      await router.route({});
      expect(approveSpy).toHaveBeenCalled();
    });
  });
});
```

#### Secret Redaction Tests

**File:** `packages/agent/test/secret-redaction.test.ts`

```typescript
describe('secretRedaction', () => {
  test('redacts OpenAI API keys', () => {
    const text = 'Error with key sk-abc123def456';
    const redacted = redactSecrets(text);
    expect(redacted).not.toContain('sk-');
    expect(redacted).toContain('[REDACTED_API_KEY]');
  });

  test('redacts bearer tokens', () => {
    const text = 'Auth failed: Bearer abc123xyz789';
    const redacted = redactSecrets(text);
    expect(redacted).not.toContain('Bearer');
    expect(redacted).toContain('[REDACTED_BEARER_TOKEN]');
  });

  test('redacts password fields', () => {
    const text = 'password=secret123&user=john';
    const redacted = redactSecrets(text);
    expect(redacted).toContain('password=[REDACTED]');
    expect(redacted).toContain('user=john'); // Non-secret unchanged
  });

  test('never logs actual API keys in error messages', async () => {
    const spy = jest.spyOn(console, 'error');
    try {
      await makeApiCall('sk-test-key-123');
    } catch (e) {
      expect(console.error).toHaveBeenCalled();
      const logOutput = spy.mock.calls[0][0];
      expect(logOutput).not.toContain('sk-');
    }
  });
});
```

#### Knowledge Graph Service Tests

**File:** `packages/agent/test/graph-service.test.ts`

```typescript
describe('KnowledgeGraphService', () => {
  describe('entity extraction', () => {
    test('extracts named entities from text', async () => {
      const service = new KnowledgeGraphService(db);
      const text = 'Alice works at OpenAI in San Francisco.';
      const entities = await service.extractEntities(text);
      
      expect(entities).toContainEqual(
        expect.objectContaining({ name: 'Alice', type: 'Person' })
      );
      expect(entities).toContainEqual(
        expect.objectContaining({ name: 'OpenAI', type: 'Organization' })
      );
    });

    test('links entities to embeddings', async () => {
      const service = new KnowledgeGraphService(db);
      const entities = await service.extractEntities('sample text');
      
      entities.forEach(entity => {
        expect(entity.embedding).toBeDefined();
        expect(entity.embedding.length).toBe(384); // Anthropic dimension
      });
    });
  });

  describe('claim extraction', () => {
    test('extracts claims with subject-predicate-object structure', async () => {
      const service = new KnowledgeGraphService(db);
      const text = 'Machine learning models improve with more data.';
      const claims = await service.extractClaims(text);
      
      expect(claims).toContainEqual(
        expect.objectContaining({
          subject_entity_id: expect.any(String),
          predicate: 'improve',
          object_entity_id: expect.any(String),
        })
      );
    });

    test('links claims to evidence', async () => {
      const service = new KnowledgeGraphService(db);
      const claims = await service.extractClaims('sample text');
      
      claims.forEach(claim => {
        expect(claim.evidence_ref_ids).toBeDefined();
        expect(claim.evidence_ref_ids.length).toBeGreaterThan(0);
      });
    });
  });

  describe('context retrieval', () => {
    test('retrieves relevant context for query', async () => {
      const service = new KnowledgeGraphService(db);
      const context = await service.retrieveContext('machine learning applications');
      
      expect(context.entities).toBeDefined();
      expect(context.claims).toBeDefined();
      expect(context.relations).toBeDefined();
      expect(context.evidence_refs).toBeDefined();
    });
  });
});
```

#### Persona Builder Tests

**File:** `packages/agent/test/persona-builder.test.ts`

```typescript
describe('PersonaBuilder', () => {
  test('creates persona from knowledge graph', async () => {
    const builder = new PersonaBuilder(graphService);
    const sources = ['https://example.com/ml-article'];
    
    const persona = await builder.createPersona({
      domain: 'machine learning',
      sources,
    });

    expect(persona.name).toBeDefined();
    expect(persona.domain).toBe('machine learning');
    expect(persona.expertise).toHaveLength(expect.any(Number));
    expect(persona.traits).toHaveLength(expect.any(Number));
    expect(persona.evidence_refs).toEqual(expect.any(Array));
  });

  test('generates agent prompt for persona', async () => {
    const builder = new PersonaBuilder(graphService);
    const persona = await builder.createPersona({ domain: 'finance' });
    
    expect(persona.agent_prompt).toBeDefined();
    expect(persona.agent_prompt).toContain('finance');
    expect(persona.agent_prompt).toContain('expert');
  });

  test('links all traits back to evidence', async () => {
    const builder = new PersonaBuilder(graphService);
    const persona = await builder.createPersona({ domain: 'biology' });
    
    persona.traits.forEach(trait => {
      expect(trait.evidence_ref_ids).toBeDefined();
      expect(trait.evidence_ref_ids.length).toBeGreaterThan(0);
    });
  });
});
```

#### Coordinator Tests

**File:** `packages/agent/test/coordinator.test.ts`

```typescript
describe('PICoordinator', () => {
  test('selects relevant personas for query', async () => {
    const coordinator = new PICoordinator(graphService, personas);
    const selected = await coordinator.selectPersonas('quantum computing basics');
    
    expect(selected.length).toBeGreaterThan(0);
    selected.forEach(p => {
      expect(p.domain).toBeDefined();
      expect(p.expertise).toContain(expect.stringContaining('quantum'));
    });
  });

  test('dispatches independent reasoning to personas', async () => {
    const coordinator = new PICoordinator(graphService, personas);
    const responses = await coordinator.reasonWithPersonas(
      'What is machine learning?',
      selectedPersonas
    );
    
    expect(responses).toHaveLength(selectedPersonas.length);
    responses.forEach(r => {
      expect(r.reasoning).toBeDefined();
      expect(r.confidence).toBeGreaterThan(0);
      expect(r.confidence).toBeLessThanOrEqual(1);
    });
  });

  test('synthesizes responses into final answer', async () => {
    const coordinator = new PICoordinator(graphService, personas);
    const responses = [
      { reasoning: 'ML is about learning patterns', confidence: 0.9 },
      { reasoning: 'ML uses neural networks', confidence: 0.85 },
    ];
    
    const synthesis = await coordinator.synthesize('test query', responses);
    
    expect(synthesis.text).toBeDefined();
    expect(synthesis.evidence_refs).toBeDefined();
    expect(synthesis.confidence).toBeGreaterThan(0);
  });

  test('respects loop limit circuit breaker', async () => {
    const coordinator = new PICoordinator(graphService, personas);
    coordinator.maxTurns = 2; // Set low for testing
    
    // Mock infinite reasoning loop
    jest.spyOn(coordinator, 'reasonWithPersonas')
      .mockImplementation(() => ({ continueReasoning: true }));
    
    const result = await coordinator.coordinate('query');
    
    expect(result.stopped_reason).toBe('loop_limit_exceeded');
  });

  test('stops if budget exhausted', async () => {
    const coordinator = new PICoordinator(graphService, personas, budgets);
    budgets.remaining = 0.001; // Only $0.001 left
    
    const result = await coordinator.coordinate('expensive query');
    
    expect(result.stopped_reason).toContain('budget');
  });
});
```

---

### Integration Tests

#### URL Ingestion with Fixture Server

**File:** `packages/agent/test/integration/ingest-url.test.ts`

```typescript
describe('URL Ingestion Integration', () => {
  let fixtureServer: TestServer;

  beforeAll(async () => {
    // Start fixture server with sample HTML
    fixtureServer = new TestServer({
      '/article': '<html><body><h1>Test Article</h1><p>Content...</p></body></html>',
    });
    await fixtureServer.start();
  });

  afterAll(async () => {
    await fixtureServer.stop();
  });

  test('ingests URL and creates source record', async () => {
    const ingestor = new URLIngestor(playwrightBrowser);
    const result = await ingestor.ingest(fixtureServer.url('/article'));

    expect(result.source_id).toBeDefined();
    expect(result.title).toBe('Test Article');
    expect(result.text).toContain('Content');
  });

  test('extracts entities and claims from ingested content', async () => {
    const ingestor = new URLIngestor(playwrightBrowser);
    const result = await ingestor.ingest(fixtureServer.url('/article'));

    const source = await db.getSource(result.source_id);
    const entities = await graphService.extractEntities(source.text);

    expect(entities.length).toBeGreaterThan(0);
  });

  test('creates audit log entry for ingestion', async () => {
    const ingestor = new URLIngestor(playwrightBrowser);
    const before = Date.now();
    await ingestor.ingest(fixtureServer.url('/article'));
    
    const audit = await auditLog.query({
      event_type: 'ingest_success',
      since: new Date(before),
    });

    expect(audit.length).toBeGreaterThan(0);
  });
});
```

#### Video Analysis with Fixture Data

**File:** `packages/agent/test/integration/video-analysis.test.ts`

```typescript
describe('Video Analysis Integration', () => {
  test('analyzes video transcript', async () => {
    const analyzer = new VideoAnalyzer();
    const result = await analyzer.analyze({
      url: 'test://videos/sample.mp4',
      transcript: 'Here is a sample transcript about machine learning.',
      frames: [], // No frames for this test
    });

    expect(result.transcript_summary).toBeDefined();
    expect(result.key_claims).toBeDefined();
    expect(result.concepts).toBeDefined();
  });

  test('extracts visual observations from frames', async () => {
    const analyzer = new VideoAnalyzer();
    const frameData = loadFixtureImage('test-frame.jpg');
    
    const result = await analyzer.analyze({
      url: 'test://videos/sample.mp4',
      transcript: 'About deep learning architectures',
      frames: [
        { timestamp: '00:00:05', data: frameData },
      ],
    });

    expect(result.frame_observations).toHaveLength(1);
    expect(result.frame_observations[0].observation).toBeDefined();
    expect(result.transcript_fallback).toBe(false); // Frames were analyzed
  });

  test('labels transcript-only fallback', async () => {
    const analyzer = new VideoAnalyzer();
    const result = await analyzer.analyze({
      url: 'test://videos/sample.mp4',
      transcript: 'Sample transcript',
      frames: [], // No frames
    });

    expect(result.transcript_fallback).toBe(true);
  });
});
```

#### Multi-Persona Reasoning with Mocked Models

**File:** `packages/agent/test/integration/multi-persona-reasoning.test.ts`

```typescript
describe('Multi-Persona Reasoning Integration', () => {
  test('end-to-end reasoning workflow', async () => {
    // Setup: Create personas
    const mlPersona = await personaBuilder.createPersona({
      domain: 'machine learning',
      sources: [fixtureML],
    });
    const softwarePersona = await personaBuilder.createPersona({
      domain: 'software engineering',
      sources: [fixtureSE],
    });

    // Execute reasoning
    const coordinator = new PICoordinator(graphService, [mlPersona, softwarePersona]);
    const result = await coordinator.coordinate(
      'How should I design a machine learning system?'
    );

    // Verify result structure
    expect(result.selected_personas).toEqual([mlPersona.id, softwarePersona.id]);
    expect(result.persona_responses).toHaveLength(2);
    expect(result.synthesis).toBeDefined();
    expect(result.evidence_refs.length).toBeGreaterThan(0);
    expect(result.cost_summary.estimated_cost_usd).toBe(0); // Mocked models are free
  });

  test('detects disagreements between personas', async () => {
    // Create personas with different viewpoints
    const persona1 = { id: 'p1', expertise: ['agile'] };
    const persona2 = { id: 'p2', expertise: ['waterfall'] };

    const coordinator = new PICoordinator(graphService, [persona1, persona2]);
    const result = await coordinator.coordinate('Best development methodology?');

    if (result.disagreements.length > 0) {
      result.disagreements.forEach(d => {
        expect(d.severity).toBeGreaterThan(0);
        expect(d.position_a).toBeDefined();
        expect(d.position_b).toBeDefined();
      });
    }
  });
});
```

---

### Policy Tests

#### Free Mode Enforcement

**File:** `packages/agent/test/policy/free-mode.test.ts`

```typescript
describe('Free Mode Policy', () => {
  test('blocks paid model silently fallback', async () => {
    const policy = 'free';
    const router = new ModelRouter(policy, budgets);
    
    mockOllamaUnavailable();
    mockOpenRouterFreeUnavailable();
    
    // Try to route - should block, not fallback to paid
    const result = await router.route({});
    
    expect(result.blocked).toBe(true);
    expect(result.selected_provider).not.toBe('openai');
    expect(result.selected_provider).not.toBe('anthropic');
  });

  test('requires explicit approval for paid models', async () => {
    const policy = 'balanced'; // Try to use paid
    const router = new ModelRouter(policy, budgets);
    
    mockExpensiveModelNeeded();
    const approveSpy = jest.spyOn(approvalManager, 'createRequest');
    
    await router.route({});
    
    expect(approveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request_type: 'expensive_model_route'
      })
    );
  });
});
```

---

### E2E Smoke Tests

**File:** `packages/agent/test/smoke/control-plane.smoke.ts`

```typescript
describe('PI Agent Control Plane - Smoke Tests', () => {
  test('ingest → persona → reason → synthesize workflow', async () => {
    // 1. Ingest
    const ingestResult = await fixtureService.ingestFixtureArticle();
    console.log(`✓ Ingested source: ${ingestResult.source_id}`);

    // 2. Build persona
    const persona = await personaBuilder.createPersona({
      domain: 'test',
      sources: [ingestResult.source_id],
    });
    console.log(`✓ Created persona: ${persona.id}`);

    // 3. Coordinate reasoning
    const coordinator = new PICoordinator(graphService, [persona]);
    const result = await coordinator.coordinate('Test question?');
    console.log(`✓ Reasoning completed: ${result.synthesis.substring(0, 50)}...`);

    // 4. Verify audit trail
    const auditEvents = await auditLog.query({
      resource_type: 'source',
      resource_id: ingestResult.source_id,
    });
    expect(auditEvents.length).toBeGreaterThan(0);
    console.log(`✓ Audit trail verified: ${auditEvents.length} events`);

    // 5. View in dashboard API
    const dashboardRun = await dashboardAPI.getRun(result.run_id);
    expect(dashboardRun.status).toBe('completed');
    console.log(`✓ Dashboard view working`);

    console.log('\n✅ Full workflow smoke test passed');
  });
});
```

---

## Fixture Data

All test data stored in `packages/agent/test/fixtures/`:

```
test/fixtures/
├── articles/
│   └── sample-article.html
├── videos/
│   ├── sample-transcript.txt
│   └── sample-frame.jpg
├── documents/
│   ├── sample.pdf
│   └── sample.docx
└── knowledge-graphs/
    ├── entities.json
    └── claims.json
```

---

## Running Tests

### Run All Tests

```bash
npm test --workspaces
```

### Run Package-Specific Tests

```bash
cd packages/agent
npm test
```

### Run Specific Test File

```bash
cd packages/agent
npm test -- model-router.test.ts
```

### Run with Coverage

```bash
npm test -- --coverage
```

### Run Specific Test Suite

```bash
npm test -- -t "Free Mode"
```

---

## CI/CD Integration

GitHub Actions workflow tests on every push:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run check
      - run: npm test --workspaces
      - run: npm run coverage
      - uses: codecov/codecov-action@v3
```

---

## Conclusion

Comprehensive test coverage ensures the PI Agent Control Plane is reliable, secure, and auditable. All tests use fixtures and mocked providers—zero live API calls.
