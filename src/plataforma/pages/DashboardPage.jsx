import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLessonProgress } from '../hooks/useLessonProgress';
import Layout from '../components/Layout';
import DashboardStats from '../components/DashboardStats';

const WHATSAPP_URL = 'https://chat.whatsapp.com/CzkXZ1ol61YC1zw5dUjy7v?mode=gi_t';

const TYPE_LABEL = { video: 'Vídeo', text: 'Texto', activity: 'Atividade', quiz: 'Quiz' };
const TYPE_ICON  = { text: '📄', activity: '✏️', quiz: '🧠' };

function getVideoThumbnail(url) {
  if (!url) return null;
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&/]+)/);
  if (embedMatch) return `https://img.youtube.com/vi/${embedMatch[1]}/mqdefault.jpg`;
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^?&/]+)/);
  if (watchMatch) return `https://img.youtube.com/vi/${watchMatch[1]}/mqdefault.jpg`;
  return null;
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

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

/* ── Card de aula (Últimos Lançamentos) ─────────────────────────── */
function LessonCard({ lesson }) {
  const thumb = getVideoThumbnail(lesson.video_url);
  const type  = lesson.lesson_type ?? 'video';
  return (
    <Link to={`/modulos/${lesson.module_id}/aulas/${lesson.id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: 'var(--panel)', border: '1px solid var(--line)',
          borderRadius: '8px', overflow: 'hidden', transition: 'border-color .15s', cursor: 'pointer',
        }}
        onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseOut={(e)  => e.currentTarget.style.borderColor = 'var(--line)'}
      >
        <div style={{
          width: '100%', aspectRatio: '16/9', background: 'var(--panel-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', position: 'relative',
        }}>
          {thumb ? (
            <img
              src={thumb} alt={lesson.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          <div style={{
            display: thumb ? 'none' : 'flex',
            width: '100%', height: '100%', position: thumb ? 'absolute' : 'static',
            top: 0, left: 0, alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
          }}>
            {TYPE_ICON[type] ?? '▶'}
          </div>
        </div>
        <div style={{ padding: '12px 14px' }}>
          <div style={{ marginBottom: '6px' }}><LessonTypeTag type={type} /></div>
          <div style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--text)', marginBottom: '4px', lineHeight: 1.3 }}>
            {lesson.title}
          </div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.62rem', color: 'var(--muted)' }}>
            {lesson.modules?.title}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Card "Continue Assistindo" ─────────────────────────────────── */
function NextLessonCard({ lesson }) {
  return (
    <Link to={`/modulos/${lesson.module_id}/aulas/${lesson.id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: 'var(--panel)', border: '1px solid var(--line)',
          borderRadius: '8px', padding: '18px 20px',
          display: 'flex', flexDirection: 'column', gap: '10px',
          transition: 'border-color .15s', cursor: 'pointer', height: '100%', boxSizing: 'border-box',
        }}
        onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseOut={(e)  => e.currentTarget.style.borderColor = 'var(--line)'}
      >
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.6rem', textTransform: 'uppercase', color: 'var(--muted)' }}>
          {lesson.moduleTitle}
        </div>
        <div style={{ fontWeight: 600, fontSize: '.95rem', color: 'var(--text)', lineHeight: 1.3, flex: 1 }}>
          {lesson.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LessonTypeTag type={lesson.lesson_type ?? 'video'} />
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--accent)' }}>
            → Continuar
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Card de post do blog ───────────────────────────────────────── */
function BlogCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: 'var(--panel)', border: '1px solid var(--line)',
          borderRadius: '8px', overflow: 'hidden',
          transition: 'border-color .15s', cursor: 'pointer', height: '100%', boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column',
        }}
        onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseOut={(e)  => e.currentTarget.style.borderColor = 'var(--line)'}
      >
        {/* Cover */}
        <div style={{
          width: '100%', aspectRatio: '16/9', background: 'var(--panel-2)',
          overflow: 'hidden', flexShrink: 0, position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {post.cover_url && (
            <img
              src={post.cover_url} alt={post.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', top: 0, left: 0 }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <span style={{ fontSize: '2rem' }}>✍️</span>
        </div>
        {/* Info */}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.6rem', color: 'var(--muted)' }}>
            {fmtDate(post.published_at)}{post.author_name ? ` · ${post.author_name}` : ''}
          </div>
          <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text)', lineHeight: 1.3 }}>
            {post.title}
          </div>
          {post.seo_description && (
            <div style={{
              fontFamily: 'Space Grotesk, sans-serif', fontSize: '.8rem', color: 'var(--muted)',
              lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {post.seo_description}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user } = useAuth();
  const { completedIds, getTotalProgress } = useLessonProgress();

  const [loading, setLoading]             = useState(true);
  const [userName, setUserName]           = useState('');
  const [diasEstudando, setDiasEstudando] = useState(0);
  const [modules, setModules]             = useState([]);
  const [latestLessons, setLatestLessons] = useState([]);
  const [ranking, setRanking]             = useState([]);
  const [nextLessons, setNextLessons]     = useState([]);   // próximas 3 aulas
  const [blogPosts, setBlogPosts]         = useState([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [profileRes, progressRes, modulesRes, latestRes, rankingRes, blogRes] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('user_id', user.id).single(),
        supabase.from('lesson_progress').select('completed_at').eq('user_id', user.id),
        supabase.from('modules').select('id, title, order, lessons(id, title, lesson_type, order, module_id)').order('order'),
        supabase.from('lessons')
          .select('id, title, lesson_type, video_url, module_id, modules(title)')
          .order('created_at', { ascending: false })
          .limit(4),
        supabase.rpc('get_weekly_ranking'),
        supabase.from('posts')
          .select('id, title, slug, cover_url, seo_description, published_at, author_name')
          .eq('status', 'published')
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false })
          .limit(3),
      ]);

      const name = profileRes.data?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Aluno';
      setUserName(name);

      if (progressRes.data) {
        const dates = new Set(progressRes.data.map((r) => new Date(r.completed_at).toDateString()));
        setDiasEstudando(dates.size);
      }
      if (modulesRes.data) setModules(modulesRes.data);
      if (latestRes.data)  setLatestLessons(latestRes.data);
      if (rankingRes.data) setRanking(rankingRes.data);
      if (blogRes.data)    setBlogPosts(blogRes.data);

      setLoading(false);
    }
    load();
  }, [user]);

  // Próximas 3 aulas não assistidas
  useEffect(() => {
    if (!modules.length) return;
    const allLessons = modules
      .slice().sort((a, b) => a.order - b.order)
      .flatMap((m) =>
        (m.lessons || []).slice().sort((a, b) => a.order - b.order)
          .map((l) => ({ ...l, moduleTitle: m.title }))
      );
    setNextLessons(allLessons.filter((l) => !completedIds.has(l.id)).slice(0, 3));
  }, [modules, completedIds]);

  const progress = getTotalProgress(modules);

  return (
    <Layout>
      <div style={{ maxWidth: '960px' }}>
        {loading ? (
          <p style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.8rem' }}>Carregando...</p>
        ) : (
          <>
            {/* ── Stats + saudação ──────────────────────────────── */}
            <DashboardStats
              userName={userName}
              completed={progress.completed}
              total={progress.total}
              diasEstudando={diasEstudando}
            />

            {/* ── Continue Assistindo ───────────────────────────── */}
            <section style={{ marginBottom: '44px' }}>
              <SectionTitle label="Continue Assistindo" />
              {nextLessons.length === 0 ? (
                <div style={{
                  background: 'rgba(74,222,128,.06)', border: '1px solid rgba(74,222,128,.2)',
                  borderRadius: '8px', padding: '24px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🎉</div>
                  <div style={{ fontWeight: 600, fontSize: '.9rem', color: '#4ade80', marginBottom: '4px' }}>Parabéns!</div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)' }}>
                    Você concluiu todas as aulas disponíveis.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                  {nextLessons.map((lesson) => <NextLessonCard key={lesson.id} lesson={lesson} />)}
                </div>
              )}
            </section>

            {/* ── Últimos Lançamentos ───────────────────────────── */}
            <section style={{ marginBottom: '44px' }}>
              <SectionTitle label="Últimos Lançamentos" />
              {latestLessons.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.8rem' }}>
                  Nenhuma aula disponível ainda.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  {latestLessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)}
                </div>
              )}
            </section>

            {/* ── Últimas do Blog ───────────────────────────────── */}
            {blogPosts.length > 0 && (
              <section style={{ marginBottom: '44px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <SectionTitle label="Últimas do Blog" noBorder />
                  <Link
                    to="/blog"
                    style={{
                      fontFamily: 'Space Mono, monospace', fontSize: '.7rem',
                      color: 'var(--accent)', textDecoration: 'none', letterSpacing: '.04em',
                    }}
                  >
                    Ver todos →
                  </Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                  {blogPosts.map((post) => <BlogCard key={post.id} post={post} />)}
                </div>
              </section>
            )}

            {/* ── Ranking + WhatsApp ────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>

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
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 14px',
                        background: entry.is_current_user ? 'rgba(255,106,0,.07)' : 'var(--panel)',
                        border: `1px solid ${entry.is_current_user ? 'rgba(255,106,0,.3)' : 'var(--line)'}`,
                        borderRadius: '6px',
                      }}>
                        <span style={{
                          fontFamily: 'Space Mono, monospace', fontSize: '.7rem',
                          color: i < 3 ? 'var(--accent)' : 'var(--muted)',
                          fontWeight: i < 3 ? 700 : 400, minWidth: '20px',
                        }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </span>
                        <span style={{ flex: 1, fontSize: '.875rem', fontWeight: entry.is_current_user ? 600 : 400, color: 'var(--text)' }}>
                          {entry.user_name}
                          {entry.is_current_user && (
                            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.6rem', color: 'var(--accent)', marginLeft: '6px' }}>(você)</span>
                          )}
                        </span>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--accent)', fontWeight: 700 }}>
                          {entry.points} pt{entry.points !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Comunidade WhatsApp */}
              <section style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(37,211,102,.1) 0%, rgba(37,211,102,.05) 100%)',
                      border: '1px solid rgba(37,211,102,.25)',
                      borderRadius: '12px', padding: '28px 24px',
                      display: 'flex', flexDirection: 'column', gap: '14px',
                      transition: 'border-color .2s', cursor: 'pointer',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(37,211,102,.5)'}
                    onMouseOut={(e)  => e.currentTarget.style.borderColor = 'rgba(37,211,102,.25)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.4rem' }}>💬</span>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>Entre na Comunidade</span>
                    </div>
                    <p style={{ margin: 0, fontFamily: 'Space Mono, monospace', fontSize: '.72rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                      Tire dúvidas, compartilhe resultados e conecte-se com outros mentorados no WhatsApp.
                    </p>
                    <div style={{
                      alignSelf: 'flex-start',
                      padding: '10px 22px', background: '#25D366', color: '#fff',
                      borderRadius: '6px', fontFamily: 'Space Grotesk, sans-serif',
                      fontWeight: 700, fontSize: '.875rem',
                    }}>
                      Entrar no grupo →
                    </div>
                  </div>
                </a>
              </section>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function SectionTitle({ label, noBorder }) {
  if (noBorder) {
    return (
      <span style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '1rem', fontWeight: 700,
        color: 'var(--text)', letterSpacing: '.01em',
      }}>
        {label}
      </span>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
      <span style={{ width: '3px', height: '18px', background: 'var(--accent)', borderRadius: '2px', flexShrink: 0 }} />
      <span style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '1rem', fontWeight: 700,
        color: 'var(--text)', letterSpacing: '.01em',
      }}>
        {label}
      </span>
    </div>
  );
}
