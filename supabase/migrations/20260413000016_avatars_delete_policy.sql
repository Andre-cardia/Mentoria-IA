-- Adiciona política DELETE para avatars (necessária para remove() e replace())
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatar_delete_own'
  ) THEN
    CREATE POLICY "avatar_delete_own"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;
