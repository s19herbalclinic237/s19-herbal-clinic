"use client";

import { useState } from "react";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FaEnvelope, FaRegCircleCheck } from "react-icons/fa6";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not subscribe.");
      setEmail("");
      setStatus("done");
      setMessage("You are subscribed. We will send health updates and new articles.");
    } catch (e) {
      setStatus("error");
      setMessage((e as Error).message || "Could not subscribe right now.");
    }
  };

  return (
    <form onSubmit={submit} className={compact ? "" : "space-y-2"}>
      <div className={`flex gap-2 ${compact ? "" : "max-w-md"}`}>
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          disabled={status === "sending"}
        />
        <Button type="submit" disabled={status === "sending"} className="shrink-0">
          {status === "sending" ? (
            "Subscribing…"
          ) : (
            <>
              <FaEnvelope className="h-3.5 w-3.5" aria-hidden />
              Subscribe
            </>
          )}
        </Button>
      </div>
      {status === "done" ? (
        <p className="flex items-center gap-1.5 text-sm font-medium text-forest-700">
          <FaRegCircleCheck className="h-4 w-4" aria-hidden />
          {message}
        </p>
      ) : null}
      {status === "error" && message ? <p className="text-sm text-red-600">{message}</p> : null}
    </form>
  );
}