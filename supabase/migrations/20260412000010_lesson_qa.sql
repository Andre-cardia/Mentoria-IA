-- Story 3.3: Q&A por Aula
-- Tabela lesson_qa: perguntas e respostas aninhadas (1 nível)

CREATE TABLE IF NOT EXISTS public.lesson_qa (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id   uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id   uuid REFERENCES public.lesson_qa(id) ON DELETE CASCADE,
  body        text NOT NULL CHECK (char_length(body) >= 5),
  is_official boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_qa_lesson ON public.lesson_qa(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_qa_parent ON public.lesson_qa(parent_id);

ALTER TABLE public.lesson_qa ENABLE ROW LEVEL SECURITY;

-- SELECT: todos os autenticados
CREATE POLICY "qa: autenticados leem"
  ON public.lesson_qa FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT: usuário insere como ele mesmo
CREATE POLICY "qa: usuario insere propria"
  ON public.lesson_qa FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DELETE: próprio item ou admin
CREATE POLICY "qa: usuario deleta propria ou admin deleta tudo"
  ON public.lesson_qa FOR DELETE
  USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- UPDATE (is_official): apenas admin
CREATE POLICY "qa: admin marca oficial"
  ON public.lesson_qa FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
