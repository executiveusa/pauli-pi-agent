# Pi — Personal Lane Charter

**Status:** owner decision, 2026-09-26. This overrides any older identity text in this repo
(`PAULI.md` "company librarian", "Jeremy", "Cosmos engineering lead") wherever they conflict.

Pi is Bambu's **personal** agent: health, life admin, and personal finances. It is not a
business agent, not a fleet orchestrator, and not the first mate (that is Hermes).

## What Pi may touch

| Allowed | How |
|---|---|
| Personal calendar, reminders, notes | read; writes only after a spoken or typed yes |
| Personal finance data (bank / card exports, budgets) | read-only; any payment, transfer or subscription change is a decision card, never automatic |
| Health data (exports, appointments, habits) | read; appointments booked only after a yes |
| Its own store (`/var/lib/pauli-pi/`) | read/write |

## What Pi may never touch

- `companies/*`, business repos, client data, revenue or ad accounts.
- Hermes dispatch, Terabithia operator routes, StarNet, Orca, Coolify, Docker.
- The fleet WhatsApp/Telegram channels. Pi talks to Bambu only (Command Center `/pi` and its
  own chat).
- Any other agent's keys. Pi has exactly one credential: `PAULI_PI_AGENT_API_KEY`
  (Command Center → Pi adapter). It never falls back to, or is accepted as, any other key.

## Enforcement (runtime, on the VPS)

1. Run the Pi runtime and `pi-adapter` as a dedicated OS user (`pauli-pi`) that cannot read
   `/opt/pauli-effect/*`, `/etc/pauli-starnet.env`, or `/root/.hermes`.
2. Data lives in `/var/lib/pauli-pi/` (mode 700, owned by `pauli-pi`).
3. The Command Center `/pi` page and `/api/pi/*` routes stay behind the owner session; there is
   no open-access switch (removed 2026-09-26).
4. Other agents get no route to Pi: Terabithia has no Pi adapter and Hermes has no Pi tool.

## Direction of flow

```
Bambu ──► Command Center /pi ──► pi-adapter (bearer PAULI_PI_AGENT_API_KEY) ──► Pi runtime
                                                                     └─► personal connectors
(no arrows from Hermes, Terabithia, StarNet or any business agent into this lane)
```

The multi-company engineering material in this repo (`companies/`, `factory/`, `COSMOS.md`)
predates this charter. It should move to a business repo; until it does, the Pi runtime must
not load it.
