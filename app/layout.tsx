import type { Metadata, Viewport } from "next";
import { Montserrat, Libre_Baskerville } from "next/font/google";
import { Providers } from "@/components/providers";
import { RouteProgress } from "@/components/ui/route-progress";
import { AnnouncementBar, SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteChromeGate } from "@/components/layout/site-chrome-gate";
import { WhatsAppFloat } from "@/components/sections/cta-band";
import { LanguageFab } from "@/components/i18n/language-fab";
import { CLINIC } from "@/lib/site";
import { getServerLocale } from "@/lib/i18n-server";
import { SITE_URL, SEO_KEYWORDS, clinicJsonLd } from "@/lib/seo";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${CLINIC.brand} | ${CLINIC.tagline}`,
    template: `%s | ${CLINIC.brand}`,
  },
  description: `${CLINIC.tagline}. ${CLINIC.mission} Located in Bafoussam, West Region, Cameroon — with telehealth consultations and worldwide DHL shipping.`,
  keywords: SEO_KEYWORDS,
  applicationName: CLINIC.brand,
  authors: [{ name: CLINIC.brand, url: SITE_URL }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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
    alternateLocale: ["fr_FR"],
    url: SITE_URL,
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
  twitter: {
    card: "summary_large_image",
    title: `${CLINIC.brand} | ${CLINIC.tagline}`,
    description: CLINIC.mission,
    images: ["/open-graph-thumbnail.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0F5D2E",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();
  return (
    <html lang={locale} className={`${montserrat.variable} ${libreBaskerville.variable}`}>
      <body>
        <RouteProgress />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(clinicJsonLd()).replace(/</g, "\\u003c"),
          }}
        />
        <Providers initialLocale={locale}>
          <SiteChromeGate>
            <AnnouncementBar />
            <SiteHeader />
          </SiteChromeGate>
          <main>{children}</main>
          <SiteChromeGate>
            <SiteFooter />
            <WhatsAppFloat />
            <LanguageFab />
          </SiteChromeGate>
        </Providers>
      </body>
    </html>
  );
}