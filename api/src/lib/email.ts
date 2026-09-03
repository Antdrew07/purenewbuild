import { env, isEmailConfigured } from "../env.js";
import { money, paymentLinks } from "./orders.js";

const FROM = "Pure Peptide <noreply@purepeptide.us>";

interface SendArgs {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

/**
 * Fire-and-report. Email never blocks an order: a Resend outage must not stop
 * a customer from getting their payment instructions on screen, so failures are
 * logged and surfaced in the response meta rather than thrown.
 */
async function send({ to, subject, html, text, replyTo }: SendArgs): Promise<boolean> {
  if (!isEmailConfigured) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html, text, reply_to: replyTo }),
    });
    if (!r.ok) {
      console.error("[email] resend failed", r.status, await r.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] resend threw", err);
    return false;
  }
}

const shell = (inner: string) => `
<div style="background:#f4f5f7;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#000000;padding:22px 28px;">
      <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:1px;">PURE</span>
      <span style="color:#E8121C;font-size:20px;font-weight:800;letter-spacing:1px;">PEPTIDE</span>
    </div>
    <div style="padding:28px;">${inner}</div>
    <div style="padding:18px 28px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.6;">
      Research use only — not for human consumption.<br />
      Questions? Reply to this email or write to support@purepeptide.us.
    </div>
  </div>
</div>`;

export interface OrderEmailData {
  orderNumber: string;
  name: string;
  email: string;
  totalCents: number;
  items: { name: string; dosage: string; quantity: number; lineTotalCents: number }[];
}

/** Sent the moment an order is placed — carries the payment instructions. */
export async function sendOrderPlaced(o: OrderEmailData): Promise<boolean> {
  const pay = paymentLinks();
  const rows = o.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;color:#374151;">${i.name}${i.dosage ? ` ${i.dosage}` : ""} × ${i.quantity}</td>` +
        `<td style="padding:6px 0;text-align:right;color:#111827;font-weight:600;">${money(i.lineTotalCents)}</td></tr>`,
    )
    .join("");

  const html = shell(`
    <p style="margin:0 0 6px;color:#111827;font-size:18px;font-weight:700;">Thanks, ${o.name} — your order is in.</p>
    <p style="margin:0 0 22px;color:#4b5563;line-height:1.6;">
      We are holding it until payment lands. Send the total using either option below.
    </p>

    <div style="border:2px solid #E8121C;background:#fff6f6;border-radius:12px;padding:16px;text-align:center;margin-bottom:22px;">
      <div style="color:#9ca3af;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Put this in the payment note</div>
      <div style="color:#E8121C;font-size:28px;font-weight:800;letter-spacing:2px;margin-top:4px;">${o.orderNumber}</div>
      <div style="color:#6b7280;font-size:12px;margin-top:6px;">Without it we cannot match your payment to this order.</div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:8px;">${rows}</table>
    <table style="width:100%;border-collapse:collapse;font-size:16px;border-top:1px solid #e5e7eb;">
      <tr><td style="padding:10px 0;font-weight:700;color:#111827;">Total to send</td>
          <td style="padding:10px 0;text-align:right;font-weight:800;color:#111827;">${money(o.totalCents)}</td></tr>
    </table>

    <div style="margin-top:22px;">
      <a href="${pay.cashapp}" style="display:block;background:#00B841;color:#ffffff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;margin-bottom:10px;">
        Pay ${money(o.totalCents)} with Cash App — ${pay.cashappHandle}
      </a>
      <a href="${pay.venmo}" style="display:block;background:#008CFF;color:#ffffff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;">
        Pay ${money(o.totalCents)} with Venmo — ${pay.venmoHandle}
      </a>
    </div>

    <p style="margin:22px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
      Once we verify the transfer we will approve the order, buy the label and email your tracking number.
      Every order ships with reconstitution liquid.
    </p>
  `);

  const text =
    `Thanks, ${o.name} — your order is in.\n\n` +
    `PAYMENT NOTE: ${o.orderNumber}  (required — we match payments on this)\n` +
    `Total to send: ${money(o.totalCents)}\n\n` +
    `Cash App: ${pay.cashapp}\nVenmo: ${pay.venmo}\n\n` +
    o.items.map((i) => `  ${i.name}${i.dosage ? ` ${i.dosage}` : ""} x${i.quantity}  ${money(i.lineTotalCents)}`).join("\n") +
    `\n\nOnce we verify the transfer we will approve the order and email your tracking number.\n` +
    `Research use only — not for human consumption.`;

  return send({ to: [o.email], subject: `Your Pure Peptide order ${o.orderNumber} — payment needed`, html, text });
}

/** Sent when an admin approves and (usually) a label has been bought. */
export async function sendOrderApproved(o: {
  orderNumber: string;
  name: string;
  email: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}): Promise<boolean> {
  const tracked = Boolean(o.trackingNumber);
  const html = shell(`
    <p style="margin:0 0 6px;color:#111827;font-size:18px;font-weight:700;">Payment confirmed — thanks, ${o.name}.</p>
    <p style="margin:0 0 20px;color:#4b5563;line-height:1.6;">
      Order <strong>${o.orderNumber}</strong> is approved and being packed.
    </p>
    ${
      tracked
        ? `<div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;text-align:center;">
             <div style="color:#9ca3af;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Tracking number</div>
             <div style="color:#111827;font-size:20px;font-weight:800;margin-top:4px;">${o.trackingNumber}</div>
             ${o.trackingUrl ? `<a href="${o.trackingUrl}" style="display:inline-block;margin-top:12px;background:#000;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;">Track this shipment</a>` : ""}
           </div>`
        : `<p style="color:#4b5563;line-height:1.6;">Your tracking number follows in a separate email as soon as the label is generated.</p>`
    }
  `);
  const text =
    `Payment confirmed — order ${o.orderNumber} is approved and being packed.\n` +
    (tracked ? `\nTracking: ${o.trackingNumber}${o.trackingUrl ? `\n${o.trackingUrl}` : ""}\n` : `\nTracking follows shortly.\n`);

  return send({
    to: [o.email],
    subject: tracked
      ? `Order ${o.orderNumber} approved — tracking ${o.trackingNumber}`
      : `Order ${o.orderNumber} approved`,
    html,
    text,
  });
}

/** Internal heads-up so someone knows to go look for the payment. */
export async function sendOwnerNewOrder(o: OrderEmailData): Promise<boolean> {
  if (!env.OWNER_EMAIL) return false;
  const lines = o.items
    .map((i) => `  ${i.name}${i.dosage ? ` ${i.dosage}` : ""} x${i.quantity}  ${money(i.lineTotalCents)}`)
    .join("\n");
  return send({
    to: [env.OWNER_EMAIL],
    replyTo: o.email,
    subject: `New order ${o.orderNumber} — ${money(o.totalCents)}`,
    html: shell(
      `<p style="color:#111827;font-weight:700;">New order ${o.orderNumber} — ${money(o.totalCents)}</p>` +
        `<p style="color:#4b5563;">${o.name} &lt;${o.email}&gt;</p>` +
        `<pre style="color:#374151;font-size:13px;white-space:pre-wrap;">${lines}</pre>` +
        `<p style="color:#6b7280;font-size:13px;">Approve it in the admin area once the transfer clears.</p>`,
    ),
    text: `New order ${o.orderNumber} — ${money(o.totalCents)}\n${o.name} <${o.email}>\n\n${lines}\n`,
  });
}
