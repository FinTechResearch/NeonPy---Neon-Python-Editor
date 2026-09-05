import { NextRequest, NextResponse } from "next/server";
import { PROVIDERS, type ProviderId, type ChatMessage } from "@/lib/ai/types";
import { assertLocalHttpHost } from "@/lib/ai/localGuard";

export const runtime = "nodejs";

interface Body {
  provider: ProviderId;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** Required when provider === "local": base URL of the local runtime. */
  baseUrl?: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { provider, apiKey, model, messages, temperature, maxTokens } = body;
  const conf = PROVIDERS[provider];
  if (!conf) {
    return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Missing messages" }, { status: 400 });
  }

  let baseUrl = conf.baseUrl;
  const key = conf.needsKey ? apiKey : apiKey || "local";
  if (conf.needsKey && !key) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  if (provider === "local") {
    baseUrl = (body.baseUrl ?? "").trim();
    if (!baseUrl) {
      return NextResponse.json(
        { error: "No local runtime selected — open Settings → Local and run detection." },
        { status: 400 },
      );
    }
    const hostErr = assertLocalHttpHost(baseUrl);
    if (hostErr) {
      return NextResponse.json({ error: hostErr }, { status: 400 });
    }
  }

  try {
    // OpenAI-compatible runtimes expose /v1/chat/completions; accept hosts with
    // or without a trailing /v1 (e.g. Ollama reports http://127.0.0.1:11434).
    const apiRoot = /\/v1$/.test(baseUrl) ? baseUrl : `${baseUrl}/v1`;
    const upstream = await fetch(`${apiRoot}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: temperature ?? 0.4,
        max_tokens: maxTokens ?? 2048,
        stream: true,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      return NextResponse.json(
        { error: `Provider error ${upstream.status}: ${text.slice(0, 400)}` },
        { status: 502 },
      );
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown proxy error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
