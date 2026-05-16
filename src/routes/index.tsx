import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { SITE } from "@/lib/config";
import { ArrowRight, Sparkles, Truck, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${SITE.name} — ${SITE.tagline}` },
      { name: "description", content: SITE.description },
    ],
  }),
  component: HomePage,
});

async function fetchHomeProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, price, is_new_arrival, is_featured, product_images(storage_path, display_order)")
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) throw error;
  return data ?? [];
}

function HomePage() {
  const { data: products = [] } = useQuery({
    queryKey: ["home-products"],
    queryFn: fetchHomeProducts,
  });

  const featured = products.filter((p) => p.is_featured).slice(0, 4);
  const newArrivals = products.filter((p) => p.is_new_arrival).slice(0, 4);
  const display = featured.length ? featured : products.slice(0, 4);
  const arrivals = newArrivals.length ? newArrivals : products.slice(0, 4);

  const firstImage = (p: typeof products[0]) =>
    p.product_images?.sort((a, b) => a.display_order - b.display_order)[0]?.storage_path;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/30 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-24 md:py-36 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-6">Handcrafted Elegance</p>
          <h1 className="font-serif text-5xl md:text-7xl leading-tight">
            <span className="gold-gradient">Turkish Gold</span>
            <br />
            <span className="text-foreground">Plated Earrings</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-muted-foreground text-lg">
            Timeless craftsmanship meets modern sophistication — for the woman who wears beauty with intent.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Shop Collection <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center rounded-full border border-primary/50 px-8 py-3.5 text-sm font-medium text-primary transition hover:bg-primary/10"
            >
              Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 grid gap-8 md:grid-cols-3">
        {[
          { icon: Sparkles, title: "Premium Quality", text: "Genuine gold plating on Turkish brass." },
          { icon: Truck, title: "Fast Delivery", text: "Nationwide shipping across Pakistan." },
          { icon: ShieldCheck, title: "Easy WhatsApp Order", text: "Order in seconds via WhatsApp." },
        ].map((f) => (
          <div key={f.title} className="rounded-lg border border-border/40 bg-card p-6 text-center">
            <f.icon className="mx-auto h-8 w-8 text-primary" />
            <h3 className="mt-3 font-serif text-xl">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Featured</p>
            <h2 className="font-serif text-4xl mt-2">Signature Pieces</h2>
          </div>
          <Link to="/shop" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        {display.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No products yet. Add some from the admin panel.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {display.map((p) => (
              <ProductCard key={p.id} slug={p.slug} name={p.name} price={Number(p.price)} image={firstImage(p)} isNew={p.is_new_arrival} />
            ))}
          </div>
        )}
      </section>

      {/* New arrivals */}
      {arrivals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Just In</p>
              <h2 className="font-serif text-4xl mt-2">New Arrivals</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {arrivals.map((p) => (
              <ProductCard key={p.id} slug={p.slug} name={p.name} price={Number(p.price)} image={firstImage(p)} isNew />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
