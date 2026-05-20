import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { SITE } from "@/lib/config";
import { ArrowRight, Sparkles, Truck, ShieldCheck, Star, Quote, Heart, Award, Gift, Package, CreditCard, Headphones, ThumbsUp, Crown, Gem, Leaf, Phone, MessageCircle } from "lucide-react";
import heroImg from "@/assets/hero-jewelry.jpg";
import { reviewImageUrl } from "@/lib/review-image-url";
import { siteAssetUrl } from "@/lib/site-asset-url";
import { getYoutubeId, youtubeEmbedUrl } from "@/lib/youtube";

const FEATURE_ICONS: Record<string, typeof Sparkles> = {
  Sparkles, Truck, ShieldCheck, Star, Heart, Award, Gift, Package,
  CreditCard, Headphones, ThumbsUp, Crown, Gem, Leaf, Phone, MessageCircle,
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${SITE.name} — ${SITE.tagline}` },
      { name: "description", content: SITE.description },
    ],
  }),
  component: HomePage,
});

const PRODUCT_SELECT = "id, slug, name, price, sale_price, is_new_arrival, is_featured, is_best_seller, product_images(storage_path, display_order)";

async function fetchSection(filter: "featured" | "new" | "best") {
  const column = filter === "featured" ? "is_featured" : filter === "new" ? "is_new_arrival" : "is_best_seller";
  const { data: tagged, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq(column, true)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  if ((tagged?.length ?? 0) >= 10) return tagged ?? [];
  const { data: latest, error: e2 } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false })
    .limit(20);
  if (e2) throw e2;
  const seen = new Set((tagged ?? []).map((p: any) => p.id));
  const filler = (latest ?? []).filter((p: any) => !seen.has(p.id));
  return [...(tagged ?? []), ...filler].slice(0, 10);
}

type SectionRow = { id: string; kind: string; title: string | null; subtitle: string | null };

const FALLBACK_SECTIONS: SectionRow[] = [
  { id: "fs-hero", kind: "hero", title: "Hero", subtitle: null },
  { id: "fs-features", kind: "features", title: null, subtitle: null },
  { id: "fs-featured", kind: "featured", title: "Signature Pieces", subtitle: "Featured" },
  { id: "fs-new", kind: "new", title: "New Arrivals", subtitle: "Just In" },
  { id: "fs-best", kind: "best", title: "Best Sellers", subtitle: "Bestsellers" },
  { id: "fs-categories", kind: "categories", title: "Shop by Category", subtitle: "Browse" },
  { id: "fs-testimonials", kind: "testimonials", title: "Happy Customers", subtitle: "Testimonials" },
];

const FALLBACK_REVIEWS = [
  { name: "Ayesha K.", city: "Lahore", text: "Quality bohot achi hai, gold plating asli lag rahi hai. Packaging bhi premium thi. Highly recommended!" },
  { name: "Sana M.", city: "Karachi", text: "Earrings exactly waisi hi mili jaisi tasveer mein thi. Delivery bhi fast thi. Zaroor dobara order karungi." },
  { name: "Hira R.", city: "Islamabad", text: "Maine apni shaadi ke liye jewellery set liya, sab ne tareef ki! Shukriya Zyriz." },
  { name: "Fatima A.", city: "Rawalpindi", text: "WhatsApp pe order karna bohot easy tha. Staff ne acha guide kiya aur product bilkul perfect tha." },
  { name: "Mehwish T.", city: "Faisalabad", text: "Bracelet ki finishing kamaal ki hai. Price ke hisab se quality bohot acchi mili." },
  { name: "Zoya S.", city: "Multan", text: "Best gift for my sister! Locket bohot khoobsurat hai aur long-lasting bhi." },
];

function HomePage() {
  const { data: display = [] } = useQuery({ queryKey: ["home-featured"], queryFn: () => fetchSection("featured") });
  const { data: arrivals = [] } = useQuery({ queryKey: ["home-new"], queryFn: () => fetchSection("new") });
  const { data: sellers = [] } = useQuery({ queryKey: ["home-best"], queryFn: () => fetchSection("best") });
  const { data: categories = [] } = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, slug, name, image_path")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: dbReviews = [] } = useQuery({
    queryKey: ["home-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, customer_name, rating, review_text, image_path")
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: heroSetting } = useQuery({
    queryKey: ["home-hero"],
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
  const { data: featuresDb = [] } = useQuery({
    queryKey: ["home-features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_features")
        .select("id, icon, title, text")
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: videos = [] } = useQuery({
    queryKey: ["home-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_videos")
        .select("id, title, youtube_url")
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: sectionsDb = [] } = useQuery({
    queryKey: ["home-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_sections")
        .select("id, kind, title, subtitle")
        .eq("is_published", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SectionRow[];
    },
  });
  const sections = sectionsDb.length > 0 ? sectionsDb : FALLBACK_SECTIONS;
  const heroPath = (heroSetting?.value as any)?.path as string | undefined;
  const heroSrc = heroPath ? siteAssetUrl(heroPath) : heroImg;

  const firstImage = (p: any) =>
    p.product_images?.sort((a: any, b: any) => a.display_order - b.display_order)[0]?.storage_path;

  const renderHero = (s: SectionRow) => (
    <section key={s.id} className="relative overflow-hidden border-b border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-12">
        <div className="relative overflow-hidden rounded-2xl shadow-[0_20px_60px_-20px_oklch(0.78_0.13_82/0.4)]">
          <img src={heroSrc} alt={s.title ?? "Timeless Beauty — Turkish gold-plated earrings collection"} className="w-full h-auto object-cover" loading="eager" />
          <div className="absolute inset-0 hidden md:flex items-center">
            <div className="px-12 md:px-16 max-w-[55%]">
              <Link to="/shop" className="inline-flex mt-6 items-center gap-2 rounded-full bg-foreground/90 px-6 py-3 text-xs font-medium text-background hover:bg-foreground transition">
                Shop Collection <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
        <div className="md:hidden mt-5 flex justify-center">
          <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground w-full sm:w-auto justify-center">
            Shop Collection <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );

  const renderFeatures = (s: SectionRow) => {
    const fallback = [
      { id: "f1", icon: "Sparkles", title: "Premium Quality", text: "Genuine gold plating on Turkish brass." },
      { id: "f2", icon: "Truck", title: "Fast Delivery", text: "Nationwide shipping across Pakistan." },
      { id: "f3", icon: "ShieldCheck", title: "Easy WhatsApp Order", text: "Order in seconds via WhatsApp." },
    ];
    const items = featuresDb.length > 0 ? featuresDb : fallback;
    if (items.length === 0) return null;
    return (
      <section key={s.id} className="mx-auto max-w-7xl px-4 sm:px-6 py-10 md:py-16">
        {s.title && (
          <div className="text-center mb-6 md:mb-10">
            {s.subtitle && <p className="text-xs uppercase tracking-[0.3em] text-primary">{s.subtitle}</p>}
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl mt-2">{s.title}</h2>
          </div>
        )}
        <div className="grid gap-4 sm:gap-6 md:gap-8 sm:grid-cols-2 md:grid-cols-3">
          {items.map((f: any) => {
            const Icon = FEATURE_ICONS[f.icon] ?? Sparkles;
            return (
              <div key={f.id} className="rounded-lg border border-border/40 bg-card p-6 text-center">
                <Icon className="mx-auto h-8 w-8 text-primary" />
                <h3 className="mt-3 font-serif text-xl">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const renderProducts = (s: SectionRow, items: any[], showViewAll: boolean) => {
    if (items.length === 0) return null;
    return (
      <section key={s.id} className="mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-12">
        <div className="flex items-end justify-between gap-3 mb-6 md:mb-8">
          <div className="min-w-0">
            {s.subtitle && <p className="text-xs uppercase tracking-[0.3em] text-primary">{s.subtitle}</p>}
            {s.title && <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl mt-2">{s.title}</h2>}
          </div>
          {showViewAll && <Link to="/shop" className="text-sm text-primary hover:underline shrink-0">View all →</Link>}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {items.map((p: any) => (
            <ProductCard key={p.id} slug={p.slug} name={p.name} price={Number(p.price)} salePrice={p.sale_price != null ? Number(p.sale_price) : null} image={firstImage(p)} isNew={p.is_new_arrival} />
          ))}
        </div>
      </section>
    );
  };

  const renderCategories = (s: SectionRow) => {
    if (categories.length === 0) return null;
    return (
      <section key={s.id} className="mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-12">
        <div className="text-center mb-6 md:mb-10">
          {s.subtitle && <p className="text-xs uppercase tracking-[0.3em] text-primary">{s.subtitle}</p>}
          {s.title && <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl mt-2">{s.title}</h2>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {categories.map((c) => (
            <Link key={c.id} to="/category/$slug" params={{ slug: c.slug }} className="group relative aspect-square overflow-hidden rounded-lg border border-border/40 bg-card transition hover:shadow-[0_10px_30px_-10px_oklch(0.78_0.13_82/0.35)]">
              {c.image_path ? (
                <img src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${c.image_path}`} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-primary/10" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 text-center">
                <h3 className="font-serif text-base sm:text-lg md:text-xl gold-gradient">{c.name}</h3>
                <p className="mt-1 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition">Shop now →</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  };

  const renderTestimonials = (s: SectionRow) => {
    const items = dbReviews.length > 0
      ? dbReviews.map((r: any) => ({ key: r.id, name: r.customer_name, text: r.review_text, rating: r.rating ?? 5, image: r.image_path ? reviewImageUrl(r.image_path) : null as string | null }))
      : FALLBACK_REVIEWS.map((r, i) => ({ key: `fb-${i}`, name: `${r.name}, ${r.city}`, text: r.text, rating: 5, image: null as string | null }));
    return (
      <section key={s.id} className="mx-auto max-w-7xl px-4 sm:px-6 py-10 md:py-16">
        <div className="text-center mb-8 md:mb-12">
          {s.subtitle && <p className="text-xs uppercase tracking-[0.3em] text-primary">{s.subtitle}</p>}
          {s.title && <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl mt-2">{s.title}</h2>}
          <p className="mt-2 text-sm text-muted-foreground">Real reviews from our valued buyers</p>
        </div>
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => (
            <div key={r.key} className="relative rounded-xl border border-border/40 bg-card p-6 shadow-sm transition hover:shadow-[0_10px_30px_-10px_oklch(0.78_0.13_82/0.35)]">
              <Quote className="absolute top-4 right-4 h-6 w-6 text-primary/30" />
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
                ))}
              </div>
              {r.image && <img src={r.image} alt="" className="mb-3 w-full max-h-56 rounded-md object-cover" />}
              <p className="text-sm text-foreground/85 leading-relaxed">"{r.text}"</p>
              <div className="mt-4 pt-4 border-t border-border/40">
                <p className="font-serif text-base">{r.name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderVideos = (s: SectionRow) => {
    const items = videos
      .map((v: any) => ({ id: v.id, title: v.title as string | null, ytId: getYoutubeId(v.youtube_url) }))
      .filter((v) => v.ytId);
    if (items.length === 0) return null;
    return (
      <section key={s.id} className="mx-auto max-w-7xl px-4 sm:px-6 py-10 md:py-16">
        <div className="text-center mb-6 md:mb-10">
          {s.subtitle && <p className="text-xs uppercase tracking-[0.3em] text-primary">{s.subtitle}</p>}
          {s.title && <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl mt-2 break-words">{s.title}</h2>}
        </div>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((v) => (
            <div key={v.id} className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
              <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                <iframe
                  src={youtubeEmbedUrl(v.ytId!)}
                  title={v.title ?? "Video"}
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
              {v.title && <div className="p-3 sm:p-4"><p className="text-sm font-medium line-clamp-2">{v.title}</p></div>}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderSection = (s: SectionRow) => {
    switch (s.kind) {
      case "hero": return renderHero(s);
      case "features": return renderFeatures(s);
      case "featured": return renderProducts(s, display, true);
      case "new": return renderProducts(s, arrivals, false);
      case "best": return renderProducts(s, sellers, true);
      case "categories": return renderCategories(s);
      case "testimonials": return renderTestimonials(s);
      case "videos": return renderVideos(s);
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {sections.map((s) => {
        const node = renderSection(s);
        if (!node) return null;
        return (
          <div key={s.id} className="animate-fade-in">
            {node}
          </div>
        );
      })}
      <Footer />
    </div>
  );
}
