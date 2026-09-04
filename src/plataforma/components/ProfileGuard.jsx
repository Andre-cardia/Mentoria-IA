import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/useAuth';

const BLOCKED_MESSAGES = {
  suspended: {
    title: 'Conta suspensa',
    body: 'Seu acesso foi temporariamente suspenso. Entre em contato com o suporte.',
  },
  cancelled: {
    title: 'Matrícula cancelada',
    body: 'Sua matrícula foi cancelada. Entre em contato caso acredite que isso foi um engano.',
  },
};

function BlockedPage({ status }) {
  const msg = BLOCKED_MESSAGES[status] ?? BLOCKED_MESSAGES.suspended;
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔒</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>{msg.title}</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: '24px' }}>{msg.body}</p>
        <a href="mailto:contato@neuralhub.ia.br" style={{ color: 'var(--accent)', fontFamily: 'Space Mono, monospace', fontSize: '.85rem' }}>
          contato@neuralhub.ia.br
        </a>
      </div>
    </div>
  );
}

/**
 * Verifica se o usuário autenticado tem perfil completo e status ativo.
 * Admin é dispensado — vai direto para o conteúdo.
 * Aluno sem perfil → /completar-perfil
 * Aluno suspenso/cancelado → tela de bloqueio
 */
export default function ProfileGuard({ children }) {
  const { user, isAdmin, isCommercial } = useAuth();
  const [checked, setChecked] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const settle = (nextProfile, nextError = '') => {
      if (cancelled) return;
      setProfile(nextProfile);
      setLoadError(nextError);
      setChecked(true);
    };

    if (!user) {
      settle(null);
      return () => { cancelled = true; };
    }
    if (isAdmin) {
      settle({ status: 'active' });
      return () => { cancelled = true; };
    }
    if (isCommercial) {
      settle(null);
      return () => { cancelled = true; };
    }

    supabase
      .from('profiles')
      .select('user_id, status')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('[ProfileGuard] erro ao carregar perfil:', error);
          settle(null, error.message ?? 'Erro ao verificar perfil.');
          return;
        }

        settle(data);
      });

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin, isCommercial]);

  if (!checked) return null;
  if (isCommercial) return <Navigate to="/crm/leads" replace />;
  if (isAdmin) return children;
  if (loadError) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '420px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>Erro ao validar seu acesso</h1>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: '24px' }}>
            Não foi possível confirmar seu perfil agora. Atualize a página em instantes para tentar novamente.
          </p>
        </div>
      </div>
    );
  }
  if (!profile) return <Navigate to="/completar-perfil" replace />;
  if (profile.status !== 'active') return <BlockedPage status={profile.status} />;
  return children;
}
