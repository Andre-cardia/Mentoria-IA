import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Layout from '../components/Layout';
import {
  POINT_RULES, RANKING_PERIODS,
  computeBadges, formatPoints, nextBadge, normalizeStats,
} from '../lib/gamification';

const mono = { fontFamily: 'Space Mono, monospace' };
const card = { background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '12px' };

const STAT_LABELS = [
  { metric: 'lessons',     label: 'Aulas concluídas' },
  { metric: 'access_days', label: 'Dias com acesso' },
  { metric: 'posts',       label: 'Posts no fórum' },
  { metric: 'questions',   label: 'Dúvidas' },
  { metric: 'answers',     label: 'Respostas' },
];

function SectionTitle({ id, children }) {
  return <h2 id={id} style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 14px 0' }}>{children}</h2>;
}

function positionLabel(position) {
  if (position === 1) return '🥇';
  if (position === 2) return '🥈';
  if (position === 3) return '🥉';
  return `${position}º`;
}

function Summary({ me }) {
  const stats = normalizeStats(me);
  const position = me?.rank_pos ? Number(me.rank_pos) : null;
  const upcoming = nextBadge(stats);

  return (
    <section aria-labelledby="meu-resumo" style={{ ...card, padding: '24px', marginBottom: '32px', borderLeft: '4px solid var(--accent)' }}>
      <h2 id="meu-resumo" style={{ ...mono, fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent-text)', margin: '0 0 12px 0', fontWeight: 400 }}>
        Sua pontuação
      </h2>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <span style={{ fontSize: '2.4rem', fontWeight: 700, lineHeight: 1 }}>{formatPoints(stats.points)}</span>
        <span style={{ color: 'var(--muted)', fontSize: '.95rem' }}>
          {position
            ? `${position}º lugar no ranking geral, entre ${Number(me.participants)} participante${Number(me.participants) === 1 ? '' : 's'}`
            : stats.points > 0
              ? 'Contas da equipe não entram no ranking'
              : 'Conclua uma aula ou participe do fórum para entrar no ranking'}
        </span>
      </div>

      <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', margin: 0 }}>
        {STAT_LABELS.map(({ metric, label }) => (
          <div key={metric} style={{ background: 'var(--panel-2)', borderRadius: '8px', padding: '12px 14px' }}>
            <dt style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: '2px' }}>{label}</dt>
            <dd style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>{stats[metric]}</dd>
          </div>
        ))}
      </dl>

      {upcoming && (
        <p style={{ margin: '18px 0 0 0', fontSize: '.9rem', color: 'var(--muted)' }}>
          Próxima medalha: <strong style={{ color: 'var(--text)' }}>{upcoming.icon} {upcoming.title}</strong> — {upcoming.description.toLowerCase()} ({upcoming.current}/{upcoming.target}).
        </p>
      )}
    </section>
  );
}

function BadgeGrid({ badges }) {
  const earnedCount = badges.filter((badge) => badge.earned).length;
  return (
    <section aria-labelledby="medalhas" style={{ marginBottom: '32px' }}>
      <SectionTitle id="medalhas">Medalhas · {earnedCount} de {badges.length}</SectionTitle>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '12px' }}>
        {badges.map((badge) => (
          <li
            key={badge.id}
            aria-label={`${badge.title}: ${badge.earned ? 'conquistada' : `${badge.current} de ${badge.target}`}`}
            style={{
              ...card, padding: '16px',
              borderColor: badge.earned ? 'rgba(255,106,0,.45)' : 'var(--line)',
              background: badge.earned ? 'var(--accent-soft)' : 'var(--panel)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span aria-hidden="true" style={{ fontSize: '1.5rem', filter: badge.earned ? 'none' : 'grayscale(1)', opacity: badge.earned ? 1 : 0.55 }}>
                {badge.icon}
              </span>
              <span style={{ fontWeight: 700, fontSize: '.95rem' }}>{badge.title}</span>
            </div>
            <div style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: '10px' }}>{badge.description}</div>
            {badge.earned ? (
              <span style={{ ...mono, fontSize: '.7rem', color: 'var(--accent-text)', fontWeight: 700 }}>✓ Conquistada</span>
            ) : (
              <>
                <div style={{ height: '4px', background: 'var(--line)', borderRadius: '2px', overflow: 'hidden', marginBottom: '4px' }}>
                  <div style={{ height: '100%', width: `${badge.pct}%`, background: 'var(--accent)' }} />
                </div>
                <span style={{ ...mono, fontSize: '.7rem', color: 'var(--muted)' }}>{badge.current}/{badge.target}</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RankingList({ period, onPeriodChange, rows, loading }) {
  return (
    <section aria-labelledby="ranking" style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <h2 id="ranking" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Ranking</h2>
        <div role="group" aria-label="Período do ranking" style={{ display: 'flex', gap: '6px' }}>
          {RANKING_PERIODS.map(({ id, label }) => {
            const active = id === period;
            return (
              <button
                key={id} type="button" aria-pressed={active}
                onClick={() => onPeriodChange(id)}
                style={{
                  padding: '6px 14px', borderRadius: '999px', cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', fontWeight: 600,
                  background: active ? 'var(--accent)' : 'var(--panel)',
                  color: active ? '#261000' : 'var(--text)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--line-strong)'}`,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {loading && <p style={{ color: 'var(--muted)' }}>Carregando ranking...</p>}
      {!loading && rows.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '.95rem' }}>Ninguém pontuou neste período ainda. Seja o primeiro!</p>
      )}
      {!loading && rows.length > 0 && (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '6px' }}>
          {rows.map((row) => {
            const position = Number(row.rank_pos);
            return (
              <li
                key={`${position}-${row.user_name}`}
                style={{
                  ...card, borderRadius: '8px', padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  background: row.is_current_user ? 'var(--accent-soft)' : 'var(--panel)',
                  borderColor: row.is_current_user ? 'rgba(255,106,0,.45)' : 'var(--line)',
                }}
              >
                <span style={{ minWidth: '36px', fontWeight: 700, fontSize: position <= 3 ? '1.2rem' : '.9rem', color: 'var(--muted)' }}>
                  {positionLabel(position)}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontWeight: row.is_current_user ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.user_name}
                  {row.is_current_user && <span style={{ color: 'var(--accent-text)', fontWeight: 600, marginLeft: '8px', fontSize: '.85rem' }}>(você)</span>}
                </span>
                <span style={{ color: 'var(--muted)', fontSize: '.85rem', whiteSpace: 'nowrap' }}>
                  {Number(row.lessons)} aula{Number(row.lessons) === 1 ? '' : 's'}
                </span>
                <span style={{ ...mono, fontSize: '.8rem', fontWeight: 700, color: 'var(--accent-text)', whiteSpace: 'nowrap', minWidth: '72px', textAlign: 'right' }}>
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
    <section aria-labelledby="como-pontuar" style={{ ...card, padding: '20px 24px' }}>
      <SectionTitle id="como-pontuar">Como pontuar</SectionTitle>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '8px' }}>
        {POINT_RULES.map((rule) => (
          <li key={rule.metric} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '.95rem' }}>
            <span>
              {rule.label}
              {rule.dailyCap && <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}> · até {rule.dailyCap} por dia</span>}
            </span>
            <span style={{ ...mono, fontSize: '.8rem', fontWeight: 700, color: 'var(--accent-text)', whiteSpace: 'nowrap' }}>+{rule.points} pts</span>
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
      <div style={{ maxWidth: '960px' }}>
        <div style={{ ...mono, fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent-text)', marginBottom: '8px' }}>
          Comunidade
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Ranking e medalhas</h1>
        <p style={{ color: 'var(--muted)', fontSize: '1rem', marginBottom: '28px' }}>
          Ganhe pontos estudando e ajudando a turma.
        </p>

        {error && <p role="alert" style={{ color: 'var(--danger)', marginBottom: '20px' }}>{error}</p>}

        {me && <Summary me={me} />}
        {me && <BadgeGrid badges={computeBadges(me)} />}
        <RankingList period={period} onPeriodChange={changePeriod} rows={rows} loading={loadingRows} />
        <Rules />
      </div>
    </Layout>
  );
}
