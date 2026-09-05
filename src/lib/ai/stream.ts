/**
 * Shared SSE reader for OpenAI-compatible chat completion streams.
 * Works both in the browser (chat panel) and on the server.
 */
export interface StreamCallbacks {
  onDelta: (text: string) => void;
  onDone: (full: string) => void;
  onError: (msg: string) => void;
}

export async function streamChatCompletion(
  res: Response,
  cb: StreamCallbacks,
): Promise<void> {
  if (!res.body) {
    cb.onError("Empty response body");
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") {
          cb.onDone(full);
          return;
        }
        try {
          const json = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[];
            error?: { message?: string };
          };
          if (json.error?.message) {
            cb.onError(json.error.message);
            return;
          }
          const delta = json.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            full += delta;
            cb.onDelta(delta);
          }
        } catch {
          /* partial JSON across chunks — keep buffering */
        }
      }
    }
    cb.onDone(full);
  } catch (err) {
    cb.onError(err instanceof Error ? err.message : "Stream failed");
  }
}
