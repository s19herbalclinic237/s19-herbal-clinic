import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { CLINIC } from "@/lib/site";
import { S19_ASSETS } from "@/lib/site-assets";
import { serverT } from "@/lib/i18n-server";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverT();
  return {
    title: t("cookies.metaTitle"),
    description: t("cookies.metaDescription"),
  };
}

const sectionKeys = [
  "cookies.section1",
  "cookies.section2",
  "cookies.section3",
  "cookies.section4",
  "cookies.section5",
  "cookies.section6",
] as const;

const sections = [
  {
    body: `These are strictly necessary for the site to work: your session cookie (keeps you signed in, e.g. "s19_session"), and security measures that protect login and checkout. They cannot be switched off and do not store unnecessary personal information.`,
  },
  {
    body: `We store a small language preference cookie (used to remember whether you browse in English or French) and use local storage to keep your shopping cart and delivery preferences between visits. This data stays in your browser and is only sent back to us when you use it.`,
  },
  {
    body: "We keep anonymous, aggregated page-usage information so we can improve the site. This does not identify you personally, and we do not run intrusive advertising or tracking networks.",
  },
  {
    body: `Some pages load content from trusted third parties, for example video hosting or clinic schedules. Those providers may set their own cookies according to their own policies. Payment and delivery providers only receive the data needed to complete a transaction.`,
  },
  {
    body: `You can clear or block cookies in your browser settings at any time. Blocking essential cookies may prevent you from signing in or completing an order. The language preference and cart data in local storage can be cleared through your browser's site-data settings without affecting your account.`,
  },
  {
    body: `Questions or requests about cookies can be sent to ${CLINIC.email} or by calling ${CLINIC.phone}.`,
  },
];

export default async function CookiesPage() {
  const t = await serverT();
  return (
    <>
      <PageHero eyebrow={t("legal.eyebrow")} title={t("cookies.metaTitle")} lead={t("cookies.lead")} compact image={S19_ASSETS.photos.cupboardProducts} />
      <Container className="max-w-3xl py-10 md:py-14">
        <p className="text-sm text-muted">
          {t("cookies.intro", { brand: CLINIC.brand })}
        </p>
        <div className="mt-8 space-y-6">
          {sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-lg font-semibold">{t(sectionKeys[i])}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-lg border border-line bg-mist p-5 text-sm text-muted">
          <p>
            {t("cookies.questions", { email: CLINIC.email, phone: CLINIC.phone })}{" "}
            <Link href="/privacy" className="font-semibold text-forest-700 hover:text-forest-800">
              {t("privacy.metaTitle")}
            </Link>
          </p>
        </div>
      </Container>
    </>
  );
}