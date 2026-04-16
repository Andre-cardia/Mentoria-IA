import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { supabase } from '../../lib/supabase';
import Layout from '../components/Layout';
import CommentSection from '../../components/CommentSection';
import '../../styles/blog-prose.css';

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
  const navigate = useNavigate();
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
          <Link to="/blog" style={{ color: 'var(--accent)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem', textDecoration: 'none' }}>
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
      <div style={{ maxWidth: '740px', margin: '0 auto', padding: '36px 24px 80px' }}>
        {/* Cover hero */}
        {post.cover_url && (
          <div style={{ width: '100%', height: '300px', overflow: 'hidden', borderRadius: '8px', marginBottom: '28px' }}>
            <img src={post.cover_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* Breadcrumb */}
        <nav style={{ marginBottom: '20px', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', color: 'var(--muted)' }}>
          <Link to="/blog" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Blog</Link>
          <span style={{ margin: '0 8px' }}>›</span>
          <span>{post.title}</span>
        </nav>

        {/* Tags */}
        {post.post_tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {post.post_tags.map((pt, i) => pt.tags && (
              <span key={i} style={{
                fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--accent)',
                background: 'var(--accent-soft)', borderRadius: '3px', padding: '2px 8px',
              }}>
                {pt.tags.name}
              </span>
            ))}
          </div>
        )}

        <h1 style={{
          fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700,
          fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', lineHeight: 1.2,
          color: 'var(--text)', margin: '0 0 14px',
        }}>
          {post.title}
        </h1>

        <div style={{ display: 'flex', gap: '14px', marginBottom: '28px', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', color: 'var(--muted)' }}>
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

        {/* Share */}
        <ShareButtons title={post.title} url={pageUrl} />

        {/* Comments */}
        <CommentSection postId={post.id} loginHref="/login" />
      </div>
    </Layout>
  );
}
