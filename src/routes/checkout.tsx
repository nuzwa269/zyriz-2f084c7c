import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SITE } from "@/lib/config";
import { buildOrderMessage, whatsappUrl, type CheckoutDetails } from "@/lib/whatsapp";
import { useState } from "react";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Zyriz" }] }),
  component: CheckoutPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(7, "Phone is required").max(30),
  address: z.string().trim().min(5, "Address is required").max(500),
  city: z.string().trim().min(2, "City is required").max(100),
  postalCode: z.string().trim().max(20).optional(),
  note: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(["JazzCash", "EasyPaisa", "Bank Transfer"]),
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clear } = useCart();
  const [sent, setSent] = useState(false);
  const [submittedMethod, setSubmittedMethod] = useState<CheckoutDetails["paymentMethod"]>("JazzCash");

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutDetails>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: "JazzCash" },
  });

  const selectedMethod = watch("paymentMethod");

  if (items.length === 0 && !sent) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-24">
          <p className="text-muted-foreground mb-4">Your cart is empty.</p>
          <Link to="/shop" className="text-primary hover:underline">Continue shopping →</Link>
        </div>
      </div>
    );
  }

  const onSubmit = (data: CheckoutDetails) => {
    const msg = buildOrderMessage(items, total, data);
    setSubmittedMethod(data.paymentMethod);
    window.open(whatsappUrl(msg), "_blank");
    clear();
    setSent(true);
  };

  if (sent) {
    const pay = submittedMethod === "JazzCash" ? SITE.payment.jazzCash
      : submittedMethod === "EasyPaisa" ? SITE.payment.easyPaisa : null;
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center mb-6">
            <MessageCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-serif text-4xl gold-gradient">Order Sent!</h1>
          <p className="mt-4 text-muted-foreground">
            Your order has been sent to us on WhatsApp. We'll contact you shortly to confirm.
          </p>
          <div className="mt-8 rounded-lg border border-border bg-card p-6 text-left">
            <h2 className="font-serif text-xl mb-3">Complete Payment</h2>
            <p className="text-sm text-muted-foreground mb-4">Send your payment via {submittedMethod} to:</p>
            {pay ? (
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Account Name:</span> <span className="text-foreground">{pay.account}</span></p>
                <p><span className="text-muted-foreground">Number:</span> <span className="text-primary font-medium">{pay.number}</span></p>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Bank:</span> <span className="text-foreground">{SITE.payment.bank.bank}</span></p>
                <p><span className="text-muted-foreground">Account Title:</span> <span className="text-foreground">{SITE.payment.bank.account}</span></p>
                <p><span className="text-muted-foreground">IBAN:</span> <span className="text-primary font-medium">{SITE.payment.bank.iban}</span></p>
              </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">After paying, please share the screenshot on WhatsApp.</p>
          </div>
          <Link to="/" className="mt-8 inline-block text-primary hover:underline">← Back to home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const inputCls = "w-full rounded-md border border-border bg-input px-4 py-2.5 text-sm focus:border-primary focus:outline-none";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        <h1 className="font-serif text-4xl mb-8 gold-gradient">Checkout</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-5">
            <div className="rounded-lg border border-border/40 bg-card p-6 space-y-4">
              <h2 className="font-serif text-xl">Contact & Shipping</h2>
              <div>
                <label className="text-sm text-muted-foreground">Full Name *</label>
                <input {...register("name")} className={inputCls} />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Email *</label>
                  <input type="email" {...register("email")} className={inputCls} />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Phone *</label>
                  <input {...register("phone")} className={inputCls} placeholder="03xx-xxxxxxx" />
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Complete Address *</label>
                <textarea {...register("address")} rows={3} className={inputCls} placeholder="House #, Street, Area" />
                {errors.address && <p className="text-xs text-destructive mt-1">{errors.address.message}</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">City *</label>
                  <input {...register("city")} className={inputCls} />
                  {errors.city && <p className="text-xs text-destructive mt-1">{errors.city.message}</p>}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Postal Code</label>
                  <input {...register("postalCode")} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Order Note (optional)</label>
                <textarea {...register("note")} rows={2} className={inputCls} />
              </div>
            </div>

            <div className="rounded-lg border border-border/40 bg-card p-6 space-y-3">
              <h2 className="font-serif text-xl">Payment Method</h2>
              {(["JazzCash", "EasyPaisa", "Bank Transfer"] as const).map((m) => (
                <label key={m} className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer transition ${selectedMethod === m ? "border-primary bg-primary/5" : "border-border"}`}>
                  <input type="radio" {...register("paymentMethod")} value={m} className="accent-primary" />
                  <span className="font-medium">{m}</span>
                </label>
              ))}
              {selectedMethod && (
                <div className="mt-3 rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground">
                  {selectedMethod === "JazzCash" && <>Send to JazzCash: <span className="text-primary font-medium">{SITE.payment.jazzCash.number}</span> ({SITE.payment.jazzCash.account})</>}
                  {selectedMethod === "EasyPaisa" && <>Send to EasyPaisa: <span className="text-primary font-medium">{SITE.payment.easyPaisa.number}</span> ({SITE.payment.easyPaisa.account})</>}
                  {selectedMethod === "Bank Transfer" && <>Bank: {SITE.payment.bank.bank}, IBAN: <span className="text-primary font-medium">{SITE.payment.bank.iban}</span></>}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-card p-6 h-fit lg:sticky lg:top-20">
            <h2 className="font-serif text-xl mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              {items.map((i) => (
                <div key={i.productId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{i.name} × {i.quantity}</span>
                  <span>Rs {(i.price * i.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-lg border-t border-border pt-4 mb-6">
              <span>Total</span>
              <span className="text-primary">Rs {total.toLocaleString()}</span>
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-full bg-[oklch(0.65_0.18_145)] hover:bg-[oklch(0.6_0.18_145)] px-6 py-3.5 text-sm font-semibold text-white w-full transition"
            >
              <MessageCircle className="h-4 w-4" /> Order through WhatsApp
            </button>
            <p className="text-xs text-muted-foreground mt-3 text-center">Your order details will be sent to us on WhatsApp.</p>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
