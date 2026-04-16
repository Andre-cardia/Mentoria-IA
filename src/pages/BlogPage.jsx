import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import BlogSidebar from '../components/blog/BlogSidebar';
import FeaturedPost from '../components/blog/FeaturedPost';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function BlogPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('');
  const [featuredId, setFeaturedId] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('posts')
        .select('id, title, slug, cover_url, seo_description, published_at, author_name, visibility, post_tags(tags(name, slug))')
        .eq('visibility', 'public')
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false });
      setPosts(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // Collect unique tags from posts
  const allTags = Array.from(
    new Map(
      posts.flatMap((p) => p.post_tags?.map((pt) => pt.tags).filter(Boolean) ?? [])
           .map((t) => [t.slug, t])
    ).values()
  );

  const basePosts = featuredId ? posts.filter((p) => p.id !== featuredId) : posts;
  const filtered = activeTag ? basePosts.filter((p) => p.post_tags?.some((pt) => pt.tags?.slug === activeTag)) : basePosts;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid var(--line)', background: 'rgba(6,6,6,.85)',
        backdropFilter: 'blur(16px)',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '12px', height: '12px', background: 'var(--accent)' }} />
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '1.1rem', color: 'var(--text)' }}>
              ZERO-TO-HERO IA
            </span>
          </a>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem', color: 'var(--accent)', fontWeight: 600 }}>Blog</span>
            <a href="/plataforma/login" style={{
              fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', color: 'var(--muted)',
              textDecoration: 'none', padding: '8px 16px',
              border: '1px solid var(--line)', borderRadius: '4px',
            }}>
              Entrar
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: '64px 24px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 700, margin: '0 0 12px', color: 'var(--text)', lineHeight: 1.1,
        }}>Blog</h1>
        <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.05rem', color: 'var(--muted)', margin: 0 }}>
          Artigos sobre Inteligência Artificial, produtividade e o futuro do trabalho.
        </p>
      </section>

      {/* Featured post hero */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <FeaturedPost onFeaturedId={setFeaturedId} />
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 32px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTag('')}
            style={{
              background: !activeTag ? 'var(--accent)' : 'var(--panel-2)',
              color: !activeTag ? '#000' : 'var(--text)',
              border: '1px solid var(--line-strong)', borderRadius: '20px',
              padding: '6px 16px', cursor: 'pointer',
              fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', fontWeight: !activeTag ? 600 : 400,
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
                padding: '6px 16px', cursor: 'pointer',
                fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', fontWeight: activeTag === tag.slug ? 600 : 400,
              }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* 2-column layout: posts + sidebar */}
      <div className="blog-layout" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
        {/* Posts grid */}
        <div>
          {loading ? (
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--muted)' }}>Carregando artigos...</p>
          ) : filtered.length === 0 ? (
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--muted)' }}>Nenhum artigo publicado ainda.</p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
            }}>
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
                  {/* Cover */}
                  <div style={{ height: '180px', background: 'var(--panel-2)', overflow: 'hidden' }}>
                    {post.cover_url ? (
                      <img src={post.cover_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'var(--panel-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '32px', height: '32px', background: 'var(--line)', borderRadius: '4px' }} />
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div style={{ padding: '16px' }}>
                    {/* Tags */}
                    {post.post_tags?.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {post.post_tags.map((pt, i) => pt.tags && (
                          <span key={i} style={{
                            fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--accent)',
                            background: 'var(--accent-soft)', borderRadius: '3px', padding: '2px 6px',
                          }}>
                            {pt.tags.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 style={{
                      fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.05rem', fontWeight: 600,
                      color: 'var(--text)', margin: '0 0 8px', lineHeight: 1.3,
                    }}>
                      {post.title}
                    </h2>
                    {post.seo_description && (
                      <p style={{
                        fontFamily: 'Space Grotesk, sans-serif', fontSize: '.875rem', color: 'var(--muted)',
                        margin: '0 0 12px', lineHeight: 1.6,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {post.seo_description}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '.8rem', color: 'var(--muted)' }}>
                        {post.author_name}
                      </span>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.75rem', color: 'var(--muted)' }}>
                        {fmtDate(post.published_at)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ alignSelf: 'start' }}>
          <BlogSidebar />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .blog-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
