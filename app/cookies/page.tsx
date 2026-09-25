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
    body: `These are strictly necessary for the site to work: our session cookie (keeps you signed in to your account, called "s19_session"), and the security measures that protect login, order placement and checkout. They cannot be switched off and they do not store personal information beyond what is required to keep the session secure.`,
  },
  {
    body: `We store a small language preference cookie (called "s19_locale", to remember whether you browse in English or French) and use local storage in your browser to keep your shopping cart and delivery preferences between visits. Nothing in this group is sent to third parties, and you can clear it at any time without breaking the site.`,
  },
  {
    body: `We do not run analytics, advertising or tracking cookies, and we do not use third-party advertising or tracking networks. We do not build profiles of visitors. If we ever add measurement tools in the future, we will only place them after obtaining your consent as required by applicable law (including the EU ePrivacy rules and Cameroon's Law No. 2024/017 on personal-data protection).`,
  },
  {
    body: `A few parts of the site work with trusted third parties: mobile-money payments can open pages operated by MTN Mobile Money or Orange Money, and some videos are delivered by our hosting providers. Those providers may set their own cookies or local storage according to their own policies, and we only share with them the minimum information needed to complete the transaction. We do not control their technologies and recommend you review their policies if you use them.`,
  },
  {
    body: `You can clear or block cookies and local storage in your browser settings at any time. Blocking essential cookies may prevent you from signing in or completing an order. The language preference and cart data in local storage can be cleared through your browser's site-data settings without affecting your account. Because we do not use tracking or advertising cookies, there is no separate opt-out tool needed on this site: simply use your browser's controls.`,
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