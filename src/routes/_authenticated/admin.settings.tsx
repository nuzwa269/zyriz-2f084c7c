import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, ImageIcon, Save } from "lucide-react";
import imageCompression from "browser-image-compression";
import { siteAssetUrl } from "@/lib/site-asset-url";
import { SITE } from "@/lib/config";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

type Brand = {
  name?: string;
  tagline?: string;
  description?: string;
  logo_path?: string;
};

function AdminSettings() {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Brand>({});

  const { data: setting, isLoading } = useQuery({
    queryKey: ["site-setting", "brand"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "brand")
        .maybeSingle();
      if (error) throw error;
      return (data?.value as Brand) ?? {};
    },
  });

  useEffect(() => {
    if (setting) setForm(setting);
  }, [setting]);

  const logoUrl = form.logo_path ? siteAssetUrl(form.logo_path) : null;

  const persist = async (next: Brand) => {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "brand", value: next, updated_at: new Date().toISOString() });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["site-setting", "brand"] });
    qc.invalidateQueries({ queryKey: ["brand-settings"] });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await persist(form);
      toast.success("Brand settings saved");
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image");
      return;
    }
    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 600,
        useWebWorker: true,
      });
      const ext = file.name.split(".").pop() || "png";
      const path = `brand/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("site-assets")
        .upload(path, compressed, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const oldPath = form.logo_path;
      const next = { ...form, logo_path: path };
      await persist(next);
      setForm(next);

      if (oldPath && oldPath !== path) {
        await supabase.storage.from("site-assets").remove([oldPath]);
      }
      toast.success("Logo updated");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!form.logo_path) return;
    if (!confirm("Remove logo and show brand name only?")) return;
    try {
      const old = form.logo_path;
      const next = { ...form, logo_path: undefined };
      await persist(next);
      setForm(next);
      await supabase.storage.from("site-assets").remove([old]);
      toast.success("Logo removed");
    } catch (e: any) {
      toast.error(e.message ?? "Remove failed");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8 animate-fade-in">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Admin Dashboard</p>
        <h1 className="font-serif text-2xl sm:text-3xl">Brand Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Brand name, tagline, description aur logo yahan se update karein. URL/domain tabdeel nahi hota.
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-lg bg-secondary" />
      ) : (
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-4 sm:p-6 space-y-4">
            <h2 className="font-medium">Brand Identity</h2>

            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Brand name</label>
              <input
                type="text"
                value={form.name ?? ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={SITE.name}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">Khali chhorne par default: "{SITE.name}"</p>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Tagline</label>
              <input
                type="text"
                value={form.tagline ?? ""}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder={SITE.tagline}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Description</label>
              <textarea
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={SITE.description}
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">SEO meta description aur footer mein use hota hai.</p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save changes"}
            </button>
          </section>

          <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
            <h2 className="font-medium mb-3">Logo</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <ImageIcon className="h-4 w-4" /> Header aur admin bar mein dikhega
            </div>
            <div className="flex items-center gap-4 mb-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-16 w-16 rounded-md border border-border/40 object-contain bg-background p-1"
                />
              ) : (
                <div className="h-16 w-16 rounded-md border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                  No logo
                </div>
              )}
              <p className="text-xs text-muted-foreground">PNG/SVG transparent recommended. Auto-compressed to 600px.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <label className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading..." : "Upload logo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {form.logo_path && (
                <button
                  onClick={handleRemoveLogo}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" /> Remove logo
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
