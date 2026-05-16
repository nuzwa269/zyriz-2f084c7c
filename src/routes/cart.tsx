import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/lib/cart";
import { productImageUrl } from "@/lib/image-url";
import { supabase } from "@/integrations/supabase/client";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart — Zyriz" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, total } = useCart();
  const excludeIds = items.map((i) => i.productId);

  const { data: related = [] } = useQuery({
    queryKey: ["cart-related", excludeIds.sort().join(",")],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id, slug, name, price, sale_price, is_new_arrival, product_images(storage_path, display_order)")
        .order("created_at", { ascending: false })
        .limit(8);
      if (excludeIds.length > 0) q = q.not("id", "in", `(${excludeIds.join(",")})`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).slice(0, 4);
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        <h1 className="font-serif text-4xl mb-8 gold-gradient">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-6">Your cart is empty.</p>
            <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Browse Collection <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 sm:gap-4 rounded-lg border border-border/40 bg-card p-3 sm:p-4">
                  <img src={productImageUrl(item.image)} alt={item.name} className="h-20 w-20 sm:h-24 sm:w-24 rounded-md object-cover shrink-0" />
                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                    <div className="min-w-0">
                      <Link to="/product/$slug" params={{ slug: item.slug }} className="font-serif text-base sm:text-lg hover:text-primary line-clamp-2 block">{item.name}</Link>
                      <p className="text-primary mt-1">Rs {item.price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setQty(item.productId, item.quantity - 1)} className="rounded-md border border-border p-1.5 hover:border-primary"><Minus className="h-3 w-3" /></button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => setQty(item.productId, item.quantity + 1)} className="rounded-md border border-border p-1.5 hover:border-primary"><Plus className="h-3 w-3" /></button>
                      </div>
                      <button onClick={() => remove(item.productId)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border/40 bg-card p-6 h-fit">
              <h2 className="font-serif text-xl mb-4">Order Summary</h2>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Subtotal</span>
                <span>Rs {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mb-4">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-lg border-t border-border pt-4">
                <span>Total</span>
                <span className="text-primary">Rs {total.toLocaleString()}</span>
              </div>
              <Link to="/checkout" className="mt-6 flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 w-full">
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
