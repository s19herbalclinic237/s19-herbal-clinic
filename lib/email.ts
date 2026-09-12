import nodemailer from "nodemailer";
import type { IOrder } from "@/lib/models/Order";
import { formatFcfa } from "@/lib/utils";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || "S19 Herbal Clinic <no-reply@localhost>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

async function sendMail(to: string, subject: string, html: string) {
  const t = getTransporter();
  if (!t) return false;
  await t.sendMail({ from: SMTP_FROM, to, subject, html });
  return true;
}

function wrap(body: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f6faf8;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:600px;margin:24px auto;background:#ffffff;border:1px solid #e2ebe6;border-radius:12px;overflow:hidden">
      <div style="background:#124034;padding:24px 28px">
        <div style="color:#d4af37;font-weight:bold;letter-spacing:1px">S19 HERBAL CLINIC</div>
        <div style="color:#ffffff;font-size:12px;margin-top:2px">S19 King of Cure · Bafoussam & Worldwide Tele-Health</div>
      </div>
      <div style="padding:28px;color:#13201b;font-size:15px;line-height:1.6">${body}</div>
      <div style="border-top:1px solid #e2ebe6;padding:16px 28px;color:#6b7a74;font-size:12px">
        S19 Herbal Clinic · Cathedrale Market Entrance B, Bafoussam · +237 672 595 989<br/>
        <a href="https://wa.me/237672595989" style="color:#217a5d">WhatsApp</a> · s19herbs@gmail.com
      </div>
    </div></body></html>`;
}

function orderItemsHtml(items: IOrder["items"]): string {
  return items
    .map(
      (it) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #eef4f0">${it.name}</td>
         <td style="padding:10px 0;border-bottom:1px solid #eef4f0;text-align:center">x${it.quantity}</td>
         <td style="padding:10px 0;border-bottom:1px solid #eef4f0;text-align:right">${formatFcfa(it.price * it.quantity)}</td></tr>`
    )
    .join("");
}

export async function sendOrderConfirmation(order: IOrder) {
  const { customer, shipping, payment } = order;
  const items = orderItemsHtml(order.items);
  const body = `<h2 style="margin:0 0 6px;color:#124034">Thank you, ${customer.fullName}</h2>
    <p style="margin:0 0 18px;color:#6b7a74">Your order at S19 Herbal Clinic has been received.</p>
    <p style="font-size:14px"><strong>Order reference:</strong> ${order.orderReference}</p>
    <table style="width:100%;font-size:14px">${items}
      <tr><td style="padding-top:12px"><strong>Subtotal</strong></td><td style="padding-top:12px;text-align:center"></td><td style="padding-top:12px;text-align:right"><strong>${formatFcfa(order.subtotal)}</strong></td></tr>
      <tr><td style="padding-top:4px">Delivery (${shipping.mode})</td><td style="padding-top:4px"></td><td style="padding-top:4px;text-align:right">${formatFcfa(order.shippingFee)}</td></tr>
      <tr><td style="padding-top:4px"><strong>Total</strong></td><td style="padding-top:4px"></td><td style="padding-top:4px;text-align:right"><strong style="color:#124034">${formatFcfa(order.total)}</strong></td></tr>
    </table>
    <p style="margin-top:20px;font-size:14px">
      <strong>Delivery:</strong> ${shipping.mode} · ${shipping.address}${shipping.city ? ", " + shipping.city : ""}<br/>
      <strong>Payment:</strong> ${payment.method} (${payment.status})<br/>
      <strong>Phone:</strong> ${customer.phone}
    </p>
    <p style="margin:20px 0 0;font-size:14px">Our team will contact you to confirm your order and payment. For fast assistance, message us on WhatsApp.</p>
    <a href="https://wa.me/237672595989?text=${encodeURIComponent(`Hello S19, I have a question about my order ${order.orderReference}.`)}" style="display:inline-block;margin-top:14px;background:#1a624c;color:#ffffff;padding:10px 18px;border-radius:6px;text-decoration:none;font-size:13px">Contact us on WhatsApp</a>`;
  await sendMail(customer.email, `Order received — ${order.orderReference}`, wrap(body));
  if (ADMIN_EMAIL) {
    const adminBody = `<h2 style="margin:0;color:#124034">New order ${order.orderReference}</h2>
      <p style="margin:0">From ${customer.fullName} · ${customer.phone} · ${customer.email}</p>
      <table style="width:100%;font-size:14px;margin-top:12px">${items}</table>
      <p><strong>Total:</strong> ${formatFcfa(order.total)}<br/><strong>Delivery:</strong> ${shipping.mode} · ${shipping.address}<br/><strong>Payment:</strong> ${payment.method}</p>`;
    await sendMail(ADMIN_EMAIL, `New order ${order.orderReference}`, wrap(adminBody));
  }
}

export async function sendBookingNotification(data: {
  fullName: string;
  phone: string;
  email?: string;
  mode?: string;
  concern?: string;
  message: string;
}) {
  const body = `<h2 style="margin:0;color:#124034">New health assessment request</h2>
    <p style="margin:12px 0"><strong>Name:</strong> ${data.fullName}<br/>
    <strong>Phone:</strong> ${data.phone}<br/>
    ${data.email ? `<strong>Email:</strong> ${data.email}<br/>` : ""}
    ${data.mode ? `<strong>Mode:</strong> ${data.mode}<br/>` : ""}
    ${data.concern ? `<strong>Concern:</strong> ${data.concern}<br/>` : ""}</p>
    <p><strong>Message:</strong> ${data.message || "—"}</p>`;
  if (data.email) await sendMail(data.email, "We received your health assessment request", wrap(body));
  if (ADMIN_EMAIL) await sendMail(ADMIN_EMAIL, "New health assessment request from web", wrap(body));
}