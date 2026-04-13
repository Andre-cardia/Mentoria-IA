-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Story 8.1 — Blog Schema                                     ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Enums
DO $$ BEGIN
  CREATE TYPE post_status AS ENUM ('draft','published','scheduled','archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE post_visibility AS ENUM ('public','private');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE comment_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Tags
CREATE TABLE IF NOT EXISTS tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  slug            text NOT NULL UNIQUE,
  content_json    jsonb,
  cover_url       text,
  author_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name     text,
  status          post_status NOT NULL DEFAULT 'draft',
  visibility      post_visibility NOT NULL DEFAULT 'public',
  published_at    timestamptz,
  seo_title       text,
  seo_description text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Post ↔ Tags junction
CREATE TABLE IF NOT EXISTS post_tags (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS post_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name  text NOT NULL,
  content    text NOT NULL,
  status     comment_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_status_visibility_published
  ON posts (status, visibility, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts (slug);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments (post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_status ON post_comments (status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_posts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_posts_updated_at ON posts;
CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_posts_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Tags: leitura pública, escrita somente admin
DROP POLICY IF EXISTS "tags_read_all" ON tags;
CREATE POLICY "tags_read_all" ON tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "tags_admin_write" ON tags;
CREATE POLICY "tags_admin_write" ON tags
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Posts: leitura pública apenas public+published+past; leitura privada para autenticados; escrita somente admin
DROP POLICY IF EXISTS "posts_read_public" ON posts;
CREATE POLICY "posts_read_public" ON posts FOR SELECT USING (
  visibility = 'public'
  AND status IN ('published','scheduled')
  AND published_at <= now()
);

DROP POLICY IF EXISTS "posts_read_authenticated" ON posts;
CREATE POLICY "posts_read_authenticated" ON posts FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND status IN ('published','scheduled')
  AND published_at <= now()
);

DROP POLICY IF EXISTS "posts_admin_all" ON posts;
CREATE POLICY "posts_admin_all" ON posts
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Post_tags: leitura pública, escrita somente admin
DROP POLICY IF EXISTS "post_tags_read_all" ON post_tags;
CREATE POLICY "post_tags_read_all" ON post_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "post_tags_admin_write" ON post_tags;
CREATE POLICY "post_tags_admin_write" ON post_tags
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Comments: leitura de aprovados para todos; insert para autenticados; moderação para admin
DROP POLICY IF EXISTS "comments_read_approved" ON post_comments;
CREATE POLICY "comments_read_approved" ON post_comments FOR SELECT USING (
  status = 'approved'
);

DROP POLICY IF EXISTS "comments_insert_auth" ON post_comments;
CREATE POLICY "comments_insert_auth" ON post_comments FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND auth.uid() = user_id
);

DROP POLICY IF EXISTS "comments_admin_all" ON post_comments;
CREATE POLICY "comments_admin_all" ON post_comments
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
