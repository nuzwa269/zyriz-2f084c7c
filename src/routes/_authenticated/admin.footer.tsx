import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, ExternalLink, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/footer")({
  component: AdminFooter,
});

type LinkRow = {
  id: string;
  label: string;
  url: string;
  section: string;
  display_order: number;
  is_published: boolean;
  is_external: boolean;
};

type FooterText = {
  description: string;
  whatsapp: string;
  email: string;
  address: string;
  copyright: string;
};

const emptyText: FooterText = {
  description: "",
  whatsapp: "",
  email: "",
  address: "",
  copyright: "",
};

function AdminFooter() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<LinkRow | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["admin-footer-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("footer_links")
        .select("*")
        .order("section", { ascending: true })
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LinkRow[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-footer-links"] });
    qc.invalidateQueries({ queryKey: ["footer-links"] });
    qc.invalidateQueries({ queryKey: ["footer-text"] });
  };

  const handleDelete = async (r: LinkRow) => {
    if (!confirm(`Delete "${r.label}"?`)) return;
    const { error } = await supabase.from("footer_links").delete().eq("id", r.id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); invalidate(); }
  };

  const togglePublish = async (r: LinkRow) => {
    const { error } = await supabase
      .from("footer_links").update({ is_published: !r.is_published }).eq("id", r.id);
    if (error) toast.error(error.message);
    else invalidate();
  };

  // Group by section
  const grouped = links.reduce<Record<string, LinkRow[]>>((acc, l) => {
    (acc[l.section] = acc[l.section] || []).push(l);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Admin Dashboard</p>
        <h1 className="font-serif text-2xl sm:text-3xl">Footer — Content & Links</h1>
      </div>

      <FooterTextEditor onSaved={invalidate} />

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="font-serif text-xl">Footer Links</h2>
          {!showForm && (
            <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Add Link
            </button>
          )}
        </div>

        {showForm && (
          <LinkForm
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            onSaved={() => { setShowForm(false); setEditing(null); invalidate(); }}
          />
        )}

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : links.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No footer links yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([section, items]) => (
              <div key={section}>
                <p className="text-xs uppercase tracking-widest text-primary mb-2">{section}</p>
                <div className="grid gap-3">
                  {items.map((r) => (
                    <div key={r.id} className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{r.label}</p>
                          {r.is_external && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />}
                          {!r.is_published && (
                            <span className="rounded bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Hidden</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{r.url} · order {r.display_order}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => togglePublish(r)} title={r.is_published ? "Hide" : "Show"} className="p-2 text-muted-foreground hover:text-primary">
                          {r.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button onClick={() => { setEditing(r); setShowForm(true); }} className="p-2 text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(r)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FooterTextEditor({ onSaved }: { onSaved: () => void }) {
  const [values, setValues] = useState<FooterText>(emptyText);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings").select("value").eq("key", "footer").maybeSingle();
      if (data?.value) setValues({ ...emptyText, ...(data.value as any) });
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "footer", value: values as any }, { onConflict: "key" });
      if (error) throw error;
      toast.success("Footer content saved");
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="font-serif text-xl">Footer Content</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Brand description</label>
        <textarea
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
          rows={3}
          placeholder="Short description shown under the brand name"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">WhatsApp number</label>
          <input
            type="text"
            value={values.whatsapp}
            onChange={(e) => setValues({ ...values, whatsapp: e.target.value })}
            placeholder="923000000000"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={values.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
            placeholder="info@example.com"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address (optional)</label>
        <input
          type="text"
          value={values.address}
          onChange={(e) => setValues({ ...values, address: e.target.value })}
          placeholder="Shop address or city"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Copyright text (optional)</label>
        <input
          type="text"
          value={values.copyright}
          onChange={(e) => setValues({ ...values, copyright: e.target.value })}
          placeholder="Leave empty for default"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">Leave blank for "© YEAR Brand Name. All rights reserved."</p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save footer content
      </button>
    </div>
  );
}

function LinkForm({
  initial, onCancel, onSaved,
}: {
  initial?: LinkRow;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState({
    label: initial?.label ?? "",
    url: initial?.url ?? "",
    section: initial?.section ?? "explore",
    display_order: initial?.display_order ?? 0,
    is_published: initial?.is_published ?? true,
    is_external: initial?.is_external ?? false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.label.trim() || !values.url.trim()) {
      toast.error("Label and URL are required");
      return;
    }
    setSaving(true);
    try {
      if (initial?.id) {
        const { error } = await supabase.from("footer_links").update(values).eq("id", initial.id);
        if (error) throw error;
        toast.success("Updated");
      } else {
        const { error } = await supabase.from("footer_links").insert(values);
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
    <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-border bg-card p-5 space-y-4">
      <h3 className="font-serif text-lg">{initial ? "Edit link" : "Add a new link"}</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Label *</label>
          <input
            type="text"
            value={values.label}
            onChange={(e) => setValues({ ...values, label: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="e.g. Shop"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Section</label>
          <input
            type="text"
            value={values.section}
            onChange={(e) => setValues({ ...values, section: e.target.value.toLowerCase() })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="explore"
          />
          <p className="mt-1 text-xs text-muted-foreground">e.g. explore, legal, social</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">URL *</label>
        <input
          type="text"
          value={values.url}
          onChange={(e) => setValues({ ...values, url: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="/shop  or  https://..."
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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
        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={values.is_external}
              onChange={(e) => setValues({ ...values, is_external: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm">Opens new tab</span>
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
