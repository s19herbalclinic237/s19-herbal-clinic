"use client";

import { useEffect, useRef, useState } from "react";
import { Input, RadioCard } from "@/components/ui/form";
import { useLocale } from "@/components/i18n/locale-provider";
import {
  DONATION_FUNDS,
  DONATION_MOMO_NUMBER,
  DONATION_REFERENCE_CODE,
  DONATION_WHATSAPP_NUMBER,
  donationConfirmationMessage,
  localizedFundName,
  type DonationFundId,
} from "@/lib/data/donation-funds";
import { waLink } from "@/lib/site";
import { FaCheck, FaCopy, FaWhatsapp } from "react-icons/fa6";

/**
 * The donation panel: purpose selector, copyable MTN MoMo number, copyable
 * payment reference code, optional amount, and the prefilled WhatsApp
 * confirmation link.
 *
 * ## Why this is a client component
 *
 * Two of the brief's requirements are interactive. The donor must be able to
 * *choose* a purpose, and the WhatsApp link must carry that choice - which
 * means the link's href cannot be known on the server.
 *
 * ## Why the WhatsApp link falls back to a bare "DONATION"
 *
 * The brief fixes the confirmation button URL as
 * `https://wa.me/237672595989?text=DONATION`, and separately asks for the
 * message to be prefilled with "DONATION" *and the chosen purpose*. Those are
 * the same link with more in it: when a purpose has been chosen the message
 * grows, and when it has not, the link is exactly the URL the brief specifies.
 * A donor who ignores the selector still reaches the clinic with a usable
 * message rather than a dead button.
 *
 * ## Why the amount is optional
 *
 * The brief says "send any amount to the MTN MoMo number", so a donor who has
 * not decided yet must still be able to send a confirmation. The amount is
 * only written into the message when it is actually entered - a message that
 * says "[amount]" would reach the clinic unedited and mean nothing.
 *
 * ## Why the screenshot is not uploaded here
 *
 * The brief is explicit: "Users must attach the screenshot themselves", and
 * "screenshots alone are not proof". So the panel hands the donor over to
 * WhatsApp with the message prepared and nothing else - no file input, no
 * upload, no claim that an image has been received.
 */

type CopyTarget = "number" | "reference" | "message";

export function DonationPanel() {
  const { t, locale } = useLocale();
  const [fundId, setFundId] = useState<DonationFundId | "">("");
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const fund = DONATION_FUNDS.find((f) => f.id === fundId);

  const message = fund
    ? donationConfirmationMessage({
        fundName: localizedFundName(fund, locale),
        amount: amount.trim() || undefined,
        locale,
      })
    : DONATION_REFERENCE_CODE;

  const whatsappHref = waLink(message);

  const markCopied = (target: CopyTarget) => {
    setCopied(target);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(null), 2000);
  };

  const copy = async (value: string, target: CopyTarget) => {
    const ok = await copyToClipboard(value);
    if (ok) markCopied(target);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-forest-800/60 bg-forest-950 shadow-lift">
      {/* ---------- Payment details ---------- */}
      <div className="space-y-3 border-b border-white/10 p-6 md:p-7">
        <CopyRow
          label={t("s19care.momo.numberLabel")}
          value={DONATION_MOMO_NUMBER}
          copied={copied === "number"}
          onCopy={() => void copy(DONATION_MOMO_NUMBER, "number")}
          copyLabel={t("s19care.momo.copyNumber")}
          copiedLabel={t("s19care.momo.copied")}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gold-400">
              {t("s19care.momo.whatsappLabel")}
            </p>
            <p className="mt-0.5 font-display text-lg font-semibold text-white">
              {DONATION_WHATSAPP_NUMBER}
            </p>
          </div>
          <a
            href={waLink("")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/15"
          >
            <FaWhatsapp className="h-3.5 w-3.5" aria-hidden />
            WhatsApp
          </a>
        </div>
        <CopyRow
          label={t("s19care.momo.referenceLabel")}
          value={DONATION_REFERENCE_CODE}
          copied={copied === "reference"}
          onCopy={() => void copy(DONATION_REFERENCE_CODE, "reference")}
          copyLabel={t("s19care.momo.copyReference")}
          copiedLabel={t("s19care.momo.copied")}
        />
        <p className="text-xs leading-relaxed text-forest-200/80">
          {t("s19care.momo.referenceHint")}
        </p>
      </div>

      {/* ---------- Purpose, amount, confirmation ---------- */}
      <div className="space-y-6 p-6 md:p-7">
        <fieldset>
          <legend className="text-sm font-bold text-white">
            {t("s19care.panel.purposeLabel")}
          </legend>
          <p className="mt-1 text-xs leading-relaxed text-forest-200/80">
            {t("s19care.panel.purposeHint")}
          </p>
          <div className="mt-4 space-y-2.5">
            {DONATION_FUNDS.map((f) => (
              <RadioCard
                key={f.id}
                name="donation-purpose"
                value={f.id}
                checked={fundId === f.id}
                onChange={(value) => setFundId(value as DonationFundId)}
                title={localizedFundName(f, locale)}
                description={locale === "fr" ? f.descriptionFr : f.description}
              />
            ))}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="donation-amount"
            className="block text-xs font-semibold uppercase tracking-wide text-white"
          >
            {t("s19care.panel.amountLabel")}
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <Input
              id="donation-amount"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="5000"
              aria-describedby="donation-amount-hint"
              className="bg-white"
            />
            <span className="shrink-0 text-sm font-semibold text-forest-200">FCFA</span>
          </div>
          <p id="donation-amount-hint" className="mt-1.5 text-xs text-forest-200/80">
            {t("s19care.panel.amountHint")}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-white">
              {t("s19care.panel.previewLabel")}
            </p>
            <button
              type="button"
              onClick={() => void copy(message, "message")}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/25 bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-white/15"
            >
              {copied === "message" ? (
                <FaCheck className="h-3 w-3" aria-hidden />
              ) : (
                <FaCopy className="h-3 w-3" aria-hidden />
              )}
              {copied === "message" ? t("s19care.momo.copied") : t("s19care.panel.copyMessage")}
            </button>
          </div>
          <p className="mt-2 rounded-md border border-white/10 bg-white/5 px-4 py-3 font-mono text-xs leading-relaxed text-forest-100">
            {message}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-forest-200/80">
            {t("s19care.panel.previewHint")}
          </p>
        </div>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-auto min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-center text-[15px] font-semibold leading-snug text-forest-950 shadow-md shadow-gold-500/25 transition-colors hover:bg-gold-400"
        >
          <FaWhatsapp className="h-4 w-4" aria-hidden />
          {t("s19care.panel.confirmCta")}
        </a>
      </div>
    </div>
  );
}

/** A labelled value with a copy button. Used for the number and the reference. */
function CopyRow({
  label,
  value,
  copied,
  onCopy,
  copyLabel,
  copiedLabel,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  copyLabel: string;
  copiedLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gold-400">{label}</p>
        <p className="mt-0.5 font-display text-lg font-semibold text-white">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        aria-label={`${copyLabel}: ${value}`}
        className="inline-flex items-center gap-1.5 rounded-md border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/15"
      >
        {copied ? (
          <FaCheck className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <FaCopy className="h-3.5 w-3.5" aria-hidden />
        )}
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}

/**
 * Copies text to the clipboard.
 *
 * `navigator.clipboard` is unavailable outside a secure context, which still
 * includes a clinic desktop on a plain HTTP preview. The `execCommand` path is
 * the old fallback and still the only one that works there, so it stays.
 */
async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the legacy path below.
  }

  try {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
