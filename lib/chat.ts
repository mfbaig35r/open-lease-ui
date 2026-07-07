import { ApiError } from "./api";
import { getConn } from "./connection";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// Stream a chat completion through the OpenAI-compatible proxy (mounted at /v1/* on the same
// server). The proxy routes by the `model` field (the deployment's model id or HF repo) to the
// READY pod and rewrites it to the served id. onDelta gets each content chunk as it arrives.
export async function streamChat(opts: {
  model: string;
  messages: ChatMessage[];
  onDelta: (text: string) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const { baseUrl, token } = getConn();
  const base = baseUrl.replace(/\/$/, "");
  let res: Response;
  try {
    res = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ model: opts.model, messages: opts.messages, stream: true }),
      signal: opts.signal,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") return;
    throw new ApiError(`cannot reach the API at ${base || "the configured server"}`, 0);
  }
  if (!res.ok || !res.body) {
    const sentence = await res
      .json()
      .then((b) => b?.error as string | undefined)
      .catch(() => undefined);
    throw new ApiError(sentence ?? `chat failed (${res.status})`, res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      throw e;
    }
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const data = t.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) opts.onDelta(delta);
      } catch {
        // ignore keep-alive / partial lines
      }
    }
  }
}
