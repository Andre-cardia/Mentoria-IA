import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLessonProgress } from '../hooks/useLessonProgress';
import Layout from '../components/Layout';
import DashboardStats from '../components/DashboardStats';

const WHATSAPP_URL = 'https://chat.whatsapp.com/'; // Substituir pelo link real do grupo

const TYPE_LABEL = { video: 'Vídeo', text: 'Texto', activity: 'Atividade', quiz: 'Quiz' };

function LessonTypeTag({ type }) {
  return (
    <span style={{
      fontFamily: 'Space Mono, monospace', fontSize: '.58rem',
      textTransform: 'uppercase', letterSpacing: '.08em',
      color: 'var(--accent)', background: 'rgba(255,106,0,.08)',
      border: '1px solid rgba(255,106,0,.2)', borderRadius: '3px',
      padding: '2px 6px',
    }}>
      {TYPE_LABEL[type] ?? type}
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { completedIds, getTotalProgress } = useLessonProgress();

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [diasEstudando, setDiasEstudando] = useState(0);
  const [modules, setModules] = useState([]);
  const [latestLessons, setLatestLessons] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [nextLesson, setNextLesson] = useState(null);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const [profileRes, progressRes, modulesRes, latestRes, rankingRes] = await Promise.all([
        // Nome do aluno
        supabase.from('profiles').select('full_name').eq('user_id', user.id).single(),
        // Datas distintas de estudo
        supabase.from('lesson_progress').select('completed_at').eq('user_id', user.id),
        // Módulos + aulas para progresso e "continue assistindo"
        supabase.from('modules').select('id, title, order, lessons(id, title, lesson_type, order, module_id)').order('order'),
        // 4 aulas mais recentes
        supabase.from('lessons')
          .select('id, title, lesson_type, module_id, modules(title)')
          .order('created_at', { ascending: false })
          .limit(4),
        // Ranking semanal via RPC
        supabase.rpc('get_weekly_ranking'),
      ]);

      // Nome
      const name = profileRes.data?.full_name
        || user.user_metadata?.full_name
        || user.email?.split('@')[0]
        || 'Aluno';
      setUserName(name);

      // Dias estudando
      if (progressRes.data) {
        const dates = new Set(progressRes.data.map((r) => new Date(r.completed_at).toDateString()));
        setDiasEstudando(dates.size);
      }

      // Módulos + lições
      if (modulesRes.data) {
        setModules(modulesRes.data);
      }

      // 4 últimas aulas
      if (latestRes.data) {
        setLatestLessons(latestRes.data);
      }

      // Ranking
      if (rankingRes.data) {
        setRanking(rankingRes.data);
      }

      setLoading(false);
    }

    load();
  }, [user]);

  // "Continue Assistindo" — recalcula quando completedIds ou modules mudam
  useEffect(() => {
    if (!modules.length) return;
    const allLessons = modules
      .slice()
      .sort((a, b) => a.order - b.order)
      .flatMap((m) =>
        (m.lessons || [])
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((l) => ({ ...l, moduleTitle: m.title }))
      );
    const next = allLessons.find((l) => !completedIds.has(l.id));
    setNextLesson(next || null);
  }, [modules, completedIds]);

  const progress = getTotalProgress(modules);

  return (
    <Layout>
      <div style={{ maxWidth: '900px' }}>
        {loading ? (
          <p style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.8rem' }}>
            Carregando...
          </p>
        ) : (
          <>
            {/* Stats + saudação */}
            <DashboardStats
              userName={userName}
              completed={progress.completed}
              total={progress.total}
              diasEstudando={diasEstudando}
            />

            {/* Últimos lançamentos */}
            <section style={{ marginBottom: '40px' }}>
              <SectionTitle label="Últimos Lançamentos" />
              {latestLessons.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.8rem' }}>
                  Nenhuma aula disponível ainda.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  {latestLessons.map((lesson) => (
                    <Link
                      key={lesson.id}
                      to={`/modulos/${lesson.module_id}/aulas/${lesson.id}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div style={{
                        background: 'var(--panel)', border: '1px solid var(--line)',
                        borderRadius: '8px', padding: '16px',
                        transition: 'border-color .15s',
                        cursor: 'pointer',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                      >
                        <div style={{ marginBottom: '8px' }}>
                          <LessonTypeTag type={lesson.lesson_type ?? 'video'} />
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--text)', marginBottom: '6px', lineHeight: 1.3 }}>
                          {lesson.title}
                        </div>
                        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--muted)' }}>
                          {lesson.modules?.title}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Continue assistindo + Ranking */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
              {/* Continue assistindo */}
              <section>
                <SectionTitle label="Continue Assistindo" />
                {nextLesson ? (
                  <Link
                    to={`/modulos/${nextLesson.module_id}/aulas/${nextLesson.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      background: 'var(--panel)', border: '1px solid var(--line)',
                      borderRadius: '8px', padding: '20px',
                      display: 'flex', flexDirection: 'column', gap: '10px',
                      transition: 'border-color .15s', cursor: 'pointer',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                    >
                      <div style={{
                        fontFamily: 'Space Mono, monospace', fontSize: '.6rem',
                        textTransform: 'uppercase', color: 'var(--muted)',
                      }}>
                        {nextLesson.moduleTitle}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text)', lineHeight: 1.3 }}>
                        {nextLesson.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LessonTypeTag type={nextLesson.lesson_type ?? 'video'} />
                        <span style={{
                          fontFamily: 'Space Mono, monospace', fontSize: '.65rem',
                          color: 'var(--accent)',
                        }}>
                          → Continuar
                        </span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div style={{
                    background: 'rgba(74,222,128,.06)', border: '1px solid rgba(74,222,128,.2)',
                    borderRadius: '8px', padding: '20px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🎉</div>
                    <div style={{ fontWeight: 600, fontSize: '.9rem', color: '#4ade80', marginBottom: '4px' }}>
                      Parabéns!
                    </div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)' }}>
                      Você concluiu todas as aulas disponíveis.
                    </div>
                  </div>
                )}
              </section>

              {/* Ranking da semana */}
              <section>
                <SectionTitle label="Ranking da Semana" />
                {ranking.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.75rem' }}>
                    Nenhuma atividade esta semana ainda.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {ranking.map((entry, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '10px 14px',
                          background: entry.is_current_user ? 'rgba(255,106,0,.07)' : 'var(--panel)',
                          border: `1px solid ${entry.is_current_user ? 'rgba(255,106,0,.3)' : 'var(--line)'}`,
                          borderRadius: '6px',
                        }}
                      >
                        <span style={{
                          fontFamily: 'Space Mono, monospace', fontSize: '.7rem',
                          color: i < 3 ? 'var(--accent)' : 'var(--muted)',
                          fontWeight: i < 3 ? 700 : 400, minWidth: '20px',
                        }}>
                          #{i + 1}
                        </span>
                        <span style={{ flex: 1, fontSize: '.875rem', fontWeight: entry.is_current_user ? 600 : 400, color: 'var(--text)' }}>
                          {entry.user_name}
                          {entry.is_current_user && (
                            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.6rem', color: 'var(--accent)', marginLeft: '6px' }}>
                              (você)
                            </span>
                          )}
                        </span>
                        <span style={{
                          fontFamily: 'Space Mono, monospace', fontSize: '.7rem',
                          color: 'var(--accent)', fontWeight: 700,
                        }}>
                          {entry.points} pt{entry.points !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Comunidade WhatsApp */}
            <section style={{ marginBottom: '24px' }}>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(37,211,102,.1) 0%, rgba(37,211,102,.05) 100%)',
                  border: '1px solid rgba(37,211,102,.25)',
                  borderRadius: '12px', padding: '28px 32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: '16px',
                  transition: 'border-color .2s',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(37,211,102,.5)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(37,211,102,.25)'}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.4rem' }}>💬</span>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>
                        Entre na Comunidade
                      </span>
                    </div>
                    <p style={{ margin: 0, fontFamily: 'Space Mono, monospace', fontSize: '.75rem', color: 'var(--muted)' }}>
                      Tire dúvidas, compartilhe resultados e conecte-se com outros mentorados no WhatsApp.
                    </p>
                  </div>
                  <div style={{
                    padding: '10px 22px', background: '#25D366', color: '#fff',
                    borderRadius: '6px', fontFamily: 'Space Grotesk, sans-serif',
                    fontWeight: 700, fontSize: '.875rem', whiteSpace: 'nowrap',
                  }}>
                    Entrar no grupo →
                  </div>
                </div>
              </a>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}

function SectionTitle({ label }) {
  return (
    <div style={{
      fontFamily: 'Space Mono, monospace', fontSize: '.65rem',
      textTransform: 'uppercase', letterSpacing: '.14em',
      color: 'var(--muted)', marginBottom: '12px',
    }}>
      {label}
    </div>
  );
}
