/**
 * Pyodide (CPython compiled to WebAssembly) loader + runner.
 * Runs real Python in the browser — identical behaviour on Linux & Windows.
 */

export interface PyodideAPI {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (opts: { batched: (s: string) => void }) => void;
  setStderr: (opts: { batched: (s: string) => void }) => void;
  setStdin: (opts: { stdin: () => string | undefined }) => void;
  globals: Map<string, unknown>;
}

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideAPI>;
  }
}

const PYODIDE_VERSION = "0.27.2";
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodidePromise: Promise<PyodideAPI> | null = null;

export function isPyodideLoading(): boolean {
  return pyodidePromise !== null;
}

export function loadPyodideRuntime(): Promise<PyodideAPI> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Pyodide is browser-only"));
  }
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    if (!window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `${INDEX_URL}pyodide.js`;
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("Failed to download the Python runtime (Pyodide)"));
        document.head.appendChild(script);
      });
    }
    if (!window.loadPyodide) throw new Error("Pyodide loader unavailable");
    return await window.loadPyodide({ indexURL: INDEX_URL });
  })();
  return pyodidePromise;
}

export interface RunResult {
  ok: boolean;
  output: string;
  error: string | null;
  durationMs: number;
}

/**
 * Returns the string for a Python input() call, or undefined to signal EOF.
 * A raw string is returned as-is (input() strips the trailing newline).
 */
export type StdinProvider = () => string | undefined;

export async function runPython(
  code: string,
  options?: { stdin?: StdinProvider },
): Promise<RunResult> {
  const started = performance.now();
  const out: string[] = [];
  try {
    const py = await loadPyodideRuntime();
    // Pyodide's setStdout/setStderr take an options object; "batched" receives
    // each complete line (newline stripped) or each flushed partial line.
    py.setStdout({ batched: (s: string) => out.push(s + "\n") });
    py.setStderr({ batched: (s: string) => out.push(s + "\n") });
    // Replace the default browser stdin (native prompt(), which breaks with
    // "Illegal invocation") with our own non-blocking queue-backed reader.
    let inputWarned = false;
    py.setStdin({
      stdin: () => {
        const v = options?.stdin?.();
        if (v === undefined && !inputWarned) {
          inputWarned = true;
          out.push("[input()] No more queued input — use the console input box.\n");
        }
        return v ?? "";
      },
    });

    const last = (await py.runPythonAsync(code)) as unknown;

    // REPL-style convenience: surface the last expression's value when the
    // program printed nothing (None/undefined is converted to null by Pyodide).
    if (out.length === 0 && last !== null && last !== undefined) {
      const rendered =
        typeof last === "string" ? last : repr(last);
      out.push(rendered + "\n");
    }

    return {
      ok: true,
      output: out.join("") || "(no output)",
      error: null,
      durationMs: Math.round(performance.now() - started),
    };
  } catch (err) {
    return {
      ok: false,
      output: out.join(""),
      error: err instanceof Error ? err.message : String(err),
      durationMs: Math.round(performance.now() - started),
    };
  }
}

/** Best-effort readable rendering for values returned from Python. */
function repr(value: unknown): string {
  if (typeof value === "object" && value !== null) {
    const pyProxy = value as { toString?: () => string; destroy?: () => void };
    try {
      const s = pyProxy.toString?.() ?? "";
      // PyProxy.toString() calls Python repr(); plain objects fall back to JSON
      return s || JSON.stringify(value);
    } finally {
      pyProxy.destroy?.();
    }
  }
  return String(value);
}
