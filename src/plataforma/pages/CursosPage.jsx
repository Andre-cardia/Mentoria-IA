import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Layout from '../components/Layout';
import { useLessonProgress } from '../hooks/useLessonProgress';
import { groupModulesByTrack, TRACK_LEVEL_LABEL } from '../lib/tracks';

function ProgressBar({ pct }) {
  return (
    <div style={{ height: '3px', background: 'var(--line)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: 'var(--accent)',
        borderRadius: '2px',
        transition: 'width .3s',
      }} />
    </div>
  );
}

function ModuleCard({ mod, progress, onOpen }) {
  const pct = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: progress.total > 0 ? '12px' : '0' }}>
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
          color: progress.completed > 0 ? 'var(--accent)' : 'var(--muted)',
          background: 'rgba(255,255,255,.05)',
          border: '1px solid var(--line)', borderRadius: '3px',
          padding: '2px 10px', whiteSpace: 'nowrap',
        }}>
          {progress.completed}/{progress.total} aula{progress.total !== 1 ? 's' : ''}
        </span>
      </div>
      {progress.total > 0 && <ProgressBar pct={pct} />}
    </div>
  );
}

function TrackSection({ track, modules, getModuleProgress, onOpenModule }) {
  const totals = modules.reduce(
    (acc, mod) => {
      const mp = getModuleProgress(mod.id, mod.lessons ?? []);
      return { completed: acc.completed + mp.completed, total: acc.total + mp.total };
    },
    { completed: 0, total: 0 }
  );
  const pct = totals.total > 0 ? (totals.completed / totals.total) * 100 : 0;

  return (
    <section aria-labelledby={`trilha-${track.id}`} style={{ marginBottom: '48px' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <h2 id={`trilha-${track.id}`} style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>{track.title}</h2>
          {TRACK_LEVEL_LABEL[track.level] && (
            <span style={{
              fontFamily: 'Space Mono, monospace', fontSize: '.7rem',
              color: 'var(--accent)', background: 'var(--accent-soft)',
              border: '1px solid rgba(255,106,0,.25)', borderRadius: '3px',
              padding: '2px 10px',
            }}>
              {TRACK_LEVEL_LABEL[track.level]}
            </span>
          )}
        </div>
        {track.description && (
          <p style={{ color: 'var(--muted)', fontSize: '.95rem', margin: '0 0 12px 0' }}>{track.description}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1 }}><ProgressBar pct={pct} /></div>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.75rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
            {modules.length} curso{modules.length !== 1 ? 's' : ''} · {totals.completed}/{totals.total} aulas
          </span>
        </div>
      </div>

      {modules.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '.95rem' }}>Os cursos desta trilha serão adicionados em breve.</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {modules.map((mod) => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              progress={getModuleProgress(mod.id, mod.lessons ?? [])}
              onOpen={() => onOpenModule(mod.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function CursosPage() {
  const [modules, setModules] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { getModuleProgress } = useLessonProgress();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const [modulesRes, tracksRes] = await Promise.all([
        supabase.from('modules').select('*, lessons(id)').order('order', { ascending: true }),
        supabase.from('tracks').select('id, title, description, level, order').order('order', { ascending: true }),
      ]);
      if (modulesRes.error) setError('Erro ao carregar cursos.');
      else setModules(modulesRes.data ?? []);
      // Sem trilhas (ou tabela ainda não migrada), a página cai na lista simples.
      setTracks(tracksRes.error ? [] : (tracksRes.data ?? []));
      setLoading(false);
    }
    load();
  }, []);

  const { groups, ungrouped } = useMemo(() => groupModulesByTrack(tracks, modules), [tracks, modules]);
  const hasTracks = groups.length > 0;
  const openModule = (id) => navigate(`/cursos/${id}`);

  return (
    <Layout>
      <div style={{ maxWidth: '800px' }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
          Conteúdo
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px' }}>{hasTracks ? 'Trilhas' : 'Cursos'}</h1>

        {loading && <p style={{ color: 'var(--muted)' }}>Carregando cursos...</p>}
        {error && <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.8rem' }}>{error}</p>}

        {!loading && !error && modules.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '.95rem' }}>Nenhum curso disponível ainda.</p>
        )}

        {!loading && !error && modules.length > 0 && (
          <>
            {groups.map(({ track, modules: trackModules }) => (
              <TrackSection
                key={track.id}
                track={track}
                modules={trackModules}
                getModuleProgress={getModuleProgress}
                onOpenModule={openModule}
              />
            ))}

            {ungrouped.length > 0 && (
              <section aria-label={hasTracks ? 'Outros cursos' : 'Cursos'}>
                {hasTracks && (
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 16px 0' }}>Outros cursos</h2>
                )}
                <div style={{ display: 'grid', gap: '12px' }}>
                  {ungrouped.map((mod) => (
                    <ModuleCard
                      key={mod.id}
                      mod={mod}
                      progress={getModuleProgress(mod.id, mod.lessons ?? [])}
                      onOpen={() => openModule(mod.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
