"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Lenis from "lenis";
import { Send, Square, Trash2, Wand2 } from "lucide-react";
import type { UseAIResult, ChatEntry } from "@/lib/ai/useAI";
import type { AISettings } from "@/lib/ai/settings";
import { PROVIDERS } from "@/lib/ai/types";

interface Props {
  ai: UseAIResult;
  settings: AISettings;
  onOpenSettings: () => void;
  codeContext: string;
}

function Bubble({ entry }: { entry: ChatEntry }) {
  const isUser = entry.role === "user";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[92%] rounded-xl px-3 py-2 text-[12.5px] leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? "border border-cyan-400/30 bg-cyan-500/10 text-cyan-50"
            : "border border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-50"
        }`}
      >
        {entry.content || (entry.role === "assistant" ? "…" : "")}
      </div>
    </motion.div>
  );
}

const SUGGESTIONS = [
  "Fibonacci with memoization",
  "CSV column statistics",
  "Async web scraper skeleton",
];

export default function ChatPanel({ ai, settings, onOpenSettings, codeContext }: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const provider = PROVIDERS[settings.provider];

  // Smooth-scroll the chat log (lenis)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const lenis = new Lenis({ wrapper: el, content: el.firstElementChild as HTMLElement, duration: 0.9 });
    lenisRef.current = lenis;
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    lenisRef.current?.scrollTo(999999, { immediate: true });
  }, [ai.entries]);

  const submit = () => {
    if (!input.trim() || ai.streaming) return;
    void ai.send(input, settings, codeContext);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <Wand2 size={13} className="text-fuchsia-300 neon-text" />
          <span className="text-xs font-semibold tracking-wide text-muted">
            AI ASSISTANT — {provider.label.toUpperCase()}
          </span>
        </div>
        <button
          onClick={onOpenSettings}
          className="rounded-md border border-line px-2 py-1 text-[11px] text-muted transition hover:border-cyan-400/50 hover:text-cyan-300"
        >
          Settings
        </button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-2 p-3">
          {ai.entries.length === 0 && (
            <div className="mt-10 text-center text-xs text-muted">
              Ask for Python code — it will be typed into the editor with neon trails.
              <div className="mt-3 flex flex-col gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="rounded-lg border border-line/70 px-3 py-1.5 text-[11px] text-muted transition hover:border-fuchsia-400/50 hover:text-fuchsia-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <AnimatePresence initial={false}>
            {ai.entries.map((e, i) => (
              <Bubble key={i} entry={e} />
            ))}
          </AnimatePresence>
          {ai.error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
              {ai.error}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-line/60 p-2">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="Describe the Python code you need…"
            className="flex-1 resize-none rounded-lg border border-line bg-panel2/80 px-3 py-2 text-[12.5px] text-foreground placeholder:text-muted/60 focus:border-cyan-400/50 focus:outline-none"
          />
          <div className="flex flex-col gap-1">
            {ai.streaming ? (
              <button
                onClick={ai.stop}
                title="Stop"
                className="rounded-lg border border-red-400/50 p-2 text-red-300 transition hover:bg-red-500/10"
              >
                <Square size={14} />
              </button>
            ) : (
              <button
                onClick={submit}
                title="Send"
                className="rounded-lg border border-cyan-400/50 p-2 text-cyan-300 transition hover:bg-cyan-500/10"
              >
                <Send size={14} />
              </button>
            )}
            <button
              onClick={ai.clear}
              title="Clear chat"
              className="rounded-lg border border-line p-2 text-muted transition hover:text-foreground"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
