
-- Reviews
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  review_text TEXT NOT NULL,
  image_path TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 5)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published reviews" ON public.reviews FOR SELECT TO anon, authenticated
  USING (is_published = true OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER reviews_set_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO storage.buckets (id, name, public) VALUES ('review-images', 'review-images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public can view review images" ON storage.objects FOR SELECT USING (bucket_id = 'review-images');
CREATE POLICY "Admins upload review images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'review-images' AND private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update review images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'review-images' AND private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete review images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'review-images' AND private.has_role(auth.uid(), 'admin'::app_role));

-- Site settings
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings_public_read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings_admin_all" ON public.site_settings FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "site_assets_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'site-assets');
CREATE POLICY "site_assets_admin_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-assets' AND private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "site_assets_admin_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-assets' AND private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "site_assets_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-assets' AND private.has_role(auth.uid(), 'admin'::app_role));

-- Home features
CREATE TABLE public.home_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text NOT NULL DEFAULT 'Sparkles',
  title text NOT NULL,
  text text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.home_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published features" ON public.home_features FOR SELECT TO anon, authenticated
  USING (is_published = true OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage features" ON public.home_features FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER set_updated_at_home_features BEFORE UPDATE ON public.home_features
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.home_features (icon, title, text, display_order) VALUES
  ('Sparkles', 'Premium Quality', 'Genuine gold plating on Turkish brass.', 1),
  ('Truck', 'Fast Delivery', 'Nationwide shipping across Pakistan.', 2),
  ('ShieldCheck', 'Easy WhatsApp Order', 'Order in seconds via WhatsApp.', 3);

-- Footer links
CREATE TABLE public.footer_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  section text NOT NULL DEFAULT 'explore',
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  is_external boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published footer links" ON public.footer_links FOR SELECT TO anon, authenticated
  USING (is_published = true OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage footer links" ON public.footer_links FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER set_updated_at_footer_links BEFORE UPDATE ON public.footer_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.footer_links (label, url, section, display_order, is_external) VALUES
  ('Shop', '/shop', 'explore', 1, false),
  ('About', '/about', 'explore', 2, false),
  ('Contact', '/contact', 'explore', 3, false);

-- Home sections (order/title/subtitle of homepage sections)
CREATE TABLE public.home_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  title text,
  subtitle text,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published sections" ON public.home_sections FOR SELECT
  USING (is_published = true OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage sections" ON public.home_sections FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER home_sections_set_updated_at BEFORE UPDATE ON public.home_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.home_sections (kind, title, subtitle, display_order) VALUES
  ('hero', 'Hero', null, 10),
  ('features', null, null, 20),
  ('featured', 'Signature Pieces', 'Featured', 30),
  ('new', 'New Arrivals', 'Just In', 40),
  ('best', 'Best Sellers', 'Bestsellers', 50),
  ('categories', 'Shop by Category', 'Browse', 60),
  ('testimonials', 'Happy Customers', 'Testimonials', 70),
  ('videos', 'Watch Our Story', 'Videos', 80);
-- Videos section off by default (no videos yet)
UPDATE public.home_sections SET is_published = false WHERE kind = 'videos';

-- Home videos
CREATE TABLE public.home_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  youtube_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.home_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published videos" ON public.home_videos FOR SELECT TO anon, authenticated
  USING (is_published = true OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage videos" ON public.home_videos FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER home_videos_updated_at BEFORE UPDATE ON public.home_videos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Social links
CREATE TABLE public.social_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published social links" ON public.social_links FOR SELECT TO anon, authenticated
  USING (is_published = true OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage social links" ON public.social_links FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER set_social_links_updated_at BEFORE UPDATE ON public.social_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
