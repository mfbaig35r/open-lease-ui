"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { ChatMessage } from "@/lib/chat";
import { streamChat } from "@/lib/chat";
import { useDeployments } from "@/lib/hooks";

export function Playground() {
  const deployments = useDeployments(false);
  const ready = (deployments.data ?? []).filter((d) => d.observed_state === "ready");

  const [selectedId, setSelectedId] = useState("");
  const effective = ready.find((d) => d.id === selectedId) ?? ready[0];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    if (!effective || !input.trim() || streaming) return;
    const history: ChatMessage[] = [...messages, { role: "user", content: input.trim() }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setError(null);
    setStreaming(true);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      await streamChat({
        model: effective.model_id,
        messages: history,
        signal: ac.signal,
        onDelta: (text) =>
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = { ...last, content: last.content + text };
            return copy;
          }),
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  if (deployments.isLoading)
    return <p className="font-mono text-small text-ink-muted">Loading…</p>;

  if (ready.length === 0)
    return (
      <div>
        <h1 className="text-h1 font-semibold text-ink-strong">Playground</h1>
        <div className="mt-8 rounded-sm border border-dashed border-rule bg-surface/40 p-10 text-center">
          <p className="text-h3 font-semibold text-ink-strong">No ready deployments</p>
          <p className="mt-2 text-body text-ink-muted">Spin up a model to chat with it.</p>
          <Link
            href="/deploy"
            className="mt-4 inline-block rounded-sm bg-accent px-5 py-2.5 text-small font-medium text-canvas transition-colors hover:bg-accent-hover"
          >
            Deploy a model
          </Link>
        </div>
      </div>
    );

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <header className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-h1 font-semibold text-ink-strong">Playground</h1>
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              className="font-mono text-label tracking-[0.04em] text-ink-muted uppercase hover:text-ink"
            >
              clear
            </button>
          )}
          <select
            value={effective?.id ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-sm border border-rule-strong bg-canvas px-3 py-1.5 text-small text-ink-strong outline-none focus:border-accent-soft"
          >
            {ready.map((d) => (
              <option key={d.id} value={d.id}>
                {d.model_id}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-5 overflow-auto rounded-sm border border-rule bg-surface p-5"
      >
        {messages.length === 0 ? (
          <p className="font-mono text-small text-ink-muted">
            Chatting with{" "}
            <span className="text-accent-soft">{effective?.model_id}</span>. Say something.
          </p>
        ) : (
          messages.map((m, i) => (
            <div key={i}>
              <p className="mb-1 font-mono text-label tracking-[0.04em] text-ink-muted uppercase">
                {m.role === "user" ? "You" : effective?.model_id}
              </p>
              <p
                className={cn(
                  "text-body whitespace-pre-wrap",
                  m.role === "user" ? "text-ink-strong" : "text-ink",
                )}
              >
                {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
              </p>
            </div>
          ))
        )}
      </div>

      {error && <p className="mt-3 text-small text-danger">{error}</p>}

      <div className="mt-4 flex items-end gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder="Message the model…  (Enter to send, Shift+Enter for a newline)"
          className="flex-1 resize-none rounded-sm border border-rule-strong bg-canvas px-3 py-2 text-small text-ink-strong outline-none focus:border-accent-soft"
        />
        {streaming ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="rounded-sm border border-rule-strong px-5 py-2.5 text-small text-ink transition-colors hover:border-danger hover:text-danger"
          >
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={send}
            disabled={!input.trim()}
            className="rounded-sm bg-accent px-5 py-2.5 text-small font-medium text-canvas transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
