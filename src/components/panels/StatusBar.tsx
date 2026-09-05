"use client";

import { Heart, Coffee, Info, Sparkles } from "lucide-react";
import { SPONSORS_URL, KOFI_URL } from "./AboutDialog";

interface Props {
  lines: number;
  chars: number;
  trailEnabled: boolean;
  onOpenAbout: () => void;
}

export default function StatusBar({ lines, chars, trailEnabled, onOpenAbout }: Props) {
  return (
    <footer className="relative z-10 flex h-7 shrink-0 items-center justify-between border-t border-line/60 bg-panel/70 px-3 text-[10px] text-muted backdrop-blur-md">
      <span className="flex items-center gap-2 font-mono">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-400 shadow-[0_0_6px_#a3e635]" />
        {lines} lines · {chars} chars
      </span>

      <span className="flex items-center gap-1.5">
        <a
          href={SPONSORS_URL}
          target="_blank"
          rel="noreferrer"
          title="Support on GitHub Sponsors"
          className="flex items-center gap-1 rounded-full border border-pink-400/35 bg-pink-500/10 px-2 py-0.5 text-pink-300 transition hover:border-pink-400/70 hover:shadow-[0_0_14px_rgba(244,114,182,0.35)]"
        >
          <Heart size={10} className="fill-pink-400/60" /> Sponsor
        </a>
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noreferrer"
          title="Buy me a coffee on Ko-fi"
          className="flex items-center gap-1 rounded-full border border-lime-400/35 bg-lime-500/10 px-2 py-0.5 text-lime-300 transition hover:border-lime-400/70 hover:shadow-[0_0_14px_rgba(163,230,53,0.35)]"
        >
          <Coffee size={10} /> Ko-fi
        </a>
        <button
          onClick={onOpenAbout}
          title="About NeonPy"
          className="flex items-center gap-1 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-2 py-0.5 text-cyan-300 transition hover:border-cyan-400/70 hover:shadow-[0_0_14px_rgba(34,211,238,0.35)]"
        >
          <Info size={10} /> About
        </button>
        <span className="mx-1 hidden text-line sm:inline">|</span>
        <span className="hidden items-center gap-1 sm:flex">
          <Sparkles size={10} className={trailEnabled ? "text-cyan-300" : "text-muted"} />
          {trailEnabled ? "trails on" : "trails off"}
        </span>
        <span className="hidden md:inline">Linux · Windows portable</span>
      </span>
    </footer>
  );
}
