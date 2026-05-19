import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Loader2, Eye, EyeOff,
  Sparkles, Truck, ShieldCheck, Star, Heart, Award, Gift, Package,
  CreditCard, Headphones, ThumbsUp, Crown, Gem, Leaf, Phone, MessageCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/features")({
  component: AdminFeatures,
});

export const ICONS = {
  Sparkles, Truck, ShieldCheck, Star, Heart, Award, Gift, Package,
  CreditCard, Headphones, ThumbsUp, Crown, Gem, Leaf, Phone, MessageCircle,
} as const;

export type IconName = keyof typeof ICONS;
const ICON_NAMES = Object.keys(ICONS) as IconName[];

type FeatureRow = {
  id: string;
  icon: string;
  title: string;
  text: string;
  display_order: number;
  is_published: boolean;
};

type FormValues = Omit<FeatureRow, "id">;

function AdminFeatures() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<FeatureRow | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_features")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FeatureRow[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-features"] });
    qc.invalidateQueries({ queryKey: ["home-features"] });
  };

  const handleDelete = async (r: FeatureRow) => {
    if (!confirm(`Delete "${r.title}"?`)) return;
    const { error } = await supabase.from("home_features").delete().eq("id", r.id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); invalidate(); }
  };

  const togglePublish = async (r: FeatureRow) => {
    const { error } = await supabase
      .from("home_features").update({ is_published: !r.is_published }).eq("id", r.id);
    if (error) toast.error(error.message);
    else invalidate();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Admin Dashboard</p>
          <h1 className="font-serif text-2xl sm:text-3xl">Why Choose Us — Features</h1>
        </div>
        {!showForm && (
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Feature
          </button>
        )}
      </div>

      {showForm && (
        <FeatureForm
          key={editing?.id ?? "new"}
          initial={editing ?? undefined}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); invalidate(); }}
        />
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No features yet. Add your first one!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map((r) => {
            const Icon = ICONS[(r.icon as IconName)] ?? Sparkles;
            return (
              <div key={r.id} className="rounded-lg border border-border bg-card p-4 sm:p-5">
                <div className="flex gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-medium">{r.title}</p>
                      {!r.is_published && (
                        <span className="rounded bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Hidden</span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/80">{r.text}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Order: {r.display_order} · Icon: {r.icon}</p>
                  </div>
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <button onClick={() => togglePublish(r)} title={r.is_published ? "Hide" : "Show"} className="p-2 text-muted-foreground hover:text-primary">
                      {r.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button onClick={() => { setEditing(r); setShowForm(true); }} className="p-2 text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(r)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FeatureForm({
  initial, onCancel, onSaved,
}: {
  initial?: FeatureRow;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<FormValues>({
    icon: initial?.icon ?? "Sparkles",
    title: initial?.title ?? "",
    text: initial?.text ?? "",
    display_order: initial?.display_order ?? 0,
    is_published: initial?.is_published ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.title.trim() || !values.text.trim()) {
      toast.error("Title and text are required");
      return;
    }
    setSaving(true);
    try {
      if (initial?.id) {
        const { error } = await supabase.from("home_features").update(values).eq("id", initial.id);
        if (error) throw error;
        toast.success("Updated");
      } else {
        const { error } = await supabase.from("home_features").insert(values);
        if (error) throw error;
        toast.success("Added");
      }
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const SelectedIcon = ICONS[(values.icon as IconName)] ?? Sparkles;

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="font-serif text-lg">{initial ? "Edit feature" : "Add a new feature"}</h2>

      <div>
        <label className="block text-sm font-medium mb-2">Icon</label>
        <div className="flex flex-wrap gap-2">
          {ICON_NAMES.map((name) => {
            const Icon = ICONS[name];
            const active = values.icon === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setValues({ ...values, icon: name })}
                title={name}
                className={`h-10 w-10 rounded-md border flex items-center justify-center transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-primary hover:border-primary/50"}`}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground inline-flex items-center gap-2">
          Selected: <SelectedIcon className="h-4 w-4 text-primary" /> {values.icon}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          type="text"
          value={values.title}
          onChange={(e) => setValues({ ...values, title: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="e.g. Premium Quality"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description *</label>
        <textarea
          value={values.text}
          onChange={(e) => setValues({ ...values, text: e.target.value })}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          required
        />
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
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {initial ? "Update" : "Save"}
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
