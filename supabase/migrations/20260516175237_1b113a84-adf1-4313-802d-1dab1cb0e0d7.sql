
-- Categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  image_path text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add category_id to products
ALTER TABLE public.products
  ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX idx_products_category_id ON public.products(category_id);

-- Seed categories
INSERT INTO public.categories (slug, name, display_order) VALUES
  ('earrings', 'Earrings', 1),
  ('lockets', 'Lockets', 2),
  ('rings', 'Rings', 3),
  ('bracelets', 'Bracelets', 4),
  ('jewellery-set', 'Jewellery Set', 5),
  ('watches', 'Watches', 6),
  ('anklet', 'Anklet', 7);
