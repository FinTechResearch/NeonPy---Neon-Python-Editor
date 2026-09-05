"use client";

import { X, Heart, Coffee, Zap, Cpu, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const SPONSORS_URL = "https://github.com/sponsors/FinTechResearch";
export const KOFI_URL = "https://ko-fi.com/adityamadhok";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TECH = [
  "Next.js 16",
  "CodeMirror 6",
  "Pyodide (CPython WASM)",
  "Three.js / R3F",
  "Groq · NVIDIA · Local AI",
];

export default function AboutDialog({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="relative w-[440px] max-w-[92vw] overflow-hidden rounded-2xl border border-cyan-400/30 bg-panel p-6 shadow-[0_0_80px_rgba(34,211,238,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* futuristic scanline + corner glow */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(34,211,238,0.04)_50%)] bg-[length:100%_3px]" />
        <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-cyan-400/15 blur-3xl" />

        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted transition hover:text-foreground"
          aria-label="Close about"
        >
          <X size={16} />
        </button>

        <div className="relative">
          <div className="mb-1 flex items-center gap-2">
            <Zap size={22} className="flicker text-cyan-300 neon-text" />
            <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-lime-300 bg-clip-text text-2xl font-bold tracking-wide text-transparent">
              NeonPy
            </span>
            <span className="rounded-full border border-cyan-400/40 px-2 py-0.5 text-[9px] uppercase tracking-widest text-cyan-300/80">
              v1.0
            </span>
          </div>
          <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-muted">
            Python editor with neon light-trails
          </p>

          <div className="mb-4 space-y-1.5 rounded-xl border border-line bg-panel2/60 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted">Author</span>
              <span className="font-semibold text-cyan-200">Aditya Madhok</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Built</span>
              <span className="text-fuchsia-300">September 2026</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">License</span>
              <span className="text-lime-300">© 2026 Aditya Madhok</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted">
              <Cpu size={11} /> Powered by
            </div>
            <div className="flex flex-wrap gap-1">
              {TECH.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] text-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={SPONSORS_URL}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-center gap-2 rounded-lg border border-pink-400/50 bg-pink-500/10 py-2.5 text-xs font-semibold text-pink-300 transition hover:bg-pink-500/20 hover:shadow-[0_0_24px_rgba(244,114,182,0.35)]"
            >
              <Heart size={14} className="transition group-hover:scale-110 group-hover:fill-pink-400" />
              GitHub Sponsors
            </a>
            <a
              href={KOFI_URL}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-center gap-2 rounded-lg border border-lime-400/50 bg-lime-500/10 py-2.5 text-xs font-semibold text-lime-300 transition hover:bg-lime-500/20 hover:shadow-[0_0_24px_rgba(163,230,53,0.35)]"
            >
              <Coffee size={14} className="transition group-hover:scale-110 group-hover:-rotate-12" />
              Ko-fi
            </a>
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[10px] text-muted">
            <Sparkles size={10} className="text-cyan-400/70" />
            © 2026 Aditya Madhok · All rights reserved · Made with neon
          </p>
        </div>
      </motion.div>
    </div>
  );
}
