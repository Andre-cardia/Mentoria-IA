import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { supabase } from '../../lib/supabase';
import Layout from '../components/Layout';

export default function MateriaisPage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    supabase
      .from('materials')
      .select('id, title, description, file_size, created_at, module_id, modules(id, title, order)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const materials = data ?? [];
        const grouped = {};
        const extra = [];

        for (const m of materials) {
          if (!m.module_id) { extra.push(m); continue; }
          const key = m.module_id;
          if (!grouped[key]) grouped[key] = { title: m.modules.title, order: m.modules.order, items: [] };
          grouped[key].items.push(m);
        }

        const result = Object.values(grouped).sort((a, b) => a.order - b.order);
        if (extra.length > 0) result.push({ title: 'Conteúdo Extra', order: Infinity, items: extra });
        setSections(result);
        setLoading(false);
      });
  }, []);

  async function handleDownload(material) {
    setDownloading(material.id);
    try {
      const res = await fetch(`/api/materials/${material.id}/download`, {
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível gerar o link de download.');
      }
      if (!data.downloadUrl) {
        throw new Error('Link de download não disponível no momento.');
      }

      window.open(data.downloadUrl, '_blank');
    } catch (err) {
      console.error('Erro ao baixar material:', err);
      toast.error(err.message || 'Erro ao baixar material.');
    } finally {
      setDownloading(null);
    }
  }

  function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const totalMaterials = sections.reduce((acc, s) => acc + s.items.length, 0);

  return (
    <Layout>
      <div style={{ maxWidth: '780px' }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
          Recursos
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px' }}>Materiais</h1>

        {loading && <p style={{ color: 'var(--muted)' }}>Carregando materiais...</p>}

        {!loading && totalMaterials === 0 && (
          <p style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.875rem' }}>
            Nenhum material disponível ainda.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {sections.map((section) => (
            <div key={section.title}>
              {/* Cabeçalho de seção */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--accent)', marginBottom: '4px' }}>
                  {section.title}
                </div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--muted)' }}>
                  {section.items.length} material{section.items.length !== 1 ? 'is' : ''}
                </div>
                <div style={{ marginTop: '10px', borderBottom: '1px solid var(--line)' }} />
              </div>

              {/* Itens */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {section.items.map((m) => (
                  <div key={m.id} style={{
                    background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px',
                    padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px',
                    transition: 'border-color .2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--line-strong)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                  >
                    <div style={{
                      width: '40px', height: '40px', flexShrink: 0,
                      background: 'var(--accent-soft)', border: '1px solid rgba(255,106,0,.25)',
                      borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Space Mono, monospace', fontSize: '.75rem', color: 'var(--accent)',
                    }}>
                      FILE
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{m.title}</div>
                      {m.description && (
                        <div
                          style={{ fontSize: '.85rem', color: 'var(--muted)' }}
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(m.description) }}
                        />
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                      {m.file_size && (
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)' }}>
                          {formatSize(m.file_size)}
                        </span>
                      )}
                      <button onClick={() => handleDownload(m)} disabled={downloading === m.id} style={{
                        padding: '8px 18px', background: 'transparent',
                        border: '1px solid var(--line-strong)', borderRadius: '4px',
                        color: downloading === m.id ? 'var(--muted)' : 'var(--text)',
                        fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '.85rem',
                        cursor: downloading === m.id ? 'not-allowed' : 'pointer',
                        transition: 'border-color .15s, background .15s',
                      }}
                      onMouseOver={(e) => { if (downloading !== m.id) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-soft)'; }}}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--line-strong)'; e.currentTarget.style.background = 'transparent'; }}
                      >
                        {downloading === m.id ? 'Gerando link...' : 'Download'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
