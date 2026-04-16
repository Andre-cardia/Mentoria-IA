import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function FeaturedPost({ onFeaturedId }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, title, slug, cover_url, seo_description, author_name, published_at')
          .eq('featured', true)
          .eq('status', 'published')
          .eq('visibility', 'public')
          .limit(1)
          .single();

        if (error || !data) { setLoading(false); return; }
        setPost(data);
        onFeaturedId?.(data.id);
      } catch {
        // no featured post
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  if (loading || !post) return null;

  const fmtDate = (d) => {
    try {
      return new Date(d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return ''; }
  };

  return (
    <div className="featured-post" style={styles.container}>
      <a href={`/blog/${post.slug}`} style={styles.link}>
        <div style={styles.imageWrap}>
          {post.cover_url ? (
            <img src={post.cover_url} alt={post.title} style={styles.image} />
          ) : (
            <div style={styles.fallback} />
          )}
          <div style={styles.overlay} />
        </div>
        <div style={styles.content}>
          <span style={styles.badge}>Destaque</span>
          <h2 style={styles.title}>{post.title}</h2>
          {post.seo_description && (
            <p style={styles.excerpt}>{post.seo_description}</p>
          )}
          <div style={styles.meta}>
            {post.author_name && <span>{post.author_name}</span>}
            <span>{fmtDate(post.published_at)}</span>
          </div>
          <span style={styles.cta}>Ler artigo →</span>
        </div>
      </a>

      <style>{`
        @media (max-width: 768px) {
          .featured-post a { flex-direction: column !important; }
          .featured-post a > div:first-child { width: 100% !important; height: 200px !important; }
          .featured-post a > div:last-child { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    marginBottom: 32,
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid var(--line)',
    background: 'var(--panel-2)',
  },
  link: {
    display: 'flex',
    textDecoration: 'none',
    color: 'inherit',
    minHeight: 280,
  },
  imageWrap: {
    position: 'relative',
    width: '60%',
    minHeight: 280,
    overflow: 'hidden',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  fallback: {
    width: '100%',
    height: '100%',
    background: 'var(--panel-2)',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(90deg, transparent 60%, var(--panel-2) 100%)',
  },
  content: {
    width: '40%',
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 8,
  },
  badge: {
    display: 'inline-block',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '.72rem',
    fontWeight: 600,
    color: 'var(--accent)',
    background: 'var(--accent-soft)',
    padding: '3px 10px',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 'clamp(1.4rem, 3vw, 2rem)',
    fontWeight: 700,
    lineHeight: 1.2,
    color: 'var(--text)',
    margin: 0,
  },
  excerpt: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '.9rem',
    lineHeight: 1.5,
    color: 'var(--muted)',
    margin: 0,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  meta: {
    display: 'flex',
    gap: 12,
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '.8rem',
    color: 'var(--muted)',
  },
  cta: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '.85rem',
    fontWeight: 600,
    color: 'var(--accent)',
    marginTop: 4,
  },
};
