import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Layout from '../components/Layout';
import { useLessonProgress } from '../hooks/useLessonProgress';

export default function ModulosPage() {
  const [modules, setModules] = useState([]);
  const [openModule, setOpenModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isComplete, getModuleProgress, getTotalProgress } = useLessonProgress();

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('modules')
        .select('id, title, description, order, lessons(id, title, video_url, duration, order)')
        .order('order', { ascending: true })
        .order('order', { referencedTable: 'lessons', ascending: true });

      if (error) { setError('Erro ao carregar módulos.'); }
      else { setModules(data ?? []); }
      setLoading(false);
    }
    load();
  }, []);

  function formatDuration(seconds) {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  const totalProgress = getTotalProgress(modules);

  return (
    <Layout>
      <div style={{ maxWidth: '800px' }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
          Conteúdo
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '16px' }}>Módulos & Aulas</h1>

        {/* Progresso geral */}
        {totalProgress.total > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '.85rem' }}>
              <span style={{ color: 'var(--muted)' }}>Progresso geral</span>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.75rem', color: 'var(--accent)' }}>
                {totalProgress.completed} / {totalProgress.total} aulas
              </span>
            </div>
            <div style={{ height: '4px', background: 'var(--line)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(totalProgress.completed / totalProgress.total) * 100}%`,
                background: 'var(--accent)',
                borderRadius: '2px',
                transition: 'width .3s',
              }} />
            </div>
          </div>
        )}

        {loading && <p style={{ color: 'var(--muted)' }}>Carregando módulos...</p>}
        {error && <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.8rem' }}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {modules.map((mod) => (
            <div key={mod.id} style={{
              background: 'var(--panel)',
              border: openModule === mod.id ? '1px solid rgba(255,106,0,.4)' : '1px solid var(--line)',
              borderTop: openModule === mod.id ? '2px solid var(--accent)' : '1px solid var(--line)',
              borderRadius: '6px',
              overflow: 'hidden',
              transition: 'border-color .2s',
            }}>
              {/* Header do módulo */}
              <button
                onClick={() => setOpenModule(openModule === mod.id ? null : mod.id)}
                style={{
                  width: '100%', padding: '20px 24px',
                  background: 'transparent', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text)', marginBottom: '4px' }}>
                    {mod.title}
                  </div>
                  {mod.description && (
                    <div style={{ fontSize: '.875rem', color: 'var(--muted)' }}>{mod.description}</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '16px' }}>
                  {(() => {
                    const mp = getModuleProgress(mod.id, mod.lessons ?? []);
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{
                          fontFamily: 'Space Mono, monospace', fontSize: '.7rem',
                          color: mp.completed > 0 ? 'var(--accent)' : 'var(--muted)',
                          background: 'rgba(255,255,255,.05)',
                          border: '1px solid var(--line)', borderRadius: '3px',
                          padding: '2px 10px',
                        }}>
                          {mp.completed}/{mp.total} aula{mp.total !== 1 ? 's' : ''}
                        </span>
                        {mp.total > 0 && (
                          <div style={{ width: '80px', height: '3px', background: 'var(--line)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${(mp.completed / mp.total) * 100}%`,
                              background: 'var(--accent)',
                              borderRadius: '2px',
                            }} />
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <span style={{ color: 'var(--accent)', fontSize: '1rem' }}>
                    {openModule === mod.id ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              {/* Lista de aulas */}
              {openModule === mod.id && (
                <div style={{ borderTop: '1px solid var(--line)' }}>
                  {(mod.lessons ?? []).length === 0 ? (
                    <p style={{ padding: '16px 24px', color: 'var(--muted)', fontSize: '.875rem' }}>
                      Nenhuma aula disponível neste módulo.
                    </p>
                  ) : (
                    mod.lessons.map((lesson, idx) => (
                      <div key={lesson.id} style={{
                        display: 'flex', alignItems: 'center', gap: '16px',
                        padding: '14px 24px',
                        borderBottom: idx < mod.lessons.length - 1 ? '1px solid var(--line)' : 'none',
                        transition: 'background .15s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: 'var(--accent-soft)', border: '1px solid rgba(255,106,0,.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Space Mono, monospace', fontSize: '.7rem',
                          color: 'var(--accent)', flexShrink: 0,
                        }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 500, fontSize: '.95rem', color: 'var(--text)' }}>
                              {lesson.title}
                            </span>
                            {isComplete(lesson.id) && (
                              <span style={{
                                fontFamily: 'Space Mono, monospace', fontSize: '.65rem',
                                color: '#4ade80', background: 'rgba(34,197,94,.1)',
                                border: '1px solid rgba(34,197,94,.25)', borderRadius: '3px',
                                padding: '1px 6px',
                              }}>
                                ✓ Concluída
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                          {lesson.duration && (
                            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)' }}>
                              {formatDuration(lesson.duration)}
                            </span>
                          )}
                          {lesson.video_url && (
                            <Link
                              to={`/modulos/${mod.id}/aulas/${lesson.id}`}
                              style={{
                                padding: '6px 16px', background: 'var(--accent)', color: '#000',
                                borderRadius: '4px', fontFamily: 'Space Grotesk, sans-serif',
                                fontWeight: 700, fontSize: '.8rem', textDecoration: 'none',
                              }}
                            >
                              Assistir
                            </Link>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
