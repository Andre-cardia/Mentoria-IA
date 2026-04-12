import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Layout from '../components/Layout';
import LessonPlayer from '../components/LessonPlayer';
import { useLessonProgress } from '../hooks/useLessonProgress';

export default function LessonPage() {
  const { moduleId, lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isComplete, toggleComplete, marking } = useLessonProgress();
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function load() {
      const [lessonRes, moduleRes] = await Promise.all([
        supabase.from('lessons').select('id, title, video_url, duration').eq('id', lessonId).single(),
        supabase.from('modules').select('id, title').eq('id', moduleId).single(),
      ]);
      if (lessonRes.error || moduleRes.error) {
        setError('Erro ao carregar a aula.');
      } else {
        setLesson(lessonRes.data);
        setModule(moduleRes.data);
      }
      setLoading(false);
    }
    load();
  }, [lessonId, moduleId]);

  useEffect(() => {
    if (lessonId) setCompleted(isComplete(lessonId));
  }, [lessonId, isComplete]);

  async function handleToggle() {
    await toggleComplete(lessonId);
    // não chamar setCompleted aqui — o useEffect abaixo já atualiza via isComplete
  }

  function formatDuration(seconds) {
    if (!seconds) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  return (
    <Layout>
      <div style={{ maxWidth: '860px' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.85rem', color: 'var(--muted)' }}>
          <Link to="/modulos" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Módulos</Link>
          <span>›</span>
          {module && <span style={{ color: 'var(--muted)' }}>{module.title}</span>}
          <span>›</span>
          {lesson && <span style={{ color: 'var(--text)' }}>{lesson.title}</span>}
        </div>

        {loading && <p style={{ color: 'var(--muted)' }}>Carregando aula...</p>}
        {error && <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.8rem' }}>{error}</p>}

        {lesson && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '6px' }}>
                Aula
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>{lesson.title}</h1>
                {lesson.duration && (
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.75rem', color: 'var(--muted)', background: 'rgba(255,255,255,.05)', border: '1px solid var(--line)', borderRadius: '3px', padding: '2px 10px' }}>
                    {formatDuration(lesson.duration)}
                  </span>
                )}
              </div>
            </div>

            {/* Player */}
            <LessonPlayer videoUrl={lesson.video_url} />

            {/* Ação de progresso */}
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={handleToggle}
                disabled={marking}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 24px',
                  background: completed ? 'rgba(34,197,94,.1)' : 'var(--accent)',
                  color: completed ? '#4ade80' : '#000',
                  border: completed ? '1px solid rgba(34,197,94,.3)' : 'none',
                  borderRadius: '6px',
                  fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '.9rem',
                  cursor: marking ? 'not-allowed' : 'pointer',
                  opacity: marking ? .6 : 1,
                  transition: 'opacity .15s, background .2s',
                }}
              >
                {marking ? 'Salvando...' : completed ? '✓ Desmarcar conclusão' : 'Marcar como concluída'}
              </button>

              <Link
                to="/modulos"
                style={{ color: 'var(--muted)', fontSize: '.875rem', textDecoration: 'none' }}
              >
                ← Voltar aos módulos
              </Link>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
