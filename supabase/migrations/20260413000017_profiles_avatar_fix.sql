-- Garante que a coluna avatar_url existe em profiles
-- (correção: migration 12 foi registrada mas a coluna não foi criada no remoto)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
