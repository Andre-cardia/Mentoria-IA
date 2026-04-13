-- Migration: adiciona coluna avatar_url à tabela profiles (Story 5.2)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
