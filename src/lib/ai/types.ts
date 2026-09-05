export type ProviderId = "groq" | "nvidia" | "local";

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  baseUrl: string;
  defaultModel: string;
  keyUrl: string;
  /** Fallback catalog shown before/without a live /models fetch. */
  models: string[];
  /** Cloud APIs need a key; local runtimes do not. */
  needsKey: boolean;
}

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  groq: {
    id: "groq",
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "openai/gpt-oss-120b",
    keyUrl: "https://console.groq.com/keys",
    models: [
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "qwen/qwen3.6-27b",
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "groq/compound",
    ],
    needsKey: true,
  },
  nvidia: {
    id: "nvidia",
    label: "NVIDIA NIM",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    defaultModel: "meta/llama-3.3-70b-instruct",
    keyUrl: "https://build.nvidia.com/",
    models: [
      "meta/llama-3.3-70b-instruct",
      "nvidia/llama-3.1-nemotron-70b-instruct",
      "qwen/qwen2.5-coder-32b-instruct",
      "deepseek-ai/deepseek-r1",
      "openai/gpt-oss-20b",
    ],
    needsKey: true,
  },
  local: {
    id: "local",
    label: "Local",
    baseUrl: "", // chosen at runtime via detection (/api/local)
    defaultModel: "",
    keyUrl: "https://ollama.com/download",
    models: [],
    needsKey: false,
  },
};

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/** Known local OpenAI-compatible runtimes and their default ports. */
export const LOCAL_RUNTIMES: { name: string; port: number }[] = [
  { name: "Ollama", port: 11434 },
  { name: "LM Studio", port: 1234 },
  { name: "llama.cpp server", port: 8080 },
  { name: "vLLM", port: 8000 },
  { name: "text-generation-webui", port: 5000 },
  { name: "KoboldCpp", port: 5001 },
  { name: "Jan", port: 1337 },
  { name: "GPT4All", port: 4891 },
];
