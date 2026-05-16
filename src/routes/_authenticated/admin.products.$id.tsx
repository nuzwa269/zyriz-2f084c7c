import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductForm } from "@/components/ProductForm";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(id, storage_path, display_order)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !data) return <div className="p-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="font-serif text-3xl mb-6">Edit Product</h1>
      <ProductForm
        productId={id}
        initial={{
          name: data.name,
          slug: data.slug,
          description: data.description ?? "",
          price: Number(data.price),
          sale_price: data.sale_price != null ? Number(data.sale_price) : null,
          color: data.color ?? "",
          stock: data.stock,
          is_featured: data.is_featured,
          is_new_arrival: data.is_new_arrival,
        }}
        initialImages={data.product_images ?? []}
        onSaved={() => navigate({ to: "/admin" })}
      />
    </div>
  );
}
