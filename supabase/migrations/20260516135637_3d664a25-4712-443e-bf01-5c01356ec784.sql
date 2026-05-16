DROP POLICY IF EXISTS "Public read product images" ON storage.objects;

CREATE POLICY "Public read product images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] IN ('products', 'demo')
);