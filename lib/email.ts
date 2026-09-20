import nodemailer from "nodemailer";
import type { IOrder } from "@/lib/models/Order";
import { formatFcfa, waLink } from "@/lib/utils";
import { CLINIC } from "@/lib/site";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || "S19 Herbal Clinic <no-reply@localhost>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

let transporter: nodemailer.Transporter | null = null;

export function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  const fallback = "http://localhost:3000";
  const trimmed = raw?.trim();
  if (!trimmed) return fallback;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withScheme.replace(/\/+$/, "");
}

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

/* ------------------------------------------------------------------ */
/* Email template kit                                                  */
/* ------------------------------------------------------------------ */

const C = {
  brand: "#124034",
  gold: "#d4af37",
  goldDark: "#a8862a",
  ink: "#13201b",
  muted: "#6b7a74",
  line: "#e2ebe6",
  softRow: "#f5faf7",
  btn: "#1a6b50",
  white: "#ffffff",
};

const WHATSAPP_CLINIC = `https://wa.me/${CLINIC.whatsappNumber}`;

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function digits(phone: string): string {
  return phone.replace(/\D+/g, "");
}

/** Click-to-chat link addressed to an arbitrary WhatsApp number. */
function waTo(phone: string, text: string): string {
  return `https://wa.me/${digits(phone)}?text=${encodeURIComponent(text)}`;
}

interface EmailContent {
  kicker?: string;
  title: string;
  lead?: string;
  sections?: string;
  cta?: { href: string; label: string };
  note?: string;
}

function wrap(c: EmailContent): string {
  const kicker = c.kicker
    ? `<p style="margin:0 0 10px;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1.6px;color:${C.goldDark}">${esc(c.kicker)}</p>`
    : "";
  const lead = c.lead
    ? `<p style="margin:0;font-size:15px;line-height:1.65;color:${C.muted}">${esc(c.lead)}</p>`
    : "";
  const cta = c.cta
    ? `<p style="margin:28px 0 0;text-align:center">
        <a href="${c.cta.href}" style="display:inline-block;background:${C.btn};color:${C.white};padding:13px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:bold">${esc(c.cta.label)}</a>
      </p>`
    : "";
  const note = c.note
    ? `<p style="margin:26px 0 0;font-size:12px;line-height:1.7;color:${C.muted}">${esc(c.note)}</p>`
    : "";

  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#f3f7f4;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%">
    <tr>
      <td align="center" style="padding:24px 12px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${C.white};border:1px solid ${C.line};border-radius:14px;overflow:hidden">
          <tr><td style="height:4px;background:${C.gold};font-size:0;line-height:0">&nbsp;</td></tr>
          <tr>
            <td style="background:${C.brand};padding:26px 32px">
              <div style="color:${C.gold};font-weight:bold;font-size:16px;letter-spacing:1px">S19 HERBAL CLINIC</div>
              <div style="color:${C.white};font-size:12px;margin-top:3px;opacity:0.85">S19 King of Cure · Bafoussam &amp; Worldwide Tele-Health</div>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 32px 26px;color:${C.ink};font-size:15px;line-height:1.6">
              ${kicker}
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:${C.brand}">${esc(c.title)}</h1>
              ${lead}
              ${c.sections ? `<div style="margin-top:10px">${c.sections}</div>` : ""}
              ${cta}
              ${note}
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid ${C.line};padding:18px 32px 22px;color:${C.muted};font-size:12px;line-height:1.7">
              ${esc(CLINIC.brand)} · ${esc(CLINIC.address)}<br/>
              <a href="tel:${CLINIC.phoneHref}" style="color:${C.muted}">${esc(CLINIC.phone)}</a> ·
              <a href="${WHATSAPP_CLINIC}" style="color:${C.btn}">WhatsApp</a> ·
              <a href="mailto:${CLINIC.email}" style="color:${C.muted}">${esc(CLINIC.email)}</a><br/>
              ${esc(CLINIC.hours)}
            </td>
          </tr>
        </table>
        <p style="margin:14px 0 0;font-size:11px;color:#93a29c">
          This email was sent from the S19 Herbal Clinic website because of activity related to your account or a recent order.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function section(title: string, inner: string): string {
  return `<div style="margin:22px 0 0">
    <p style="margin:0 0 10px;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1.4px;color:${C.goldDark}">${esc(title)}</p>
    ${inner}
  </div>`;
}

function infoRows(rows: Array<{ label: string; value: string }>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;border:1px solid ${C.line};border-radius:10px;overflow:hidden">
    ${rows
      .map(
        (r, i) => `<tr${i % 2 === 1 ? ` style="background:${C.softRow}"` : ""}>
          <td style="padding:11px 16px;border-bottom:${i < rows.length - 1 ? `1px solid ${C.line}` : "none"};font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${C.muted};vertical-align:top;width:36%">${esc(r.label)}</td>
          <td style="padding:11px 16px;border-bottom:${i < rows.length - 1 ? `1px solid ${C.line}` : "none"};font-size:14px;color:${C.ink};vertical-align:top">${r.value}</td>
        </tr>`
      )
      .join("")}
  </table>`;
}

function orderItemsHtml(items: IOrder["items"]): string {
  return items
    .map(
      (it, i) => `<tr${i % 2 === 1 ? ` style="background:${C.softRow}"` : ""}>
        <td style="padding:12px 16px;border-bottom:1px solid ${C.line};font-size:14px;color:${C.ink}">${esc(it.name)}</td>
        <td style="padding:12px 16px;border-bottom:1px solid ${C.line};font-size:14px;color:${C.muted};text-align:center;white-space:nowrap">× ${it.quantity}</td>
        <td style="padding:12px 16px;border-bottom:1px solid ${C.line};font-size:14px;color:${C.ink};text-align:right;white-space:nowrap">${formatFcfa(it.price * it.quantity)}</td>
      </tr>`
    )
    .join("");
}

function totalRow(label: string, value: string, strong = false): string {
  const weight = strong ? `font-weight:bold;color:${C.ink}` : `color:${C.ink}`;
  return `<tr>
    <td colspan="2" style="padding:6px 16px;font-size:13px;color:${C.muted}">${label}</td>
    <td style="padding:6px 16px;font-size:14px;${weight};text-align:right;white-space:nowrap">${value}</td>
  </tr>`;
}

function orderSummary(order: IOrder): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;border:1px solid ${C.line};border-radius:10px;overflow:hidden">
    <tr style="background:${C.brand}">
      <td style="padding:10px 16px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${C.white}">Product</td>
      <td style="padding:10px 16px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${C.white};text-align:center">Qty</td>
      <td style="padding:10px 16px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${C.white};text-align:right">Price</td>
    </tr>
    ${orderItemsHtml(order.items)}
    ${totalRow("Subtotal", formatFcfa(order.subtotal))}
    ${totalRow(`Delivery (${esc(order.shipping.mode)})`, formatFcfa(order.shippingFee))}
    ${totalRow("Total", formatFcfa(order.total), true)}
  </table>`;
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export async function sendOrderConfirmation(order: IOrder) {
  const { customer, shipping, payment } = order;
  const firstName = customer.fullName.trim().split(/\s+/)[0] || "there";

  // Customer copy
  await sendMail(
    customer.email,
    `Your order ${order.orderReference} has been received`,
    wrap({
      kicker: "Order confirmation",
      title: `Thank you, ${firstName}`,
      lead: "Your order at S19 Herbal Clinic has been received. Our team will contact you shortly to confirm payment and delivery.",
      sections: [
        section(
          "Your order",
          `<p style="margin:0;font-size:14px;color:${C.ink}"><strong>Reference:</strong> ${esc(order.orderReference)}<br/><strong>Status:</strong> ${esc(order.status)}</p>`
        ),
        section("Items", orderSummary(order)),
        section(
          "Delivery & payment",
          infoRows([
            { label: "Delivery mode", value: esc(shipping.mode) },
            {
              label: "Address",
              value: `${esc(shipping.address)}${shipping.city ? `, ${esc(shipping.city)}` : ""}`,
            },
            { label: "Payment", value: `${esc(payment.method)} (${esc(payment.status)})` },
          ])
        ),
        section(
          "What happens next",
          `<ol style="margin:0;padding-left:20px;font-size:14px;color:${C.ink};line-height:1.8">
            <li>Our team contacts you to confirm your order and payment.</li>
            <li>We carefully prepare your pack.</li>
            <li>We arrange delivery or pickup, then follow up on your progress.</li>
          </ol>`
        ),
      ].join(""),
      cta: {
        href: `https://wa.me/${CLINIC.whatsappNumber}?text=${encodeURIComponent(
          `Hello S19, I have a question about my order ${order.orderReference}.`
        )}`,
        label: "Message us on WhatsApp",
      },
      note: "If you have any questions, reply to this email or contact us on WhatsApp. We are here to support you throughout your treatment.",
    })
  );

  // Admin copy
  if (ADMIN_EMAIL) {
    const notes = shipping.notes ? ` · ${shipping.notes}` : "";
    await sendMail(
      ADMIN_EMAIL,
      `New order ${order.orderReference}`,
      wrap({
        kicker: "Admin notification",
        title: "New order received",
        lead: `${customer.fullName} · ${customer.phone} · ${customer.email}`,
        sections: [
          section("Items", orderSummary(order)),
          section(
            "Customer",
            infoRows([
              { label: "Name", value: esc(customer.fullName) },
              {
                label: "Phone",
                value: `<a href="tel:${digits(customer.phone)}" style="color:${C.btn}">${esc(customer.phone)}</a>`,
              },
              {
                label: "Email",
                value: `<a href="mailto:${esc(customer.email)}" style="color:${C.btn}">${esc(customer.email)}</a>`,
              },
            ])
          ),
          section(
            "Delivery & payment",
            infoRows([
              { label: "Mode", value: esc(shipping.mode) },
              {
                label: "Address",
                value: `${esc(shipping.address)}${shipping.city ? `, ${esc(shipping.city)}` : ""}${esc(notes)}`,
              },
              { label: "Payment", value: `${esc(payment.method)} (${esc(payment.status)})` },
              { label: "Status", value: esc(order.status) },
            ])
          ),
        ].join(""),
        cta: {
          href: waTo(customer.phone, `Hello ${customer.fullName}, this is S19 Herbal Clinic. We received your order ${order.orderReference}.`),
          label: "WhatsApp the client",
        },
        note: `Order reference: ${order.orderReference}.`,
      })
    );
  }
}

export async function sendVerificationEmail(to: string, name: string, link: string) {
  const firstName = name.trim().split(/\s+/)[0] || "friend";
  await sendMail(
    to,
    "Confirm your S19 account email",
    wrap({
      kicker: "Account verification",
      title: `Welcome to S19 Herbal Clinic, ${firstName}`,
      lead: `You created an account with the email address ${to}. Please confirm it to activate your account and keep it secure.`,
      cta: { href: link, label: "Verify my email address" },
      note: `If the button does not work, copy and paste this link into your browser: ${link}. This link expires within 24 hours. If you did not create this account, you can ignore this email.`,
    })
  );
}

export async function sendNewAccountNotification(name: string, email: string) {
  if (!ADMIN_EMAIL) return;
  await sendMail(
    ADMIN_EMAIL,
    `New account: ${email}`,
    wrap({
      kicker: "Admin notification",
      title: "New patient account created",
      lead: "A new account was just created on the website. The patient still needs to verify their email before their first sign-in.",
      sections: section(
        "Account",
        infoRows([
          { label: "Name", value: esc(name) },
          {
            label: "Email",
            value: `<a href="mailto:${esc(email)}" style="color:${C.btn}">${esc(email)}</a>`,
          },
        ])
      ),
    })
  );
}

export async function sendPasswordResetEmail(to: string, name: string, link: string) {
  const firstName = name.trim().split(/\s+/)[0] || "friend";
  await sendMail(
    to,
    "Reset your S19 account password",
    wrap({
      kicker: "Security",
      title: `Reset your password, ${firstName}`,
      lead: "We received a request to reset the password for your S19 Herbal Clinic account.",
      cta: { href: link, label: "Choose a new password" },
      note: `If the button does not work, copy and paste this link into your browser: ${link}. This link expires within 1 hour. If you did not request this, you can safely ignore this email and your password will stay unchanged.`,
    })
  );
}

export async function sendBookingNotification(data: {
  fullName: string;
  phone: string;
  email?: string;
  mode?: string;
  concern?: string;
  message: string;
}) {
  const firstName = data.fullName.trim().split(/\s+/)[0] || "there";

  const requestRows = [
    { label: "Name", value: esc(data.fullName) },
    { label: "Phone", value: esc(data.phone) },
  ];
  if (data.mode) requestRows.push({ label: "Mode", value: esc(data.mode) });
  if (data.concern) requestRows.push({ label: "Concern", value: esc(data.concern) });

  const messageHtml = data.message
    ? `<div style="margin:16px 0 0;background:${C.softRow};border:1px solid ${C.line};border-radius:8px;padding:14px 16px;font-size:14px;color:${C.ink};line-height:1.65">${esc(data.message)}</div>`
    : "";

  // Client copy
  if (data.email) {
    await sendMail(
      data.email,
      "We received your consultation request",
      wrap({
        kicker: "Consultation request",
        title: `Thank you, ${firstName}`,
        lead: "Your request has been received by S19 Herbal Clinic. A member of our clinical team will confirm your booking by phone or WhatsApp.",
        sections: section("Your request", infoRows(requestRows)) + messageHtml,
        cta: {
          href: waLink("Hello S19 Herbal Clinic, I would like to confirm my consultation booking."),
          label: "Confirm on WhatsApp",
        },
        note: "For urgent questions, call or WhatsApp us on " + esc(CLINIC.phone) + ".",
      })
    );
  }

  // Admin copy
  if (ADMIN_EMAIL) {
    const adminRows = [
      { label: "Name", value: esc(data.fullName) },
      {
        label: "Phone",
        value: `<a href="tel:${digits(data.phone)}" style="color:${C.btn}">${esc(data.phone)}</a>`,
      },
    ];
    if (data.email)
      adminRows.push({
        label: "Email",
        value: `<a href="mailto:${esc(data.email)}" style="color:${C.btn}">${esc(data.email)}</a>`,
      });
    if (data.mode) adminRows.push({ label: "Mode", value: esc(data.mode) });
    if (data.concern) adminRows.push({ label: "Concern", value: esc(data.concern) });

    await sendMail(
      ADMIN_EMAIL,
      "New consultation request from web",
      wrap({
        kicker: "Admin notification",
        title: "New health assessment request",
        lead: `${data.fullName} · ${data.phone}`,
        sections: section("Request details", infoRows(adminRows)) + messageHtml,
        cta: {
          href: waTo(
            data.phone,
            `Hello ${data.fullName}, this is S19 Herbal Clinic. We received your consultation request and would like to confirm your booking.`
          ),
          label: "WhatsApp the client",
        },
      })
    );
  }
}