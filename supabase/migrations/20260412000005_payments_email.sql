-- Migration: adiciona coluna email em payments
-- Aditivo e não-destrutivo — linhas existentes ficam com email = NULL

ALTER TABLE payments ADD COLUMN IF NOT EXISTS email text;

CREATE INDEX IF NOT EXISTS idx_payments_email ON payments (email);
