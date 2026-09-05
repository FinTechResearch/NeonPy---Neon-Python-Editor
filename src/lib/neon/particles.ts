/**
 * NeonEngine — a self-contained 2D canvas particle engine that renders the
 * glowing "ghost glyph" trails left behind every written character.
 *
 * Pure canvas, zero React re-renders: all state lives here and the canvas is
 * driven by a single requestAnimationFrame loop.
 */
import { onGlyph, type GlyphEvent } from "./bus";

export type { GlyphEvent } from "./bus";

type Disposable = { destroy: () => void };

interface GhostGlyph {
  ch: string;
  x: number;
  y: number;
  hue: number;
  born: number;
  life: number;
  size: number;
  vy: number;
  vx: number;
  rot: number;
  vr: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hue: number;
  born: number;
  life: number;
  size: number;
}

const GHOST_LIFE = 1500; // ms a ghost glyph stays visible
const SPARK_LIFE = 700; // ms sparks stay visible
const MAX_GLYPHS = 900;
const MAX_SPARKS = 2600;

function makeGhost(ev: GlyphEvent, hue: number): GhostGlyph[] {
  const chars = [...ev.text];
  const out: GhostGlyph[] = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (!/\S/.test(ch)) continue;
    out.push({
      ch,
      x: ev.x + i * ev.fontSize * 0.602, // JetBrains Mono advance ~ 0.602em
      y: ev.y,
      hue: (hue + i * 9 + 360) % 360,
      born: performance.now(),
      life: GHOST_LIFE * (0.85 + Math.random() * 0.5),
      size: ev.fontSize,
      vy: -6 - Math.random() * 12,
      vx: (Math.random() - 0.5) * 8,
      rot: 0,
      vr: (Math.random() - 0.5) * 0.0009,
    });
  }
  return out;
}

function makeSparks(ev: GlyphEvent, hue: number, count: number): Spark[] {
  const out: Spark[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 12 + Math.random() * 70;
    out.push({
      x: ev.x + (Math.random() - 0.5) * ev.fontSize * 0.6,
      y: ev.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 14,
      hue: (hue + Math.random() * 50 - 25 + 360) % 360,
      born: performance.now(),
      life: SPARK_LIFE * (0.6 + Math.random() * 0.8),
      size: 1 + Math.random() * 2.2,
    });
  }
  return out;
}

export function createNeonEngine(canvas: HTMLCanvasElement): Disposable {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return { destroy: () => undefined };

  const ghosts: GhostGlyph[] = [];
  const sparks: Spark[] = [];
  let raf = 0;
  let disposed = false;
  let last = performance.now();

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0,0, dpr, 0, 0);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const handleGlyph = (ev: GlyphEvent) => {
    if (ev.text.length > 400) return; // ignore huge pastes
    const baseHue =
      ev.source === "ai" ? 190 + Math.random() * 60 : 150 + Math.random() * 200;
    const newGhosts = makeGhost(ev, baseHue);
    for (const g of newGhosts) {
      ghosts.push(g);
      const n = ev.source === "ai" ? 6 : 4;
      for (const sp of makeSparks({ ...ev, x: g.x }, g.hue, n)) sparks.push(sp);
    }
    while (ghosts.length > MAX_GLYPHS) ghosts.shift();
    while (sparks.length > MAX_SPARKS) sparks.shift();
  };

  const unsub = onGlyph(handleGlyph);

  const frame = (now: number) => {
    if (disposed) return;
    const dt = Math.min(48, now - last);
    last = now;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.globalCompositeOperation = "lighter";

    // ---- sparks ----
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      const age = now - s.born;
      if (age > s.life) {
        sparks.splice(i, 1);
        continue;
      }
      const t = age / s.life;
      s.x += (s.vx * dt) / 1000;
      s.y += (s.vy * dt) / 1000;
      s.vy += (90 * dt) / 1000; // gravity
      const alpha = (1 - t) * 0.9;
      ctx.fillStyle = `hsla(${s.hue}, 100%, 65%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, Math.max(0.2, s.size * (1 - t * 0.6)), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = `hsla(${s.hue}, 100%, 60%, ${alpha})`;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // ---- ghost glyphs ----
    for (let i = ghosts.length - 1; i >= 0; i--) {
      const g = ghosts[i];
      const age = now - g.born;
      if (age > g.life) {
        ghosts.splice(i, 1);
        continue;
      }
      const t = age / g.life;
      g.x += (g.vx * dt) / 1000;
      g.y += (g.vy * dt) / 1000;
      g.vy += (6 * dt) / 1000;
      g.rot += g.vr * dt;
      const alpha = t < 0.12 ? t / 0.12 : Math.pow(1 - (t - 0.12) / 0.88, 1.6);
      const scale = 1 + t * 0.5;

      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.rot);
      ctx.scale(scale, scale);
      ctx.font = `700 ${g.size}px 'JetBrains Mono', ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `hsla(${g.hue}, 100%, 72%, ${alpha * 0.85})`;
      ctx.shadowColor = `hsla(${g.hue}, 100%, 62%, ${alpha})`;
      ctx.shadowBlur = 14;
      ctx.fillText(g.ch, 0, 0);
      ctx.shadowBlur = 0;
      ctx.fillStyle = `hsla(${g.hue}, 100%, 88%, ${alpha * 0.9})`; // bright core
      ctx.fillText(g.ch, 0, 0);
      ctx.restore();
    }

    ctx.globalCompositeOperation = "source-over";
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      unsub();
      ghosts.length = 0;
      sparks.length = 0;
    },
  };
}
