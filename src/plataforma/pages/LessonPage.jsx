import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Layout from '../components/Layout';
import LessonPlayer from '../components/LessonPlayer';
import LessonTextContent from '../components/LessonTextContent';
import LessonActivityContent from '../components/LessonActivityContent';
import { useLessonProgress } from '../hooks/useLessonProgress';
import LessonQA from '../components/LessonQA';
import LessonQuiz from '../components/LessonQuiz';

const TYPE_LABEL = { video: 'Vídeo', text: 'Leitura', activity: 'Atividade', quiz: 'Quiz' };

function formatDuration(seconds) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** @type {import('react').CSSProperties} */
const secondaryButton = {
  display: 'inline-flex', alignItems: 'center', gap: '8px',
  padding: '10px 18px', background: 'var(--panel)', color: 'var(--text)',
  border: '1px solid var(--line-strong)', borderRadius: '8px',
  fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '.9rem',
  cursor: 'pointer', textDecoration: 'none',
};

/** @type {import('react').CSSProperties} */
const primaryButton = {
  ...secondaryButton,
  background: 'var(--accent)', color: '#261000', border: '1px solid var(--accent)', fontWeight: 700,
};

/* Lista de aulas do curso, sempre visível ao lado do conteúdo */
function LessonList({ moduleId, moduleTitle, lessons, currentId, isComplete }) {
  const done = lessons.filter((l) => isComplete(l.id)).length;
  const pct = lessons.length > 0 ? Math.round((done / lessons.length) * 100) : 0;

  return (
    <aside aria-label="Aulas do curso" style={{
      background: 'var(--panel)', border: '1px solid var(--line)',
      borderRadius: '12px', padding: '16px 10px',
    }}>
      <div style={{ padding: '0 8px 12px' }}>
        <Link to={`/cursos/${moduleId}`} style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', textDecoration: 'none' }}>
          {moduleTitle}
        </Link>
        <div style={{ fontSize: '.8rem', color: 'var(--muted)', margin: '2px 0 8px' }}>
          {done} de {lessons.length} concluída{lessons.length !== 1 ? 's' : ''}
        </div>
        <div
          role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso do curso"
          style={{ height: '6px', background: 'var(--line)', borderRadius: '3px', overflow: 'hidden' }}
        >
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', transition: 'width .3s' }} />
        </div>
      </div>

      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {lessons.map((l, idx) => {
          const current = l.id === currentId;
          const complete = isComplete(l.id);
          return (
            <li key={l.id}>
              <Link
                to={`/cursos/${moduleId}/aulas/${l.id}`}
                aria-current={current ? 'page' : undefined}
                className="lesson-list-item"
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 8px', borderRadius: '8px', textDecoration: 'none',
                  color: 'var(--text)', fontSize: '.9rem',
                  fontWeight: current ? 700 : 400,
                  background: current ? 'var(--accent-soft)' : 'transparent',
                }}
              >
                <span aria-hidden="true" style={{
                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.75rem', fontWeight: 700,
                  background: current ? 'var(--accent)' : complete ? 'rgba(21,128,61,.12)' : 'transparent',
                  border: current ? '1px solid var(--accent)' : complete ? '1px solid rgba(21,128,61,.4)' : '1px solid var(--line-strong)',
                  color: current ? '#261000' : complete ? 'var(--success)' : 'var(--muted)',
                }}>
                  {complete && !current ? '✓' : idx + 1}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  {l.title}
                  {complete && <span style={{ position: 'absolute', left: '-9999px' }}> (concluída)</span>}
                </span>
                {l.duration ? (
                  <span style={{ fontSize: '.75rem', color: 'var(--muted)', flexShrink: 0 }}>{formatDuration(l.duration)}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

export default function LessonPage() {
  const { moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isComplete, toggleComplete, marking } = useLessonProgress();
  const completed = lessonId ? isComplete(lessonId) : false;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [lessonRes, moduleRes] = await Promise.all([
        supabase.from('lessons').select('id, title, video_url, duration, lesson_type, content').eq('id', lessonId).single(),
        supabase.from('modules')
          .select('id, title, lessons(id, title, duration, lesson_type, order)')
          .eq('id', moduleId)
          .order('order', { referencedTable: 'lessons', ascending: true })
          .single(),
      ]);
      if (cancelled) return;
      if (lessonRes.error || moduleRes.error) {
        setError('Erro ao carregar a aula.');
      } else {
        setError('');
        setLesson(lessonRes.data);
        setModule(moduleRes.data);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [lessonId, moduleId]);

  const lessons = (module?.lessons ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const index = lessons.findIndex((l) => l.id === lessonId);
  const prev = index > 0 ? lessons[index - 1] : null;
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null;
  const lessonUrl = (id) => `/cursos/${moduleId}/aulas/${id}`;

  // Concluir já leva para a próxima aula; desmarcar fica onde está.
  async function handleComplete() {
    const wasComplete = completed;
    await toggleComplete(lessonId);
    if (!wasComplete && next) navigate(lessonUrl(next.id));
  }

  return (
    <Layout>
      <style>{`
        .lesson-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 24px; align-items: start; }
        .lesson-list-item:hover { background: var(--hover) !important; }
        @media (max-width: 1100px) { .lesson-layout { grid-template-columns: minmax(0, 1fr); } }
      `}</style>

      <div style={{ maxWidth: '100%' }}>
        {/* Caminho */}
        <nav aria-label="Caminho" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '.875rem', color: 'var(--muted)' }}>
          <Link to="/cursos" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Trilhas</Link>
          <span aria-hidden="true">›</span>
          {module && <Link to={`/cursos/${moduleId}`} style={{ color: 'var(--muted)', textDecoration: 'none' }}>{module.title}</Link>}
          {index >= 0 && (
            <>
              <span aria-hidden="true">›</span>
              <span style={{ color: 'var(--text)' }}>Aula {index + 1} de {lessons.length}</span>
            </>
          )}
        </nav>

        {loading && !lesson && <p style={{ color: 'var(--muted)' }}>Carregando aula...</p>}
        {error && <p role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}

        {lesson && module && (
          <div className="lesson-layout">
            <div style={{ minWidth: 0 }}>
              {/* Conteúdo principal — renderização por tipo */}
              {(!lesson.lesson_type || lesson.lesson_type === 'video') && (
                <LessonPlayer videoUrl={lesson.video_url} />
              )}
              {lesson.lesson_type === 'text' && <LessonTextContent content={lesson.content} />}
              {lesson.lesson_type === 'activity' && <LessonActivityContent content={lesson.content} />}
              {lesson.lesson_type === 'quiz' && <LessonQuiz lessonId={lesson.id} />}

              {/* Título + ações */}
              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, lineHeight: 1.25 }}>{lesson.title}</h1>
                  <div style={{ marginTop: '4px', fontSize: '.875rem', color: 'var(--muted)' }}>
                    {TYPE_LABEL[lesson.lesson_type ?? 'video'] ?? 'Aula'}
                    {lesson.duration ? ` · ${formatDuration(lesson.duration)}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {prev && <Link to={lessonUrl(prev.id)} style={secondaryButton}>← Anterior</Link>}
                  {next && <Link to={lessonUrl(next.id)} style={secondaryButton}>Próxima →</Link>}
                </div>
              </div>

              {/* Progresso */}
              <div style={{
                marginTop: '20px', padding: '16px 18px',
                background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '12px',
                display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
              }}>
                <div style={{ flex: '1 1 220px', fontSize: '.9rem', color: completed ? 'var(--success)' : 'var(--muted)', fontWeight: completed ? 700 : 400 }}>
                  {completed ? '✓ Aula concluída' : next ? 'Terminou? Marque como concluída para seguir para a próxima.' : 'Última aula do curso. Marque como concluída ao terminar.'}
                </div>
                <button
                  onClick={handleComplete}
                  disabled={marking}
                  style={{ ...(completed ? secondaryButton : primaryButton), cursor: marking ? 'not-allowed' : 'pointer', opacity: marking ? .6 : 1 }}
                >
                  {marking ? 'Salvando...' : completed ? 'Desmarcar conclusão' : next ? 'Concluir e avançar' : 'Marcar como concluída'}
                </button>
              </div>

              {/* Dúvidas — para todos os tipos de aula */}
              <LessonQA lessonId={lesson.id} />
            </div>

            <LessonList
              moduleId={moduleId}
              moduleTitle={module.title}
              lessons={lessons}
              currentId={lessonId}
              isComplete={isComplete}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
