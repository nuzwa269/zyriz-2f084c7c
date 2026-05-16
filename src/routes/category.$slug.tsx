import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { useState } from "react";
import { SITE } from "@/lib/config";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, slug, name, description")
      .eq("slug", params.slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.name ?? "Category";
    const desc = loaderData?.description ?? `Shop ${name} at ${SITE.name}.`;
    const title = `${name} — ${SITE.name}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-serif text-4xl">Category not found</h1>
        <p className="mt-3 text-muted-foreground">The category you’re looking for doesn’t exist.</p>
        <Link to="/shop" className="inline-block mt-6 rounded-md bg-primary px-6 py-2.5 text-sm text-primary-foreground">Shop all</Link>
      </div>
      <Footer />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      {error.message}
    </div>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const category = Route.useLoaderData();
  const [sort, setSort] = useState<"newest" | "price-asc" | "price-desc">("newest");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["category-products", category.id, sort],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id, slug, name, price, sale_price, is_new_arrival, product_images(storage_path, display_order)")
        .eq("category_id", category.id);
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Collection</p>
          <h1 className="font-serif text-4xl sm:text-5xl mt-2 gold-gradient">{category.name}</h1>
          {category.description && (
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto text-sm">{category.description}</p>
          )}
        </div>

        <div className="flex justify-between items-center mb-8 gap-3">
          <Link to="/shop" className="text-sm text-muted-foreground hover:text-primary">← All products</Link>
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
          <p className="text-center text-muted-foreground py-12">No products in this category yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {products.map((p: any) => {
              const img = p.product_images?.sort((a: any, b: any) => a.display_order - b.display_order)[0]?.storage_path;
              return <ProductCard key={p.id} slug={p.slug} name={p.name} price={Number(p.price)} salePrice={p.sale_price != null ? Number(p.sale_price) : null} image={img} isNew={p.is_new_arrival} />;
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
