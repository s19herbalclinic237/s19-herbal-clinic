"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, useState } from "react";
import { Container } from "@/components/ui/container";
import { buttonLinkClasses } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { CLINIC } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import { cn } from "@/lib/utils";
import {
  FaBagShopping,
  FaBars,
  FaXmark,
  FaPhone,
  FaInstagram,
  FaFacebookF,
  FaRegUser,
} from "react-icons/fa6";

const subscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

const nav = [
  { label: "Home", href: "/" },
  { label: "Programs", href: "/programs" },
  { label: "Tele-Health", href: "/telehealth" },
  { label: "Shop", href: "/shop" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function AnnouncementBar() {
  return (
    <div className="border-b border-forest-900 bg-forest-950">
      <Container className="flex h-9 items-center justify-between gap-4 text-xs text-forest-100">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold-400" />
          </span>
          <span className="hidden truncate text-forest-300 sm:inline">
            {CLINIC.slogan} · Bafoussam, Cameroon
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 sm:flex">
            <a
              href={CLINIC.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="S19 on Instagram"
              className="flex h-6 w-6 items-center justify-center rounded-full border border-forest-700 text-forest-300 transition-colors hover:border-gold-400 hover:text-gold-400"
            >
              <FaInstagram className="h-3 w-3" aria-hidden />
            </a>
            <a
              href={CLINIC.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="S19 on Facebook"
              className="flex h-6 w-6 items-center justify-center rounded-full border border-forest-700 text-forest-300 transition-colors hover:border-gold-400 hover:text-gold-400"
            >
              <FaFacebookF className="h-3 w-3" aria-hidden />
            </a>
          </div>
          <a href={`tel:${CLINIC.phoneHref}`} className="flex items-center gap-1.5 font-medium text-white hover:text-gold-400">
            <FaPhone className="h-3 w-3 shrink-0 text-gold-400" aria-hidden />
            {CLINIC.phone}
          </a>
        </div>
      </Container>
    </div>
  );
}

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <img
        src={S19_ASSETS.logos.fullLight}
        alt={`${CLINIC.brand} logo`}
        className="h-10 w-auto transition-transform group-hover:scale-[1.03] md:h-11"
      />
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const mounted = useMounted();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4 md:h-[68px]">
        <Logo />

        <nav className="hidden items-center gap-1 xl:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                isActive(item.href)
                  ? "bg-forest-100 text-forest-900"
                  : "text-ink/80 hover:bg-forest-50 hover:text-forest-800"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            aria-label="Shopping cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-line-strong bg-white text-ink shadow-sm transition-colors hover:border-forest-500 hover:text-forest-700"
          >
            <FaBagShopping className="h-4 w-4" aria-hidden />
            {mounted && count > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-forest-950 ring-2 ring-cream">
                {count}
              </span>
            ) : null}
          </Link>
          <Link
            href="/account"
            aria-label="Account"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line-strong bg-white text-ink shadow-sm transition-colors hover:border-forest-500 hover:text-forest-700"
          >
            <FaRegUser className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/contact" className={cn(buttonLinkClasses("primary", "sm"), "hidden sm:inline-flex")}>
            Book Consultation
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line-strong bg-white text-ink xl:hidden"
          >
            {open ? <FaXmark className="h-4 w-4" aria-hidden /> : <FaBars className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </Container>

      {open ? (
        <div className="border-t border-line bg-cream xl:hidden">
          <Container className="flex flex-col py-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "border-b border-line py-3 text-sm font-semibold last:border-0",
                  isActive(item.href) ? "text-forest-800" : "text-ink/80"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/contact" onClick={() => setOpen(false)} className={cn(buttonLinkClasses("primary", "md"), "mt-3")}>
              Book Consultation
            </Link>
            <Link href="/account" onClick={() => setOpen(false)} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-forest-800">
              <FaRegUser className="h-4 w-4" aria-hidden />
              My Account
            </Link>
          </Container>
        </div>
      ) : null}
    </header>
  );
}