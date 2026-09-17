import { cn, formatEur, formatFcfa, formatUsd } from "@/lib/utils";

export function MultiCurrencyPrice({
  price,
  unit,
  size = "md",
  className,
}: {
  price: number;
  unit?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (price <= 0) {
    return (
      <span className={cn("font-semibold text-forest-800", size === "lg" ? "text-lg" : "text-sm", className)}>
        Contact S19 for pricing
      </span>
    );
  }
  return (
    <div className={className}>
      <p className={cn("font-bold text-forest-800", size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base")}>
        {unit ? <span className="mr-1.5 font-semibold text-muted">{unit} ·</span> : null}
        {formatFcfa(price)}
      </p>
      <p className={cn("text-muted", size === "lg" ? "text-[13px]" : "text-[11px]")}>
        ≈ {formatUsd(price)} · {formatEur(price)}
      </p>
    </div>
  );
}