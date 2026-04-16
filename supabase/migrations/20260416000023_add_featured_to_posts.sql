ALTER TABLE posts ADD COLUMN featured boolean NOT NULL DEFAULT false;

CREATE INDEX idx_posts_featured ON posts(featured) WHERE featured = true;
