"use client";

import { useEffect, useRef } from "react";
import { createNeonEngine } from "@/lib/neon/particles";
import { trailCanvasBridge } from "@/lib/neon/bus";

/**
 * Full-viewport canvas overlay that renders neon ghost-glyph trails.
 * Sits above the editor with `pointer-events: none` so it never blocks input.
 */
export default function TrailCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    trailCanvasBridge.canvas = canvas;
    const engine = createNeonEngine(canvas);
    return () => {
      engine.destroy();
      trailCanvasBridge.canvas = null;
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40 h-full w-full"
    />
  );
}
