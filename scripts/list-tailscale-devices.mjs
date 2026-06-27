// scripts/list-tailscale-devices.mjs
// One-off: use TAILSCALE_API_KEY (+ NET_NAME) from Cosmos_Vault/.env to list tailnet devices
// and their IPs, so we can find the VPS's 100.x.x.x. Prints ONLY names + IPs, never the key.
import { readFileSync, existsSync } from 'node:fs';

function pick(key, sources) {
  if (process.env[key]) return process.env[key];
  for (const p of sources) {
    try {
      if (!existsSync(p)) continue;
      const m = readFileSync(p, 'utf8').match(new RegExp(`^${key}=(.+)$`, 'm'));
      if (m && m[1].trim()) return m[1].trim().replace(/^["']|["']$/g, '');
    } catch {}
  }
  return '';
}

const key = pick('TAILSCALE_API_KEY', [
  'E:\\THE PAULI FILES\\Cosmos_Vault.env',
  'C:\\Users\\execu\\repos\\pauli-pi-agent\\.env',
]);
const tailnet = pick('TAILSCALE_NET_NAME', [
  'E:\\THE PAULI FILES\\Cosmos_Vault.env',
  'C:\\Users\\execu\\repos\\pauli-pi-agent\\.env',
]);

if (!key) {
  console.log(JSON.stringify({ ok: false, reason: 'TAILSCALE_API_KEY not found' }));
  process.exit(0);
}

const auth = Buffer.from(`${key}:`).toString('base64');
const t = tailnet || '-';
const url = `https://api.tailscale.com/api/v2/tailnet/${encodeURIComponent(t)}/devices`;

try {
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    console.log(JSON.stringify({ ok: false, status: res.status, body: (await res.text()).slice(0, 300) }));
    process.exit(0);
  }
  const data = await res.json();
  const devices = (data.devices || []).map((d) => ({
    name: d.name || d.hostname || '(unnamed)',
    node_id: d.node_id || d.id || null,
    os: d.os || null,
    online: d.online,
    ipv4: d.addresses ? d.addresses.find((a) => /^[0-9.]+$/.test(a)) : null,
    ipv6: d.addresses ? d.addresses.find((a) => a.includes(':')) : null,
  }));
  console.log(JSON.stringify({ ok: true, tailnet_used: t, count: devices.length, devices }, null, 2));
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: String(e) }));
}
