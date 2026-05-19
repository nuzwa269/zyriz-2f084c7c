import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import { SOCIAL_PLATFORMS, getPlatform } from "@/lib/social-platforms";

export const Route = createFileRoute("/_authenticated/admin/social")({
  component: AdminSocial,
});

type Row = {
  id: string;
  platform: string;
  url: string;
  display_order: number;
  is_published: boolean;
};

function AdminSocial() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-social-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_links")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-social-links"] });
    qc.invalidateQueries({ queryKey: ["footer-social-links"] });
  };

  const handleDelete = async (r: Row) => {
    if (!confirm(`Delete ${getPlatform(r.platform)?.label ?? r.platform}?`)) return;
    const { error } = await supabase.from("social_links").delete().eq("id", r.id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); invalidate(); }
  };

  const togglePublish = async (r: Row) => {
    const { error } = await supabase
      .from("social_links").update({ is_published: !r.is_published }).eq("id", r.id);
    if (error) toast.error(error.message);
    else invalidate();
  };

  const move = async (r: Row, dir: -1 | 1) => {
    const sorted = [...rows].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((x) => x.id === r.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await supabase.from("social_links").update({ display_order: swap.display_order }).eq("id", r.id);
    await supabase.from("social_links").update({ display_order: r.display_order }).eq("id", swap.id);
    invalidate();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Admin Dashboard</p>
        <h1 className="font-serif text-2xl sm:text-3xl">Social Links</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Footer میں نظر آنے والے سوشل میڈیا لنکس کا انتظام۔ جسے چاہیں شامل کریں یا چھپا دیں۔
        </p>
      </div>

      <div className="flex justify-end">
        {!showForm && (
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Social Link
          </button>
        )}
      </div>

      {showForm && (
        <SocialForm
          key={editing?.id ?? "new"}
          initial={editing ?? undefined}
          nextOrder={rows.length ? Math.max(...rows.map((r) => r.display_order)) + 1 : 0}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); invalidate(); }}
        />
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">ابھی کوئی سوشل لنک نہیں۔ "Add Social Link" پر کلک کریں۔</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => {
            const p = getPlatform(r.platform);
            return (
              <div key={r.id} className="rounded-lg border border-border bg-card p-3 sm:p-4 flex items-center gap-3">
                <div className="shrink-0 h-10 w-10 rounded-md flex items-center justify-center bg-muted" style={{ color: p?.color }}>
                  {p?.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{p?.label ?? r.platform}</p>
                    {!r.is_published && (
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Hidden</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{r.url}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => move(r, -1)} className="p-2 text-muted-foreground hover:text-primary" aria-label="Up"><ArrowUp className="h-4 w-4" /></button>
                  <button onClick={() => move(r, 1)} className="p-2 text-muted-foreground hover:text-primary" aria-label="Down"><ArrowDown className="h-4 w-4" /></button>
                  <button onClick={() => togglePublish(r)} className="p-2 text-muted-foreground hover:text-primary" aria-label="Toggle">
                    {r.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button onClick={() => { setEditing(r); setShowForm(true); }} className="p-2 text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(r)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SocialForm({
  initial, nextOrder, onCancel, onSaved,
}: {
  initial?: Row;
  nextOrder: number;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState({
    platform: initial?.platform ?? SOCIAL_PLATFORMS[0].key,
    url: initial?.url ?? "",
    display_order: initial?.display_order ?? nextOrder,
    is_published: initial?.is_published ?? true,
  });
  const [saving, setSaving] = useState(false);

  const platform = getPlatform(values.platform);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.url.trim()) { toast.error("URL is required"); return; }
    setSaving(true);
    try {
      if (initial?.id) {
        const { error } = await supabase.from("social_links").update(values).eq("id", initial.id);
        if (error) throw error;
        toast.success("Updated");
      } else {
        const { error } = await supabase.from("social_links").insert(values);
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

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h3 className="font-serif text-lg">{initial ? "Edit social link" : "Add social link"}</h3>

      <div>
        <label className="block text-sm font-medium mb-2">Platform</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {SOCIAL_PLATFORMS.map((p) => {
            const active = values.platform === p.key;
            return (
              <button
                type="button"
                key={p.key}
                onClick={() => setValues({ ...values, platform: p.key })}
                className={`flex flex-col items-center gap-1 rounded-md border p-2 text-xs transition ${active ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}
              >
                <span style={{ color: p.color }}>{p.icon}</span>
                <span className="truncate w-full text-center">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">URL *</label>
        <input
          type="url"
          value={values.url}
          onChange={(e) => setValues({ ...values, url: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder={platform?.placeholder}
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
        </div>
        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={values.is_published}
              onChange={(e) => setValues({ ...values, is_published: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm">Publish</span>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
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
