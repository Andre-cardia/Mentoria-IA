-- Adiciona campos para destacar avisos no dashboard

-- Adicionar coluna 'featured' para marcar avisos em destaque
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

-- Adicionar coluna 'type' para diferentes estilos visuais
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'info'
CHECK (type IN ('info', 'warning', 'success', 'error', 'update'));

-- Adicionar índice para avisos em destaque
CREATE INDEX IF NOT EXISTS idx_announcements_featured
ON announcements(featured, published_at DESC)
WHERE featured = true;

-- Comentários explicativos
COMMENT ON COLUMN announcements.featured IS 'Indica se o aviso deve aparecer em destaque na página inicial';
COMMENT ON COLUMN announcements.type IS 'Tipo visual do aviso: info (azul), warning (laranja), success (verde), error (vermelho), update (roxo)';
