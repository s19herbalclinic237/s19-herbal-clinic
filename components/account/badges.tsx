"use client";

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const orderStatusClasses: Record<string, string> = {
  Pending: "border-amber-300 bg-amber-50 text-amber-800",
  Processing: "border-sky-300 bg-sky-50 text-sky-800",
  "Ready for Pickup": "border-teal-300 bg-teal-50 text-teal-800",
  "Out for Delivery": "border-indigo-300 bg-indigo-50 text-indigo-800",
  Delivered: "border-forest-300 bg-forest-50 text-forest-800",
  Cancelled: "border-red-300 bg-red-50 text-red-700",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        orderStatusClasses[status] || "border-line-strong bg-cream text-muted"
      }`}
    >
      {status}
    </span>
  );
}

const testimonialStatusClasses: Record<string, string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-800",
  approved: "border-forest-300 bg-forest-50 text-forest-800",
  rejected: "border-red-300 bg-red-50 text-red-700",
};

const testimonialStatusLabels: Record<string, string> = {
  pending: "Pending review",
  approved: "Approved & live",
  rejected: "Not approved",
};

export function TestimonialStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        testimonialStatusClasses[status] || "border-line-strong bg-cream text-muted"
      }`}
    >
      {testimonialStatusLabels[status] || status}
    </span>
  );
}