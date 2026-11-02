"use client";

import { useState } from "react";
import { toast } from "sonner";
import { adminApi, type AdminMessage } from "@/lib/admin-client";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";

/** Contact-form inbox: mark read, reply by email, see what was sent. */
export function MessagesPanel({ messages, onChanged }: { messages: AdminMessage[]; onChanged: () => void }) {
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  async function markRead(id: number) {
    try { await adminApi.markMessageRead(id); onChanged(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Could not update the message"); }
  }

  async function sendReply(id: number) {
    if (!replyText.trim()) { toast.error("Write a reply first"); return; }
    setSending(true);
    try {
      const r = await adminApi.replyMessage(id, replyText.trim());
      toast[r.meta.emailed ? "success" : "warning"](r.meta.emailed ? "Reply sent" : "Reply saved, but email is not configured so nothing was sent");
      setReplyingTo(null);
      setReplyText("");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the reply");
    } finally {
      setSending(false);
    }
  }

  if (messages.length === 0) {
    return <Panel className="text-center"><p className="text-text-secondary">No contact messages yet.</p></Panel>;
  }

  return (
    <div className="space-y-4">
      {messages.map((m) => (
        <Panel key={m.id} glow={m.handled ? "none" : "blue"}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-display text-lg font-bold uppercase text-text-primary">
              {m.subject}
              {!m.handled && <span className="ml-2 rounded-full bg-red px-2 py-0.5 align-middle font-mono text-[10px] text-white">New</span>}
              {m.adminReply && <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 align-middle font-mono text-[10px] text-emerald-600">Replied</span>}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim">{new Date(m.createdAt).toLocaleString()}</p>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {m.name} · <a href={`mailto:${m.email}`} className="text-blue hover:underline">{m.email}</a>
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-primary">{m.message}</p>

          {m.adminReply && (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-600">Your reply{m.repliedAt ? ` · ${new Date(m.repliedAt).toLocaleString()}` : ""}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-text-primary">{m.adminReply}</p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {!m.handled && <Button variant="outline" onClick={() => void markRead(m.id)}>Mark read</Button>}
            <Button
              variant="outline"
              onClick={() => { setReplyingTo(replyingTo === m.id ? null : m.id); setReplyText(m.adminReply ?? ""); }}
            >
              {replyingTo === m.id ? "Cancel" : m.adminReply ? "Reply again" : "Reply"}
            </Button>
          </div>

          {replyingTo === m.id && (
            <div className="mt-3">
              <textarea
                rows={5}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${m.name}…`}
                className="admin-input w-full rounded-xl border border-border-hair bg-bg-base/60 px-4 py-3 text-sm text-text-primary focus:border-red/60 focus:outline-none"
              />
              <div className="mt-2 flex gap-2">
                <Button onClick={() => void sendReply(m.id)} disabled={sending}>{sending ? "Sending…" : "Send reply"}</Button>
              </div>
            </div>
          )}
        </Panel>
      ))}
    </div>
  );
}
