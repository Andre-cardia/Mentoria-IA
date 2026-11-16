import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Layout from '../components/Layout';
import StellarGlyph from '../components/StellarGlyph';
import { APEX_NAME, GALAXIES, buildRacers, levelTotals, positionLabel } from '../lib/starRace';
import {
  POINT_RULES, RANKING_PERIODS,
  computeBadges, formatPoints, nextBadge, normalizeStats,
} from '../lib/gamification';

// O cenário 3D (three.js) só é baixado por quem abre esta página.
const StarRace = lazy(() => import('../components/StarRace'));

const mono = { fontFamily: 'Space Mono, monospace' };
const card = { background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '8px' };

// Rótulo técnico: caixa alta, espaçado, pequeno.
const eyebrow = { ...mono, fontSize: '.68rem', letterSpacing: '.18em', textTransform: 'uppercase' };

// O painel de missão é sempre escuro, nos dois temas.
const panel = {
  ink: '#f2f4f8',
  dim: '#8b93a7',
  line: 'rgba(255,255,255,.12)',
  bg: '#05070d',
};

const ACTIVITY = [
  { metric: 'lessons',     label: 'Aulas' },
  { metric: 'access_days', label: 'Acessos' },
  { metric: 'posts',       label: 'Posts' },
  { metric: 'questions',   label: 'Dúvidas' },
  { metric: 'answers',     label: 'Respostas' },
];

function pad(n) {
  return String(n).padStart(2, '0');
}

function SectionTitle({ id, children, aside = null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', borderBottom: '1px solid var(--line-strong)', paddingBottom: '10px', marginBottom: '16px' }}>
      <h2 id={id} style={{ ...eyebrow, fontSize: '.78rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{children}</h2>
      {aside}
    </div>
  );
}

function Readout({ label, children }) {
  return (
    <div style={{ padding: '16px 20px', borderLeft: `1px solid ${panel.line}`, borderBottom: `1px solid ${panel.line}`, marginBottom: '-1px', minWidth: 0 }}>
      <div style={{ ...eyebrow, color: panel.dim, marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 500, color: panel.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {children}
      </div>
    </div>
  );
}

function MissionPanel({ me, racers }) {
  const stats = normalizeStats(me);
  const rank = me?.rank_pos ? Number(me.rank_pos) : null;
  const participants = Number(me?.participants) || 0;
  const mine = racers.find((racer) => racer.isCurrentUser);
  const position = mine?.position;
  const sector = !position
    ? '—'
    : position.certified ? 'Certificação' : GALAXIES[position.galaxyIndex].name.replace('Galáxia ', '');

  return (
    <section aria-labelledby="missao" style={{ background: panel.bg, color: panel.ink, borderRadius: '12px', overflow: 'hidden', marginBottom: '40px', boxShadow: '0 18px 50px rgba(8,12,30,.3)' }}>
      <h2 id="missao" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        Painel da missão
      </h2>

      {racers.length > 0 && (
        <Suspense fallback={<div style={{ height: '340px' }} />}>
          <StarRace racers={racers} />
        </Suspense>
      )}

      {/* Telemetria */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', borderTop: `1px solid ${panel.line}`, marginLeft: '-1px' }}>
        <Readout label="Pontos">{formatPoints(stats.points)}</Readout>
        <Readout label="Posição">
          {rank ? <>{pad(rank)}<span style={{ color: panel.dim, fontSize: '1rem' }}> / {pad(participants)}</span></> : '—'}
        </Readout>
        <Readout label="Setor atual">{sector}</Readout>
        <Readout label="Jornada">{position ? `${position.pct}%` : '—'}</Readout>
      </div>

      {/* Setores da rota */}
      {position && (
        <ol style={{ listStyle: 'none', margin: 0, padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', borderTop: `1px solid ${panel.line}` }}>
          {GALAXIES.map((galaxy, index) => {
            const pct = Math.round(position.fractions[index] * 100);
            return (
              <li key={galaxy.level}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: galaxy.color }}>
                  <StellarGlyph name="galaxy" size={18} />
                  <span style={{ ...eyebrow, color: panel.ink }}>
                    <span style={{ color: panel.dim }}>{pad(index + 1)} </span>
                    {galaxy.name.replace('Galáxia ', '')}
                  </span>
                </div>
                <div
                  role="progressbar" aria-label={galaxy.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
                  style={{ height: '2px', background: panel.line, marginBottom: '8px' }}
                >
                  <div style={{ height: '100%', width: `${pct}%`, background: galaxy.color }} />
                </div>
                <span style={{ ...mono, fontSize: '.72rem', color: panel.dim }}>
                  {position.earned[index]} de {position.goals[index]} pts
                </span>
              </li>
            );
          })}
          <li>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: position.certified ? '#ffb347' : panel.dim }}>
              <StellarGlyph name="star" size={18} />
              <span style={{ ...eyebrow, color: panel.ink }}>{APEX_NAME}</span>
            </div>
            <div style={{ height: '2px', background: position.certified ? '#ffb347' : panel.line, marginBottom: '8px' }} />
            <span style={{ ...mono, fontSize: '.72rem', color: panel.dim }}>
              {position.certified ? 'Você chegou ao ápice da jornada!' : 'O ápice: conclua o Projeto de Certificação'}
            </span>
          </li>
        </ol>
      )}

      {/* Situação e atividade */}
      <div style={{ padding: '18px 20px', borderTop: `1px solid ${panel.line}`, display: 'flex', flexWrap: 'wrap', gap: '14px 32px', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontSize: '.95rem', color: panel.ink }}>
          {position && <>{positionLabel(position)}. </>}
          <span style={{ color: panel.dim }}>
            {rank
              ? `${rank}º lugar no ranking geral, entre ${participants} participante${participants === 1 ? '' : 's'}`
              : stats.points > 0
                ? 'Contas da equipe não entram no ranking'
                : 'Conclua uma aula ou participe do fórum para entrar no ranking'}
          </span>
        </p>
        <dl style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 22px', margin: 0 }}>
          {ACTIVITY.map(({ metric, label }) => (
            <div key={metric} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
              <dt style={{ ...eyebrow, color: panel.dim }}>{label}</dt>
              <dd style={{ margin: 0, ...mono, fontSize: '.85rem', color: panel.ink }}>{stats[metric]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function BadgeGrid({ badges, upcoming }) {
  const earnedCount = badges.filter((badge) => badge.earned).length;
  return (
    <section aria-labelledby="insignias" style={{ marginBottom: '40px' }}>
      <SectionTitle
        id="insignias"
        aside={<span style={{ ...mono, fontSize: '.75rem', color: 'var(--muted)' }}>{pad(earnedCount)} / {pad(badges.length)}</span>}
      >
        Insígnias de missão
      </SectionTitle>

      {upcoming && (
        <p style={{ margin: '0 0 16px 0', fontSize: '.9rem', color: 'var(--muted)' }}>
          Próxima insígnia: <strong style={{ color: 'var(--text)' }}>{upcoming.title}</strong> — {upcoming.description.toLowerCase()} ({upcoming.current}/{upcoming.target}).
        </p>
      )}

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {badges.map((badge) => (
          <li
            key={badge.id}
            aria-label={`${badge.title}: ${badge.earned ? 'conquistada' : `${badge.current} de ${badge.target}`}`}
            style={{ ...card, padding: '16px', borderColor: badge.earned ? 'var(--text)' : 'var(--line)', opacity: badge.earned ? 1 : 0.78 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{
                width: '40px', height: '40px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${badge.earned ? 'var(--accent)' : 'var(--line-strong)'}`,
                background: badge.earned ? 'var(--accent)' : 'transparent',
                color: badge.earned ? '#261000' : 'var(--muted)',
              }}>
                <StellarGlyph name={badge.glyph} size={22} />
              </span>
              <span style={{ ...mono, fontSize: '.75rem', color: 'var(--muted)', letterSpacing: '.1em' }}>{badge.tier}</span>
            </div>
            <div style={{ ...eyebrow, fontSize: '.72rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{badge.title}</div>
            <div style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: '12px' }}>{badge.description}</div>
            {badge.earned ? (
              <span style={{ ...eyebrow, color: 'var(--accent-text)', fontWeight: 700 }}>Conquistada</span>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '2px', background: 'var(--line)' }}>
                  <div style={{ height: '100%', width: `${badge.pct}%`, background: 'var(--text)' }} />
                </div>
                <span style={{ ...mono, fontSize: '.7rem', color: 'var(--muted)' }}>{badge.current}/{badge.target}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RankingList({ period, onPeriodChange, rows, loading }) {
  const filter = (
    <div role="group" aria-label="Período do ranking" style={{ display: 'flex' }}>
      {RANKING_PERIODS.map(({ id, label }, index) => {
        const active = id === period;
        return (
          <button
            key={id} type="button" aria-pressed={active}
            onClick={() => onPeriodChange(id)}
            style={{
              ...eyebrow, padding: '7px 14px', cursor: 'pointer', fontWeight: 700,
              marginLeft: index === 0 ? 0 : '-1px', borderRadius: 0,
              background: active ? 'var(--text)' : 'transparent',
              color: active ? 'var(--panel)' : 'var(--muted)',
              border: `1px solid ${active ? 'var(--text)' : 'var(--line-strong)'}`,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  return (
    <section aria-labelledby="ranking" style={{ marginBottom: '40px' }}>
      <SectionTitle id="ranking" aside={filter}>Classificação</SectionTitle>

      {loading && <p style={{ color: 'var(--muted)' }}>Carregando ranking...</p>}
      {!loading && rows.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '.95rem' }}>Ninguém pontuou neste período ainda. Seja o primeiro!</p>
      )}
      {!loading && rows.length > 0 && (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {rows.map((row) => {
            const position = Number(row.rank_pos);
            return (
              <li
                key={`${position}-${row.user_name}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px', padding: '13px 12px',
                  borderBottom: '1px solid var(--line)',
                  background: row.is_current_user ? 'var(--accent-soft)' : 'transparent',
                  boxShadow: row.is_current_user ? 'inset 3px 0 0 var(--accent)' : 'none',
                }}
              >
                <span style={{ ...mono, minWidth: '32px', fontSize: '.85rem', fontWeight: position <= 3 ? 700 : 400, color: position <= 3 ? 'var(--text)' : 'var(--muted)' }}>
                  {pad(position)}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontWeight: row.is_current_user ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.user_name}
                  {row.is_current_user && <span style={{ ...eyebrow, color: 'var(--accent-text)', fontWeight: 700, marginLeft: '10px' }}>(você)</span>}
                </span>
                <span style={{ ...mono, color: 'var(--muted)', fontSize: '.75rem', whiteSpace: 'nowrap' }}>
                  {Number(row.lessons)} aula{Number(row.lessons) === 1 ? '' : 's'}
                </span>
                <span style={{ ...mono, fontSize: '.85rem', fontWeight: 700, whiteSpace: 'nowrap', minWidth: '78px', textAlign: 'right' }}>
                  {formatPoints(row.points)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function Rules() {
  return (
    <section aria-labelledby="como-pontuar">
      <SectionTitle id="como-pontuar">Como pontuar</SectionTitle>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {POINT_RULES.map((rule) => (
          <li key={rule.metric} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '.95rem', padding: '10px 12px', borderBottom: '1px solid var(--line)' }}>
            <span>
              {rule.label}
              {rule.dailyCap && <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}> · até {rule.dailyCap} por dia</span>}
              {rule.note && <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}> · {rule.note}</span>}
            </span>
            <span style={{ ...mono, fontSize: '.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}>+{rule.points} pts</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function RankingPage() {
  const [me, setMe] = useState(null);
  const [period, setPeriod] = useState('week');
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [error, setError] = useState('');
  const [race, setRace] = useState({ rows: [], tracks: [] });

  useEffect(() => {
    let active = true;
    Promise.all([
      supabase.rpc('get_star_race', { p_limit: 30 }),
      supabase.from('tracks').select('level, modules(lessons(id))'),
    ]).then(([raceRes, tracksRes]) => {
      if (!active || raceRes.error || tracksRes.error) return;
      setRace({ rows: raceRes.data ?? [], tracks: tracksRes.data ?? [] });
    });
    return () => { active = false; };
  }, []);

  const totals = useMemo(() => levelTotals(race.tracks), [race.tracks]);
  const racers = useMemo(() => buildRacers(race.rows, totals), [race.rows, totals]);

  useEffect(() => {
    let active = true;
    supabase.rpc('get_my_gamification', { p_period: 'all' }).then(({ data, error: rpcError }) => {
      if (!active) return;
      if (rpcError) setError('Não foi possível carregar sua pontuação.');
      else setMe(Array.isArray(data) ? data[0] ?? {} : data ?? {});
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    supabase.rpc('get_gamification_ranking', { p_period: period, p_limit: 20 }).then(({ data, error: rpcError }) => {
      if (!active) return;
      if (rpcError) setError('Não foi possível carregar o ranking.');
      setRows(rpcError ? [] : data ?? []);
      setLoadingRows(false);
    });
    return () => { active = false; };
  }, [period]);

  function changePeriod(next) {
    if (next === period) return;
    setLoadingRows(true);
    setPeriod(next);
  }

  return (
    <Layout>
      <div style={{ maxWidth: '1040px' }}>
        <div style={{ ...eyebrow, color: 'var(--accent-text)', marginBottom: '10px' }}>
          Missão
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-.01em', marginBottom: '8px' }}>
          Corrida Estelar pela Certificação em AI Engineer
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1rem', marginBottom: '24px', maxWidth: '70ch' }}>
          Cada trilha é uma galáxia. Ganhe pontos para atravessá-las e conclua o Projeto de Certificação para chegar à {APEX_NAME}.
        </p>

        {error && <p role="alert" style={{ color: 'var(--danger)', marginBottom: '20px' }}>{error}</p>}

        {(me || racers.length > 0) && <MissionPanel me={me} racers={racers} />}
        {me && <BadgeGrid badges={computeBadges(me)} upcoming={nextBadge(me)} />}
        <RankingList period={period} onPeriodChange={changePeriod} rows={rows} loading={loadingRows} />
        <Rules />
      </div>
    </Layout>
  );
}
