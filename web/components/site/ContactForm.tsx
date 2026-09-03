"use client";

import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/Button";

const Schema = z.object({
  name: z.string().trim().min(1, "Please enter your name"),
  email: z.string().trim().email("Please enter a valid email address"),
  subject: z.string().trim().min(1, "Please enter a subject"),
  message: z.string().trim().min(10, "Please write at least 10 characters"),
});

type Field = keyof z.infer<typeof Schema>;

const FIELDS: { name: Field; label: string; type: string; textarea?: boolean }[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "subject", label: "Subject", type: "text" },
  { name: "message", label: "Message", type: "text", textarea: true },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export function ContactForm({ defaultSubject = "" }: { defaultSubject?: string }) {
  const [values, setValues] = useState<Record<Field, string>>({
    name: "", email: "", subject: defaultSubject, message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Schema.safeParse(values);
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as Field] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setPending(true);

    try {
      if (!API_URL) {
        // Demo mode — no API configured. Say so rather than faking success.
        toast.info("Demo mode — message not sent", {
          description: "Set NEXT_PUBLIC_API_URL to deliver messages for real.",
        });
        setSent(true);
        return;
      }
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSent(true);
      toast.success("Message sent", { description: "We'll reply within one business day." });
    } catch (err) {
      console.error("[contact]", err);
      toast.error("Could not send", { description: "Please email support@purepeptide.us instead." });
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-border-hair bg-bg-glass p-10 text-center backdrop-blur">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red/15">
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-red stroke-2" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="mt-5 font-display text-3xl font-black uppercase text-text-primary">
          Message received
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          We reply to every enquiry within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {/* Honeypot — hidden from users, catches naive bots. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {FIELDS.map((f) => {
        const err = errors[f.name];
        const describedBy = err ? `${f.name}-error` : undefined;
        const base =
          "w-full rounded-xl border bg-bg-base/60 px-4 py-3 text-sm text-text-primary placeholder:text-text-dim transition-colors focus:outline-none";
        const tone = err ? "border-red focus:border-red" : "border-border-hair focus:border-red/60";

        return (
          <div key={f.name}>
            <label
              htmlFor={f.name}
              className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-text-dim"
            >
              {f.label}
            </label>
            {f.textarea ? (
              <textarea
                id={f.name}
                rows={5}
                value={values[f.name]}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                aria-invalid={Boolean(err)}
                aria-describedby={describedBy}
                className={`${base} ${tone} resize-y`}
              />
            ) : (
              <input
                id={f.name}
                type={f.type}
                value={values[f.name]}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                aria-invalid={Boolean(err)}
                aria-describedby={describedBy}
                className={`${base} ${tone}`}
              />
            )}
            {err && (
              <p id={`${f.name}-error`} role="alert" className="mt-1.5 text-xs text-red">
                {err}
              </p>
            )}
          </div>
        );
      })}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send message"}
      </Button>

      <p className="text-center text-xs text-text-dim">
        We cannot provide dosing, medical, or protocol advice.
      </p>
    </form>
  );
}
