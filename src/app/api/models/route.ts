import { NextRequest, NextResponse } from "next/server";
import { PROVIDERS, type ProviderId } from "@/lib/ai/types";

export const runtime = "nodejs";

/**
 * POST /api/models
 * Body: { provider, apiKey }
 * Returns the live model list from the provider (OpenAI-compatible /models).
 */
export async function POST(req: NextRequest) {
  let body: { provider?: ProviderId; apiKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const conf = body.provider ? PROVIDERS[body.provider] : undefined;
  if (!conf) {
    return NextResponse.json(
      { error: "Unknown or missing provider" },
      { status: 400 },
    );
  }
  if (body.provider === "local") {
    return NextResponse.json(
      { error: "Local models are listed by detection — use the Local section in Settings." },
      { status: 400 },
    );
  }
  const apiKey = body.apiKey ?? "";
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  try {
    const upstream = await fetch(`${conf.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return NextResponse.json(
        { error: `Provider error ${upstream.status}: ${text.slice(0, 300)}` },
        { status: 502 },
      );
    }

    const json = (await upstream.json()) as {
      data?: { id?: string; active?: boolean }[];
    };
    const models = (json.data ?? [])
      .map((m) => m.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0)
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ models });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown proxy error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
