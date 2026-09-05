import { z } from "zod";
import { PROVIDERS, type ProviderId } from "./types";

export const settingsSchema = z
  .object({
    provider: z.enum(["groq", "nvidia", "local"]),
    apiKey: z.string(),
    model: z.string().min(1, "Model is required"),
    localHost: z.string(),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().int().min(64).max(8192),
    systemPrompt: z.string().min(1),
    autoInsert: z.boolean(),
  })
  .superRefine((s, ctx) => {
    if (s.provider !== "local" && s.apiKey.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["apiKey"],
        message: "API key is required",
      });
    }
  });

export type AISettings = z.infer<typeof settingsSchema>;

export const DEFAULT_SYSTEM_PROMPT =
  "You are NeonPy, a concise Python coding assistant embedded in a code editor. " +
  "Always answer with a short explanation followed by complete, runnable Python code " +
  "in a single ```python fenced block. Prefer standard library only. No placeholders.";

export function defaultSettings(): AISettings {
  return {
    provider: "groq",
    apiKey: "",
    model: PROVIDERS.groq.defaultModel,
    localHost: "",
    temperature: 0.4,
    maxTokens: 2048,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    autoInsert: true,
  };
}

const KEY = "neonpy-settings-v2";

export function loadSettings(): AISettings {
  if (typeof window === "undefined") return defaultSettings();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultSettings();
    // migrate pre-localHost payloads before validating
    const merged = { localHost: "", ...JSON.parse(raw) };
    const parsed = settingsSchema.safeParse(merged);
    if (parsed.success) return parsed.data;
  } catch {
    /* corrupted storage -> defaults */
  }
  return defaultSettings();
}

export function saveSettings(s: AISettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
}

export function switchModelFor(s: AISettings, provider: ProviderId): AISettings {
  if (s.provider === provider) return s;
  return {
    ...s,
    provider,
    model: provider === "local" ? s.model : PROVIDERS[provider].defaultModel,
  };
}
