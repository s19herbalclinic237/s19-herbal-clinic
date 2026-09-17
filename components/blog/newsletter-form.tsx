"use client";

import { useState } from "react";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";
import { FaEnvelope, FaRegCircleCheck } from "react-icons/fa6";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale();
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
      if (!res.ok) throw new Error(data.error || t("newsletter.errorDefault"));
      setEmail("");
      setStatus("done");
      setMessage(t("newsletter.success"));
    } catch (e) {
      setStatus("error");
      setMessage((e as Error).message || t("newsletter.errorDefault"));
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
          placeholder={t("newsletter.placeholder")}
          aria-label={t("newsletter.aria")}
          disabled={status === "sending"}
        />
        <Button type="submit" disabled={status === "sending"} className="shrink-0">
          {status === "sending" ? (
            t("newsletter.submitting")
          ) : (
            <>
              <FaEnvelope className="h-3.5 w-3.5" aria-hidden />
              {t("newsletter.subscribe")}
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