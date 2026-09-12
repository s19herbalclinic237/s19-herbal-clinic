import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-forest-200 bg-forest-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-forest-800",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Kicker({
  children,
  dark,
  center,
  className,
}: {
  children: React.ReactNode;
  dark?: boolean;
  center?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.24em]",
        dark ? "text-gold-400" : "text-forest-700",
        center && "justify-center",
        className
      )}
    >
      <span className={cn("h-px w-8", dark ? "bg-gold-400/70" : "bg-forest-600/60")} aria-hidden />
      {children}
    </p>
  );
}

export function Eyebrow({
  children,
  className,
  dark,
}: {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <p
      className={cn(
        "text-xs font-bold uppercase tracking-[0.22em]",
        dark ? "text-gold-400" : "text-forest-700",
        className
      )}
    >
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  dark,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  dark?: boolean;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? <Eyebrow dark={dark}>{eyebrow}</Eyebrow> : null}
      <h2 className={cn("mt-3", dark && "text-white")}>{title}</h2>
      {lead ? (
        <p
          className={cn(
            "mt-4 max-w-xl text-[15px] leading-relaxed",
            dark ? "text-forest-200" : "text-muted",
            align === "center" && "mx-auto"
          )}
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}