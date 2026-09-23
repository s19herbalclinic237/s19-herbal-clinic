"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Field, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { formatFcfa } from "@/lib/utils";
import { formatDate, OrderStatusBadge } from "@/components/account/badges";
import { FaArrowRotateLeft, FaBoxesStacked, FaEnvelope } from "react-icons/fa6";

interface AdminUserRef {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface AdminOrder {
  _id: string;
  orderReference: string;
  status: string;
  total: number;
  subtotal: number;
  shippingFee: number;
  items: { name: string; quantity: number; price: number }[];
  customer: { fullName: string; email: string; phone: string };
  shipping: { mode: string; city?: string; address: string };
  payment: { method: string; status: string; reference?: string };
  user?: AdminUserRef | null;
  createdAt: string;
}

const STATUSES = [
  "Pending",
  "Processing",
  "Ready for Pickup",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
] as const;

export function AdminOrdersTab() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [composeId, setComposeId] = useState<string | null>(null);
  const [composeText, setComposeText] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = (status = filter) => {
    let active = true;
    const url = status === "All" ? "/api/admin/orders" : `/api/admin/orders?status=${encodeURIComponent(status)}`;
    fetch(url, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setOrders(Array.isArray(data.orders) ? data.orders : []);
      })
      .catch(() => {
        if (active) setError("Could not load orders.");
      });
    return () => {
      active = false;
    };
  };

  useEffect(() => {
    return load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  const patchOrder = async (id: string, body: Record<string, unknown>, message: string) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        order?: Partial<AdminOrder>;
      };
      if (!res.ok) throw new Error(data.error || "Update failed.");
      setOrders((prev) =>
        prev === null
          ? prev
          : prev.map((o) =>
              o._id === id
                ? {
                    ...o,
                    status: data.order?.status ?? o.status,
                    payment: { ...o.payment, ...(data.order?.payment ?? {}) },
                  }
                : o
            )
      );
      notify(message);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const refresh = () => {
    setOrders(null);
    load();
  };

  const sendOrderMessage = async (o: AdminOrder, e: FormEvent) => {
    e.preventDefault();
    const text = composeText.trim();
    if (!o.user?._id || text.length < 2) {
      notify("Please write a message first.");
      return;
    }
    setSendingId(o._id);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: o.user._id,
          subject: `About your order ${o.orderReference}`,
          text,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not send the message.");
      setComposeId(null);
      setComposeText("");
      notify(`Message sent to ${o.customer.fullName}.`);
    } catch (err) {
      notify((err as Error).message);
    } finally {
      setSendingId(null);
    }
  };

  const counts = useCounts(orders);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Manage Orders</p>
          <p className="text-sm text-muted">Update order status and payment records.</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <FaArrowRotateLeft className="h-3.5 w-3.5" aria-hidden />
          Refresh
        </Button>
      </div>

      {toast ? (
        <p className="rounded-md border border-forest-200 bg-forest-50 px-3 py-2 text-sm text-forest-800">{toast}</p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {["All", ...STATUSES].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setOrders(null);
              setFilter(s);
            }}
            className={
              filter === s
                ? "rounded-full border border-forest-700 bg-forest-800 px-3 py-1 text-xs font-semibold text-white"
                : "rounded-full border border-line-strong bg-white px-3 py-1 text-xs font-medium text-muted hover:border-forest-300 hover:text-ink"
            }
          >
            {s}
            {s !== "All" && counts[s] ? <span className="ml-1 opacity-70">({counts[s]})</span> : null}
          </button>
        ))}
      </div>

      {orders === null ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <FaBoxesStacked className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">
            {filter === "All" ? "No orders have been placed yet." : `No orders with status "${filter}".`}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o._id} className="rounded-lg border border-line bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{o.orderReference}</p>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDate(o.createdAt)} · {o.customer.fullName} · {o.customer.phone}
                    {o.user?.email ? ` · account: ${o.user.email}` : " · guest"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {o.shipping.mode}
                    {o.shipping.city ? ` · ${o.shipping.city}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {o.items.reduce((n, i) => n + i.quantity, 0)} items · subtotal {formatFcfa(o.subtotal)}
                    {o.shippingFee > 0 ? ` · delivery ${formatFcfa(o.shippingFee)}` : ""} · total{" "}
                    <span className="font-semibold text-ink">{formatFcfa(o.total)}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <label className="text-xs font-medium text-muted">Order status</label>
                  <Select
                    value={o.status}
                    disabled={savingId === o._id}
                    onChange={(e) => void patchOrder(o._id, { status: e.target.value }, `Status set to "${e.target.value}".`)}
                    className="min-w-44"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-line pt-3 text-sm">
                <label className="flex items-center gap-2 font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={o.payment.status === "Paid"}
                    disabled={savingId === o._id}
                    onChange={(e) =>
                      void patchOrder(o._id, { paymentStatus: e.target.checked ? "Paid" : "Unpaid" }, e.target.checked ? "Marked as paid." : "Marked as unpaid.")
                    }
                    className="h-4 w-4 accent-forest-700"
                  />
                  Payment {o.payment.status === "Paid" ? "received" : "unpaid"}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted">Paid by {o.payment.method}</span>
                  <input
                    className="w-40 rounded-md border border-line-strong bg-white px-2 py-1 text-xs text-ink focus:border-forest-500 focus:outline-none"
                    defaultValue={o.payment.reference || ""}
                    placeholder="Reference / receipt no."
                    disabled={savingId === o._id}
                    onBlur={(e) => {
                      if ((e.target.value || "").trim() !== (o.payment.reference || "").trim()) {
                        void patchOrder(o._id, { paymentReference: e.target.value }, "Payment reference saved.");
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                  />
                </div>
                <span className="text-xs text-muted">
                  {formatDate(o.createdAt)} · {o.shipping.address}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                {o.user?._id ? (
                  <button
                    type="button"
                    onClick={() => {
                      setComposeId((cur) => (cur === o._id ? null : o._id));
                      setComposeText("");
                    }}
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-xs font-semibold text-forest-800 transition-colors hover:border-forest-400"
                  >
                    <FaEnvelope className="h-3 w-3" aria-hidden />
                    {composeId === o._id ? "Close message" : "Message customer"}
                  </button>
                ) : (
                  <span className="text-xs text-muted">Guest order — customer has no account to message.</span>
                )}
              </div>

              {composeId === o._id && o.user?._id ? (
                <form
                  onSubmit={(e) => void sendOrderMessage(o, e)}
                  className="mt-3 rounded-lg border border-forest-200 bg-forest-50/50 p-4"
                >
                  <Field label={`Message about ${o.orderReference}`}>
                    <Textarea
                      rows={3}
                      value={composeText}
                      onChange={(e) => setComposeText(e.target.value)}
                      placeholder={`e.g. Your order is ready for pickup tomorrow at the clinic.`}
                      maxLength={2000}
                    />
                  </Field>
                  <div className="mt-3 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setComposeId(null);
                        setComposeText("");
                      }}
                      className="text-sm font-semibold text-muted hover:text-ink"
                    >
                      Cancel
                    </button>
                    <Button type="submit" size="sm" disabled={sendingId === o._id}>
                      {sendingId === o._id ? "Sending..." : "Send message"}
                    </Button>
                  </div>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function useCounts(orders: AdminOrder[] | null) {
  if (!orders) return {} as Record<string, number>;
  const counts: Record<string, number> = {};
  for (const o of orders) {
    counts[o.status] = (counts[o.status] || 0) + 1;
  }
  return counts;
}