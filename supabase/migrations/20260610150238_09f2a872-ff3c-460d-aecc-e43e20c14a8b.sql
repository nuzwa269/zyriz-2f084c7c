CREATE TABLE public.site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  meta_description text,
  is_published boolean NOT NULL DEFAULT true,
  show_in_footer boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_pages TO authenticated;
GRANT ALL ON public.site_pages TO service_role;

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published pages"
ON public.site_pages FOR SELECT
USING (is_published = true OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert pages"
ON public.site_pages FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update pages"
ON public.site_pages FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete pages"
ON public.site_pages FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE TRIGGER set_site_pages_updated_at
BEFORE UPDATE ON public.site_pages
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_pages (slug, title, content, meta_description, sort_order) VALUES
('about', 'About Us', E'# About Us\n\nWrite your story here. You can edit this page anytime from the admin panel.', 'Learn more about our brand and story.', 1),
('contact', 'Contact', E'# Contact\n\nReach out via WhatsApp or email.', 'Get in touch with us.', 2),
('privacy-policy', 'Privacy Policy', E'# Privacy Policy\n\nDescribe how you collect, use, and protect customer data.', 'Our privacy policy.', 3),
('shipping', 'Shipping', E'# Shipping Information\n\nDescribe shipping times, areas, and fees.', 'Shipping details.', 4),
('refund-policy', 'Refund Policy', E'# Refund Policy\n\nDescribe your refund/return process.', 'Our refund policy.', 5),
('terms', 'Terms & Conditions', E'# Terms & Conditions\n\nDescribe your terms of service.', 'Terms and conditions.', 6);