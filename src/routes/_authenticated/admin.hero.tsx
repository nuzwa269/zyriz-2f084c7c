import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import imageCompression from "browser-image-compression";
import { siteAssetUrl } from "@/lib/site-asset-url";
import heroFallback from "@/assets/hero-jewelry.jpg";

export const Route = createFileRoute("/_authenticated/admin/hero")({
  component: AdminHero,
});

function AdminHero() {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: setting, isLoading } = useQuery({
    queryKey: ["site-setting", "hero_image"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "hero_image")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const currentPath = (setting?.value as any)?.path as string | undefined;
  const currentUrl = currentPath ? siteAssetUrl(currentPath) : heroFallback;

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image");
      return;
    }
    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 2000,
        useWebWorker: true,
      });
      const ext = file.name.split(".").pop() || "jpg";
      const path = `hero/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("site-assets")
        .upload(path, compressed, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { error: dbErr } = await supabase
        .from("site_settings")
        .upsert({ key: "hero_image", value: { path }, updated_at: new Date().toISOString() });
      if (dbErr) throw dbErr;

      // Remove old file
      if (currentPath && currentPath !== path) {
        await supabase.storage.from("site-assets").remove([currentPath]);
      }

      toast.success("Hero image updated");
      qc.invalidateQueries({ queryKey: ["site-setting", "hero_image"] });
      qc.invalidateQueries({ queryKey: ["home-hero"] });
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset to default hero image?")) return;
    try {
      if (currentPath) {
        await supabase.storage.from("site-assets").remove([currentPath]);
      }
      const { error } = await supabase.from("site_settings").delete().eq("key", "hero_image");
      if (error) throw error;
      toast.success("Reset to default");
      qc.invalidateQueries({ queryKey: ["site-setting", "hero_image"] });
      qc.invalidateQueries({ queryKey: ["home-hero"] });
    } catch (e: any) {
      toast.error(e.message ?? "Reset failed");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Admin Dashboard</p>
        <h1 className="font-serif text-2xl sm:text-3xl">Home Page Hero Image</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Yeh image home page ke top par dikhti hai. Recommended size: 1600×900 ya wider.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="h-4 w-4" /> Current hero image
        </div>
        {isLoading ? (
          <div className="aspect-[16/9] w-full animate-pulse rounded-md bg-secondary" />
        ) : (
          <img
            src={currentUrl}
            alt="Current hero"
            className="w-full rounded-md border border-border/40 object-cover"
          />
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload New Image"}
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
          {currentPath && (
            <button
              onClick={handleReset}
              disabled={uploading}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> Reset to default
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
