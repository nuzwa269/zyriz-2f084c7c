import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/config";
import { useBrand } from "@/hooks/use-brand";
import { getPlatform } from "@/lib/social-platforms";

type FooterText = {
  description?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  copyright?: string;
};

export function Footer() {
  const { name: brandName, description: brandDescription, logoUrl } = useBrand();
  const { data: text } = useQuery<FooterText>({
    queryKey: ["footer-text"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings").select("value").eq("key", "footer").maybeSingle();
      if (error) throw error;
      return ((data?.value as FooterText) ?? {});
    },
  });

  const { data: links = [] } = useQuery({
    queryKey: ["footer-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("footer_links")
        .select("id, label, url, section, is_external")
        .eq("is_published", true)
        .order("section", { ascending: true })
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: socials = [] } = useQuery({
    queryKey: ["footer-social-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_links")
        .select("id, platform, url")
        .eq("is_published", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const description = text?.description?.trim() || brandDescription || SITE.description;
  const whatsapp = text?.whatsapp?.trim() || SITE.whatsappNumber;
  const email = text?.email?.trim() || SITE.email;
  const address = text?.address?.trim() || "";
  const copyright = text?.copyright?.trim() || `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`;

  const grouped = links.reduce<Record<string, typeof links>>((acc, l) => {
    (acc[l.section] = acc[l.section] || []).push(l);
    return acc;
  }, {});

  const sectionEntries = Object.entries(grouped);

  return (
    <footer className="mt-16 sm:mt-24 border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12 sm:px-6 grid gap-8 sm:gap-10 sm:grid-cols-2 md:grid-cols-3">
        <div className="sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-2">
            {logoUrl && <img src={logoUrl} alt={brandName} className="h-8 w-8 object-contain" />}
            <h3 className="font-serif text-2xl gold-gradient">{brandName}</h3>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">{description}</p>
        </div>

        {sectionEntries.length > 0 ? (
          sectionEntries.map(([section, items]) => (
            <div key={section}>
              <h4 className="text-sm uppercase tracking-widest text-primary mb-3 capitalize">{section}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {items.map((l) =>
                  l.is_external || /^https?:\/\//i.test(l.url) ? (
                    <li key={l.id}>
                      <a href={l.url} target={l.is_external ? "_blank" : undefined} rel={l.is_external ? "noopener noreferrer" : undefined} className="hover:text-primary">
                        {l.label}
                      </a>
                    </li>
                  ) : (
                    <li key={l.id}>
                      <a href={l.url} className="hover:text-primary">{l.label}</a>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))
        ) : (
          <div>
            <h4 className="text-sm uppercase tracking-widest text-primary mb-3">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/shop" className="hover:text-primary">Shop</Link></li>
              <li><Link to="/about" className="hover:text-primary">About</Link></li>
              <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            </ul>
          </div>
        )}

        <div className="min-w-0">
          <h4 className="text-sm uppercase tracking-widest text-primary mb-3">Contact</h4>
          <p className="text-sm text-muted-foreground break-words">
            WhatsApp:{" "}
            <a href={`tel:${whatsapp}`} className="hover:text-primary">
              +{whatsapp}
            </a>
          </p>
          <p className="text-sm text-muted-foreground break-words">
            <a href={`mailto:${email}`} className="hover:text-primary">
              {email}
            </a>
          </p>
          {address && <p className="text-sm text-muted-foreground mt-1 break-words">{address}</p>}

          {socials.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {socials.map((s) => {
                const p = getPlatform(s.platform);
                if (!p) return null;
                return (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={p.label}
                    title={p.label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-primary hover:border-primary"
                  >
                    {p.icon}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        {copyright}
      </div>
    </footer>
  );
}
