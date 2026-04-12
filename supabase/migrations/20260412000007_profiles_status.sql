-- Migration: adiciona status ao perfil do aluno
-- active = acesso normal | suspended = temporariamente bloqueado | cancelled = matrícula cancelada

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'suspended', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles (status);
