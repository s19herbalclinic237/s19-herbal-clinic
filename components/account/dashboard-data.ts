"use client";

import { useEffect, useState } from "react";

/**
 * The patient-facing tabs of the dashboard. Admin tabs are handled by the
 * dashboard screen shell only.
 */
export type PatientTabId =
  | "overview"
  | "appointments"
  | "orders"
  | "messages"
  | "records"
  | "prescriptions"
  | "treatment"
  | "family"
  | "testimonials"
  | "settings";

export interface OrderSummary {
  _id: string;
  orderReference: string;
  status: string;
  total: number;
  items: { name: string; quantity: number }[];
  createdAt: string;
}

export interface MessageView {
  _id: string;
  subject: string;
  body: string;
  read: boolean;
  author?: "admin" | "user";
  thread?: string;
  createdAt: string;
}

export interface TestimonialView {
  _id: string;
  name: string;
  city: string;
  country?: string;
  program: string;
  text: string;
  status: string;
  createdAt: string;
}

export type TreatmentPlanPhase = "active" | "expired" | "scheduled" | "completed";

export interface TreatmentPlanView {
  _id: string;
  forMember?: string;
  title: string;
  program?: string;
  startDate: string;
  endDate: string;
  notes?: string;
  phase: TreatmentPlanPhase;
  /** Whole days the plan spans (start..end, inclusive). */
  days: number;
  /** Whole months the plan spans ("Y" in "Month X of Y"). */
  months: number;
  /** Current month of treatment (1-based) or null when not started. */
  month: number | null;
  /** Day of treatment (1-based) or null when not started. */
  day: number | null;
  daysLeft: number;
  /** Fraction of the period elapsed, 0..1. */
  elapsed: number;
  /** Clinician-driven lifecycle; plans stay "active" until closed. */
  status: "active" | "completed";
  completedAt?: string;
  completionReview?: {
    improvements?: string;
    resolved?: string;
    unresolvedProblems?: string;
    complications?: string;
    followUpLabs?: string;
    outcome: "maintenance" | "extended" | "completed" | "discontinued";
    notes?: string;
  };
  monitoring?: {
    glucose: boolean;
    fastingStart: string;
    fastingEnd: string;
    postLunchStart: string;
    postLunchEnd: string;
  };
}

export interface DashboardData {
  orders: OrderSummary[];
  messages: MessageView[];
  testimonials: TestimonialView[];
  plans: TreatmentPlanView[];
  unreadCount: number;
  loading: boolean;
}

async function readJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Loads the three data sets that power the dashboard overview (orders,
 * messages + unread count, and testimonials) in a single pass so the shell
 * and overview share one request instead of duplicating fetches.
 */
export function useDashboardData(): DashboardData {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialView[]>([]);
  const [plans, setPlans] = useState<TreatmentPlanView[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [oRes, mRes, tRes, pRes] = await Promise.all([
        readJson<{ orders?: OrderSummary[] }>("/api/orders"),
        readJson<{ messages?: MessageView[]; unreadCount?: number }>("/api/messages"),
        readJson<{ testimonials?: TestimonialView[] }>("/api/testimonials"),
        readJson<{ plans?: TreatmentPlanView[] }>("/api/treatment-plans"),
      ]);
      if (!active) return;
      const o = Array.isArray(oRes?.orders) ? (oRes!.orders as OrderSummary[]) : [];
      const m = Array.isArray(mRes?.messages) ? (mRes!.messages as MessageView[]) : [];
      const t = Array.isArray(tRes?.testimonials) ? (tRes!.testimonials as TestimonialView[]) : [];
      const p = Array.isArray(pRes?.plans) ? (pRes!.plans as TreatmentPlanView[]) : [];
      setOrders(o);
      setMessages(m);
      setTestimonials(t);
      setPlans(p);
      setUnreadCount(
        typeof mRes?.unreadCount === "number" ? mRes.unreadCount : m.filter((x) => !x.read).length
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { orders, messages, testimonials, plans, unreadCount, loading };
}