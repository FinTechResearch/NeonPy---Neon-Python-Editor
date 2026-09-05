"use client";

import { useEffect, useRef } from "react";
import { Activity, Play, Settings, Sparkles, Trash2, Zap } from "lucide-react";
import { gsap } from "gsap";
import { PROVIDERS } from "@/lib/ai/types";
import type { AISettings } from "@/lib/ai/settings";

interface Props {
  settings: AISettings;
  trailEnabled: boolean;
  onToggleTrail: () => void;
  onRun: () => void;
  onNewFile: () => void;
  onOpenSettings: () => void;
  running: boolean;
}

function BarButton({
  onClick,
  label,
  active,
  danger,
  children,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
        active
          ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-fuchsia-200 shadow-[0_0_16px_rgba(232,121,249,0.25)]"
          : danger
            ? "border-red-400/40 text-red-300 hover:bg-red-500/10"
            : "border-line text-muted hover:border-cyan-400/40 hover:text-cyan-200"
      }`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default function TopBar({
  settings,
  trailEnabled,
  onToggleTrail,
  onRun,
  onNewFile,
  onOpenSettings,
  running,
}: Props) {
  const provider = PROVIDERS[settings.provider];

  // GSAP intro punch for the logo when the bar mounts
  const logoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!logoRef.current) return;
    gsap.fromTo(
      logoRef.current,
      { scale: 0.6, opacity: 0, rotate: -12 },
      { scale: 1, opacity: 1, rotate: 0, duration: 0.7, ease: "elastic.out(1, 0.5)" },
    );
  }, []);

  return (
    <header className="relative z-20 flex h-12 shrink-0 items-center justify-between border-b border-line/70 bg-panel/70 px-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div ref={logoRef} className="flex items-center gap-2">
          <Zap size={18} className="flicker text-cyan-300 neon-text" />
          <span className="text-sm font-bold tracking-wide">
            Neon<span className="text-fuchsia-400">Py</span>
          </span>
        </div>
        <span className="hidden text-[10px] text-muted md:inline">
          python editor with light-trails · main.py
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <BarButton onClick={onRun} label={running ? "Running…" : "Run"}>
          <Play size={12} className={running ? "animate-pulse text-lime-300" : "text-lime-300"} />
        </BarButton>
        <BarButton
          onClick={onToggleTrail}
          label={trailEnabled ? "Trails: ON" : "Trails: OFF"}
          active={trailEnabled}
        >
          <Sparkles size={12} />
        </BarButton>
        <BarButton onClick={onNewFile} label="New" danger>
          <Trash2 size={12} />
        </BarButton>
        <div
          className="ml-1 hidden items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11px] text-muted lg:flex"
          title={`Model: ${settings.model}`}
        >
          <Activity size={12} className="text-cyan-400" />
          {provider.label}
          <span className="max-w-[180px] truncate text-cyan-300/80">{settings.model}</span>
          {!settings.apiKey && settings.provider !== "local" && (
            <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[9px] text-amber-300">
              no key
            </span>
          )}
        </div>
        <BarButton
          onClick={onOpenSettings}
          label="AI"
          active={!!settings.apiKey || settings.provider === "local"}
        >
          <Settings size={12} />
        </BarButton>
      </div>
    </header>
  );
}
