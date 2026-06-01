# Next.js Demo Client — Mercury Voice Agent

A minimal Next.js app that mounts the `<mercury-agent-shell>` web component and routes
Mercury API calls through a server-side proxy so the `INCEPTION_API_KEY` never reaches
the browser.

## File structure

```
apps/mercury-demo/
├── app/
│   ├── api/
│   │   └── mercury/
│   │       └── route.ts        ← server-side proxy (key lives here)
│   ├── layout.tsx
│   └── page.tsx                ← imports web component + shell
├── components/
│   └── MercuryShell.tsx        ← client component wrapper
├── .env.local                  ← INCEPTION_API_KEY (never committed)
└── next.config.mjs
```

## Server-side proxy (`app/api/mercury/route.ts`)

```ts
import { NextRequest } from "next/server";

// INCEPTION_API_KEY stays here — never sent to the client
const INCEPTION_API_KEY = process.env.INCEPTION_API_KEY!;
const MERCURY_BASE_URL  = process.env.MERCURY_BASE_URL ?? "https://api.inceptionlabs.ai/v1";

export async function POST(req: NextRequest) {
  const body = await req.text();

  const upstream = await fetch(`${MERCURY_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${INCEPTION_API_KEY}`,
    },
    body,
    // @ts-expect-error — Node 18+ duplex requirement for streaming
    duplex: "half",
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      "Transfer-Encoding": "chunked",
    },
  });
}
```

## Client component (`components/MercuryShell.tsx`)

```tsx
"use client";
import { useEffect, useRef } from "react";

// Web components must be imported client-side in Next.js
export default function MercuryShell({ tenantId }: { tenantId: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    // Dynamic import avoids SSR issues with custom elements
    import("@archonx/web-ui").then(({ MercuryAgentShell }) => {
      if (!customElements.get("mercury-agent-shell")) {
        customElements.define("mercury-agent-shell", MercuryAgentShell);
      }
    });
  }, []);

  useEffect(() => {
    const el = ref.current as any;
    if (!el) return;
    el.tenantId  = tenantId;
    el.proxyUrl  = "/api/mercury";   // server route above
  }, [tenantId]);

  return <mercury-agent-shell ref={ref} />;
}
```

## Page (`app/page.tsx`)

```tsx
import MercuryShell from "@/components/MercuryShell";

export default function Home() {
  return (
    <main style={{ height: "100dvh" }}>
      <MercuryShell tenantId={process.env.NEXT_PUBLIC_TENANT_ID ?? "client_demo"} />
    </main>
  );
}
```

## `.env.local`

```
INCEPTION_API_KEY=sk-...          # never expose to browser
MERCURY_BASE_URL=https://api.inceptionlabs.ai/v1
NEXT_PUBLIC_TENANT_ID=client_demo
```

## `next.config.mjs`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the Mercury API origin in CSP if needed
  async headers() {
    return [
      {
        source: "/api/mercury",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
```

## Security notes

- `INCEPTION_API_KEY` is read only in the API route (server runtime). It is not prefixed
  with `NEXT_PUBLIC_` and will never be bundled into client code.
- The proxy strips all upstream response headers except `Content-Type` to avoid leaking
  internal infrastructure details.
- Add rate limiting (e.g. `@upstash/ratelimit`) to the proxy route before going to production.
