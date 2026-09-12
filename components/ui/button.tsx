import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "dark" | "gold" | "glass";
type Size = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-forest-800 text-white hover:bg-forest-900 border border-forest-800 shadow-md shadow-forest-800/20",
  secondary: "bg-white text-forest-800 hover:bg-forest-50 border border-line-strong shadow-sm",
  outline:
    "bg-white border border-line-strong text-ink hover:border-forest-500 hover:text-forest-800 shadow-sm",
  ghost: "text-forest-800 hover:bg-forest-100/70 border border-transparent",
  dark: "bg-forest-950 text-white hover:bg-forest-900 border border-forest-950 shadow-md shadow-forest-950/20",
  gold: "bg-gold-500 text-forest-950 hover:bg-gold-400 border border-gold-500 shadow-md shadow-gold-500/25",
  glass:
    "bg-white/10 border border-white/25 text-white hover:bg-white/15 backdrop-blur-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
  xl: "h-12 px-6 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
  )
);
Button.displayName = "Button";

export function buttonLinkClasses(
  variant: Variant = "primary",
  size: Size = "md",
  className?: string
) {
  return cn(base, variants[variant], sizes[size], "inline-flex", className);
}