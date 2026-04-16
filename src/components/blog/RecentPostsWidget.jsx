import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function RecentPostsWidget({ excludePostId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchRecentPosts() {
      try {
        let query = supabase
          .from('posts')
          .select('id, title, slug, published_at')
          .eq('status', 'published')
          .eq('visibility', 'public')
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false })
          .limit(excludePostId ? 6 : 5);

        const { data, error: fetchError } = await query;

        if (cancelled) return;
        if (fetchError) throw fetchError;

        const filtered = excludePostId
          ? data.filter((p) => p.id !== excludePostId).slice(0, 5)
          : data;

        setPosts(filtered);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRecentPosts();
    return () => { cancelled = true; };
  }, [excludePostId]);

  if (error || (!loading && posts.length === 0)) return null;

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Posts Recentes</h3>

      {loading ? (
        <div style={styles.skeletonList}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={styles.skeletonItem}>
              <div style={styles.skeletonTitle} />
              <div style={styles.skeletonDate} />
            </div>
          ))}
        </div>
      ) : (
        <ul style={styles.list}>
          {posts.map((post) => (
            <li key={post.id} style={styles.item}>
              <a href={`/blog/${post.slug}`} style={styles.link}>
                {post.title}
              </a>
              <span style={styles.date}>{formatDate(post.published_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles = {
  container: {},
  heading: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '.9rem',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: 12,
    letterSpacing: '.02em',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    paddingBottom: 10,
    marginBottom: 10,
    borderBottom: '1px solid var(--line)',
  },
  link: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '.85rem',
    color: 'var(--text)',
    textDecoration: 'none',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    transition: 'color .2s',
  },
  date: {
    fontSize: '.75rem',
    color: 'var(--muted)',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  skeletonList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  skeletonItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  skeletonTitle: {
    height: 14,
    borderRadius: 4,
    background: 'var(--line)',
    width: '85%',
  },
  skeletonDate: {
    height: 10,
    borderRadius: 4,
    background: 'var(--line)',
    width: '40%',
  },
};
