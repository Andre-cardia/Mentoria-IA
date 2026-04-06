import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Layout from '../components/Layout';

export default function AvisosPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('announcements')
      .select('id, title, body, published_at')
      .order('published_at', { ascending: false })
      .then(({ data }) => { setAnnouncements(data ?? []); setLoading(false); });
  }, []);

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  }

  return (
    <Layout>
      <div style={{ maxWidth: '780px' }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
          Informações
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px' }}>Quadro de Avisos</h1>

        {loading && <p style={{ color: 'var(--muted)' }}>Carregando avisos...</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {announcements.map((a, idx) => (
            <div key={a.id} style={{
              background: 'var(--panel)',
              border: idx === 0 ? '1px solid rgba(255,106,0,.25)' : '1px solid var(--line)',
              borderTop: idx === 0 ? '2px solid var(--accent)' : '1px solid var(--line)',
              borderRadius: '6px',
              padding: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', lineHeight: 1.3 }}>
                  {a.title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {idx === 0 && (
                    <span style={{
                      fontFamily: 'Space Mono, monospace', fontSize: '.65rem', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '.06em',
                      background: 'var(--accent-soft)', color: 'var(--accent)',
                      border: '1px solid rgba(255,106,0,.25)', borderRadius: '3px',
                      padding: '3px 10px',
                    }}>
                      Novo
                    </span>
                  )}
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(a.published_at)}
                  </span>
                </div>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '.925rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {a.body}
              </p>
            </div>
          ))}
          {!loading && announcements.length === 0 && (
            <div style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: '6px', padding: '32px', textAlign: 'center',
            }}>
              <p style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.875rem' }}>
                Nenhum aviso publicado ainda.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
