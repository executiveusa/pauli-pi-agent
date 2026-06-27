#!/usr/bin/env node
/**
 * Tailscale Vault Proxy
 * Run this on your Windows machine or VPS.
 * It serves local files from VAULT_ROOT to the Vercel dashboard.
 *
 * Usage:
 *   VAULT_ROOT="E:\MENTAL MODELS" PROXY_SECRET=your-secret node server.mjs
 *
 * On Windows:
 *   $env:VAULT_ROOT="E:\MENTAL MODELS"; $env:PROXY_SECRET="your-secret"; node server.mjs
 *
 * Expose via Tailscale Funnel so Vercel can reach it:
 *   tailscale funnel 3001
 */

import { createServer } from 'node:http'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative, extname } from 'node:path'
import { URL } from 'node:url'

const PORT = parseInt(process.env.PROXY_PORT ?? '3001', 10)
const VAULT_ROOT = process.env.VAULT_ROOT ?? 'E:\\MENTAL MODELS'
const PROXY_SECRET = process.env.PROXY_SECRET ?? ''

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(data))
}

function checkAuth(req, res) {
  if (!PROXY_SECRET) return true
  const secret = req.headers['x-proxy-secret']
  if (secret !== PROXY_SECRET) {
    json(res, 401, { error: 'unauthorized' })
    return false
  }
  return true
}

async function listDir(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true })
  return entries
    .filter((e) => !e.name.startsWith('.'))
    .map((e) => ({
      name: e.name,
      path: relative(VAULT_ROOT, join(dirPath, e.name)).replace(/\\/g, '/'),
      type: e.isDirectory() ? 'dir' : 'file',
    }))
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'x-proxy-secret' })
    res.end()
    return
  }

  if (!checkAuth(req, res)) return

  const url = new URL(req.url, `http://localhost:${PORT}`)

  // GET /api/list?path=<vault-relative-path>
  if (url.pathname === '/api/list') {
    const rel = url.searchParams.get('path') ?? ''
    const abs = join(VAULT_ROOT, rel)
    try {
      const files = await listDir(abs)
      json(res, 200, { files })
    } catch (e) {
      json(res, 404, { error: String(e) })
    }
    return
  }

  // GET /api/read?path=<vault-relative-path>
  if (url.pathname === '/api/read') {
    const rel = url.searchParams.get('path') ?? ''
    if (!rel) { json(res, 400, { error: 'path required' }); return }
    // Prevent path traversal
    const abs = join(VAULT_ROOT, rel)
    if (!abs.startsWith(VAULT_ROOT)) {
      json(res, 403, { error: 'forbidden' })
      return
    }
    try {
      const content = await readFile(abs, 'utf-8')
      json(res, 200, { content, path: rel })
    } catch (e) {
      json(res, 404, { error: String(e) })
    }
    return
  }

  // GET /health
  if (url.pathname === '/health') {
    json(res, 200, { ok: true, vault: VAULT_ROOT })
    return
  }

  json(res, 404, { error: 'not found' })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Vault proxy running on port ${PORT}`)
  console.log(`Vault root: ${VAULT_ROOT}`)
  console.log(`Auth: ${PROXY_SECRET ? 'enabled' : 'DISABLED (set PROXY_SECRET)'}`)
  console.log()
  console.log('To expose via Tailscale Funnel:')
  console.log(`  tailscale funnel ${PORT}`)
  console.log()
  console.log('Then set in Vercel:')
  console.log(`  VAULT_SOURCE=tailscale`)
  console.log(`  TAILSCALE_PROXY_HOST=<your-machine>.ts.net:${PORT}`)
  console.log(`  TAILSCALE_PROXY_SECRET=<your-secret>`)
})
