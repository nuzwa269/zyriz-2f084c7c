import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";
import { reviewImageUrl } from "@/lib/review-image-url";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star, Upload, X, Loader2, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: AdminReviews,
});

type ReviewRow = {
  id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  image_path: string | null;
  display_order: number;
  is_published: boolean;
};

type FormValues = {
  customer_name: string;
  rating: number;
  review_text: string;
  image_path: string | null;
  display_order: number;
  is_published: boolean;
};

const empty: FormValues = {
  customer_name: "",
  rating: 5,
  review_text: "",
  image_path: null,
  display_order: 0,
  is_published: true,
};

function AdminReviews() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ReviewRow | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReviewRow[];
    },
  });

  const handleDelete = async (r: ReviewRow) => {
    if (!confirm(`Delete review by ${r.customer_name}?`)) return;
    if (r.image_path) {
      await supabase.storage.from("review-images").remove([r.image_path]);
    }
    const { error } = await supabase.from("reviews").delete().eq("id", r.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Review deleted");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["home-reviews"] });
    }
  };

  const togglePublish = async (r: ReviewRow) => {
    const { error } = await supabase
      .from("reviews")
      .update({ is_published: !r.is_published })
      .eq("id", r.id);
    if (error) toast.error(error.message);
    else {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["home-reviews"] });
    }
  };

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (r: ReviewRow) => { setEditing(r); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Admin Dashboard</p>
          <h1 className="font-serif text-2xl sm:text-3xl">Happy Customers — Reviews</h1>
        </div>
        {!showForm && (
          <button onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Review
          </button>
        )}
      </div>

      {showForm && (
        <ReviewForm
          key={editing?.id ?? "new"}
          initial={editing ?? undefined}
          onCancel={closeForm}
          onSaved={() => {
            closeForm();
            qc.invalidateQueries({ queryKey: ["admin-reviews"] });
            qc.invalidateQueries({ queryKey: ["home-reviews"] });
          }}
        />
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : reviews.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">No reviews yet. Add your first one!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-lg border border-border bg-card p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                {r.image_path ? (
                  <img src={reviewImageUrl(r.image_path)} alt="" className="h-24 w-24 rounded-md object-cover shrink-0" />
                ) : (
                  <div className="h-24 w-24 rounded-md bg-secondary shrink-0 flex items-center justify-center text-muted-foreground text-xs">No image</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-medium">{r.customer_name}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                      ))}
                    </div>
                    {!r.is_published && (
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Hidden</span>
                    )}
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">"{r.review_text}"</p>
                  <p className="mt-2 text-xs text-muted-foreground">Order: {r.display_order}</p>
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button onClick={() => togglePublish(r)} title={r.is_published ? "Hide" : "Show"} className="p-2 text-muted-foreground hover:text-primary">
                    {r.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button onClick={() => openEdit(r)} className="p-2 text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(r)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: ReviewRow;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<FormValues>({
    customer_name: initial?.customer_name ?? "",
    rating: initial?.rating ?? 5,
    review_text: initial?.review_text ?? "",
    image_path: initial?.image_path ?? null,
    display_order: initial?.display_order ?? 0,
    is_published: initial?.is_published ?? true,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const file = files[0];
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/webp",
      });
      const path = `reviews/${crypto.randomUUID()}.webp`;
      const { error } = await supabase.storage
        .from("review-images")
        .upload(path, compressed, { contentType: "image/webp", upsert: false });
      if (error) throw error;
      // Remove the previous image if there was one
      if (values.image_path) {
        await supabase.storage.from("review-images").remove([values.image_path]);
      }
      setValues((p) => ({ ...p, image_path: path }));
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    if (!values.image_path) return;
    await supabase.storage.from("review-images").remove([values.image_path]);
    setValues((p) => ({ ...p, image_path: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.customer_name.trim() || !values.review_text.trim()) {
      toast.error("Name and review text are required");
      return;
    }
    setSaving(true);
    try {
      if (initial?.id) {
        const { error } = await supabase.from("reviews").update(values).eq("id", initial.id);
        if (error) throw error;
        toast.success("Review updated");
      } else {
        const { error } = await supabase.from("reviews").insert(values);
        if (error) throw error;
        toast.success("Review added");
      }
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="font-serif text-lg">{initial ? "Edit review" : "Add a new review"}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Customer name *</label>
          <input
            type="text"
            value={values.customer_name}
            onChange={(e) => setValues({ ...values, customer_name: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="e.g. Ayesha K., Lahore"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Rating</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setValues({ ...values, rating: n })}
                className="p-1"
                aria-label={`${n} stars`}
              >
                <Star className={`h-6 w-6 ${n <= values.rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Review text *</label>
        <textarea
          value={values.review_text}
          onChange={(e) => setValues({ ...values, review_text: e.target.value })}
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Image / Screenshot (optional)</label>
        {values.image_path ? (
          <div className="relative inline-block">
            <img src={reviewImageUrl(values.image_path)} alt="" className="h-32 w-32 rounded-md object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span>{uploading ? "Uploading..." : "Upload image"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Display order</label>
          <input
            type="number"
            value={values.display_order}
            onChange={(e) => setValues({ ...values, display_order: Number(e.target.value) })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">Lower numbers appear first</p>
        </div>
        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={values.is_published}
              onChange={(e) => setValues({ ...values, is_published: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm">Publish on site</span>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="submit"
          disabled={saving || uploading}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {initial ? "Update review" : "Save review"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-5 py-2.5 text-sm hover:bg-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
