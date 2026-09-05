# ⚡ NeonPy — Neon Python Editor

A browser-based **Python code editor** where every character you type — or the **AI**
types for you — leaves a **colorful neon light-trail per letter**: glowing ghost glyphs
drift upward, fade through the rainbow, and shed sparks across the editor.

Powered by **Next.js 16**, a custom canvas particle engine, **real in-browser Python**
(Pyodide/WASM), and bring-your-own **AI** from Groq, NVIDIA NIM, or a **local** model
on your own machine.

**Author:** Aditya Madhok · **Built:** September 2026 · **© 2026 Aditya Madhok**

> 💜 **Support the project** → [GitHub Sponsors](https://github.com/sponsors/FinTechResearch) · [Ko-fi](https://ko-fi.com/adityamadhok)

---

## ✨ Features

- **Neon letter trails** — a custom 2D particle engine renders a glowing ghost of every
  written character with additive blending, per-letter rainbow hue rotation, sparks,
  gravity, rotation and ease-out drift. **Everything** typed — by you *or* the AI —
  sparkles. Toggle with **Trails ON/OFF**.
- **AI code generation** — bring your own key for **Groq** (`gsk_…`), **NVIDIA NIM**
  (`nvapi-…`), or **run fully offline against a local model** (Ollama, LM Studio,
  llama.cpp, Jan, GPT4All, vLLM, KoboldCpp, …). Streaming chat writes Python into the
  editor *character-by-character*, so AI code leaves trails exactly like yours.
- **Local AI detection** — NeonPy auto-scans the well-known OpenAI-compatible ports,
  lists the runtimes it finds, and shows models you actually have installed — no key,
  no internet, 100% private. Custom LAN hosts are supported too.
- **Real Python execution** — Pyodide (CPython 3.12 → WebAssembly) runs your code
  entirely in the browser. Same behavior on Linux & Windows; nothing to install.
- **Program input support** — programs that call `input()` work: queue lines in the
  console's neon **Program input** box, then hit Run.
- **Pro editor** — CodeMirror 6: Python syntax highlighting, bracket matching/closing,
  code folding, search, history, multiple selections, active-line highlight.
- **Three.js ambience** — additive neon rings + starfield behind the UI (drei).
- **Motion** — framer-motion bubbles/dialog, GSAP logo intro, lenis smooth chat scroll.
- **Futuristic chrome** — resizable panels, glassmorphism, and a status bar with live
  stats and Sponsor / Ko-fi / About links.

## 🚀 Run it

### Linux / macOS
```bash
cd neonpy
./scripts/dev.sh        # development (http://localhost:3000)
# or
./scripts/start.sh      # production build + serve
```

### Windows
```bat
cd neonpy
scripts\dev.bat         & rem development
scripts\start.bat       & rem production
```

Manual (any OS): `npm install && npm run dev`

> Should run first on Linux and is fully portable to Windows — the app is browser-based, so
> encoding/line-endings behave identically.

## 🤖 AI setup

NeonPy supports **three** provider types:

### 1. Groq (cloud)
1. Click **AI** in the top bar → pick **Groq**.
2. Get a key at https://console.groq.com/keys.
3. Paste it, hit **"load live model list"** to see the models your key can actually use
   (free keys: `openai/gpt-oss-120b` or `openai/gpt-oss-20b`), choose one, **Save**.

### 2. NVIDIA NIM (cloud)
Same flow, with a key from https://build.nvidia.com/ — models like
`meta/llama-3.3-70b-instruct` are typically free tier.

### 3. Local (offline, no key)
1. Install any OpenAI-compatible runtime, e.g. [Ollama](https://ollama.com/download),
   LM Studio, llama.cpp, Jan, GPT4All, vLLM, KoboldCpp, or text-generation-webui.
2. Click **AI** → **Local** → detection runs automatically and lists your installed
   models as clickable chips (Ollama → `11434`, LM Studio → `1234`, …).
3. Pick a model, add a custom host if needed, **Save**. Fully offline.
4. Build, run, and debug — NeonPy types the code, runs it, and your `input()` prompts
   read from the console's **Program input** box.

API keys (for cloud) stay in your browser (localStorage) and are proxied server-side
per request — never exposed to the client bundle.

## 📥 Program input (for `input()`)

Because Python runs in the browser via Pyodide, the OS `stdin` isn't available. Type
each line a program should read into the console's **Program input** field (press Enter
between values — they stack as chips), then press **Run**:

```python
name = input("Your name: ")
print("Hello,", name)   # queue "Alice", then run
```

## 🧱 Project structure

```
src/
├── app/
│   ├── api/generate/route.ts    # Streaming AI proxy (Groq / NVIDIA / Local, OpenAI-style)
│   ├── api/models/route.ts      # Live model catalog (fetched with your key)
│   ├── api/local/route.ts       # ✦ Local runtime detection (Ollama, LM Studio, …) + SSRF guard
│   └── layout.tsx  page.tsx  globals.css
├── components/
│   ├── editor/CodeEditor.tsx       # CodeMirror 6 + trail emission + AI sessions
│   ├── neon/TrailCanvas.tsx        # Fixed overlay canvas (pointer-events: none)
│   ├── neon/Background.tsx         # Three.js neon rings + stars
│   ├── ai/ChatPanel.tsx            # Streaming chat (framer-motion + lenis)
│   ├── ai/SettingsDialog.tsx       # Provider/model/key + Local detection UI
│   └── panels/TopBar.tsx  Console.tsx  StatusBar.tsx  AboutDialog.tsx
└── lib/
    ├── neon/particles.ts       # ★ The neon engine: ghost glyphs + sparks
    ├── neon/bus.ts palette.ts  # Event bus + rainbow hue math
    ├── ai/types.ts settings.ts stream.ts codeblock.ts useAI.ts local.ts
    └── python/runner.ts        # Pyodide loader + runner (stdout/stderr/stdin)
```

## ⚙️ Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · CodeMirror 6 ·
framer-motion · gsap · lenis · three / @react-three/fiber / drei ·
lucide-react · clsx + tailwind-merge + class-variance-authority ·
react-hook-form + zod · react-resizable-panels · Pyodide

## 💜 Support

If NeonPy is useful to you, consider supporting the author:

- **[GitHub Sponsors](https://github.com/sponsors/FinTechResearch)**
- **[Ko-fi](https://ko-fi.com/adityamadhok)**

## 📝 Notes

- First **Run** downloads the Pyodide runtime (~10 MB) once, then the browser caches it.
  A warm-up starts automatically after page load.
- Trails are GPU-friendly (single canvas, capped particle pools, DPR-aware).
- The `/api/local` route is SSRF-guarded: proxied requests only reach loopback or
  private-network hosts.
- Cloud API routes stream SSE straight through — no key ever touches the client bundle.

---

**© 2026 Aditya Madhok.** Built in September 2026. Made with neon. ⚡
