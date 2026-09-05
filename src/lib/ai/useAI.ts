"use client";

import { useCallback, useRef, useState } from "react";
import {
  beginAiSession,
  appendAiText,
  finalizeAiText,
  endAiSession,
} from "@/components/editor/CodeEditor";
import { streamChatCompletion } from "./stream";
import { splitPartial, extractPythonBlock } from "./codeblock";
import type { AISettings } from "./settings";
import type { ChatMessage } from "./types";

export interface ChatEntry {
  role: "user" | "assistant";
  content: string;
}

/** Turn raw provider errors into actionable hints. */
function hintModelErrors(msg: string): string {
  if (/model_not_found|does not exist or you do not have access/i.test(msg)) {
    return (
      `${msg}\n\n` +
      `→ Fix: open Settings and click "load live model list" to pick a model ` +
      `your key can actually use (free Groq keys: openai/gpt-oss-120b or gpt-oss-20b; ` +
      `llama-3.3-70b-versatile now requires an enterprise plan).`
    );
  }
  if (/invalid api key|unauthorized|401/i.test(msg)) {
    return `${msg}\n\n→ Fix: check the API key in Settings (it is stored only in your browser).`;
  }
  if (/rate limit|429/i.test(msg)) {
    return `${msg}\n\n→ Fix: you hit the provider's rate limit — wait a moment and retry.`;
  }
  if (/no local runtime|ECONNREFUSED|fetch failed|load failed/i.test(msg)) {
    return (
      `${msg}\n\n` +
      `→ Fix: start your local runtime (e.g. \`ollama serve\`) and re-run detection ` +
      `in Settings → Local.`
    );
  }
  return msg;
}

export interface UseAIResult {
  entries: ChatEntry[];
  streaming: boolean;
  error: string | null;
  send: (prompt: string, settings: AISettings, codeContext: string) => Promise<void>;
  stop: () => void;
  insertLastCode: () => void;
  clear: () => void;
}

export function useAI(): UseAIResult {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastCodeRef = useRef<string | null>(null);

  const send = useCallback(
    async (prompt: string, settings: AISettings, codeContext: string) => {
      if (!prompt.trim() || streaming) return;
      setError(null);
      const userEntry: ChatEntry = { role: "user", content: prompt };
      const history: ChatMessage[] = [
        { role: "system", content: settings.systemPrompt },
        ...entries.map<ChatMessage>((e) => ({ role: e.role, content: e.content })),
        {
          role: "user",
          content: codeContext.trim()
            ? `${prompt}\n\nCurrent editor content:\n\`\`\`python\n${codeContext}\n\`\`\``
            : prompt,
        },
      ];
      setEntries((prev) => [...prev, userEntry, { role: "assistant", content: "" }]);
      setStreaming(true);
      if (settings.autoInsert) beginAiSession();

      const controller = new AbortController();
      abortRef.current = controller;
      let full = "";
      let inserted = 0;

      const finish = () => {
        setStreaming(false);
        abortRef.current = null;
      };

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: settings.provider,
            apiKey: settings.apiKey,
            model: settings.model,
            messages: history,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
            baseUrl: settings.provider === "local" ? settings.localHost : undefined,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? `Request failed (${res.status})`);
        }

        await streamChatCompletion(res, {
          onDelta: (delta) => {
            full += delta;
            setEntries((prev) => {
              const next = [...prev];
              next[next.length - 1] = { role: "assistant", content: full };
              return next;
            });
            if (settings.autoInsert) {
              const { code } = splitPartial(full);
              if (code && code.length > inserted) {
                appendAiText(code.slice(inserted));
                inserted = code.length;
              }
            }
          },
          onDone: (doneFull) => {
            const block = extractPythonBlock(doneFull);
            lastCodeRef.current = block;
            if (settings.autoInsert) {
              if (block) {
                finalizeAiText(block);
              } else {
                endAiSession();
              }
            }
            finish();
          },
          onError: (msg) => {
            setError(hintModelErrors(msg));
            endAiSession();
            finish();
          },
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Unexpected error");
        }
        endAiSession();
        finish();
      }
    },
    [entries, streaming],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const insertLastCode = useCallback(() => {
    const code = lastCodeRef.current;
    if (!code) return;
    beginAiSession();
    appendAiText(code);
    endAiSession();
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
    setError(null);
    lastCodeRef.current = null;
  }, []);

  return { entries, streaming, error, send, stop, insertLastCode, clear };
}
