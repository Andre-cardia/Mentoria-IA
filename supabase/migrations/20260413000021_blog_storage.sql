-- Bucket público para imagens do blog (capa e conteúdo)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Leitura pública para todos
CREATE POLICY "Blog images public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'blog-images');

-- Upload restrito a admin
CREATE POLICY "Admin upload blog images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'blog-images' AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Deleção restrita a admin
CREATE POLICY "Admin delete blog images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'blog-images' AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
