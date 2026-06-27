# MCP CLI REFERENCE

**Pauli Pi Software Factory — MCP Tool CLI Wrappers**
**Version**: 1.0.0
**Location**: `/lib/mcp-cli/`

The MCP CLI layer wraps all MCP tools with a consistent interface: snake_case naming, argument validation, retry logic, structured logging, and normalized error responses. Agents never call MCP tools directly — they always use these wrappers.

---

## Architecture

```
Agent code
    │
    ▼
/lib/mcp-cli/wrappers.ts        ← Call these functions
    │
    ▼
/lib/mcp-cli/index.ts           ← Exports all wrappers
    │
    ├── Argument validation (throws MCPValidationError if invalid)
    ├── /lib/mcp-cli/logger.ts  ← Logs every call with timing
    ├── Retry logic (up to 3 retries with exponential backoff)
    │
    ▼
MCP Tool (actual execution)
    │
    ▼
Normalized response or MCPError
```

---

## Installation / Import

```typescript
import {
  github_get_file_contents,
  vercel_deploy,
  supabase_execute_sql,
  browser_navigate,
  // ... all functions listed below
} from '/lib/mcp-cli';
```

---

## Error Types

```typescript
// All MCP CLI functions throw these typed errors:

class MCPValidationError extends Error {
  code: 'MCP_VALIDATION_ERROR';
  field: string;        // which argument failed validation
  expected: string;     // what was expected
  received: unknown;    // what was received
}

class MCPToolError extends Error {
  code: 'MCP_TOOL_ERROR';
  tool: string;         // which MCP tool failed
  mcpError: unknown;    // the original error from MCP
  retryCount: number;   // how many times it was retried
}

class MCPTimeoutError extends Error {
  code: 'MCP_TIMEOUT_ERROR';
  tool: string;
  timeoutMs: number;
}
```

---

## Response Envelope

All wrapper functions return a consistent response:

```typescript
interface MCPResponse<T> {
  success: boolean;
  data: T | null;
  error: MCPToolError | null;
  duration_ms: number;
  retries: number;
  logged_at: string;   // ISO timestamp
}
```

---

## GITHUB WRAPPERS

### `github_get_file_contents`

Retrieve the contents of a file from a GitHub repository.

```typescript
async function github_get_file_contents(args: {
  owner: string;         // Repository owner (username or org)
  repo: string;          // Repository name
  path: string;          // File path relative to repo root
  ref?: string;          // Branch, tag, or commit SHA (default: default branch)
}): Promise<MCPResponse<{
  content: string;       // Decoded file content
  encoding: string;      // Always 'utf-8' after decoding
  sha: string;           // File SHA
  size: number;          // File size in bytes
  path: string;          // File path as returned by GitHub
}>>
```

**Example**:
```typescript
const result = await github_get_file_contents({
  owner: 'executiveusa',
  repo: 'pauli-pi-agent',
  path: 'package.json',
  ref: 'main',
});
if (result.success) {
  const pkg = JSON.parse(result.data!.content);
}
```

**Errors**: Throws `MCPValidationError` if `owner`, `repo`, or `path` is empty. Throws `MCPToolError` if file not found (404) or no access (403).

---

### `github_create_or_update_file`

Create or update a file in a GitHub repository.

```typescript
async function github_create_or_update_file(args: {
  owner: string;
  repo: string;
  path: string;          // File path (relative to repo root)
  content: string;       // File content (will be base64-encoded internally)
  message: string;       // Commit message
  branch?: string;       // Target branch (default: default branch)
  sha?: string;          // Required when updating an existing file
}): Promise<MCPResponse<{
  commit_sha: string;    // The new commit SHA
  file_sha: string;      // The new file SHA
}>>
```

**Example**:
```typescript
// Create a new file:
await github_create_or_update_file({
  owner: 'executiveusa',
  repo: 'my-project',
  path: 'docs/README.md',
  content: '# My Project\n\nContent here.',
  message: 'Add README',
  branch: 'main',
});
```

**Notes**: When updating an existing file, you must provide the current file's `sha` (get it via `github_get_file_contents` first).

---

### `github_create_branch`

Create a new branch in a repository.

```typescript
async function github_create_branch(args: {
  owner: string;
  repo: string;
  branch: string;        // New branch name
  from_branch?: string;  // Source branch (default: default branch)
}): Promise<MCPResponse<{
  branch: string;
  sha: string;           // SHA of the branch head
}>>
```

---

### `github_list_branches`

List branches in a repository.

```typescript
async function github_list_branches(args: {
  owner: string;
  repo: string;
  page?: number;         // Pagination (default: 1)
  per_page?: number;     // Results per page (default: 30, max: 100)
}): Promise<MCPResponse<Array<{
  name: string;
  sha: string;
  protected: boolean;
}>>>
```

---

### `github_create_pull_request`

Create a pull request.

```typescript
async function github_create_pull_request(args: {
  owner: string;
  repo: string;
  title: string;
  body: string;
  head: string;          // Branch with changes
  base: string;          // Target branch (e.g., 'main')
  draft?: boolean;       // Create as draft (default: false)
}): Promise<MCPResponse<{
  number: number;        // PR number
  url: string;           // PR URL
  html_url: string;
}>>
```

---

### `github_search_code`

Search for code across GitHub repositories.

```typescript
async function github_search_code(args: {
  query: string;         // GitHub code search query
  per_page?: number;     // (default: 10, max: 100)
}): Promise<MCPResponse<Array<{
  name: string;
  path: string;
  repository: string;
  url: string;
}>>>
```

---

### `github_get_commit`

Get a specific commit's details.

```typescript
async function github_get_commit(args: {
  owner: string;
  repo: string;
  sha: string;           // Commit SHA
}): Promise<MCPResponse<{
  sha: string;
  message: string;
  author: { name: string; email: string; date: string };
  files_changed: number;
  additions: number;
  deletions: number;
}>>
```

---

### `github_add_issue_comment`

Add a comment to an issue or pull request.

```typescript
async function github_add_issue_comment(args: {
  owner: string;
  repo: string;
  issue_number: number;
  body: string;
}): Promise<MCPResponse<{
  id: number;
  url: string;
}>>
```

---

## VERCEL WRAPPERS

### `vercel_deploy`

Deploy a project to Vercel.

```typescript
async function vercel_deploy(args: {
  project_name: string;  // Vercel project name (must exist or be created first)
  environment: 'preview' | 'production';
  directory?: string;    // Local directory to deploy (default: current dir)
  env_vars?: Record<string, string>;  // Environment variables to set
}): Promise<MCPResponse<{
  deployment_id: string;
  url: string;           // Deployment URL
  state: 'READY' | 'ERROR' | 'BUILDING' | 'QUEUED';
  created_at: string;
}>>
```

**Example**:
```typescript
const deploy = await vercel_deploy({
  project_name: 'my-saas-app',
  environment: 'preview',
});
if (deploy.success) {
  console.log(`Staging URL: ${deploy.data!.url}`);
}
```

**Notes**: For production deploys, always confirm human approval is on record before calling.

---

### `vercel_get_deployment`

Get the status and details of a deployment.

```typescript
async function vercel_get_deployment(args: {
  deployment_id: string;
}): Promise<MCPResponse<{
  id: string;
  url: string;
  state: 'READY' | 'ERROR' | 'BUILDING' | 'QUEUED' | 'CANCELED';
  created_at: string;
  build_duration_ms: number;
  error?: string;
}>>
```

---

### `vercel_list_deployments`

List recent deployments for a project.

```typescript
async function vercel_list_deployments(args: {
  project_name: string;
  limit?: number;        // (default: 10, max: 100)
  state?: 'READY' | 'ERROR' | 'BUILDING';  // Filter by state
}): Promise<MCPResponse<Array<{
  id: string;
  url: string;
  state: string;
  created_at: string;
  environment: 'production' | 'preview' | 'development';
}>>>
```

---

### `vercel_get_project`

Get Vercel project details.

```typescript
async function vercel_get_project(args: {
  project_name: string;
}): Promise<MCPResponse<{
  id: string;
  name: string;
  framework: string;
  node_version: string;
  production_url: string;
  created_at: string;
  updated_at: string;
}>>
```

---

### `vercel_get_runtime_logs`

Retrieve runtime logs for a deployment.

```typescript
async function vercel_get_runtime_logs(args: {
  deployment_id: string;
  limit?: number;        // (default: 100)
  since?: string;        // ISO timestamp filter
}): Promise<MCPResponse<Array<{
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  source: string;
}>>>
```

---

## SUPABASE WRAPPERS

### `supabase_execute_sql`

Execute a SQL query against the Supabase project database.

```typescript
async function supabase_execute_sql(args: {
  query: string;         // SQL query to execute
  params?: unknown[];    // Parameterized query values
}): Promise<MCPResponse<{
  rows: Record<string, unknown>[];
  row_count: number;
  duration_ms: number;
}>>
```

**Example**:
```typescript
const result = await supabase_execute_sql({
  query: 'SELECT * FROM factory_projects WHERE status = $1',
  params: ['PRODUCTION'],
});
```

**Security Note**: Always use parameterized queries. Never interpolate user input into query strings.

---

### `supabase_list_tables`

List all tables in the Supabase project.

```typescript
async function supabase_list_tables(args?: {
  schema?: string;       // Schema name (default: 'public')
}): Promise<MCPResponse<Array<{
  table_name: string;
  row_count: number;
  schema: string;
}>>>
```

---

### `supabase_apply_migration`

Apply a database migration.

```typescript
async function supabase_apply_migration(args: {
  name: string;          // Migration name (e.g., 'add_factory_tables')
  sql: string;           // Migration SQL
}): Promise<MCPResponse<{
  migration_id: string;
  applied_at: string;
  duration_ms: number;
}>>
```

**Warning**: Migrations are irreversible without a rollback migration. Always create a database backup before applying destructive migrations.

---

### `supabase_get_project_url`

Get the public URL of the Supabase project.

```typescript
async function supabase_get_project_url(args?: {}): Promise<MCPResponse<{
  url: string;
  anon_key: string;      // Public anon key (safe to expose client-side)
}>>
```

---

## BROWSER / CHROME DEVTOOLS WRAPPERS

### `browser_navigate`

Navigate the browser to a URL and wait for page load.

```typescript
async function browser_navigate(args: {
  url: string;
  wait_for?: 'load' | 'domcontentloaded' | 'networkidle';
  timeout_ms?: number;   // (default: 30000)
}): Promise<MCPResponse<{
  url: string;           // Final URL after any redirects
  status_code: number;
  title: string;
  load_time_ms: number;
}>>
```

---

### `browser_screenshot`

Capture a screenshot of the current browser state.

```typescript
async function browser_screenshot(args: {
  output_path?: string;  // Where to save screenshot (default: temp file)
  full_page?: boolean;   // Capture full scrollable page (default: false)
  viewport?: {
    width: number;
    height: number;
  };
}): Promise<MCPResponse<{
  path: string;          // Path to saved screenshot
  width: number;
  height: number;
  format: 'png';
}>>
```

---

### `browser_click`

Click an element on the current page.

```typescript
async function browser_click(args: {
  selector: string;      // CSS selector or text content (e.g., 'button[type=submit]' or 'text=Login')
  wait_after_ms?: number; // Wait after click (default: 500)
}): Promise<MCPResponse<{
  element_found: boolean;
  clicked: boolean;
}>>
```

---

### `browser_fill_input`

Fill in a form input.

```typescript
async function browser_fill_input(args: {
  selector: string;      // CSS selector for the input
  value: string;
  clear_first?: boolean; // Clear existing value first (default: true)
}): Promise<MCPResponse<{
  filled: boolean;
}>>
```

---

### `browser_get_console_errors`

Retrieve JavaScript console errors from the current page session.

```typescript
async function browser_get_console_errors(args?: {}): Promise<MCPResponse<Array<{
  type: 'error' | 'warn';
  message: string;
  source: string;
  line: number;
  column: number;
}>>>
```

---

### `browser_run_lighthouse`

Run a Lighthouse audit on the current page.

```typescript
async function browser_run_lighthouse(args: {
  url: string;
  categories?: Array<'performance' | 'accessibility' | 'best-practices' | 'seo'>;
}): Promise<MCPResponse<{
  performance: number;        // 0–100
  accessibility: number;      // 0–100
  best_practices: number;     // 0–100
  seo: number;               // 0–100
  lcp_ms: number;            // Largest Contentful Paint
  fid_ms: number;            // First Input Delay
  cls: number;               // Cumulative Layout Shift
  tti_ms: number;            // Time to Interactive
}>>
```

---

### `browser_get_network_failures`

Get network requests that failed (4xx, 5xx, or network errors).

```typescript
async function browser_get_network_failures(args?: {
  since_ms?: number;     // Only failures after N ms into page load
}): Promise<MCPResponse<Array<{
  url: string;
  method: string;
  status_code: number;
  error?: string;        // Network error message if applicable
  duration_ms: number;
}>>>
```

---

## FILE SYSTEM WRAPPERS

### `fs_read_file`

Read a file from the local filesystem.

```typescript
async function fs_read_file(args: {
  path: string;          // Absolute path
  encoding?: 'utf-8' | 'base64';  // (default: 'utf-8')
}): Promise<MCPResponse<{
  content: string;
  size_bytes: number;
  modified_at: string;
}>>
```

---

### `fs_write_file`

Write content to a file.

```typescript
async function fs_write_file(args: {
  path: string;          // Absolute path
  content: string;
  create_dirs?: boolean; // Create parent directories if needed (default: true)
}): Promise<MCPResponse<{
  path: string;
  size_bytes: number;
}>>
```

---

### `fs_list_directory`

List files and directories at a path.

```typescript
async function fs_list_directory(args: {
  path: string;          // Absolute path
  recursive?: boolean;   // (default: false)
  max_depth?: number;    // If recursive (default: 3)
  include_hidden?: boolean; // Include .dotfiles (default: false)
}): Promise<MCPResponse<Array<{
  name: string;
  path: string;
  type: 'file' | 'directory';
  size_bytes: number;
  modified_at: string;
}>>>
```

---

### `fs_search_files`

Search for files matching a pattern.

```typescript
async function fs_search_files(args: {
  directory: string;     // Root directory for search
  pattern: string;       // Glob pattern (e.g., '**/*.ts')
  exclude?: string[];    // Patterns to exclude (e.g., ['node_modules/**'])
}): Promise<MCPResponse<Array<{
  path: string;
  name: string;
  size_bytes: number;
}>>>
```

---

## LOGGING

All wrapper calls are automatically logged via `/lib/mcp-cli/logger.ts`.

### Log Format
```json
{
  "timestamp": "2026-06-15T12:00:00.000Z",
  "tool": "github_get_file_contents",
  "args": { "owner": "executiveusa", "repo": "pauli-pi-agent", "path": "package.json" },
  "success": true,
  "duration_ms": 342,
  "retries": 0,
  "factory_run_id": "run_abc123",
  "agent": "Master"
}
```

### Accessing Logs
```typescript
import { getMCPLogs } from '/lib/mcp-cli/logger';

const logs = await getMCPLogs({
  factory_run_id: 'run_abc123',
  tool: 'vercel_deploy',          // optional filter
  since: new Date('2026-06-15'),  // optional filter
  limit: 100,
});
```

Logs are also visible in Mission Control under the "Activity Log" panel.

---

## RETRY BEHAVIOR

All wrappers implement exponential backoff retry:

```
Attempt 1: immediate
Attempt 2: after 1 second
Attempt 3: after 2 seconds

Total max wait: ~3 seconds before giving up and throwing MCPToolError
```

**Retry conditions**: Network errors, 5xx responses, timeout
**No retry**: 4xx client errors (validation/permission errors won't be fixed by retrying)

---

## ERROR HANDLING PATTERNS

### Basic pattern:
```typescript
const result = await github_get_file_contents({ owner, repo, path });
if (!result.success) {
  logger.error('Failed to get file', { error: result.error, path });
  throw result.error;
}
const content = result.data!.content;
```

### With fallback:
```typescript
const result = await vercel_get_project({ project_name: 'my-project' });
if (!result.success && result.error?.code === 'MCP_TOOL_ERROR') {
  // Project doesn't exist yet, create it
  await vercel_create_project({ name: 'my-project' });
}
```

### Batch operations (parallel):
```typescript
// Run multiple MCP calls in parallel:
const [fileResult, branchResult] = await Promise.all([
  github_get_file_contents({ owner, repo, path: 'package.json' }),
  github_list_branches({ owner, repo }),
]);

if (!fileResult.success || !branchResult.success) {
  throw new Error('Failed to fetch repository information');
}
```

---

## ADDING NEW WRAPPERS

To wrap a new MCP tool:

1. Add the function to `/lib/mcp-cli/wrappers.ts`:
```typescript
export async function tool_name(args: {
  param1: string;
  param2?: number;
}): Promise<MCPResponse<YourReturnType>> {
  // 1. Validate arguments
  if (!args.param1) throw new MCPValidationError('param1', 'non-empty string', args.param1);

  // 2. Log the call
  const startTime = Date.now();
  logger.logCall('tool_name', args);

  // 3. Execute with retry
  return withRetry(async () => {
    const result = await mcp__your_server__tool_name({
      param1: args.param1,
      param2: args.param2,
    });
    return {
      success: true,
      data: result,
      error: null,
      duration_ms: Date.now() - startTime,
      retries: 0,
      logged_at: new Date().toISOString(),
    };
  });
}
```

2. Export it from `/lib/mcp-cli/index.ts`
3. Add the type definitions to `/lib/mcp-cli/types.ts`

---

*MCP CLI Reference v1.0.0 — Pauli Pi Software Factory*
*See /lib/mcp-cli/ for implementation source code.*
