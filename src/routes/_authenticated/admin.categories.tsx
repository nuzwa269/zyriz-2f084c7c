import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";
import { productImageUrl } from "@/lib/image-url";
import { slugify } from "@/components/ProductForm";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Upload, Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategories,
});

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_path: string | null;
  display_order: number;
};

type FormValues = {
  name: string;
  slug: string;
  description: string;
  image_path: string | null;
  display_order: number;
};

function AdminCategories() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, slug, name, description, image_path, display_order")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });

  const handleDelete = async (c: Category) => {
    if (!confirm(`Delete "${c.name}"? Products in this category will be uncategorized.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Category deleted");
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["categories-list"] });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Admin Dashboard</p>
          <h1 className="font-serif text-2xl sm:text-3xl">Categories</h1>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Image</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    {c.image_path ? (
                      <img src={productImageUrl(c.image_path)} alt="" className="h-12 w-12 rounded object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded bg-gradient-to-br from-primary/30 to-primary/10" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                  <td className="px-4 py-3">{c.display_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditing(c); setShowForm(true); }} className="p-1.5 text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(c)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <CategoryFormModal
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            qc.invalidateQueries({ queryKey: ["admin-categories"] });
            qc.invalidateQueries({ queryKey: ["categories-list"] });
          }}
        />
      )}
    </div>
  );
}

function CategoryFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<FormValues>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    image_path: initial?.image_path ?? null,
    display_order: initial?.display_order ?? 0,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof FormValues>(k: K, v: FormValues[K]) => {
    setValues((p) => ({ ...p, [k]: v, ...(k === "name" && !initial ? { slug: slugify(v as string) } : {}) }));
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 3,
        maxWidthOrHeight: 2400,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.95,
      });
      const path = `categories/${crypto.randomUUID()}.webp`;
      const { error } = await supabase.storage.from("product-images").upload(path, compressed, {
        contentType: "image/webp",
      });
      if (error) throw error;
      // Remove old image if replacing
      if (values.image_path) {
        await supabase.storage.from("product-images").remove([values.image_path]);
      }
      setValues((p) => ({ ...p, image_path: path }));
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim() || !values.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        description: values.description.trim() || null,
        image_path: values.image_path,
        display_order: values.display_order,
      };
      if (initial) {
        const { error } = await supabase.from("categories").update(payload).eq("id", initial.id);
        if (error) throw error;
        toast.success("Category updated");
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
        toast.success("Category created");
      }
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full rounded-md border border-border bg-input px-3 py-2 text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-serif text-xl">{initial ? "Edit category" : "Add category"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
            <textarea className={input} rows={3} value={values.description} onChange={(e) => update("description", e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Display order</label>
            <input type="number" className={input} value={values.display_order} onChange={(e) => update("display_order", Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Image</label>
            <div className="mt-2 flex items-center gap-4">
              {values.image_path ? (
                <div className="relative h-24 w-24 rounded-md overflow-hidden border border-border group">
                  <img src={productImageUrl(values.image_path)} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setValues((p) => ({ ...p, image_path: null }))} className="absolute top-1 right-1 rounded-full bg-destructive/90 p-1 opacity-0 group-hover:opacity-100 transition">
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ) : (
                <div className="h-24 w-24 rounded-md bg-gradient-to-br from-primary/30 to-primary/10" />
              )}
              <label className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-secondary">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span>{values.image_path ? "Replace" : "Upload"}</span>
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleUpload(f); }} />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary">Cancel</button>
            <button type="submit" disabled={saving || uploading} className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {saving ? "Saving..." : initial ? "Save changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
