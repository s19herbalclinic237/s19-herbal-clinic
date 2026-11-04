import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { Badge } from "@/components/ui/heading";
import { AddToCart } from "@/components/shop/add-to-cart";
import { Button } from "@/components/ui/button";
import { getProductBySlug, getProducts } from "@/lib/catalog";
import { formatEur, formatFcfa, formatUsd, waLink } from "@/lib/utils";
import { localizedProduct } from "@/lib/site";
import { MultiCurrencyPrice } from "@/components/ui/price";
import { getServerLocale, serverT } from "@/lib/i18n-server";
import { canonicalMeta } from "@/lib/seo";
import { FaChevronRight, FaLeaf, FaRegCircleCheck, FaWhatsapp } from "react-icons/fa6";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getServerLocale();
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const p = localizedProduct(product, locale);
  return {
    title: p.name,
    description: p.shortDescription,
    keywords: [
      p.name,
      "herbal product Cameroon",
      "buy natural medicine Bafoussam",
      "African herbal remedy",
      "produit de phytothérapie Cameroun",
      "plante médicinale Bafoussam",
    ],
    ...canonicalMeta(`/shop/${slug}`),
  };
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export const revalidate = 3600;

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const t = await serverT();
  const locale = await getServerLocale();
  const product = await getProductBySlug(slug);
  const all = await getProducts();
  if (!product) notFound();

  const p = localizedProduct(product, locale);
  const related = all
    .filter((x) => x.categorySlug === product.categorySlug && x.slug !== product.slug)
    .slice(0, 4)
    .map((x) => localizedProduct(x, locale));

  return (
    <>
      <div className="border-b border-line bg-mist">
        <Container className="flex items-center gap-1.5 py-3 text-xs text-muted">
          <Link href="/shop" className="hover:text-forest-700">{t("nav.shop")}</Link>
          <FaChevronRight className="h-2.5 w-2.5" aria-hidden />
          <Link href={`/shop?category=${p.categorySlug}`} className="hover:text-forest-700">
            {p.category}
          </Link>
          <FaChevronRight className="h-2.5 w-2.5" aria-hidden />
          <span className="truncate font-medium text-ink">{p.name}</span>
        </Container>
      </div>

      <Section>
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-forest-50">
            <Image
              src={p.image}
              alt={p.name}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {p.badge ? <Badge>{p.badge}</Badge> : null}
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                {p.category}
              </span>
            </div>
            <h1 className="mt-3 text-3xl">{p.name}</h1>
            <MultiCurrencyPrice price={p.price} unit={p.unit} size="lg" className="mt-3" />
            <p className="mt-4 text-muted">{p.description}</p>

            {p.price > 0 ? (
              <AddToCart product={p} />
            ) : (
              <div className="mt-6 rounded-lg border border-line bg-cream p-5">
                <p className="text-sm leading-relaxed text-muted">
                  {t("product.customized")}
                </p>
                <a
                  href={waLink(`Hello S19, I would like more information about the ${p.name}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-forest-800 px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-900 sm:h-12"
                >
                  <FaWhatsapp className="h-4 w-4 text-gold-400" aria-hidden />
                  {t("product.contactWhatsApp")}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-line bg-white p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-forest-200 bg-forest-50 text-forest-700">
                <FaLeaf className="h-3.5 w-3.5" aria-hidden />
              </span>
              <h2 className="text-base font-bold">{t("product.usage")}</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {p.usage ?? t("product.usageDefault")}
            </p>
          </div>
          {p.ingredients ? (
            <div className="rounded-lg border border-line bg-white p-6">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-forest-200 bg-forest-50 text-forest-700">
                  <FaRegCircleCheck className="h-3.5 w-3.5" aria-hidden />
                </span>
                <h2 className="text-base font-bold">{t("product.notes")}</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{p.ingredients}</p>
            </div>
          ) : null}
        </div>

        <div className="relative mt-10 overflow-hidden rounded-lg bg-forest-950 p-7 md:p-8">
          <div className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full bg-gold-400/10 blur-3xl" />
          <div className="relative">
            <p className="text-[15px] leading-relaxed text-forest-100">
              <strong className="text-white">{t("product.care.title")}</strong> {t("product.care.text")}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/contact">
                <Button variant="gold" size="md">{t("product.bookConsultation")}</Button>
              </Link>
              <Link href="/track">
                <Button variant="glass" size="md">{t("product.trackOrder")}</Button>
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {related.length > 0 ? (
        <Section className="border-t border-line bg-mist">
          <Container>
            <h2 className="text-xl">{t("product.moreInCat", { category: p.category })}</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {related.map((x) => (
                <Link
                  key={x.id}
                  href={`/shop/${x.slug}`}
                  className="group rounded-lg border border-line bg-white p-3 transition-colors hover:border-forest-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-forest-50">
                    <Image
                      src={x.image}
                      alt={x.name}
                      fill
                      sizes="(min-width: 1024px) 20vw, 50vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-snug">{x.name}</p>
                  <p className="mt-0.5 text-xs font-semibold text-forest-700">
                    {x.price > 0 ? `${formatFcfa(x.price)} · ${formatUsd(x.price)} · ${formatEur(x.price)}` : t("shop.contactPricing")}
                  </p>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}
    </>
  );
}