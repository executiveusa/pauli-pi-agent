import { NextResponse } from "next/server";

export async function GET() {
  const proxyUrl = process.env.LLM_PROXY_URL ?? "http://localhost:8082";
  const proxyToken = process.env.LLM_PROXY_TOKEN ?? "freecc";

  try {
    const response = await fetch(`${proxyUrl}/v1/models`, {
      headers: { "x-api-key": proxyToken },
      cache: "no-store",
    });

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      proxyUrl,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      proxyUrl,
    }, { status: 500 });
  }
}
