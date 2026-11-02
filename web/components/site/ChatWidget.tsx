"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What peptides do you carry for research on recovery?",
  "How does shipping work?",
  "Do you provide Certificates of Analysis?",
];

/** Renders [label](/path) links and line breaks from the assistant's plain text. */
function renderText(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\((\/[^)\s]*|https?:\/\/[^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const href = m[2];
    out.push(
      href.startsWith("/") ? (
        <Link key={k++} href={href} className="font-semibold text-red underline underline-offset-2">{m[1]}</Link>
      ) : (
        <a key={k++} href={href} target="_blank" rel="noreferrer" className="font-semibold text-red underline underline-offset-2">{m[1]}</a>
      ),
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Floating research-assistant chat. Renders nothing until the API reports it is configured. */
export function ChatWidget() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}/api/chat/status`)
      .then((r) => r.json())
      .then((j: { data?: { enabled?: boolean } }) => setEnabled(Boolean(j?.data?.enabled)))
      .catch(() => setEnabled(false));
  }, []);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, open, busy]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-20) }),
      });
      const json = (await res.json().catch(() => null)) as { data?: { response: string }; error?: string } | null;
      const reply = res.ok && json?.data?.response
        ? json.data.response
        : "I'm sorry, something went wrong. Please try again or reach us via the [Contact page](/contact).";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "I couldn't reach the server. Please try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close assistant" : "Ask the research assistant"}
        className="fixed bottom-5 left-5 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-red px-4 text-sm font-bold text-white shadow-lg shadow-red/30 transition-transform hover:scale-[1.03]"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z" />}
        </svg>
        {open ? "Close" : "Ask us"}
      </button>

      {open && (
        <section
          role="dialog"
          aria-label="Research assistant"
          className="fixed bottom-20 left-5 z-40 flex h-[min(32rem,calc(100vh-7rem))] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border-hair bg-bg-elevated shadow-2xl"
        >
          <header className="border-b border-border-hair px-4 py-3">
            <p className="font-display text-sm font-black uppercase tracking-wide text-text-primary">Research assistant</p>
            <p className="text-[11px] text-text-dim">Product questions only · research use only</p>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            {messages.length === 0 && (
              <div>
                <p className="text-text-secondary">Hi! Ask me about any product in the catalog, shipping, or lab testing.</p>
                <div className="mt-3 flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => void send(s)} className="rounded-xl border border-border-hair px-3 py-2 text-left text-xs text-text-secondary transition-colors hover:border-red/50 hover:text-red">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 leading-relaxed ${m.role === "user" ? "bg-red text-white" : "bg-bg-base/70 text-text-primary"}`}>
                  {m.role === "assistant" ? renderText(m.content) : m.content}
                </div>
              </div>
            ))}
            {busy && <p className="text-xs text-text-dim">Thinking…</p>}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); void send(input); }}
            className="flex gap-2 border-t border-border-hair p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              aria-label="Message"
              className="commerce-input min-h-11 w-full rounded-xl border border-border-hair bg-bg-base/60 px-3 text-sm text-text-primary placeholder:text-text-dim focus:border-red/60 focus:outline-none"
            />
            <button type="submit" disabled={busy || !input.trim()} className="min-h-11 shrink-0 rounded-xl bg-red px-4 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50">
              Send
            </button>
          </form>
        </section>
      )}
    </>
  );
}
