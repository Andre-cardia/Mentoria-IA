import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Layout from '../components/Layout';
import { useLessonProgress } from '../hooks/useLessonProgress';

function formatDuration(seconds) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function CursoPage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [mod, setMod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { isComplete, getModuleProgress } = useLessonProgress();

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('modules')
        .select('id, title, subtitle, description, lessons(id, title, video_url, duration, lesson_type, order)')
        .eq('id', moduleId)
        .order('order', { referencedTable: 'lessons', ascending: true })
        .single();
      if (error || !data) setNotFound(true);
      else setMod(data);
      setLoading(false);
    }
    load();
  }, [moduleId]);

  const lessons = mod?.lessons ?? [];
  const firstLesson = lessons[0] ?? null;
  const mp = mod ? getModuleProgress(mod.id, lessons) : { completed: 0, total: 0 };
  const hasProgress = mp.completed > 0;

  return (
    <Layout>
      <div style={{ maxWidth: '800px' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.85rem', color: 'var(--muted)' }}>
          <Link to="/cursos" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Cursos</Link>
          <span>›</span>
          <span style={{ color: 'var(--text)' }}>{mod?.title ?? '...'}</span>
        </div>

        {loading && <p style={{ color: 'var(--muted)' }}>Carregando curso...</p>}
        {notFound && (
          <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.8rem' }}>
            Curso não encontrado.
          </p>
        )}

        {mod && (
          <>
            {/* Cabeçalho */}
            <div style={{ marginBottom: '36px' }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
                Curso
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 8px 0' }}>{mod.title}</h1>
              {mod.subtitle && (
                <p style={{ fontSize: '1.05rem', color: 'var(--muted)', margin: '0 0 20px 0', lineHeight: 1.5 }}>{mod.subtitle}</p>
              )}
              {firstLesson && (
                <button
                  onClick={() => navigate(`/cursos/${moduleId}/aulas/${firstLesson.id}`)}
                  style={{
                    padding: '12px 28px',
                    background: 'var(--accent)', color: '#000',
                    border: 'none', borderRadius: '6px',
                    fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'opacity .15s',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.opacity = '.85'; }}
                  onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  {hasProgress ? 'Continuar Curso' : 'Iniciar Curso'}
                </button>
              )}
            </div>

            {/* Sobre o Curso */}
            {mod.description && (
              <div style={{ marginBottom: '36px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 12px 0', paddingBottom: '10px', borderBottom: '1px solid var(--line)' }}>
                  Sobre o Curso
                </h2>
                <p style={{ color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>{mod.description}</p>
              </div>
            )}

            {/* Conteúdo do Curso */}
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 12px 0', paddingBottom: '10px', borderBottom: '1px solid var(--line)' }}>
                Conteúdo do Curso
              </h2>
              {lessons.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '.95rem' }}>As aulas serão adicionadas em breve.</p>
              ) : (
                <div>
                  {lessons.map((lesson, idx) => {
                    const done = isComplete(lesson.id);
                    return (
                      <div
                        key={lesson.id}
                        onClick={() => navigate(`/cursos/${moduleId}/aulas/${lesson.id}`)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '16px',
                          padding: '14px 0',
                          borderBottom: idx < lessons.length - 1 ? '1px solid var(--line)' : 'none',
                          cursor: 'pointer',
                          transition: 'background .15s',
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.02)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: done ? 'rgba(34,197,94,.1)' : 'var(--accent-soft)',
                          border: done ? '1px solid rgba(34,197,94,.3)' : '1px solid rgba(255,106,0,.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Space Mono, monospace', fontSize: '.7rem',
                          color: done ? '#4ade80' : 'var(--accent)', flexShrink: 0,
                        }}>
                          {done ? '✓' : idx + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 500, fontSize: '.95rem', color: 'var(--text)' }}>
                            {lesson.title}
                          </span>
                          {done && (
                            <span style={{
                              marginLeft: '8px',
                              fontFamily: 'Space Mono, monospace', fontSize: '.65rem',
                              color: '#4ade80', background: 'rgba(34,197,94,.1)',
                              border: '1px solid rgba(34,197,94,.25)', borderRadius: '3px',
                              padding: '1px 6px',
                            }}>
                              ✓ Concluída
                            </span>
                          )}
                        </div>
                        {lesson.duration && (
                          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)', flexShrink: 0 }}>
                            {formatDuration(lesson.duration)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
