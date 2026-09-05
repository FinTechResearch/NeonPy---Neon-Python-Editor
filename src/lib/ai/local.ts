export interface LocalRuntime {
  host: string;
  runtime: string;
  port: number;
  models: string[];
}

/** Ask the NeonPy server to scan this machine (or a custom host) for local AI runtimes. */
export async function detectLocalModels(customHost?: string): Promise<LocalRuntime[]> {
  const res = await fetch("/api/local", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customHost ? { host: customHost } : {}),
  });
  const data = (await res.json().catch(() => null)) as
    | { found?: LocalRuntime[]; error?: string }
    | null;
  if (!res.ok) {
    throw new Error(data?.error ?? `Detection failed (${res.status})`);
  }
  return data?.found ?? [];
}
