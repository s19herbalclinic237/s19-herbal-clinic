import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { Badge } from "@/components/ui/heading";
import { AddToCart } from "@/components/shop/add-to-cart";
import { Button } from "@/components/ui/button";
import { getProductBySlug, getProducts } from "@/lib/catalog";
import { formatFcfa } from "@/lib/utils";
import { FaChevronRight, FaLeaf, FaRegCircleCheck } from "react-icons/fa6";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.shortDescription,
  };
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const all = await getProducts();
  if (!product) notFound();

  const related = all.filter((p) => p.categorySlug === product.categorySlug && p.slug !== product.slug).slice(0, 4);

  return (
    <>
      <div className="border-b border-line bg-mist">
        <Container className="flex items-center gap-1.5 py-3 text-xs text-muted">
          <Link href="/shop" className="hover:text-forest-700">Shop</Link>
          <FaChevronRight className="h-2.5 w-2.5" aria-hidden />
          <Link href={`/shop?category=${product.categorySlug}`} className="hover:text-forest-700">
            {product.category}
          </Link>
          <FaChevronRight className="h-2.5 w-2.5" aria-hidden />
          <span className="truncate font-medium text-ink">{product.name}</span>
        </Container>
      </div>

      <Section>
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-forest-50">
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {product.badge ? <Badge>{product.badge}</Badge> : null}
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                {product.category}
              </span>
            </div>
            <h1 className="mt-3 text-3xl">{product.name}</h1>
            <p className="mt-3 text-lg font-bold text-forest-800">{formatFcfa(product.price)}</p>
            <p className="mt-4 text-muted">{product.description}</p>

            <AddToCart product={product} />
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-line bg-white p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-forest-200 bg-forest-50 text-forest-700">
                <FaLeaf className="h-3.5 w-3.5" aria-hidden />
              </span>
              <h2 className="text-base font-bold">Usage Instructions</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {product.usage ?? "Usage is individualized. Follow the schedule given during your consultation or on the pack label."}
            </p>
          </div>
          {product.ingredients ? (
            <div className="rounded-lg border border-line bg-white p-6">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-forest-200 bg-forest-50 text-forest-700">
                  <FaRegCircleCheck className="h-3.5 w-3.5" aria-hidden />
                </span>
                <h2 className="text-base font-bold">Product Notes</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{product.ingredients}</p>
            </div>
          ) : null}
        </div>

        <div className="relative mt-10 overflow-hidden rounded-lg bg-forest-950 p-7 md:p-8">
          <div className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full bg-gold-400/10 blur-3xl" />
          <div className="relative">
            <p className="text-[15px] leading-relaxed text-forest-100">
              <strong className="text-white">A note on care:</strong> S19 herbal remedies are
              standardized and individually prescribed. For best results and correct dosage,
              complete a health assessment before starting any program.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/contact">
                <Button variant="gold" size="md">Book a Health Assessment</Button>
              </Link>
              <Link href="/track">
                <Button variant="glass" size="md">Track an Order</Button>
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {related.length > 0 ? (
        <Section className="border-t border-line bg-mist">
          <Container>
            <h2 className="text-xl">More in {product.category}</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/shop/${p.slug}`}
                  className="group rounded-lg border border-line bg-white p-3 transition-colors hover:border-forest-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-forest-50">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="(min-width: 1024px) 20vw, 50vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-snug">{p.name}</p>
                  <p className="mt-0.5 text-xs font-semibold text-forest-700">{formatFcfa(p.price)}</p>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}
    </>
  );
}