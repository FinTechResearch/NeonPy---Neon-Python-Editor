"use client";

import { useEffect, useRef } from "react";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
} from "@codemirror/view";
import { EditorState, Compartment, Annotation, type Extension } from "@codemirror/state";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  indentUnit,
  bracketMatching,
  foldGutter,
  indentOnInput,
} from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { lintGutter } from "@codemirror/lint";
import { oneDark } from "@codemirror/theme-one-dark";
import { python } from "@codemirror/lang-python";
import { emitGlyph, editorBridge, trailCanvasBridge } from "@/lib/neon/bus";

/** Annotation marking transactions that originate from AI streaming. */
export const aiSourceAnnotation = Annotation.define<boolean>();

/**
 * Tracks the character range produced by the current AI stream so it can be
 * replaced cleanly when the final code block is known.
 */
let aiInsertRange: { from: number; to: number } | null = null;

/** Begin a new AI insertion session (starts at end of document). */
export function beginAiSession() {
  const view = editorBridge.view;
  if (!view) return;
  const end = view.state.doc.length;
  if (end > 0) {
    const last = view.state.doc.line(end > 0 ? view.state.doc.lines : 1);
    // Start AI output on a fresh line
    if (last.text.trim() !== "") {
      view.dispatch({
        changes: { from: end, insert: "\n" },
        annotations: aiSourceAnnotation.of(true),
      });
    }
  }
  const e2 = view.state.doc.length;
  aiInsertRange = { from: e2, to: e2 };
}

/** Append text at the AI insertion point, flagged as AI-sourced. */
export function appendAiText(text: string) {
  const view = editorBridge.view;
  if (!view) return;
  const range = aiInsertRange ?? {
    from: view.state.doc.length,
    to: view.state.doc.length,
  };
  view.dispatch({
    changes: { from: range.to, insert: text },
    selection: { anchor: range.to + text.length },
    annotations: aiSourceAnnotation.of(true),
    scrollIntoView: true,
  });
  aiInsertRange = { from: range.from, to: range.to + text.length };
}

/** Replace everything the AI inserted this session with final code. */
export function finalizeAiText(finalCode: string) {
  const view = editorBridge.view;
  if (!view) return;
  const doc = view.state.doc;
  if (aiInsertRange) {
    const from = Math.min(aiInsertRange.from, doc.length);
    const to = Math.min(aiInsertRange.to, doc.length);
    view.dispatch({
      changes: { from, to, insert: finalCode },
      annotations: aiSourceAnnotation.of(true),
    });
  } else {
    const end = doc.length;
    view.dispatch({
      changes: { from: end, insert: finalCode },
      annotations: aiSourceAnnotation.of(true),
    });
  }
  aiInsertRange = null;
}

/** Cancel the AI session without changing content. */
export function endAiSession() {
  aiInsertRange = null;
}

const CHAR_W = 0.602; // JetBrains Mono advance width in em

interface Props {
  value: string;
  onChange: (v: string) => void;
  trailEnabled: boolean;
}

export default function CodeEditor({ value, onChange, trailEnabled }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const trailComp = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  const trailEnabledRef = useRef(trailEnabled);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    trailEnabledRef.current = trailEnabled;
  }, [trailEnabled]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const emitTrails = (): Extension =>
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString());
        }
        if (!trailEnabledRef.current) return;
        if (!update.docChanged) return;
        const view = update.view;
        const contentEl = view.contentDOM;
        const contentRect = contentEl.getBoundingClientRect();
        const overlayEl = trailCanvasBridge.canvas ?? host;
        const overlayRect = overlayEl.getBoundingClientRect();
        const lineH = view.defaultLineHeight;
        const fontSize = parseFloat(
          getComputedStyle(contentEl).fontSize || "14",
        );
        for (const tr of update.transactions) {
          if (!tr.docChanged) continue;
          tr.changes.iterChangedRanges((fromA, toA, fromB, toB) => {
            void fromA;
            void toA;
            const text = tr.state.doc.sliceString(fromB, toB);
            if (!text || text.length > 400) return;
            const posLine = tr.state.doc.lineAt(fromB);
            const col = fromB - posLine.from;
            const baseX = contentRect.left - overlayRect.left + 8 + col * fontSize * CHAR_W;
            const baseY =
              contentRect.top - overlayRect.top + (posLine.number - 1) * lineH + lineH / 2;
            const source: "user" | "ai" = tr.annotation(aiSourceAnnotation)
              ? "ai"
              : "user";
            const chars = [...text];
            for (let i = 0; i < chars.length; i++) {
              emitGlyph({
                text: chars[i],
                line: posLine.number,
                col: col + i,
                x: baseX + i * fontSize * CHAR_W,
                y: baseY,
                lineHeight: lineH,
                fontSize,
                source,
              });
            }
          });
        }
      });


    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        indentUnit.of("    "),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        lintGutter(),
        python(),
        oneDark,
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          indentWithTab,
        ]),
        trailComp.current.of(emitTrails()),
        EditorView.theme({
          "&": { height: "100%", fontSize: "14px", background: "transparent" },
          ".cm-scroller": {
            fontFamily: "var(--font-jet), JetBrains Mono, monospace",
            background: "transparent",
          },
          ".cm-gutters": {
            background: "rgba(8, 11, 26, 0.55)",
            borderRight: "1px solid rgba(60, 70, 140, 0.35)",
          },
          ".cm-activeLine": { background: "rgba(56, 70, 150, 0.12)" },
          ".cm-activeLineGutter": { background: "rgba(56, 70, 150, 0.18)" },
          ".cm-content": { caretColor: "#22d3ee" },
          "&.cm-focused": { outline: "two", outlineColor: "rgba(34,211,238,0.4)" },
          ".cm-cursor": { borderLeftColor: "#22d3ee" },
        }),
        EditorView.editorAttributes.of({ class: "cm-neon" }),
      ],
    });

    const view = new EditorView({ state, parent: host });
    viewRef.current = view;
    editorBridge.view = view;
    view.focus();



    return () => {
      editorBridge.view = null;
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // External value sync (AI streaming / tab switching) — marked as AI source
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
        annotations: aiSourceAnnotation.of(true),
      });
    }
  }, [value]);

  return <div ref={hostRef} className="h-full w-full overflow-hidden" />;
}

/** Legacy helper kept for manual "insert code" actions. */
export function appendAiTextAtEnd(text: string) {
  const view = editorBridge.view;
  if (!view) return;
  const end = view.state.doc.length;
  view.dispatch({
    changes: { from: end, insert: text },
    selection: { anchor: end + text.length },
    annotations: aiSourceAnnotation.of(true),
    scrollIntoView: true,
  });
}
