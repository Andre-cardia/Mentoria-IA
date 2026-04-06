-- Migration: lesson_progress RLS policies

-- Aluno gerencia apenas seu próprio progresso
CREATE POLICY "aluno gerencia progresso"
  ON lesson_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin lê progresso de todos os alunos
CREATE POLICY "admin le progresso"
  ON lesson_progress
  FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
