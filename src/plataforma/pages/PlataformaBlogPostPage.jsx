import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { supabase } from '../../lib/supabase';
import Layout from '../components/Layout';
import CommentSection from '../../components/CommentSection';
import BlogSidebar from '../../components/blog/BlogSidebar';
import InlinePromo from '../../components/blog/InlinePromo';
import '../../styles/blog-prose.css';
import { Iframe } from '../components/extensions/Iframe';
import '../components/RichTextEditor.css';

// Link já incluso no StarterKit v3 — não importar separadamente
const tiptapExtensions = [StarterKit, Image, Iframe];

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
      <a href={`https://wa.me/?text=${enc(title + ' ' + url)}`} target="_blank" rel="noopener noreferrer"
        style={{ display: 'inline-block', padding: '8px 14px', background: '#25d366', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.82rem', fontWeight: 600 }}>
        WhatsApp
      </a>
      <a href={`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer"
        style={{ display: 'inline-block', padding: '8px 14px', background: '#1d9bf0', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.82rem', fontWeight: 600 }}>
        Twitter / X
      </a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} target="_blank" rel="noopener noreferrer"
        style={{ display: 'inline-block', padding: '8px 14px', background: '#0077b5', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.82rem', fontWeight: 600 }}>
        LinkedIn
      </a>
    </div>
  );
}

export default function PlataformaBlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, content_json, cover_url, author_name, published_at, seo_description, visibility, status, post_tags(tags(name, slug))')
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
      <Layout>
        <div style={{ padding: '48px 24px', fontFamily: 'Space Grotesk, sans-serif', color: 'var(--muted)' }}>
          Carregando artigo...
        </div>
      </Layout>
    );
  }

  if (notFound) {
    return (
      <Layout>
        <div style={{ padding: '48px 24px' }}>
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--muted)', marginBottom: '12px' }}>Artigo não encontrado.</p>
          <Link to="/blog" style={{ color: 'var(--accent-text)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem', textDecoration: 'none' }}>
            ← Voltar para o Blog
          </Link>
        </div>
      </Layout>
    );
  }

  const htmlContent = post.content_json ? generateHTML(post.content_json, tiptapExtensions) : '';
  const pageUrl = window.location.href;

  return (
    <Layout>
      <div className="plat-blogpost-layout" style={{ maxWidth: '1600px', margin: '0 auto', padding: '8px 0 80px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '48px' }}>
        {/* Article column */}
        <div>
          {/* Trilha de navegação */}
          <nav aria-label="Trilha de navegação" style={{ marginBottom: '22px', fontFamily: 'Space Mono, monospace', fontSize: '.68rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            <Link to="/inicio" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Início</Link>
            <span style={{ margin: '0 8px' }}>›</span>
            <Link to="/blog" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Blog</Link>
            {post.post_tags?.[0]?.tags && (
              <>
                <span style={{ margin: '0 8px' }}>›</span>
                <span style={{ color: 'var(--text)' }}>{post.post_tags[0].tags.name}</span>
              </>
            )}
          </nav>

          {/* Categorias */}
          {post.post_tags?.length > 0 && (
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {post.post_tags.map((pt, i) => pt.tags && (
                <span key={i} style={{
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: '.75rem', fontWeight: 700,
                  letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent-text)',
                }}>
                  {pt.tags.name}
                </span>
              ))}
            </div>
          )}

          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700,
            fontSize: 'clamp(1.7rem, 3.4vw, 2.75rem)', lineHeight: 1.15, letterSpacing: '-.01em',
            color: 'var(--text)', margin: '0 0 18px', maxWidth: '24ch',
          }}>
            {post.title}
          </h1>

          {post.seo_description && (
            <p style={{ fontSize: '1.1rem', lineHeight: 1.65, color: 'var(--muted)', margin: '0 0 24px' }}>
              {post.seo_description}
            </p>
          )}

          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
            padding: '16px 0', margin: '0 0 32px',
            borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
            fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem', color: 'var(--muted)',
          }}>
            {post.author_name && <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{post.author_name}</strong>}
            {post.author_name && <span>·</span>}
            <span>{fmtDate(post.published_at)}</span>
          </div>

          {/* Capa: ocupa toda a coluna, depois do título */}
          {post.cover_url && (
            <div style={{ width: '100%', aspectRatio: '16 / 9', overflow: 'hidden', borderRadius: '8px', marginBottom: '32px', background: 'var(--panel-2)' }}>
              <img src={post.cover_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          )}

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

          {/* Share */}
          <ShareButtons title={post.title} url={pageUrl} />

          {/* Comments */}
          <CommentSection postId={post.id} loginHref="/login" />
        </div>

        {/* Sidebar */}
        <div style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
          <BlogSidebar excludePostId={post.id} />
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .plat-blogpost-layout { grid-template-columns: 1fr !important; }
          .plat-blogpost-layout > div:last-child { position: static !important; }
        }
      `}</style>
    </Layout>
  );
}
