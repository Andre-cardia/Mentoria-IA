import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { supabase } from '../lib/supabase';
import CommentSection from '../components/CommentSection';
import BlogSidebar from '../components/blog/BlogSidebar';
import InlinePromo from '../components/blog/InlinePromo';
import '../styles/blog-prose.css';

// Link já incluso no StarterKit v3 — não importar separadamente
const tiptapExtensions = [StarterKit, Image];

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function ShareButtons({ title, url }) {
  const enc = encodeURIComponent;
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '32px 0' }}>
      <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', color: 'var(--muted)', alignSelf: 'center' }}>
        Compartilhar:
      </span>
      <a
        href={`https://wa.me/?text=${enc(title + ' ' + url)}`}
        target="_blank" rel="noopener noreferrer"
        style={{
          display: 'inline-block', padding: '8px 16px',
          background: '#25d366', color: '#fff', textDecoration: 'none',
          borderRadius: '4px', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', fontWeight: 600,
        }}
      >
        WhatsApp
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`}
        target="_blank" rel="noopener noreferrer"
        style={{
          display: 'inline-block', padding: '8px 16px',
          background: '#1d9bf0', color: '#fff', textDecoration: 'none',
          borderRadius: '4px', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', fontWeight: 600,
        }}
      >
        Twitter / X
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`}
        target="_blank" rel="noopener noreferrer"
        style={{
          display: 'inline-block', padding: '8px 16px',
          background: '#0077b5', color: '#fff', textDecoration: 'none',
          borderRadius: '4px', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', fontWeight: 600,
        }}
      >
        LinkedIn
      </a>
    </div>
  );
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, content_json, cover_url, author_name, published_at, seo_title, seo_description, visibility, status, post_tags(tags(name, slug))')
        .eq('slug', slug)
        .single();

      if (error || !data) { setNotFound(true); setLoading(false); return; }

      const isPublished = (data.status === 'published' || data.status === 'scheduled')
        && data.published_at && new Date(data.published_at) <= new Date();

      if (!isPublished) { setNotFound(true); setLoading(false); return; }

      setPost(data);
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--muted)' }}>Carregando artigo...</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--muted)', fontSize: '1.1rem' }}>Artigo não encontrado.</p>
        <a href="/blog" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--accent)', fontSize: '.9rem' }}>← Voltar para o Blog</a>
      </div>
    );
  }

  const pageTitle = post.seo_title ?? post.title;
  const pageUrl = window.location.href;
  const htmlContent = post.content_json ? generateHTML(post.content_json, tiptapExtensions) : '';
  // cover_url pode ser relativa (/api/blog/image/...) — OG precisa de URL absoluta
  const ogImage = post.cover_url
    ? (post.cover_url.startsWith('/') ? window.location.origin + post.cover_url : post.cover_url)
    : null;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        {post.seo_description && <meta name="description" content={post.seo_description} />}
        <meta property="og:title" content={pageTitle} />
        {post.seo_description && <meta property="og:description" content={post.seo_description} />}
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="article" />
      </Helmet>

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
            <a href="/plataforma/login" style={{
              fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', color: 'var(--muted)',
              textDecoration: 'none', padding: '8px 16px',
              border: '1px solid var(--line)', borderRadius: '4px',
            }}>
              Entrar
            </a>
          </div>
        </header>

        <div className="blogpost-layout" style={{ maxWidth: '1060px', margin: '0 auto', padding: '40px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '40px' }}>
          {/* Article column */}
          <div>
            {/* Cover image */}
            {post.cover_url && (
              <div style={{ width: '100%', height: '360px', overflow: 'hidden', borderRadius: '8px', marginBottom: '32px' }}>
                <img src={post.cover_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            {/* Breadcrumb */}
            <nav style={{ marginBottom: '24px', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', color: 'var(--muted)' }}>
              <a href="/blog" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Blog</a>
              <span style={{ margin: '0 8px' }}>›</span>
              <span>{post.title}</span>
            </nav>

            {/* Tags */}
            {post.post_tags?.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {post.post_tags.map((pt, i) => pt.tags && (
                  <span key={i} style={{
                    fontFamily: 'Space Mono, monospace', fontSize: '.72rem', color: 'var(--accent)',
                    background: 'var(--accent-soft)', borderRadius: '3px', padding: '2px 8px',
                  }}>
                    {pt.tags.name}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 style={{
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700,
              fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', lineHeight: 1.2,
              color: 'var(--text)', margin: '0 0 16px',
            }}>
              {post.title}
            </h1>

            {/* Meta */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', color: 'var(--muted)' }}>
              {post.author_name && <span>{post.author_name}</span>}
              <span>•</span>
              <span>{fmtDate(post.published_at)}</span>
            </div>

            {/* Article body */}
            <div
              className="blog-prose"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              style={{
                fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.05rem',
                lineHeight: 1.8, color: 'var(--text)',
              }}
            />

            {/* Inline promo */}
            <InlinePromo
              title="Mentoria Zero-to-Hero IA"
              description="Aprenda a construir com IA de verdade. 2 encontros por semana."
              cta="Ver planos"
              href="/#planos"
              badge="A partir de R$ 497/mês"
            />

            {/* Share buttons */}
            <ShareButtons title={post.title} url={pageUrl} />

            {/* Comments */}
            <CommentSection postId={post.id} />
          </div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
            <BlogSidebar excludePostId={post.id} />
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .blogpost-layout { grid-template-columns: 1fr !important; }
            .blogpost-layout > div:last-child { position: static !important; }
          }
        `}</style>
      </div>
    </>
  );
}
