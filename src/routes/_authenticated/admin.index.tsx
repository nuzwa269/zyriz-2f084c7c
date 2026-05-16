import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { productImageUrl } from "@/lib/image-url";
import { Plus, Pencil, Trash2, Package, Star, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminProducts,
});

function AdminProducts() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, slug, name, price, stock, is_featured, is_new_arrival, product_images(storage_path, display_order)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = [
    { label: "Total products", value: products.length, icon: Package },
    { label: "Featured", value: products.filter((p) => p.is_featured).length, icon: Star },
    { label: "New arrivals", value: products.filter((p) => p.is_new_arrival).length, icon: Sparkles },
    { label: "Low stock", value: products.filter((p) => Number(p.stock) <= 3).length, icon: AlertTriangle },
  ];

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Admin Dashboard</p>
          <h1 className="font-serif text-3xl">Product management</h1>
        </div>
        <Link to="/admin/products/new" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{item.value}</p>
              </div>
              <span className="rounded-md bg-primary/10 p-2 text-primary">
                <item.icon className="h-5 w-5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">No products yet. Add your first one!</p>
          <Link to="/admin/products/new" className="text-primary hover:underline">+ Add Product</Link>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Image</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Stock</th>
                <th className="px-4 py-3 text-left">Tags</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const img = p.product_images?.sort((a, b) => a.display_order - b.display_order)[0]?.storage_path;
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      {img ? <img src={productImageUrl(img)} alt="" className="h-12 w-12 rounded object-cover" /> : <div className="h-12 w-12 rounded bg-secondary" />}
                    </td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-primary">Rs {Number(p.price).toLocaleString()}</td>
                    <td className="px-4 py-3">{p.stock}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {p.is_featured && <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] text-primary">Featured</span>}
                        {p.is_new_arrival && <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] text-primary">New</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link to="/admin/products/$id" params={{ id: p.id }} className="p-1.5 text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></Link>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
