import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Layout from '../components/Layout';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PlataformaBlogPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('posts')
        .select('id, title, slug, cover_url, seo_description, published_at, author_name, visibility, post_tags(tags(name, slug))')
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false });
      setPosts(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const allTags = Array.from(
    new Map(
      posts.flatMap((p) => p.post_tags?.map((pt) => pt.tags).filter(Boolean) ?? [])
           .map((t) => [t.slug, t])
    ).values()
  );

  const filtered = activeTag
    ? posts.filter((p) => p.post_tags?.some((pt) => pt.tags?.slug === activeTag))
    : posts;

  return (
    <Layout>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
          Blog
        </h1>
        <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '.95rem', color: 'var(--muted)', margin: '0 0 28px' }}>
          Artigos públicos e exclusivos para membros.
        </p>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
            <button
              onClick={() => setActiveTag('')}
              style={{
                background: !activeTag ? 'var(--accent)' : 'var(--panel-2)',
                color: !activeTag ? '#000' : 'var(--text)',
                border: '1px solid var(--line-strong)', borderRadius: '20px',
                padding: '5px 14px', cursor: 'pointer',
                fontFamily: 'Space Grotesk, sans-serif', fontSize: '.82rem', fontWeight: !activeTag ? 600 : 400,
              }}
            >
              Todos
            </button>
            {allTags.map((tag) => (
              <button
                key={tag.slug}
                onClick={() => setActiveTag(tag.slug)}
                style={{
                  background: activeTag === tag.slug ? 'var(--accent)' : 'var(--panel-2)',
                  color: activeTag === tag.slug ? '#000' : 'var(--text)',
                  border: '1px solid var(--line-strong)', borderRadius: '20px',
                  padding: '5px 14px', cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: '.82rem', fontWeight: activeTag === tag.slug ? 600 : 400,
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--muted)' }}>Carregando artigos...</p>
        ) : filtered.length === 0 ? (
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--muted)' }}>Nenhum artigo publicado ainda.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {filtered.map((post) => (
              <article
                key={post.id}
                onClick={() => navigate(`/blog/${post.slug}`)}
                style={{
                  background: 'var(--panel-2)', border: '1px solid var(--line)',
                  borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                  transition: 'border-color .2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
              >
                <div style={{ height: '160px', overflow: 'hidden', background: 'var(--panel-2)' }}>
                  {post.cover_url ? (
                    <img src={post.cover_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '28px', height: '28px', background: 'var(--line)', borderRadius: '4px' }} />
                    </div>
                  )}
                </div>
                <div style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {post.visibility === 'private' && (
                      <span style={{
                        fontFamily: 'Space Mono, monospace', fontSize: '.68rem', fontWeight: 700,
                        background: 'var(--accent)', color: '#000',
                        borderRadius: '3px', padding: '2px 6px',
                      }}>
                        Exclusivo
                      </span>
                    )}
                    {post.post_tags?.map((pt, i) => pt.tags && (
                      <span key={i} style={{
                        fontFamily: 'Space Mono, monospace', fontSize: '.68rem', color: 'var(--accent)',
                        background: 'var(--accent-soft)', borderRadius: '3px', padding: '2px 6px',
                      }}>
                        {pt.tags.name}
                      </span>
                    ))}
                  </div>
                  <h2 style={{
                    fontFamily: 'Space Grotesk, sans-serif', fontSize: '1rem', fontWeight: 600,
                    color: 'var(--text)', margin: '0 0 6px', lineHeight: 1.3,
                  }}>
                    {post.title}
                  </h2>
                  {post.seo_description && (
                    <p style={{
                      fontFamily: 'Space Grotesk, sans-serif', fontSize: '.82rem', color: 'var(--muted)',
                      margin: '0 0 10px', lineHeight: 1.6,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {post.seo_description}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '.78rem', color: 'var(--muted)' }}>{post.author_name}</span>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.72rem', color: 'var(--muted)' }}>{fmtDate(post.published_at)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
