"use client";

import type { AuthUser } from "@/lib/auth";

export function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "S19"
  );
}

/**
 * Renders a circular user avatar. When the user has uploaded a photo it is
 * shown, otherwise the initials fall back to the classic gold-ringed monogram.
 *
 * `className` controls size + circle chrome (eg. `h-16 w-16 border-2
 * border-gold-400`). `textClassName` styles the initials inside the fallback
 * monogram.
 */
export function UserAvatar({
  user,
  className,
  textClassName = "font-display font-bold text-gold-300",
}: {
  user?: Pick<AuthUser, "name" | "avatar"> | null;
  className?: string;
  textClassName?: string;
}) {
  const baseClassName = `shrink-0 overflow-hidden rounded-full bg-forest-800 ${className ?? ""}`;
  if (user?.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatar} alt={`${user.name ?? "User"} avatar`} className={`object-cover ${baseClassName}`} />;
  }
  return (
    <span
      className={`flex items-center justify-center ${
        textClassName ?? ""
      } ${baseClassName}`}
      aria-hidden={user ? undefined : true}
    >
      {initialsOf(user?.name ?? "")}
    </span>
  );
}