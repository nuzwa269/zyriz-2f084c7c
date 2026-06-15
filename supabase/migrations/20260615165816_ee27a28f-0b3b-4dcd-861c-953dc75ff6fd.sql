ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'simple';

CREATE TABLE public.product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_attributes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_attributes TO authenticated;
GRANT ALL ON public.product_attributes TO service_role;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view attributes" ON public.product_attributes FOR SELECT USING (true);
CREATE POLICY "Admins manage attributes" ON public.product_attributes FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER set_product_attributes_updated_at BEFORE UPDATE ON public.product_attributes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_product_attributes_product ON public.product_attributes(product_id);

CREATE TABLE public.product_attribute_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id uuid NOT NULL REFERENCES public.product_attributes(id) ON DELETE CASCADE,
  value text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_attribute_values TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_attribute_values TO authenticated;
GRANT ALL ON public.product_attribute_values TO service_role;
ALTER TABLE public.product_attribute_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view attribute values" ON public.product_attribute_values FOR SELECT USING (true);
CREATE POLICY "Admins manage attribute values" ON public.product_attribute_values FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::app_role));
CREATE INDEX idx_product_attribute_values_attr ON public.product_attribute_values(attribute_id);

CREATE TABLE public.product_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku text,
  price numeric NOT NULL DEFAULT 0,
  sale_price numeric,
  stock integer NOT NULL DEFAULT 0,
  image_path text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_variations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variations TO authenticated;
GRANT ALL ON public.product_variations TO service_role;
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view variations" ON public.product_variations FOR SELECT USING (true);
CREATE POLICY "Admins manage variations" ON public.product_variations FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER set_product_variations_updated_at BEFORE UPDATE ON public.product_variations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_product_variations_product ON public.product_variations(product_id);

CREATE TABLE public.product_variation_values (
  variation_id uuid NOT NULL REFERENCES public.product_variations(id) ON DELETE CASCADE,
  attribute_value_id uuid NOT NULL REFERENCES public.product_attribute_values(id) ON DELETE CASCADE,
  PRIMARY KEY (variation_id, attribute_value_id)
);
GRANT SELECT ON public.product_variation_values TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variation_values TO authenticated;
GRANT ALL ON public.product_variation_values TO service_role;
ALTER TABLE public.product_variation_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view variation values" ON public.product_variation_values FOR SELECT USING (true);
CREATE POLICY "Admins manage variation values" ON public.product_variation_values FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::app_role));
CREATE INDEX idx_pvv_variation ON public.product_variation_values(variation_id);
CREATE INDEX idx_pvv_attr_value ON public.product_variation_values(attribute_value_id);