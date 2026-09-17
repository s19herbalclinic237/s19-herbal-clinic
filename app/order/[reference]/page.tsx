import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonLinkClasses } from "@/components/ui/button";
import { connectDb } from "@/lib/db";
import { Order, type IOrder } from "@/lib/models/Order";
import { formatFcfa, waLink } from "@/lib/utils";
import { serverT } from "@/lib/i18n-server";
import { FaCircleCheck, FaWhatsapp, FaTruckFast } from "react-icons/fa6";

interface Props {
  params: Promise<{ reference: string }>;
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { reference } = await params;
  const t = await serverT();
  let order: IOrder | null = null;

  const conn = await connectDb();
  if (conn) {
    order = await Order.findOne({ orderReference: reference }).lean<IOrder>();
  }

  if (!order) {
    return (
      <Container className="py-16">
        <h1 className="text-2xl">{t("order.notFoundTitle", { reference })}</h1>
        <p className="mt-3 max-w-md text-sm text-muted">
          {t("order.notFoundText")}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/track" className={buttonLinkClasses("primary", "md")}>{t("track.submit")}</Link>
          <a href={waLink(`Hello S19, I just placed order ${reference}. Please confirm my order.`)} target="_blank" rel="noopener noreferrer" className={buttonLinkClasses("secondary", "md")}>
            <FaWhatsapp className="h-3.5 w-3.5" aria-hidden />
            {t("order.confirmWhatsApp")}
          </a>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-forest-200 bg-forest-50 p-6 text-center md:p-8">
          <FaCircleCheck className="mx-auto h-9 w-9 text-forest-700" aria-hidden />
          <h1 className="mt-3 text-2xl">{t("order.thankYou", { name: order.customer.fullName.split(" ")[0] })}</h1>
          <p className="mt-2 text-sm text-muted">
            {t("order.received", { reference: order.orderReference })}
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-base font-bold">{t("cart.summary")}</h2>
            <span className="rounded-sm border border-forest-200 bg-forest-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-forest-800">
              {order.status}
            </span>
          </div>
          <ul className="divide-y divide-line px-5">
            {order.items.map((item) => (
              <li key={item.productSlug} className="flex items-center gap-3 py-3">
                {item.image ? (
                  <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-md border border-line bg-forest-50">
                    <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted">{t("order.qty", { qty: item.quantity })}</p>
                </div>
                <span className="text-sm font-semibold">{formatFcfa(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
            <div className="flex justify-between text-muted">
              <dt>{t("checkout.subtotal")}</dt>
              <dd>{formatFcfa(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-muted">
              <dt>{t("cart.delivery")} ({order.shipping.mode})</dt>
              <dd>{formatFcfa(order.shippingFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
              <dt>{t("cart.total")}</dt>
              <dd className="text-forest-800">{formatFcfa(order.total)}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 rounded-lg border border-line bg-white p-5 text-sm">
          <h2 className="text-base font-bold">{t("order.deliveryPayment")}</h2>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{t("order.deliveryLabel")}</dt>
              <dd className="mt-0.5">{order.shipping.mode}</dd>
              <dd className="text-muted">{order.shipping.address}{order.shipping.city ? `, ${order.shipping.city}` : ""}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{t("order.paymentLabel")}</dt>
              <dd className="mt-0.5">{order.payment.method}</dd>
              <dd className="text-muted">{order.payment.status}. {t("order.confirmNote")}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={waLink(`Hello S19 Herbal Clinic, I just placed order ${order.orderReference}. I would like to confirm payment and delivery.`)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonLinkClasses("primary", "md", "flex-1")}
          >
            <FaWhatsapp className="h-4 w-4" aria-hidden />
            {t("order.confirmWhatsApp")}
          </a>
          <Link href="/track" className={buttonLinkClasses("secondary", "md", "flex-1")}>
            <FaTruckFast className="h-4 w-4" aria-hidden />
            {t("order.trackThis")}
          </Link>
        </div>
      </div>
    </Container>
  );
}