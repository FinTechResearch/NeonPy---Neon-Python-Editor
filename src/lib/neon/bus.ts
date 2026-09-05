/** Event describing one written character (for neon trails). */
export interface GlyphEvent {
  /** Text content of the written character. */
  text: string;
  /** Document position (1-based line, 0-based column). */
  line: number;
  col: number;
  /** Pixel coordinates of the glyph, relative to the trail canvas. */
  x: number;
  y: number;
  /** Line height / font size for glyph sizing. */
  lineHeight: number;
  fontSize: number;
  /** Where the glyph came from (affects trail colour bias). */
  source: "user" | "ai";
}

type Listener = (ev: GlyphEvent) => void;

const listeners = new Set<Listener>();

/** Subscribe to glyph trail events. Returns an unsubscribe function. */
export function onGlyph(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Emit a glyph trail event (one per written character). */
export function emitGlyph(ev: GlyphEvent): void {
  for (const fn of listeners) fn(ev);
}

/**
 * Bridge so overlays can access the live CodeMirror view without prop drilling.
 */
export const editorBridge: {
  view: import("@codemirror/view").EditorView | null;
} = { view: null };

/**
 * The fixed trail canvas registers itself here so glyph coordinates can be
 * computed relative to the canvas (which covers the whole viewport).
 */
export const trailCanvasBridge: { canvas: HTMLCanvasElement | null } = {
  canvas: null,
};
