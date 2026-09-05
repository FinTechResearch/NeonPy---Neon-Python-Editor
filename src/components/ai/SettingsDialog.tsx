"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  KeyRound,
  ExternalLink,
  Loader2,
  RefreshCw,
  RadioTower,
  ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { settingsSchema, type AISettings } from "@/lib/ai/settings";
import { PROVIDERS, type ProviderId } from "@/lib/ai/types";
import { fetchProviderModels } from "@/lib/ai/models";
import { detectLocalModels, type LocalRuntime } from "@/lib/ai/local";

interface Props {
  open: boolean;
  settings: AISettings;
  onClose: () => void;
  onSave: (s: AISettings) => void;
}

const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

export default function SettingsDialog({ open, settings, onClose, onSave }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AISettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  const [customModel, setCustomModel] = useState(false);
  const [liveModels, setLiveModels] = useState<string[] | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const [detecting, setDetecting] = useState(false);
  const [runtimes, setRuntimes] = useState<LocalRuntime[]>([]);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [customHost, setCustomHost] = useState("");

  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form watch() is intentional here
  const providerId = watch("provider");
  const apiKey = watch("apiKey");
  const model = watch("model");
  const localHost = watch("localHost");
  const autoInsert = watch("autoInsert");
  const temperature = watch("temperature");
  const provider = PROVIDERS[providerId];

  // Reset form + transient state whenever the dialog opens
  useEffect(() => {
    if (open) {
      reset(settings);
      setLiveModels(null);
      setModelsError(null);
      setRuntimes([]);
      setDetectError(null);
      setCustomHost(settings.localHost);
      setCustomModel(
        settings.provider !== "local" &&
          !PROVIDERS[settings.provider].models.includes(settings.model),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset]);

  useEffect(() => {
    setLiveModels(null);
    setModelsError(null);
  }, [providerId]);

  if (!open) return null;

  const models = liveModels ?? provider.models;

  const loadLive = async () => {
    setLoadingModels(true);
    setModelsError(null);
    try {
      const list = await fetchProviderModels(providerId, getValues("apiKey"));
      setLiveModels(list);
      if (list.length > 0 && !list.includes(getValues("model"))) {
        setValue("model", PROVIDERS[providerId].defaultModel, { shouldValidate: true });
      }
    } catch (err) {
      setModelsError(err instanceof Error ? err.message : "Failed to load models");
    } finally {
      setLoadingModels(false);
    }
  };

  const runDetection = async (host?: string) => {
    setDetecting(true);
    setDetectError(null);
    try {
      const found = await detectLocalModels(host || undefined);
      setRuntimes(found);
      if (found.length === 0) {
        setDetectError(
          "No local runtimes found. Start one (e.g. `ollama serve`) or probe a custom host below.",
        );
      } else {
        const curHost = getValues("localHost");
        const curModel = getValues("model");
        const keep =
          found.find((r) => r.host === curHost && r.models.includes(curModel)) ?? null;
        if (!keep) {
          const first = found[0];
          setValue("localHost", first.host, { shouldValidate: true });
          setValue("model", first.models[0] ?? "", { shouldValidate: true });
        }
      }
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : "Detection failed");
    } finally {
      setDetecting(false);
    }
  };

  const pickRuntime = (rt: LocalRuntime, modelName: string) => {
    setValue("localHost", rt.host, { shouldValidate: true });
    setValue("model", modelName, { shouldValidate: true });
  };

  const submit = (data: AISettings) => {
    onSave(data);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.form
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="max-h-[92vh] w-[490px] max-w-[94vw] overflow-y-auto rounded-2xl border border-cyan-400/25 bg-panel p-5 shadow-[0_0_60px_rgba(34,211,238,0.15)]"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit(submit)}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold neon-text text-cyan-300">
            <KeyRound size={15} /> AI Provider Settings
          </h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted">
          Provider
        </label>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {PROVIDER_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setValue("provider", id, { shouldValidate: true });
                if (id === "local") {
                  if (runtimes.length === 0 && !detecting) void runDetection();
                } else {
                  setValue("model", PROVIDERS[id].defaultModel, { shouldValidate: true });
                  setCustomModel(false);
                }
              }}
              className={`rounded-lg border px-3 py-2 text-xs transition ${
                providerId === id
                  ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
                  : "border-line text-muted hover:border-cyan-400/30"
              }`}
            >
              {PROVIDERS[id].label}
            </button>
          ))}
        </div>

        {providerId === "local" ? (
          <div className="mb-3 rounded-xl border border-fuchsia-400/25 bg-panel2/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted">
                <RadioTower size={12} className="text-fuchsia-300" /> Local runtimes on this
                machine
              </span>
              <button
                type="button"
                onClick={() => void runDetection()}
                disabled={detecting}
                className="inline-flex items-center gap-1 text-[11px] text-cyan-400 transition hover:underline disabled:opacity-40"
              >
                {detecting ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                {runtimes.length > 0 ? `rescan (${runtimes.length})` : "scan now"}
              </button>
            </div>

            {runtimes.length > 0 && (
              <div className="mb-2 max-h-48 space-y-2 overflow-y-auto pr-1">
                {runtimes.map((rt) => (
                  <div
                    key={rt.host}
                    className={`rounded-lg border px-2.5 py-2 transition ${
                      localHost === rt.host
                        ? "border-cyan-400/60 bg-cyan-500/10"
                        : "border-line"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-cyan-200">{rt.runtime}</span>
                      <span className="font-mono text-[10px] text-muted">{rt.host}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {rt.models.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => pickRuntime(rt, m)}
                          className={`rounded-full border px-2 py-0.5 font-mono text-[10px] transition ${
                            model === m && localHost === rt.host
                              ? "border-fuchsia-400/70 bg-fuchsia-500/15 text-fuchsia-200 shadow-[0_0_12px_rgba(232,121,249,0.25)]"
                              : "border-line text-muted hover:border-fuchsia-400/40 hover:text-fuchsia-200"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-1.5">
              <input
                value={customHost}
                onChange={(e) => setCustomHost(e.target.value)}
                placeholder="custom host e.g. http://192.168.1.20:11434"
                className="min-w-0 flex-1 rounded-lg border border-line bg-panel2 px-2.5 py-1.5 font-mono text-[11px] focus:border-cyan-400/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => customHost.trim() && void runDetection(customHost.trim())}
                disabled={detecting || !customHost.trim()}
                className="rounded-lg border border-line px-2.5 py-1.5 text-[11px] text-muted transition hover:border-cyan-400/40 disabled:opacity-40"
              >
                probe
              </button>
            </div>
            {detectError && (
              <p className="mt-2 rounded border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[10.5px] text-amber-300">
                {detectError}
              </p>
            )}
            {errors.model && (
              <p className="mt-1 text-[11px] text-red-400">{errors.model.message}</p>
            )}
            <p className="mt-2 text-[10px] leading-relaxed text-muted">
              Detection probes OpenAI-compatible ports (Ollama 11434, LM Studio 1234, llama.cpp
              8080, Jan 1337, GPT4All 4891, vLLM 8000, KoboldCpp 5001, webui 5000). Requests are
              proxied through the NeonPy server — no CORS, no API key, fully offline.
            </p>
          </div>
        ) : (
          <>
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted">
              API Key
            </label>
            <input
              type="password"
              {...register("apiKey")}
              placeholder="gsk_… or nvapi-…"
              className="mb-1 w-full rounded-lg border border-line bg-panel2 px-3 py-2 font-mono text-xs focus:border-cyan-400/50 focus:outline-none"
            />
            {errors.apiKey && (
              <p className="mb-1 text-[11px] text-red-400">{errors.apiKey.message}</p>
            )}
            <a
              href={provider.keyUrl}
              target="_blank"
              rel="noreferrer"
              className="mb-3 inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
            >
              Get a {provider.label} key <ExternalLink size={11} />
            </a>

            <div className="mb-1 flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-wide text-muted">Model</label>
              <button
                type="button"
                onClick={() => setCustomModel((v) => !v)}
                className="text-[10px] text-muted transition hover:text-cyan-300"
              >
                {customModel ? "use list" : "custom id"}
              </button>
            </div>

            {customModel ? (
              <input
                {...register("model")}
                placeholder="exact model id, e.g. openai/gpt-oss-20b"
                className="mb-1 w-full rounded-lg border border-line bg-panel2 px-3 py-2 font-mono text-xs focus:border-cyan-400/50 focus:outline-none"
              />
            ) : (
              <select
                {...register("model")}
                className="mb-1 w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-xs focus:border-cyan-400/50 focus:outline-none"
              >
                {models.map((m) => (
                  <option key={m} value={m} className="bg-panel2">
                    {m}
                  </option>
                ))}
                {model && !models.includes(model) && (
                  <option value={model} className="bg-panel2">
                    {model}
                  </option>
                )}
              </select>
            )}
            {errors.model && (
              <p className="mb-1 text-[11px] text-red-400">{errors.model.message}</p>
            )}

            <div className="mb-3 mt-1 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => void loadLive()}
                disabled={loadingModels || !apiKey}
                className="inline-flex items-center gap-1 text-cyan-400 transition hover:underline disabled:opacity-40"
              >
                {loadingModels ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <RefreshCw size={11} />
                )}
                {liveModels ? `refresh ${liveModels.length} live models` : "load live model list"}
              </button>
              <span className="flex items-center gap-0.5 text-muted">
                <ChevronDown size={10} /> fetched with your key
              </span>
            </div>
            {modelsError && (
              <p className="mb-2 rounded border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[10.5px] text-amber-300">
                {modelsError}
              </p>
            )}
          </>
        )}

        <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted">
          Temperature — {Number(temperature ?? 0.4).toFixed(1)}
        </label>
        <input
          type="range"
          min={0}
          max={2}
          step={0.1}
          {...register("temperature", { valueAsNumber: true })}
          className="mb-3 w-full accent-cyan-400"
        />

        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            {...register("autoInsert")}
            className="accent-cyan-400"
            checked={autoInsert}
          />
          Auto-type AI code into the editor (with neon trails)
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-400/60 bg-cyan-500/15 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25 hover:shadow-[0_0_24px_rgba(34,211,238,0.3)] disabled:opacity-50"
        >
          {isSubmitting && <Loader2 size={13} className="animate-spin" />}
          Save Settings
        </button>
      </motion.form>
    </div>
  );
}
