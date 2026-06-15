import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { productImageUrl } from "@/lib/image-url";
import { useCart } from "@/lib/cart";
import { useMemo, useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";
import { VariationPicker, type SelectedVariation, type VariationData } from "@/components/product/VariationPicker";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [selectedVar, setSelectedVar] = useState<SelectedVariation | null>(null);

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

  const isVariable = product?.product_type === "variable";

  const { data: variationData } = useQuery({
    queryKey: ["product-variations", product?.id],
    enabled: !!product && isVariable,
    queryFn: async (): Promise<VariationData> => {
      const [{ data: attrs }, { data: vars }, { data: links }] = await Promise.all([
        supabase
          .from("product_attributes")
          .select("id, name, display_order, product_attribute_values(id, value, display_order)")
          .eq("product_id", product!.id)
          .order("display_order"),
        supabase
          .from("product_variations")
          .select("*")
          .eq("product_id", product!.id)
          .order("display_order"),
        supabase
          .from("product_variation_values")
          .select("variation_id, attribute_value_id")
          .in("variation_id", []),
      ]);
      const varIds = (vars ?? []).map((v: any) => v.id);
      let allLinks = links ?? [];
      if (varIds.length > 0) {
        const { data: l2 } = await supabase
          .from("product_variation_values")
          .select("variation_id, attribute_value_id")
          .in("variation_id", varIds);
        allLinks = l2 ?? [];
      }
      return {
        attributes: (attrs ?? []).map((a: any) => ({
          id: a.id,
          name: a.name,
          values: (a.product_attribute_values ?? [])
            .sort((x: any, y: any) => x.display_order - y.display_order)
            .map((v: any) => ({ id: v.id, value: v.value })),
        })),
        variations: (vars ?? []).map((v: any) => ({
          id: v.id,
          price: Number(v.price),
          sale_price: v.sale_price != null ? Number(v.sale_price) : null,
          stock: v.stock,
          image_path: v.image_path,
          is_active: v.is_active,
          sku: v.sku,
          value_ids: allLinks.filter((l: any) => l.variation_id === v.id).map((l: any) => l.attribute_value_id),
        })),
      };
    },
  });

  const images = useMemo(() => (product?.product_images ?? []).sort((a: any, b: any) => a.display_order - b.display_order), [product]);

  // Effective display values
  const effectivePrice = (() => {
    if (isVariable) {
      if (selectedVar) {
        const sale = selectedVar.sale_price;
        return sale != null && sale > 0 && sale < selectedVar.price ? sale : selectedVar.price;
      }
      // fallback: min price across active variations
      const prices = (variationData?.variations ?? [])
        .filter((v) => v.is_active)
        .map((v) => (v.sale_price != null && v.sale_price > 0 && v.sale_price < v.price ? v.sale_price : v.price));
      return prices.length ? Math.min(...prices) : Number(product?.price ?? 0);
    }
    if (product) {
      const sale = product.sale_price != null ? Number(product.sale_price) : null;
      const base = Number(product.price);
      return sale != null && sale > 0 && sale < base ? sale : base;
    }
    return 0;
  })();

  const originalPrice = isVariable
    ? selectedVar?.price ?? Number(product?.price ?? 0)
    : Number(product?.price ?? 0);
  const showSale = isVariable
    ? !!(selectedVar && selectedVar.sale_price != null && selectedVar.sale_price > 0 && selectedVar.sale_price < selectedVar.price)
    : !!(product && product.sale_price != null && Number(product.sale_price) > 0 && Number(product.sale_price) < Number(product.price));

  const stockAvailable = isVariable ? selectedVar?.stock ?? 0 : product?.stock ?? 0;
  const canAdd = isVariable ? !!selectedVar && stockAvailable > 0 : (product?.stock ?? 0) > 0;

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

  const variationImage = selectedVar?.image_path;
  const heroImagePath = variationImage ?? images[activeImg]?.storage_path;

  const handleAdd = () => {
    if (isVariable) {
      if (!selectedVar) {
        toast.error("Please choose all options");
        return;
      }
      add({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: effectivePrice,
        image: variationImage ?? images[0]?.storage_path ?? "",
        variationId: selectedVar.id,
        variationLabel: selectedVar.label,
      });
    } else {
      add({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: effectivePrice,
        image: images[0]?.storage_path ?? "",
      });
    }
    toast.success("Added to cart");
  };

  const handleBuyNow = () => {
    handleAdd();
    if (!isVariable || selectedVar) navigate({ to: "/cart" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <article className="mx-auto max-w-6xl px-4 sm:px-6 py-8 md:py-12 grid md:grid-cols-2 gap-6 md:gap-12">
        <div>
          <div className="aspect-square overflow-hidden rounded-lg border border-border/40 bg-secondary">
            {heroImagePath ? (
              <img src={productImageUrl(heroImagePath)} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">No image</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-5 gap-2">
              {images.map((img: any, i: number) => (
                <button
                  key={img.storage_path}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square overflow-hidden rounded-md border ${i === activeImg && !variationImage ? "border-primary" : "border-border/40"}`}
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
          {showSale ? (
            <div className="mt-4 flex items-baseline gap-3">
              <p className="text-3xl text-primary font-light">Rs {effectivePrice.toLocaleString()}</p>
              <p className="text-lg text-muted-foreground line-through">Rs {originalPrice.toLocaleString()}</p>
              <span className="rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-semibold text-destructive">
                -{Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)}%
              </span>
            </div>
          ) : (
            <p className="mt-4 text-3xl text-primary font-light">
              {isVariable && !selectedVar ? "From " : ""}Rs {effectivePrice.toLocaleString()}
            </p>
          )}
          {product.color && !isVariable && (
            <p className="mt-3 text-sm text-muted-foreground">Color: <span className="text-foreground">{product.color}</span></p>
          )}
          {product.description && (
            <div className="mt-6 max-w-none">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {isVariable && variationData && variationData.attributes.length > 0 && (
            <div className="mt-6">
              <VariationPicker data={variationData} onSelect={setSelectedVar} />
            </div>
          )}

          <div className="mt-8 flex items-center gap-3 text-sm">
            {isVariable ? (
              selectedVar ? (
                stockAvailable > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[oklch(0.65_0.18_145)]"><Check className="h-4 w-4" /> In stock ({stockAvailable} available)</span>
                ) : (
                  <span className="text-destructive">Out of stock</span>
                )
              ) : (
                <span className="text-muted-foreground">Choose options to see availability</span>
              )
            ) : product.stock > 0 ? (
              <span className="inline-flex items-center gap-1 text-[oklch(0.65_0.18_145)]"><Check className="h-4 w-4" /> In stock ({product.stock} available)</span>
            ) : (
              <span className="text-destructive">Out of stock</span>
            )}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAdd}
              disabled={!canAdd}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-primary px-8 py-3.5 text-sm font-medium text-primary hover:bg-primary/10 transition disabled:opacity-50"
            >
              <ShoppingBag className="h-4 w-4" /> Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!canAdd}
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
                price: effectivePrice,
                availability: stockAvailable > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
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
