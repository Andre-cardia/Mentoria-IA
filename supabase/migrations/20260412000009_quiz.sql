-- Story 3.2: Provas Objetivas (Quiz)
-- Tabelas: quiz_questions, quiz_options, quiz_attempts

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id  uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  question   text NOT NULL,
  "order"    int  NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_options (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  label       text NOT NULL,
  is_correct  boolean NOT NULL DEFAULT false,
  "order"     int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id    uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score        int  NOT NULL,
  answers      jsonb NOT NULL DEFAULT '{}',
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_lesson  ON public.quiz_questions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question  ON public.quiz_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_lesson   ON public.quiz_attempts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user     ON public.quiz_attempts(user_id);

-- RLS
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts  ENABLE ROW LEVEL SECURITY;

-- quiz_questions: autenticados leem; admin escreve
CREATE POLICY "quiz_questions: autenticados leem"
  ON public.quiz_questions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "quiz_questions: admin escreve"
  ON public.quiz_questions FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- quiz_options: autenticados leem; admin escreve
-- is_correct não é filtrado por RLS — o frontend omite o campo no select do player
CREATE POLICY "quiz_options: autenticados leem"
  ON public.quiz_options FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "quiz_options: admin escreve"
  ON public.quiz_options FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- quiz_attempts: aluno vê e insere as próprias; admin vê todas
CREATE POLICY "quiz_attempts: aluno ve proprias"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "quiz_attempts: aluno insere propria"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
