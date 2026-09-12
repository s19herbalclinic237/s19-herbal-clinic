import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CLINIC } from "@/lib/site";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFcfa(value: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(value))} ${CLINIC.currency}`;
}

export function formatPrice(price: number, unit?: string): string {
  if (price <= 0) return "Contact S19 for pricing";
  const base = formatFcfa(price);
  return unit ? `${unit} - ${base}` : base;
}

export function waLink(message: string): string {
  return `https://wa.me/${CLINIC.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function generateOrderReference(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `S19-${datePart}-${rand}`;
}