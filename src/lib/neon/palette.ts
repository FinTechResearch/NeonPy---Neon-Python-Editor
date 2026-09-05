/**
 * Neon palette helpers.
 * Hue is derived deterministically per character position so trails form a
 * smooth rainbow gradient flowing across the code (per letter).
 */

export function hueFor(line: number, col: number, ch: string): number {
  const code = ch.charCodeAt(0) || 42;
  const seed = line * 47 + col * 13 + code * 7;
  return ((seed % 360) + 360) % 360;
}

export const NEON_HUES = {
  cyan: 187,
  magenta: 305,
  lime: 95,
  violet: 265,
  amber: 40,
} as const;

/** Characters that should not produce any trail. */
export function isTrailable(ch: string): boolean {
  return /\S/.test(ch);
}
