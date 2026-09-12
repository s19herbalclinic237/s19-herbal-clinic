import type { Metadata, Viewport } from "next";
import { Montserrat, Libre_Baskerville } from "next/font/google";
import { Providers } from "@/components/providers";
import { AnnouncementBar, SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { WhatsAppFloat } from "@/components/sections/cta-band";
import { CLINIC } from "@/lib/site";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre-baskerville",
  display: "swap",
});

function normalizeSiteUrl(raw: string | undefined): URL {
  const fallback = "https://s19herbalclinic.com";
  const trimmed = raw?.trim();
  if (!trimmed) return new URL(fallback);
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme);
  } catch {
    return new URL(fallback);
  }
}

export const metadata: Metadata = {
  metadataBase: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: `${CLINIC.brand} | ${CLINIC.tagline}`,
    template: `%s | ${CLINIC.brand}`,
  },
  description: CLINIC.tagline + ". " + CLINIC.mission,
  keywords: [
    "S19 Herbal Clinic",
    "herbal medicine Cameroon",
    "herbalist Bafoussam",
    "science-based herbalism",
    "root-cause healthcare",
    "telehealth",
    "herbal remedy",
    "diabetes herbal support",
    "hypertension herbal support",
    "natural healing",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon1.png", type: "image/png" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/icon0.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "any", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    siteName: CLINIC.brand,
    type: "website",
    locale: "en_US",
    title: `${CLINIC.brand} | ${CLINIC.tagline}`,
    description: CLINIC.mission,
    images: [
      {
        url: "/open-graph-thumbnail.png",
        width: 1200,
        height: 630,
        alt: CLINIC.brand,
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0F5D2E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${libreBaskerville.variable}`}>
      <body>
        <Providers>
          <AnnouncementBar />
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
          <WhatsAppFloat />
        </Providers>
      </body>
    </html>
  );
}