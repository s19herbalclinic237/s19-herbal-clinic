"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { PageHero } from "@/components/ui/page-hero";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { S19_ASSETS } from "@/lib/site-assets";
import { FaTruckFast, FaMagnifyingGlass } from "react-icons/fa6";

export default function TrackOrderPage() {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim() || !email.trim()) {
      toast.error("Enter your order reference and email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: reference.trim(), email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Not found");
      router.push(`/order/${json.orderReference}?tracked=1`);
    } catch {
      toast.error("No order matches that reference and email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Order Tracking"
        title="Track Your Order"
        lead="Enter the order reference from your confirmation and the email you used at checkout."
        compact
        image={S19_ASSETS.photos.shopCounter}
      />
      <div className="border-t border-line bg-mist">
        <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-forest-700">
            <FaTruckFast className="h-5 w-5" aria-hidden />
            <h2 className="text-lg font-semibold">Where is my order?</h2>
          </div>
          <form onSubmit={submit} className="mt-5 space-y-4 rounded-lg border border-line bg-white p-5">
            <Field label="Order Reference" required>
              <Input required value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. S19-20260101-AB12C" />
            </Field>
            <Field label="Email Used at Checkout" required>
              <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </Field>
            <Button type="submit" className="w-full" disabled={loading}>
              <FaMagnifyingGlass className="h-3.5 w-3.5" aria-hidden />
              {loading ? "Searching..." : "Track Order"}
            </Button>
            <p className="text-center text-xs text-muted">
              Orders are confirmed by our clinic on WhatsApp and SMS. Delivery status updates are
              shared in real time with you.
            </p>
          </form>
        </div>
      </div>
    </>
  );
}