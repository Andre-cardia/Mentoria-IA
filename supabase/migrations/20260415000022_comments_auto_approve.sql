-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Comments — aprovação automática para usuários autenticados  ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Permite usuários autenticados inserir comentários com status 'approved'
DROP POLICY IF EXISTS "comments_insert_auth" ON post_comments;
CREATE POLICY "comments_insert_auth" ON post_comments FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND auth.uid() = user_id
);
