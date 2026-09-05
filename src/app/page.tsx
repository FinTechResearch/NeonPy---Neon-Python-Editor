"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Panel, Group, Separator } from "react-resizable-panels";
import CodeEditor from "@/components/editor/CodeEditor";
import TopBar from "@/components/panels/TopBar";
import Console from "@/components/panels/Console";
import StatusBar from "@/components/panels/StatusBar";
import AboutDialog from "@/components/panels/AboutDialog";
import ChatPanel from "@/components/ai/ChatPanel";
import SettingsDialog from "@/components/ai/SettingsDialog";
import TrailCanvas from "@/components/neon/TrailCanvas";
import { useAI } from "@/lib/ai/useAI";
import {
  loadSettings,
  saveSettings,
  type AISettings,
} from "@/lib/ai/settings";
import {
  runPython,
  loadPyodideRuntime,
  type RunResult,
} from "@/lib/python/runner";
import type { ConsoleMessage } from "@/components/panels/Console";

const Background = dynamic(() => import("@/components/neon/Background"), {
  ssr: false,
});

const DEFAULT_CODE = `# ⚡ Welcome to NeonPy
# Type anything - every letter leaves a neon ghost trail.
# Ask the AI assistant (right panel) for code: it types with trails too!
# Press Run to execute real Python (Pyodide WASM) in the console below.

def fibonacci(n: int) -> list[int]:
    seq = [0, 1]
    while len(seq) < n:
        seq.append(seq[-1] + seq[-2])
    return seq[:n]


if __name__ == "__main__":
    print("Neon fib:", fibonacci(15))
`;

export default function Home() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [trailEnabled, setTrailEnabled] = useState(true);
  const [messages, setMessages] = useState<ConsoleMessage[]>([
    { kind: "info", text: "NeonPy console ready. Click Run to load the Python runtime." },
  ]);
  const [running, setRunning] = useState(false);
  const [stdinQueue, setStdinQueue] = useState<string[]>([]);
  const stdinRef = useRef<string[]>([]);
  const pyLoadStarted = useRef(false);

  const pushInput = useCallback((line: string) => {
    stdinRef.current.push(line);
    setStdinQueue([...stdinRef.current]);
  }, []);
  const clearInput = useCallback(() => {
    stdinRef.current = [];
    setStdinQueue([]);
  }, []);

  const ai = useAI();

  useEffect(() => {
    const id = requestAnimationFrame(() => setSettings(loadSettings()));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!settings) return;
    saveSettings(settings);
  }, [settings]);

  const handleRun = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setMessages((m) => [
      ...m,
      { kind: "info", text: "▶ Running main.py with Pyodide (CPython WASM)…" },
    ]);
    const result: RunResult = await runPython(code, {
      stdin: () => stdinRef.current.shift() ?? undefined,
    });
    setMessages((m) => [
      ...m,
      ...(result.output ? [{ kind: "stdout" as const, text: result.output }] : []),
      ...(result.error
        ? [{ kind: "error" as const, text: result.error }]
        : [{ kind: "ok" as const, text: `✔ Finished in ${result.durationMs} ms` }]),
    ]);
    clearInput();
    setRunning(false);
  }, [code, running, clearInput]);

  // Warm the runtime in the background after first paint (no blocking)
  useEffect(() => {
    if (pyLoadStarted.current) return;
    pyLoadStarted.current = true;
    const id = window.setTimeout(() => {
      loadPyodideRuntime().catch(() => undefined);
    }, 1200);
    return () => window.clearTimeout(id);
  }, []);

  const handleNew = useCallback(() => {
    setCode("");
  }, []);

  if (!settings) {
    return (
      <main className="flex h-screen items-center justify-center">
        <div className="flicker text-sm text-cyan-300">Booting NeonPy…</div>
      </main>
    );
  }

  return (
    <main className="relative flex h-screen flex-col overflow-hidden">
      <Background />

      <TopBar
        settings={settings}
        trailEnabled={trailEnabled}
        onToggleTrail={() => setTrailEnabled((v) => !v)}
        onRun={handleRun}
        onNewFile={handleNew}
        onOpenSettings={() => setSettingsOpen(true)}
        running={running}
      />

      <div className="relative z-10 min-h-0 flex-1">
        <Group orientation="horizontal">
          <Panel defaultSize={62} minSize={30}>
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-2 border-b border-line/50 bg-panel/40 px-3 py-1.5 text-[11px] text-muted backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                main.py
                <span className="ml-auto">Python 3.12 · UTF-8 · LF</span>
              </div>
              <div className="min-h-0 flex-1">
                <CodeEditor value={code} onChange={setCode} trailEnabled={trailEnabled} />
              </div>
            </div>
          </Panel>

          <Separator className="w-1 bg-line/40 transition hover:bg-cyan-400/40" />

          <Panel defaultSize={38} minSize={22}>
            <Group orientation="vertical">
              <Panel defaultSize={60} minSize={25}>
                <div className="glass h-full border-l border-line/50">
                  <ChatPanel
                    ai={ai}
                    settings={settings}
                    onOpenSettings={() => setSettingsOpen(true)}
                    codeContext={code}
                  />
                </div>
              </Panel>
              <Separator className="h-1 bg-line/40 transition hover:bg-lime-400/40" />
              <Panel defaultSize={40} minSize={15}>
                <div className="glass h-full border-l border-t border-line/50">
                  <Console
                    messages={messages}
                    stdinQueue={stdinQueue}
                    onAddStdin={pushInput}
                    onClearStdin={clearInput}
                    onClear={() => setMessages([])}
                  />
                </div>
              </Panel>
            </Group>
          </Panel>
        </Group>
      </div>

      <TrailCanvas />
      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={(s) => setSettings(s)}
      />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />

      <StatusBar
        lines={code.split("\n").length}
        chars={code.length}
        trailEnabled={trailEnabled}
        onOpenAbout={() => setAboutOpen(true)}
      />
    </main>
  );
}
