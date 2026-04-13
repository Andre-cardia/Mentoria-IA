import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Layout from '../components/Layout';
import { useLessonProgress } from '../hooks/useLessonProgress';

export default function CursosPage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { getModuleProgress } = useLessonProgress();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const { data, error: err } = await supabase
        .from('modules')
        .select('id, title, subtitle, order, lessons(id)')
        .order('order', { ascending: true });
      if (err) setError('Erro ao carregar cursos.');
      else setModules(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <Layout>
      <div style={{ maxWidth: '800px' }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
          Conteúdo
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px' }}>Cursos</h1>

        {loading && <p style={{ color: 'var(--muted)' }}>Carregando cursos...</p>}
        {error && <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.8rem' }}>{error}</p>}

        {!loading && !error && modules.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '.95rem' }}>Nenhum curso disponível ainda.</p>
        )}

        <div style={{ display: 'grid', gap: '16px' }}>
          {modules.map((mod) => {
            const mp = getModuleProgress(mod.id, mod.lessons ?? []);
            const pct = mp.total > 0 ? (mp.completed / mp.total) * 100 : 0;
            return (
              <div
                key={mod.id}
                onClick={() => navigate(`/cursos/${mod.id}`)}
                style={{
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'border-color .15s, background .15s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,106,0,.4)';
                  e.currentTarget.style.background = 'rgba(255,255,255,.02)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--line)';
                  e.currentTarget.style.background = 'var(--panel)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: mp.total > 0 ? '12px' : '0' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: mod.subtitle ? '4px' : 0 }}>
                      {mod.title}
                    </div>
                    {mod.subtitle && (
                      <div style={{ fontSize: '.875rem', color: 'var(--muted)' }}>{mod.subtitle}</div>
                    )}
                  </div>
                  <span style={{
                    flexShrink: 0,
                    fontFamily: 'Space Mono, monospace', fontSize: '.7rem',
                    color: mp.completed > 0 ? 'var(--accent)' : 'var(--muted)',
                    background: 'rgba(255,255,255,.05)',
                    border: '1px solid var(--line)', borderRadius: '3px',
                    padding: '2px 10px', whiteSpace: 'nowrap',
                  }}>
                    {mp.completed}/{mp.total} aula{mp.total !== 1 ? 's' : ''}
                  </span>
                </div>
                {mp.total > 0 && (
                  <div style={{ height: '3px', background: 'var(--line)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: 'var(--accent)',
                      borderRadius: '2px',
                      transition: 'width .3s',
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
