import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/useAuth';
import { levelTotals, racePosition, rankFor } from '../lib/starRace';

// Uma consulta por aluno e por carregamento da plataforma: o menu lateral
// aparece em todas as telas e não deve refazer a busca a cada navegação.
let cache = { userId: null, promise: null };

async function fetchMyRank() {
  const [raceRes, tracksRes] = await Promise.all([
    supabase.rpc('get_star_race', { p_limit: 1 }),
    supabase.from('tracks').select('level, modules(lessons(id))'),
  ]);
  if (raceRes?.error || tracksRes?.error || !tracksRes?.data?.length) return null;
  const row = (raceRes?.data ?? []).find((item) => item.is_current_user);
  if (!row) return null;
  return rankFor(racePosition(row, levelTotals(tracksRes.data)), row.granted_rank ?? null);
}

/** Carrega (com cache) a patente do aluno; null se não for possível calcular. */
export function loadMyRank(userId) {
  if (!userId) return Promise.resolve(null);
  if (cache.userId !== userId || !cache.promise) {
    cache = {
      userId,
      promise: Promise.resolve().then(fetchMyRank).catch((error) => {
        console.error('[useMyRank] patente:', error);
        cache = { userId: null, promise: null };
        return null;
      }),
    };
  }
  return cache.promise;
}

/** Só para testes: esquece a patente guardada. */
export function resetMyRankCache() {
  cache = { userId: null, promise: null };
}

/** Patente (com a nave) do aluno logado, ou null enquanto carrega ou se indisponível. */
export function useMyRank() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [result, setResult] = useState({ userId: null, rank: null });

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    loadMyRank(userId).then((rank) => {
      if (active) setResult({ userId, rank });
    });
    return () => { active = false; };
  }, [userId]);

  return result.userId === userId ? result.rank : null;
}
