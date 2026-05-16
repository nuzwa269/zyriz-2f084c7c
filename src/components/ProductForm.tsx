import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";
import { productImageUrl } from "@/lib/image-url";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";

export type ProductFormValues = {
  name: string;
  slug: string;
  description: string;
  price: number;
  sale_price: number | null;
  color: string;
  stock: number;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  category_id: string | null;
};

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function ProductForm({
  initial,
  productId,
  initialImages = [],
  onSaved,
}: {
  initial?: Partial<ProductFormValues>;
  productId?: string;
  initialImages?: { id: string; storage_path: string; display_order: number }[];
  onSaved: (id: string) => void;
}) {
  const [values, setValues] = useState<ProductFormValues>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? 0,
    sale_price: initial?.sale_price ?? null,
    color: initial?.color ?? "",
    stock: initial?.stock ?? 0,
    is_featured: initial?.is_featured ?? false,
    is_new_arrival: initial?.is_new_arrival ?? true,
    is_best_seller: initial?.is_best_seller ?? false,
    category_id: initial?.category_id ?? null,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof ProductFormValues>(k: K, v: ProductFormValues[K]) => {
    setValues((p) => ({ ...p, [k]: v, ...(k === "name" && !productId ? { slug: slugify(v as string) } : {}) }));
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const baseFolder = productId ? `products/${productId}` : `products/temp-${crypto.randomUUID()}`;
      for (const file of Array.from(files)) {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
          fileType: "image/webp",
          initialQuality: 0.85,
        });
        const path = `${baseFolder}/${crypto.randomUUID()}.webp`;
        const { error: upErr } = await supabase.storage.from("product-images").upload(path, compressed, {
          contentType: "image/webp",
          upsert: false,
        });
        if (upErr) throw upErr;
        setImages((prev) => [...prev, { id: crypto.randomUUID(), storage_path: path, display_order: prev.length }]);
      }
      toast.success("Images uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (storage_path: string) => {
    setImages((p) => p.filter((i) => i.storage_path !== storage_path));
    await supabase.storage.from("product-images").remove([storage_path]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name || !values.slug) {
      toast.error("Name and slug are required");
      return;
    }
    setSaving(true);
    try {
      let id = productId;
      if (productId) {
        const { error } = await supabase.from("products").update(values).eq("id", productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert(values).select("id").single();
        if (error) throw error;
        id = data.id;
      }

      // Sync images
      if (id) {
        // Delete removed
        const existingIds = initialImages.map((i) => i.storage_path);
        const currentPaths = images.map((i) => i.storage_path);
        const toDelete = initialImages.filter((i) => !currentPaths.includes(i.storage_path));
        if (toDelete.length) {
          await supabase.from("product_images").delete().in("id", toDelete.map((i) => i.id));
        }
        // Insert new
        const toInsert = images.filter((i) => !existingIds.includes(i.storage_path));
        if (toInsert.length) {
          await supabase.from("product_images").insert(
            toInsert.map((i, idx) => ({ product_id: id!, storage_path: i.storage_path, display_order: idx }))
          );
        }
      }

      toast.success(productId ? "Product updated" : "Product created");
      onSaved(id!);
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full rounded-md border border-border bg-input px-3 py-2 text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="font-serif text-xl">Details</h2>
        <div>
          <label className="text-sm text-muted-foreground">Name *</label>
          <input className={input} value={values.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Slug * (URL)</label>
          <input className={input} value={values.slug} onChange={(e) => update("slug", slugify(e.target.value))} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Description</label>
          <textarea className={input} rows={5} value={values.description} onChange={(e) => update("description", e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Price (Rs) *</label>
            <input type="number" step="0.01" className={input} value={values.price} onChange={(e) => update("price", Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Sale price (Rs) — optional</label>
            <input
              type="number"
              step="0.01"
              placeholder="Leave empty if not on sale"
              className={input}
              value={values.sale_price ?? ""}
              onChange={(e) => update("sale_price", e.target.value === "" ? null : Number(e.target.value))}
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Color</label>
            <input className={input} value={values.color} onChange={(e) => update("color", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Stock</label>
            <input type="number" className={input} value={values.stock} onChange={(e) => update("stock", Number(e.target.value))} />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.is_featured} onChange={(e) => update("is_featured", e.target.checked)} className="accent-primary" />
            Featured on homepage
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.is_new_arrival} onChange={(e) => update("is_new_arrival", e.target.checked)} className="accent-primary" />
            New arrival
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.is_best_seller} onChange={(e) => update("is_best_seller", e.target.checked)} className="accent-primary" />
            Best seller
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-serif text-xl mb-4">Images</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.storage_path} className="relative aspect-square rounded-md overflow-hidden border border-border group">
              <img src={productImageUrl(img.storage_path)} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => removeImage(img.storage_path)} className="absolute top-1 right-1 rounded-full bg-destructive/90 p-1 opacity-0 group-hover:opacity-100 transition">
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
          <label className="aspect-square rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition">
            {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <><Upload className="h-6 w-6 text-muted-foreground" /><span className="text-xs text-muted-foreground mt-2">Upload</span></>}
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} disabled={uploading} />
          </label>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Images are auto-compressed to WebP (max 1600px, ~85% quality) for fast loading.</p>
      </div>

      <div className="flex justify-end gap-3">
        <button type="submit" disabled={saving} className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Saving..." : productId ? "Save Changes" : "Create Product"}
        </button>
      </div>
    </form>
  );
}
