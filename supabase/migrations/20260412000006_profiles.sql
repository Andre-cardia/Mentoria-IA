-- Migration: tabela profiles — perfil completo do aluno

CREATE TABLE IF NOT EXISTS profiles (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text NOT NULL,
  phone      text,
  origin     text,           -- como ficou sabendo da mentoria
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Usuário lê e edita apenas o próprio perfil
CREATE POLICY "perfil: usuario gerencia o proprio"
  ON profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin lê todos os perfis
CREATE POLICY "perfil: admin le todos"
  ON profiles FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
