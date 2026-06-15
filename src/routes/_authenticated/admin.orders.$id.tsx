import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { productImageUrl } from "@/lib/image-url";
import { buildOrderMessage, whatsappUrl, type CheckoutDetails } from "@/lib/whatsapp";
import { toast } from "sonner";
import { useState } from "react";
import { ArrowLeft, Loader2, MessageCircle, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/orders/$id")({
  component: AdminOrderDetail,
});

const STATUSES = ["new", "contacted", "paid", "shipped", "completed", "cancelled"] as const;

function AdminOrderDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Link to="/admin/orders" className="text-primary hover:underline mt-4 inline-block">← Back to orders</Link>
      </div>
    );
  }

  const items: any[] = Array.isArray(order.items) ? order.items : [];

  const updateStatus = async (status: string) => {
    setSaving(true);
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    setSaving(false);
    if (error) {
      toast.error("Could not update status", { description: error.message });
    } else {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    }
  };

  const deleteOrder = async () => {
    if (!confirm("Delete this order permanently?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete", { description: error.message });
    } else {
      toast.success("Order deleted");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      navigate({ to: "/admin/orders" });
    }
  };

  const resendWhatsApp = () => {
    const details: CheckoutDetails = {
      name: order.customer_name,
      email: order.customer_email,
      phone: order.customer_phone,
      address: order.address,
      city: order.city,
      postalCode: order.postal_code ?? undefined,
      note: order.note ?? undefined,
      paymentMethod: order.payment_method as CheckoutDetails["paymentMethod"],
    };
    const msg = buildOrderMessage(
      items.map((i: any) => ({
        productId: i.productId,
        slug: i.slug,
        name: i.name,
        price: Number(i.price),
        image: i.image,
        quantity: Number(i.quantity),
        variationId: i.variationId ?? null,
        variationLabel: i.variationLabel ?? null,
      })),
      Number(order.total),
      details,
    );
    window.open(whatsappUrl(msg), "_blank");
  };

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={resendWhatsApp}
            className="inline-flex items-center gap-1.5 text-sm rounded-md bg-[oklch(0.65_0.18_145)] hover:bg-[oklch(0.6_0.18_145)] text-white px-3 py-2"
          >
            <MessageCircle className="h-4 w-4" /> Open in WhatsApp
          </button>
          <button
            onClick={deleteOrder}
            className="inline-flex items-center gap-1.5 text-sm rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10 px-3 py-2"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl gold-gradient">Order details</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(order.created_at).toLocaleString()} • ID: {order.id.slice(0, 8)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Status</label>
          <select
            value={order.status}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={saving}
            className="px-3 py-2 text-sm rounded-md border border-border bg-input focus:border-primary outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-serif text-lg mb-3">Items</h2>
            <div className="space-y-3">
              {items.map((i: any, ix: number) => (
                <div key={ix} className="flex gap-3 items-center">
                  {i.image && (
                    <img
                      src={productImageUrl(i.image)}
                      alt={i.name}
                      className="h-16 w-16 rounded-md object-cover border border-border shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{i.name}</div>
                    {i.variationLabel && (
                      <div className="text-xs text-primary">{i.variationLabel}</div>
                    )}
                    <div className="text-xs text-muted-foreground">Qty {i.quantity} × Rs {Number(i.price).toLocaleString()}</div>
                  </div>
                  <div className="text-sm text-primary whitespace-nowrap">
                    Rs {(Number(i.price) * Number(i.quantity)).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-between text-base">
              <span>Total</span>
              <span className="text-primary">Rs {Number(order.total).toLocaleString()}</span>
            </div>
          </div>

          {order.note && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-serif text-lg mb-2">Note</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.note}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-serif text-lg mb-3">Customer</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Name" value={order.customer_name} />
              <Row label="Email" value={<a href={`mailto:${order.customer_email}`} className="text-primary hover:underline">{order.customer_email}</a>} />
              <Row label="Phone" value={<a href={`tel:${order.customer_phone}`} className="text-primary hover:underline">{order.customer_phone}</a>} />
              <Row label="Address" value={order.address} />
              <Row label="City" value={order.city} />
              {order.postal_code && <Row label="Postal" value={order.postal_code} />}
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-serif text-lg mb-3">Payment</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Method" value={order.payment_method} />
              <Row label="WhatsApp sent" value={order.whatsapp_opened ? "Yes" : "No"} />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground w-20 shrink-0 pt-0.5">{label}</dt>
      <dd className="flex-1 break-words">{value}</dd>
    </div>
  );
}
