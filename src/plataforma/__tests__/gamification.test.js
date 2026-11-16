import { describe, expect, it } from 'vitest';
import { BADGES, computeBadges, formatPoints, nextBadge, normalizeStats } from '../lib/gamification';

describe('gamification', () => {
  it('normaliza números vindos do banco como texto e ignora lixo', () => {
    expect(normalizeStats({ lessons: '12', points: '140', posts: null, answers: -3, questions: 'x' }))
      .toEqual({ lessons: 12, access_days: 0, posts: 0, questions: 0, answers: 0, quizzes: 0, points: 140 });
  });

  it('sem atividade nenhuma medalha é conquistada', () => {
    const badges = computeBadges(null);
    expect(badges).toHaveLength(BADGES.length);
    expect(badges.every((badge) => !badge.earned && badge.pct === 0)).toBe(true);
  });

  it('conquista a medalha exatamente ao atingir a meta', () => {
    const byId = (stats) => Object.fromEntries(computeBadges(stats).map((b) => [b.id, b]));
    expect(byId({ lessons: 9 })['aula-10']).toMatchObject({ earned: false, current: 9, pct: 90 });
    expect(byId({ lessons: 10 })['aula-10']).toMatchObject({ earned: true, current: 10, pct: 100 });
    expect(byId({ lessons: 999 })['aula-10']).toMatchObject({ earned: true, current: 10, pct: 100 });
  });

  it('aponta a medalha pendente mais próxima', () => {
    expect(nextBadge({ lessons: 9, access_days: 1 }).id).toBe('aula-10');
    const tudo = { lessons: 100, access_days: 100, posts: 10, questions: 10, answers: 50, quizzes: 15 };
    expect(nextBadge(tudo)).toBeNull();
  });

  it('formata pontos no singular e no plural', () => {
    expect(formatPoints(1)).toBe('1 pt');
    expect(formatPoints('1500')).toBe('1.500 pts');
    expect(formatPoints(undefined)).toBe('0 pts');
  });
});
