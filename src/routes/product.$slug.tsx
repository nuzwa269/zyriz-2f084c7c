import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { productImageUrl } from "@/lib/image-url";
import { useCart } from "@/lib/cart";
import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [activeImg, setActiveImg] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(storage_path, display_order)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <p className="text-center py-24 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-24">
          <h1 className="font-serif text-3xl">Product not found</h1>
        </div>
      </div>
    );
  }

  const images = (product.product_images ?? []).sort((a, b) => a.display_order - b.display_order);

  const handleAdd = () => {
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: Number(product.price),
      image: images[0]?.storage_path ?? "",
    });
    toast.success("Added to cart");
  };

  const handleBuyNow = () => {
    handleAdd();
    navigate({ to: "/cart" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <article className="mx-auto max-w-6xl px-4 sm:px-6 py-8 md:py-12 grid md:grid-cols-2 gap-6 md:gap-12">
        <div>
          <div className="aspect-square overflow-hidden rounded-lg border border-border/40 bg-secondary">
            {images[activeImg] ? (
              <img src={productImageUrl(images[activeImg].storage_path)} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">No image</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-5 gap-2">
              {images.map((img, i) => (
                <button
                  key={img.storage_path}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square overflow-hidden rounded-md border ${i === activeImg ? "border-primary" : "border-border/40"}`}
                >
                  <img src={productImageUrl(img.storage_path)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.is_new_arrival && (
            <span className="inline-block rounded-full bg-primary/15 px-3 py-1 text-xs uppercase tracking-wider text-primary mb-4">New Arrival</span>
          )}
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground break-words">{product.name}</h1>
          {product.sale_price != null && Number(product.sale_price) > 0 && Number(product.sale_price) < Number(product.price) ? (
            <div className="mt-4 flex items-baseline gap-3">
              <p className="text-3xl text-primary font-light">Rs {Number(product.sale_price).toLocaleString()}</p>
              <p className="text-lg text-muted-foreground line-through">Rs {Number(product.price).toLocaleString()}</p>
              <span className="rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-semibold text-destructive">
                -{Math.round(((Number(product.price) - Number(product.sale_price)) / Number(product.price)) * 100)}%
              </span>
            </div>
          ) : (
            <p className="mt-4 text-3xl text-primary font-light">Rs {Number(product.price).toLocaleString()}</p>
          )}
          {product.color && (
            <p className="mt-3 text-sm text-muted-foreground">Color: <span className="text-foreground">{product.color}</span></p>
          )}
          {product.description && (
            <div className="mt-6 max-w-none">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}
          <div className="mt-8 flex items-center gap-3 text-sm">
            {product.stock > 0 ? (
              <span className="inline-flex items-center gap-1 text-[oklch(0.65_0.18_145)]"><Check className="h-4 w-4" /> In stock ({product.stock} available)</span>
            ) : (
              <span className="text-destructive">Out of stock</span>
            )}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-primary px-8 py-3.5 text-sm font-medium text-primary hover:bg-primary/10 transition disabled:opacity-50"
            >
              <ShoppingBag className="h-4 w-4" /> Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
            >
              Buy Now
            </button>
          </div>

          <script type="application/ld+json" dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              name: product.name,
              description: product.description ?? "",
              image: images[0] ? productImageUrl(images[0].storage_path) : undefined,
              offers: {
                "@type": "Offer",
                priceCurrency: "PKR",
                price: Number(product.price),
                availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              },
            })
              .replace(/</g, "\\u003c")
              .replace(/>/g, "\\u003e")
              .replace(/&/g, "\\u0026"),
          }} />
        </div>
      </article>
      <Footer />
    </div>
  );
}
