import type { ProviderId } from "./types";

/** Fetch the live model catalog for a provider using the user's key. */
export async function fetchProviderModels(
  provider: ProviderId,
  apiKey: string,
): Promise<string[]> {
  const res = await fetch("/api/models", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, apiKey }),
  });
  const data = (await res.json().catch(() => null)) as
    | { models?: string[]; error?: string }
    | null;
  if (!res.ok) {
    throw new Error(data?.error ?? `Failed to list models (${res.status})`);
  }
  return data?.models ?? [];
}
