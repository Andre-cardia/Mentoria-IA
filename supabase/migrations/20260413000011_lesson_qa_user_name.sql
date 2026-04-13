-- Story 3.3 fix: adiciona user_name à lesson_qa para evitar join não-suportado com profiles
ALTER TABLE public.lesson_qa
  ADD COLUMN IF NOT EXISTS user_name text;
