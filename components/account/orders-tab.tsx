"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatFcfa } from "@/lib/utils";
import { useLocale } from "@/components/i18n/locale-provider";
import { formatDate, OrderStatusBadge } from "@/components/account/badges";
import { FaBoxOpen } from "react-icons/fa6";

interface OrderSummary {
  _id: string;
  orderReference: string;
  status: string;
  total: number;
  items: { name: string; quantity: number }[];
  createdAt: string;
}

function useOrders() {
  const { t } = useLocale();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/orders", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setOrders(Array.isArray(data.orders) ? data.orders : []);
      })
      .catch(() => {
        if (active) setError(t("dash.orders.loadError"));
      });
    return () => {
      active = false;
    };
  }, [t]);

  return { orders, error };
}

export function OrdersTab() {
  const { t } = useLocale();
  const { orders, error } = useOrders();

  if (error) {
    return <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  }

  if (!orders) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-white p-8 text-center">
        <FaBoxOpen className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
        <p className="mt-3 text-sm text-muted">{t("dash.orders.empty")}</p>
        <Link
          href="/shop"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-forest-800 px-5 text-sm font-semibold text-white hover:bg-forest-900"
        >
          {t("dash.orders.browse")}
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((o) => {
        const count = o.items.reduce((n, i) => n + i.quantity, 0);
        return (
          <li key={o._id} className="rounded-lg border border-line bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{o.orderReference}</p>
                <p className="text-xs text-muted">
                  {formatDate(o.createdAt)} ·{" "}
                  {t(count === 1 ? "dash.orders.item" : "dash.orders.items", { n: count })}
                </p>
              </div>
              <OrderStatusBadge status={o.status} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <p className="text-sm font-bold text-forest-800">{formatFcfa(o.total)}</p>
              <Link href={`/order/${o.orderReference}`} className="text-sm font-semibold text-forest-700 underline underline-offset-2">
                {t("dash.orders.viewTrack")}
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}