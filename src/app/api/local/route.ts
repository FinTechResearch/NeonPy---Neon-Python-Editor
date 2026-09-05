import { NextRequest, NextResponse } from "next/server";
import { LOCAL_RUNTIMES } from "@/lib/ai/types";
import { assertLocalHttpHost } from "@/lib/ai/localGuard";

export const runtime = "nodejs";

interface Found {
  host: string;
  runtime: string;
  port: number;
  models: string[];
}

interface Target {
  base: string;
  name: string;
  port: number;
}

async function probe(base: string, name: string, port: number): Promise<Found | null> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 1500);
  try {
    const res = await fetch(`${base}/v1/models`, {
      signal: ac.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json().catch(() => null)) as
      | { data?: { id?: string }[] }
      | null;
    const models = (json?.data ?? [])
      .map((m) => m.id ?? "")
      .filter((id) => id.length > 0)
      .sort((a, b) => a.localeCompare(b));
    return { host: base, runtime: name, port, models };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * POST /api/local
 * Body: { host?: string }
 * Scans default ports of well-known local runtimes (Ollama, LM Studio,
 * llama.cpp, Jan, GPT4All, vLLM, KoboldCpp, text-generation-webui) plus an
 * optional user-provided host, via their OpenAI-compatible /v1/models.
 */
export async function POST(req: NextRequest) {
  let body: { host?: string } = {};
  try {
    body = (await req.json()) as { host?: string };
  } catch {
    /* empty body -> default scan */
  }

  const targets: Target[] = [];
  if (body.host) {
    const hostErr = assertLocalHttpHost(body.host);
    if (hostErr) {
      return NextResponse.json({ error: hostErr }, { status: 400 });
    }
    let port = 80;
    try {
      port = Number(new URL(body.host).port) || 80;
    } catch {
      /* guarded above */
    }
    targets.push({ base: body.host.replace(/\/+$/, ""), name: "Custom", port });
  }
  for (const rt of LOCAL_RUNTIMES) {
    targets.push({ base: `http://127.0.0.1:${rt.port}`, name: rt.name, port: rt.port });
  }

  // Phase 1: loopback IP probes (custom host included)
  const probed = await Promise.all(targets.map((t) => probe(t.base, t.name, t.port)));
  const found: Found[] = [];
  const hitPorts = new Set<number>();
  for (const r of probed) {
    if (r) {
      found.push(r);
      hitPorts.add(r.port);
    }
  }

  // Phase 2: "localhost" alias only for ports that did not answer on 127.0.0.1
  const aliasTargets = LOCAL_RUNTIMES.filter((rt) => !hitPorts.has(rt.port)).map(
    (rt) => ({ base: `http://localhost:${rt.port}`, name: rt.name, port: rt.port }),
  );
  if (aliasTargets.length > 0) {
    const aliases = await Promise.all(aliasTargets.map((t) => probe(t.base, t.name, t.port)));
    const seen = new Set(found.map((f) => f.host));
    for (const r of aliases) {
      if (r && !seen.has(r.host)) {
        found.push(r);
        seen.add(r.host);
      }
    }
  }

  return NextResponse.json({ found });
}
