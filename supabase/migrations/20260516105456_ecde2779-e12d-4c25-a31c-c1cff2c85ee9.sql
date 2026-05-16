
ALTER FUNCTION public.set_updated_at() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM PUBLIC, anon, authenticated;

DROP POLICY "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'products');
