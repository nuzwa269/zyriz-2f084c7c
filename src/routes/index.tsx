import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { SITE } from "@/lib/config";
import { ArrowRight, Sparkles, Truck, ShieldCheck } from "lucide-react";
import heroImg from "@/assets/hero-jewelry.jpg";

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
    .select("id, slug, name, price, sale_price, is_new_arrival, is_featured, is_best_seller, product_images(storage_path, display_order)")
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
  const { data: categories = [] } = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, slug, name, image_path")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const featured = products.filter((p) => p.is_featured).slice(0, 4);
  const newArrivals = products.filter((p) => p.is_new_arrival).slice(0, 4);
  const display = featured.length ? featured : products.slice(0, 4);
  const arrivals = newArrivals.length ? newArrivals : products.slice(0, 4);
  const usedIds = new Set([...display.map((p) => p.id), ...arrivals.map((p) => p.id)]);
  const tagged = products.filter((p) => p.is_best_seller && !usedIds.has(p.id)).slice(0, 4);
  const bestSellers = tagged.length ? tagged : products.filter((p) => !usedIds.has(p.id)).slice(0, 4);
  const sellers = bestSellers.length ? bestSellers : products.slice(0, 4);

  const firstImage = (p: typeof products[0]) =>
    p.product_images?.sort((a, b) => a.display_order - b.display_order)[0]?.storage_path;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-12">
          <div className="relative overflow-hidden rounded-2xl shadow-[0_20px_60px_-20px_oklch(0.78_0.13_82/0.4)]">
            <img
              src={heroImg}
              alt="Timeless Beauty — Turkish gold-plated earrings collection"
              className="w-full h-auto object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 hidden md:flex items-center">
              <div className="px-12 md:px-16 max-w-[55%]">
                <Link
                  to="/shop"
                  className="inline-flex mt-6 items-center gap-2 rounded-full bg-foreground/90 px-6 py-3 text-xs font-medium text-background hover:bg-foreground transition"
                >
                  Shop Collection <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
          <div className="md:hidden mt-5 flex justify-center">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground w-full sm:w-auto justify-center"
            >
              Shop Collection <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10 md:py-16 grid gap-4 sm:gap-6 md:gap-8 sm:grid-cols-2 md:grid-cols-3">
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
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-12">
        <div className="flex items-end justify-between gap-3 mb-6 md:mb-8">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Featured</p>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl mt-2">Signature Pieces</h2>
          </div>
          <Link to="/shop" className="text-sm text-primary hover:underline shrink-0">View all →</Link>
        </div>
        {display.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No products yet. Add some from the admin panel.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {display.map((p: any) => (
              <ProductCard key={p.id} slug={p.slug} name={p.name} price={Number(p.price)} salePrice={p.sale_price != null ? Number(p.sale_price) : null} image={firstImage(p)} isNew={p.is_new_arrival} />
            ))}
          </div>
        )}
      </section>

      {/* New arrivals */}
      {arrivals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-12">
          <div className="flex items-end justify-between mb-6 md:mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Just In</p>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl mt-2">New Arrivals</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {arrivals.map((p: any) => (
              <ProductCard key={p.id} slug={p.slug} name={p.name} price={Number(p.price)} salePrice={p.sale_price != null ? Number(p.sale_price) : null} image={firstImage(p)} isNew />
            ))}
          </div>
        </section>
      )}

      {sellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-12">
          <div className="flex items-end justify-between gap-3 mb-6 md:mb-8">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Bestsellers</p>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl mt-2">Best Sellers</h2>
            </div>
            <Link to="/shop" className="text-sm text-primary hover:underline shrink-0">View all →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {sellers.map((p: any) => (
              <ProductCard key={p.id} slug={p.slug} name={p.name} price={Number(p.price)} salePrice={p.sale_price != null ? Number(p.sale_price) : null} image={firstImage(p)} isNew={p.is_new_arrival} />
            ))}
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-12">
          <div className="text-center mb-6 md:mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Browse</p>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl mt-2">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {categories.map((c) => (
              <Link
                key={c.id}
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border/40 bg-card transition hover:shadow-[0_10px_30px_-10px_oklch(0.78_0.13_82/0.35)]"
              >
                {c.image_path ? (
                  <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${c.image_path}`}
                    alt={c.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-primary/10" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 text-center">
                  <h3 className="font-serif text-base sm:text-lg md:text-xl gold-gradient">{c.name}</h3>
                  <p className="mt-1 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition">
                    Shop now →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
