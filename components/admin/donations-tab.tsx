"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { DateField } from "@/components/ui/date-field";
import { ResponsiveTable, type ResponsiveColumn } from "@/components/ui/responsive-table";
import { formatDate } from "@/components/account/badges";
import { formatFcfa } from "@/lib/utils";
import { localDateString } from "@/lib/dates";
import {
  DONATION_FUNDS,
  DONATION_PAYMENT_METHODS,
  donationFund,
  donationPaymentMethod,
  type DonationFundId,
  type DonationPaymentMethodId,
} from "@/lib/data/donation-funds";
import {
  FaArrowRotateLeft,
  FaCircleCheck,
  FaCircleExclamation,
  FaClipboardCheck,
  FaEye,
  FaEyeSlash,
  FaHandHoldingHeart,
  FaLock,
  FaPlus,
  FaReceipt,
  FaXmark,
} from "react-icons/fa6";

/**
 * The admin donation log.
 *
 * Built from page 2 of `docs/S19_CARE_Developer_Brief.md`: "Create an admin
 * donation log: date, amount, payment method, selected fund, transaction
 * reference, verification status, acknowledgment."
 *
 * ## Why the log is written by staff and never by donors
 *
 * The brief is blunt about it: "Staff must verify actual payment records:
 * screenshots alone are not proof." So the log records *payments the clinic has
 * checked*, not claims donors have made. A donor's WhatsApp message and
 * screenshot start a conversation; they never create a row. Staff file the row
 * once they have matched the payment against the Mobile Money (or bank)
 * record, and they carry the transaction reference so the match can be audited
 * later.
 *
 * ## Why patient assistance and clinic development are totalled separately
 *
 * "Account separately for patient assistance and clinic-development donations."
 * The summary above the log therefore splits the totals by fund, so money given
 * to help a family is never reported as clinic spending. The page also states
 * plainly that S19 Herbal Clinic is a private clinic and that development
 * donations benefit the clinic itself.
 *
 * ## Why donor details are masked by default
 *
 * "Keep donor details confidential." The name and contact are stored - staff
 * need them to thank the donor and to query a payment that cannot be matched -
 * but the log shows them masked until someone deliberately reveals them. A
 * screen-shared admin panel should not spill a donor's phone number.
 *
 * ## Why there is no delete button
 *
 * A donation is a financial record. Deleting one would leave the totals
 * disagreeing with the clinic's actual statements and erase the trail of what
 * was recorded and when. A wrong entry is corrected and re-verified, never
 * removed.
 */

type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

interface DonationRow {
  _id: string;
  date: string;
  amount: number;
  currency: string;
  paymentMethod: DonationPaymentMethodId;
  fund: DonationFundId;
  transactionReference: string;
  verificationStatus: VerificationStatus;
  acknowledgedAt?: string | null;
  acknowledgment?: string | null;
  donorName?: string | null;
  donorContact?: string | null;
  notes?: string | null;
  createdAt: string;
}

interface Totals {
  count: number;
  amount: number;
}

interface Summary {
  total: Totals;
  byFund: Record<DonationFundId, Totals>;
  byStatus: Record<VerificationStatus, Totals>;
  awaitingVerification: number;
  awaitingAcknowledgment: number;
}

const STATUS_LABEL: Record<VerificationStatus, string> = {
  unverified: "Unverified",
  pending: "Checking",
  verified: "Verified",
  rejected: "Rejected",
};

const STATUS_CLASS: Record<VerificationStatus, string> = {
  unverified: "bg-amber-50 text-amber-800",
  pending: "bg-sky-50 text-sky-800",
  verified: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

/**
 * Masks a donor's name, keeping only the first letter of each part.
 *
 * Enough for a staff member to recognise "M••••• N•" as the same donor they
 * are looking at, not enough to identify them from an over-the-shoulder
 * screenshot.
 */
function maskName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0) + "\u2022".repeat(Math.max(part.length - 1, 1)))
    .join(" ");
}

/**
 * Masks a contact detail, keeping only the last three characters.
 *
 * The tail of a phone number is the part that identifies the network and is
 * already spoken aloud in a clinic, while the head is the part that identifies
 * the person.
 */
function maskContact(contact: string): string {
  if (contact.length <= 3) return "\u2022".repeat(contact.length);
  return "\u2022".repeat(contact.length - 3) + contact.slice(-3);
}

export function DonationsTab() {
  const [rows, setRows] = useState<DonationRow[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [revealDonors, setRevealDonors] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<DonationRow | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  const load = () => {
    let active = true;
    fetch("/api/admin/donations", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else {
          setError(null);
          setRows(Array.isArray(data.donations) ? data.donations : []);
          setSummary(data.summary ?? null);
        }
      })
      .catch(() => {
        if (active) setError("Could not load donations.");
      });
    return () => {
      active = false;
    };
  };

  useEffect(() => {
    return load();
  }, []);

  /** Applies a patch to one row, from either the table or the detail panel. */
  const patchRow = async (
    row: DonationRow,
    patch: Record<string, unknown>,
    successMessage: string
  ) => {
    try {
      const res = await fetch(`/api/admin/donations/${row._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        donation?: DonationRow;
      };
      if (!res.ok) throw new Error(data.error || "Update failed.");
      const updated = data.donation ?? { ...row, ...(patch as Partial<DonationRow>) };
      setRows((prev) =>
        prev === null ? prev : prev.map((x) => (x._id === row._id ? { ...x, ...updated } : x))
      );
      setSelected((prev) => (prev && prev._id === row._id ? { ...prev, ...updated } : prev));
      notify(successMessage);
      // The totals change with the status and the fund, so they are re-read
      // rather than guessed at in the browser.
      load();
    } catch (e) {
      notify((e as Error).message);
    }
  };

  const donorLabel = (row: DonationRow): string => {
    const name = row.donorName?.trim();
    const contact = row.donorContact?.trim();
    if (!name && !contact) return "Not recorded";
    if (!name) return revealDonors ? contact! : maskContact(contact!);
    if (!contact) return revealDonors ? name : maskName(name);
    return revealDonors
      ? `${name} \u00b7 ${contact}`
      : `${maskName(name)} \u00b7 ${maskContact(contact)}`;
  };

  const columns: ResponsiveColumn<DonationRow>[] = [
    {
      header: "Date",
      render: (r: DonationRow) => (
        <span className="whitespace-nowrap text-sm font-semibold text-ink">
          {formatDate(r.date)}
        </span>
      ),
    },
    {
      header: "Amount",
      label: "Amount",
      render: (r: DonationRow) => (
        <span className="whitespace-nowrap text-sm font-semibold text-ink">
          {formatFcfa(r.amount)}
        </span>
      ),
    },
    {
      header: "Fund",
      label: "Fund",
      render: (r: DonationRow) => (
        <span className="text-sm text-muted">
          {donationFund(r.fund)?.name ?? r.fund}
        </span>
      ),
    },
    {
      header: "Method",
      label: "Method",
      render: (r: DonationRow) => (
        <span className="text-sm text-muted">
          {donationPaymentMethod(r.paymentMethod)?.name ?? r.paymentMethod}
        </span>
      ),
    },
    {
      header: "Transaction reference",
      label: "Reference",
      render: (r: DonationRow) => (
        <span className="break-all font-mono text-xs text-muted">
          {r.transactionReference}
        </span>
      ),
    },
    {
      header: "Verification",
      label: "Verification",
      render: (r: DonationRow) => (
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_CLASS[r.verificationStatus]}`}
        >
          {STATUS_LABEL[r.verificationStatus]}
        </span>
      ),
    },
    {
      header: "Acknowledgment",
      label: "Acknowledgment",
      render: (r: DonationRow) =>
        r.acknowledgedAt ? (
          <span className="inline-flex items-center gap-1 text-xs text-forest-700">
            <FaCircleCheck className="h-3.5 w-3.5" aria-hidden />
            {formatDate(r.acknowledgedAt)}
          </span>
        ) : (
          <span className="text-xs text-muted">Not sent</span>
        ),
    },
    {
      header: "Donor",
      label: "Donor",
      render: (r: DonationRow) => (
        <span className="text-xs text-muted">{donorLabel(r)}</span>
      ),
    },
    {
      header: "Actions",
      desktopOnly: true,
      render: (r: DonationRow) => (
        <div className="flex flex-wrap items-center gap-1.5">
          {r.verificationStatus !== "verified" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void patchRow(r, { verificationStatus: "verified" }, "Payment verified.")}
            >
              Verify
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void patchRow(r, { verificationStatus: "unverified" }, "Reopened for checking.")}
            >
              Reopen
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setSelected(r)}>
            Details
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Donation Log</p>
          {summary ? (
            <p className="text-sm text-muted">
              {summary.total.count} donation{summary.total.count === 1 ? "" : "s"} recorded
              {" \u00b7 "}
              {formatFcfa(summary.total.amount)} received
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRevealDonors((v) => !v)}
            aria-pressed={revealDonors}
          >
            {revealDonors ? (
              <FaEyeSlash className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <FaEye className="h-3.5 w-3.5" aria-hidden />
            )}
            {revealDonors ? "Hide donor details" : "Show donor details"}
          </Button>
          <Button variant="outline" size="sm" onClick={load}>
            <FaArrowRotateLeft className="h-3.5 w-3.5" aria-hidden />
            Refresh
          </Button>
        </div>
      </div>

      {toast ? (
        <p className="rounded-md border border-forest-200 bg-forest-50 px-3 py-2 text-sm text-forest-800">
          {toast}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs leading-relaxed text-sky-800">
        A screenshot is not proof of payment. Record a donation here only after checking the
        actual Mobile Money or bank record, and enter the transaction reference so the match
        can be audited. Donor names and contact details are confidential and stay masked until
        someone reveals them. There is no delete: a wrong entry is corrected, not removed.
      </p>

      {/* ---------- Totals, split by fund ---------- */}
      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total received"
            amount={summary.total.amount}
            count={summary.total.count}
            tone="forest"
          />
          <SummaryCard
            label="Patient Assistance Fund"
            amount={summary.byFund["patient-assistance"]?.amount ?? 0}
            count={summary.byFund["patient-assistance"]?.count ?? 0}
          />
          <SummaryCard
            label="S19 Development Fund"
            amount={summary.byFund["clinic-development"]?.amount ?? 0}
            count={summary.byFund["clinic-development"]?.count ?? 0}
          />
          <div className="rounded-lg border border-line bg-white p-4 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
              Awaiting verification
            </p>
            <p className="mt-1 font-display text-xl font-bold text-ink">
              {summary.awaitingVerification}
            </p>
            <p className="mt-1 text-xs text-muted">
              {summary.awaitingAcknowledgment} verified but not yet acknowledged
            </p>
          </div>
        </div>
      ) : null}

      {/* ---------- Record a donation ---------- */}
      {showForm ? (
        <RecordForm
          onCancel={() => setShowForm(false)}
          onCreated={(message) => {
            setShowForm(false);
            notify(message);
            load();
          }}
        />
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
          <FaPlus className="h-3.5 w-3.5" aria-hidden />
          Record a donation
        </Button>
      )}

      {/* ---------- The log ---------- */}
      {rows === null ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : (
        <ResponsiveTable
          minWidthClassName="min-w-[980px]"
          rows={rows}
          rowKey={(r) => r._id}
          columns={columns}
          renderTile={(r) => (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{formatFcfa(r.amount)}</p>
                  <p className="text-xs text-muted">{formatDate(r.date)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_CLASS[r.verificationStatus]}`}
                >
                  {STATUS_LABEL[r.verificationStatus]}
                </span>
              </div>
              <div className="space-y-0.5 text-xs text-muted">
                <p>{donationFund(r.fund)?.name ?? r.fund}</p>
                <p>{donationPaymentMethod(r.paymentMethod)?.name ?? r.paymentMethod}</p>
                <p className="break-all font-mono">{r.transactionReference}</p>
                <p>{donorLabel(r)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 border-t border-forest-50 pt-2.5">
                {r.verificationStatus !== "verified" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void patchRow(r, { verificationStatus: "verified" }, "Payment verified.")}
                  >
                    Verify
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void patchRow(r, { verificationStatus: "unverified" }, "Reopened for checking.")}
                  >
                    Reopen
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setSelected(r)}>
                  Details
                </Button>
              </div>
            </>
          )}
          emptyState={
            <p className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted">
              <FaHandHoldingHeart className="h-4 w-4" aria-hidden /> No donations recorded yet.
            </p>
          }
        />
      )}

      {selected ? (
        <DetailPanel
          donation={selected}
          revealDonors={revealDonors}
          onClose={() => setSelected(null)}
          onPatch={(patch, message) => void patchRow(selected, patch, message)}
        />
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  amount,
  count,
  tone,
}: {
  label: string;
  amount: number;
  count: number;
  tone?: "forest";
}) {
  return (
    <div
      className={`rounded-lg border p-4 shadow-card ${
        tone === "forest" ? "border-forest-200 bg-forest-50" : "border-line bg-white"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-ink">{formatFcfa(amount)}</p>
      <p className="mt-1 text-xs text-muted">
        {count} donation{count === 1 ? "" : "s"}
      </p>
    </div>
  );
}

/**
 * The staff form that files a donation.
 *
 * It is deliberately not a public form. A donor cannot file their own
 * donation, because the brief requires the clinic to check the actual payment
 * record first.
 */
function RecordForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (message: string) => void;
}) {
  const [date, setDate] = useState(() => localDateString());
  const [amount, setAmount] = useState("");
  const [fund, setFund] = useState<DonationFundId>("patient-assistance");
  const [paymentMethod, setPaymentMethod] = useState<DonationPaymentMethodId>("mtn-momo");
  const [transactionReference, setTransactionReference] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("unverified");
  const [donorName, setDonorName] = useState("");
  const [donorContact, setDonorContact] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch("/api/admin/donations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          amount,
          fund,
          paymentMethod,
          transactionReference,
          verificationStatus,
          donorName,
          donorContact,
          notes,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not record the donation.");
      setAmount("");
      setTransactionReference("");
      setDonorName("");
      setDonorContact("");
      setNotes("");
      onCreated("Donation recorded.");
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border border-forest-200 bg-forest-50/50 p-4 sm:p-5"
    >
      <p className="font-display text-base font-semibold text-ink">Record a donation</p>
      <p className="mt-1 text-sm text-muted">
        Enter the payment exactly as it appears in the Mobile Money or bank record.
      </p>
      {formError ? (
        <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Date received" required>
          <DateField value={date} onChange={setDate} required />
        </Field>
        <Field label="Amount (FCFA)" required>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="5000"
            required
          />
        </Field>
        <Field label="Donation purpose" required>
          <Select value={fund} onChange={(e) => setFund(e.target.value as DonationFundId)}>
            {DONATION_FUNDS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Payment method" required>
          <Select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as DonationPaymentMethodId)}
          >
            {DONATION_PAYMENT_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Transaction reference"
          required
          hint="The Mobile Money ID or bank reference, so the payment can be matched later."
        >
          <Input
            value={transactionReference}
            onChange={(e) => setTransactionReference(e.target.value)}
            placeholder="MP260722.1234.A12345"
            required
            maxLength={120}
          />
        </Field>
        <Field label="Verification status">
          <Select
            value={verificationStatus}
            onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
          >
            <option value="unverified">Unverified</option>
            <option value="pending">Checking</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </Select>
        </Field>
        <Field label="Donor name" hint="Confidential. Never published.">
          <Input
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            maxLength={160}
          />
        </Field>
        <Field label="Donor contact" hint="WhatsApp number or email. Confidential.">
          <Input
            value={donorContact}
            onChange={(e) => setDonorContact(e.target.value)}
            maxLength={160}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Notes" hint="What was checked, and what is still outstanding.">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
        </Field>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Recording\u2026" : "Record donation"}
        </Button>
      </div>
    </form>
  );
}

/**
 * One donation in full: the fields the brief lists, the notes staff keep about
 * what was checked, and the acknowledgment they sent.
 */
function DetailPanel({
  donation,
  revealDonors,
  onClose,
  onPatch,
}: {
  donation: DonationRow;
  revealDonors: boolean;
  onClose: () => void;
  onPatch: (patch: Record<string, unknown>, message: string) => void;
}) {
  const [notes, setNotes] = useState(donation.notes ?? "");
  const [acknowledgment, setAcknowledgment] = useState(donation.acknowledgment ?? "");

  const donorName = donation.donorName?.trim();
  const donorContact = donation.donorContact?.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Donation details</h3>
            <p className="mt-1 text-sm text-muted">
              {formatFcfa(donation.amount)} {"\u00b7"} {formatDate(donation.date)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line-strong bg-white text-muted hover:text-ink"
          >
            <FaXmark className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <Detail label="Donation purpose" value={donationFund(donation.fund)?.name ?? donation.fund} />
          <Detail
            label="Payment method"
            value={donationPaymentMethod(donation.paymentMethod)?.name ?? donation.paymentMethod}
          />
          <Detail label="Transaction reference" value={donation.transactionReference} mono />
          <Detail
            label="Verification status"
            value={STATUS_LABEL[donation.verificationStatus]}
          />
          <Detail
            label="Donor"
            value={
              donorName || donorContact
                ? revealDonors
                  ? [donorName, donorContact].filter(Boolean).join(" \u00b7 ")
                  : [donorName ? maskName(donorName) : "", donorContact ? maskContact(donorContact) : ""]
                      .filter(Boolean)
                      .join(" \u00b7 ")
                : "Not recorded"
            }
          />
          <Detail
            label="Acknowledgment"
            value={donation.acknowledgedAt ? `Sent ${formatDate(donation.acknowledgedAt)}` : "Not sent"}
          />
        </dl>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink">Verification</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Check the actual Mobile Money or bank record before marking a donation as verified.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPatch({ verificationStatus: "verified" }, "Payment verified.")}
              disabled={donation.verificationStatus === "verified"}
            >
              <FaCircleCheck className="h-3.5 w-3.5" aria-hidden />
              Verify
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPatch({ verificationStatus: "pending" }, "Marked as being checked.")}
              disabled={donation.verificationStatus === "pending"}
            >
              <FaClipboardCheck className="h-3.5 w-3.5" aria-hidden />
              Mark as checking
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => onPatch({ verificationStatus: "rejected" }, "Donation rejected.")}
              disabled={donation.verificationStatus === "rejected"}
            >
              <FaCircleExclamation className="h-3.5 w-3.5" aria-hidden />
              Reject
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPatch({ verificationStatus: "unverified" }, "Reopened for checking.")}
            >
              Reopen
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <Field label="Notes" hint="What was checked against the payment record.">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
          </Field>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => onPatch({ notes }, "Notes saved.")}
          >
            Save notes
          </Button>
        </div>

        <div className="mt-5">
          <Field label="Acknowledgment" hint="What was sent to the donor, if anything.">
            <Textarea
              value={acknowledgment}
              onChange={(e) => setAcknowledgment(e.target.value)}
              maxLength={1000}
            />
          </Field>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onPatch(
                  { acknowledgment, acknowledged: true },
                  "Donation marked as acknowledged."
                )
              }
              disabled={Boolean(donation.acknowledgedAt)}
            >
              <FaReceipt className="h-3.5 w-3.5" aria-hidden />
              Mark acknowledged
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => onPatch({ acknowledged: false }, "Acknowledgment withdrawn.")}
              disabled={!donation.acknowledgedAt}
            >
              Undo acknowledgment
            </Button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <FaLock className="h-3.5 w-3.5" aria-hidden />
            Donor details stay confidential and are never published.
          </p>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</dt>
      <dd className={`mt-0.5 text-sm text-ink ${mono ? "break-all font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
