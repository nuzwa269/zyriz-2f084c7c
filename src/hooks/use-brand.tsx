import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { siteAssetUrl } from "@/lib/site-asset-url";
import { SITE } from "@/lib/config";

export type BrandSettings = {
  name?: string;
  tagline?: string;
  description?: string;
  logo_path?: string;
};

export function useBrand() {
  const { data } = useQuery<BrandSettings>({
    queryKey: ["brand-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "brand")
        .maybeSingle();
      if (error) throw error;
      return (data?.value as BrandSettings) ?? {};
    },
    staleTime: 5 * 60 * 1000,
  });

  const name = data?.name?.trim() || SITE.name;
  const tagline = data?.tagline?.trim() || SITE.tagline;
  const description = data?.description?.trim() || SITE.description;
  const logoUrl = data?.logo_path ? siteAssetUrl(data.logo_path) : null;

  return { name, tagline, description, logoUrl, logoPath: data?.logo_path ?? null };
}
