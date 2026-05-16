import { SITE } from "./config";
import type { CartItem } from "./cart";

export type CheckoutDetails = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  note?: string;
  paymentMethod: "JazzCash" | "EasyPaisa" | "Bank Transfer";
};

export function buildOrderMessage(items: CartItem[], total: number, d: CheckoutDetails) {
  const lines: string[] = [];
  lines.push("🛍️ *NEW ORDER*");
  lines.push("");
  lines.push(`👤 *Name:* ${d.name}`);
  lines.push(`📧 *Email:* ${d.email}`);
  lines.push(`📱 *Phone:* ${d.phone}`);
  lines.push(`📍 *Address:* ${d.address}, ${d.city}${d.postalCode ? " " + d.postalCode : ""}`);
  lines.push("");
  lines.push(`💳 *Payment Method:* ${d.paymentMethod}`);
  lines.push("");
  lines.push("🛒 *Items:*");
  items.forEach((i, ix) => {
    lines.push(`${ix + 1}. ${i.name} × ${i.quantity} — Rs ${(i.price * i.quantity).toLocaleString()}`);
  });
  lines.push("");
  lines.push(`💰 *Total: Rs ${total.toLocaleString()}*`);
  if (d.note) {
    lines.push("");
    lines.push(`📝 *Note:* ${d.note}`);
  }
  lines.push("");
  lines.push(`— Sent from ${SITE.name} website`);
  return lines.join("\n");
}

export function whatsappUrl(message: string) {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
