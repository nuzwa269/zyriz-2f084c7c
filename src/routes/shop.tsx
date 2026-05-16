import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { useState } from "react";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop All Earrings — Zarrin Atelier" },
      { name: "description", content: "Browse our complete collection of Turkish gold-plated earrings." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const [sort, setSort] = useState<"newest" | "price-asc" | "price-desc">("newest");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop-products", sort],
    queryFn: async () => {
      let q = supabase.from("products").select("id, slug, name, price, is_new_arrival, product_images(storage_path, display_order)");
      if (sort === "newest") q = q.order("created_at", { ascending: false });
      else if (sort === "price-asc") q = q.order("price", { ascending: true });
      else q = q.order("price", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Collection</p>
          <h1 className="font-serif text-5xl mt-2 gold-gradient">All Earrings</h1>
        </div>

        <div className="flex justify-end mb-8">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-12">Loading...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No products available yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const img = p.product_images?.sort((a, b) => a.display_order - b.display_order)[0]?.storage_path;
              return <ProductCard key={p.id} slug={p.slug} name={p.name} price={Number(p.price)} image={img} isNew={p.is_new_arrival} />;
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
