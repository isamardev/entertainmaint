
CREATE POLICY "article images public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'article-images');
CREATE POLICY "admins upload article images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'article-images' AND public.is_admin(auth.uid()));
CREATE POLICY "admins update article images" ON storage.objects FOR UPDATE
  USING (bucket_id = 'article-images' AND public.is_admin(auth.uid()));
CREATE POLICY "admins delete article images" ON storage.objects FOR DELETE
  USING (bucket_id = 'article-images' AND public.is_admin(auth.uid()));
