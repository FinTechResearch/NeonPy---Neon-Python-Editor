"use client";

import { useState } from "react";
import { Eraser, CornerDownLeft, Send } from "lucide-react";

export interface ConsoleMessage {
  kind: "info" | "stdout" | "error" | "ok";
  text: string;
}

interface Props {
  messages: ConsoleMessage[];
  stdinQueue: string[];
  onAddStdin: (line: string) => void;
  onClearStdin: () => void;
  onClear: () => void;
}

const COLORS: Record<ConsoleMessage["kind"], string> = {
  info: "text-muted",
  stdout: "text-cyan-100",
  error: "text-red-300",
  ok: "text-lime-300",
};

export default function Console({
  messages,
  stdinQueue,
  onAddStdin,
  onClearStdin,
  onClear,
}: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_8px_#a3e635]" />
          <span className="text-xs font-semibold tracking-wide text-muted">
            PYTHON CONSOLE (Pyodide WASM)
          </span>
        </div>
        <button
          onClick={onClear}
          className="rounded-md border border-line p-1 text-muted transition hover:text-foreground"
          title="Clear console"
        >
          <Eraser size={13} />
        </button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-3 font-mono text-[12px] leading-relaxed">
        {messages.length === 0 && (
          <div className="text-muted">Run your code to see output here…</div>
        )}
        {messages.map((m, i) => (
          <pre
            key={i}
            className={`whitespace-pre-wrap ${COLORS[m.kind]}`}
          >
            {m.text}
          </pre>
        ))}
      </div>

      <ConsoleInput
        stdinQueue={stdinQueue}
        onAddStdin={onAddStdin}
        onClearStdin={onClearStdin}
      />
    </div>
  );
}

function ConsoleInput({
  stdinQueue,
  onAddStdin,
  onClearStdin,
}: {
  stdinQueue: string[];
  onAddStdin: (line: string) => void;
  onClearStdin: () => void;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    const v = value.trim();
    if (!v) return;
    onAddStdin(v);
    setValue("");
  };

  return (
    <div className="border-t border-line/50 px-3 py-2">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-[9px] uppercase tracking-widest text-fuchsia-300">
          Program input
        </span>
        {stdinQueue.length > 0 && (
          <button
            onClick={onClearStdin}
            className="ml-auto text-[9px] text-muted transition hover:text-foreground"
            title="Clear queued inputs"
          >
            clear ({stdinQueue.length})
          </button>
        )}
      </div>

      {stdinQueue.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {stdinQueue.map((line, i) => (
            <span
              key={i}
              className="rounded-full border border-line bg-panel2 px-2 py-0.5 font-mono text-[10px] text-cyan-200"
            >
              ⏎ {line}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="type a line for input()… Enter to queue, then Run"
            className="w-full rounded-lg border border-line bg-panel2 py-1.5 pl-2 pr-7 font-mono text-[11px] focus:border-fuchsia-400/50 focus:outline-none"
          />
          <CornerDownLeft
            size={11}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted"
          />
        </div>
        <button
          onClick={submit}
          className="rounded-lg border border-fuchsia-400/40 bg-fuchsia-500/10 px-2.5 py-1.5 text-fuchsia-300 transition hover:bg-fuchsia-500/20 disabled:opacity-40"
          disabled={!value.trim()}
          title="Queue this line"
        >
          <Send size={12} />
        </button>
      </div>
      <p className="mt-1 text-[9px] text-muted">
        Enter each line <b>input()</b> should read before pressing Run.
      </p>
    </div>
  );
}
