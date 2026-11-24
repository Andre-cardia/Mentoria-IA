import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isAuthSessionMissingError } from '@supabase/supabase-js';
import { isStaffRole } from '../../lib/app-env';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/useAuth';
import {
  FIRST_ACCESS_PASSWORD_REQUIREMENTS,
  isStrongFirstAccessPassword,
  requiresFirstAccessPasswordChange,
} from '../../../shared/first-access.js';

const CHANGE_ERROR = 'Não foi possível alterar a senha. Tente novamente.';
const LOGIN_REQUIRED = 'Sua sessão expirou. Entre novamente para alterar a senha.';
const CHANGE_SUCCESS = 'Senha alterada. Entre novamente com a nova senha.';

const inputStyle = {
  width: '100%', background: 'var(--panel-2)', border: '1px solid var(--line-strong)',
  borderRadius: '4px', padding: '12px 16px', color: 'var(--text)',
  font: 'inherit',
};
const submitStyle = {
  padding: '12px 24px', background: 'var(--accent)', color: '#000', border: 0,
  borderRadius: '4px', font: 'inherit', fontWeight: 700,
};

function PasswordField({ id, label, value, onChange, autoComplete, describedBy = undefined }) {
  return (
    <div style={{ display: 'grid', gap: '6px' }}>
      <label htmlFor={id} style={{ fontSize: '.875rem', fontWeight: 600 }}>{label}</label>
      <input id={id} name={id} type="password" value={value} onChange={onChange}
        autoComplete={autoComplete} aria-describedby={describedBy} required style={inputStyle} />
    </div>
  );
}

/** @param {{ area?: 'ensino' | 'gestao' }} props */
export default function FirstAccessPasswordPage({ area = 'ensino' }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [saved, setSaved] = useState(false);

  const isGestao = area === 'gestao';
  const role = user?.app_metadata?.role;
  const allowed = isGestao ? isStaffRole(role) : role !== 'comercial';

  if (!loading && !working && !saved) {
    if (!user || !allowed) return <Navigate to="/login" replace />;
    if (!requiresFirstAccessPasswordChange(user)) {
      const destination = isGestao ? (role === 'admin' ? '/admin/alunos' : '/crm/leads') : '/inicio';
      return <Navigate to={destination} replace />;
    }
  }

  async function endLocalSession() {
    setWorking(true);
    setError('');
    try {
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
      if (signOutError) throw signOutError;
      navigate('/login', { replace: true, state: { successMessage: CHANGE_SUCCESS } });
    } catch {
      setError('Não foi possível encerrar esta sessão. Tente novamente para entrar com a nova senha.');
    } finally {
      setWorking(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (working) return;
    setError('');

    if (password !== confirmation) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password === currentPassword) {
      setError('A nova senha deve ser diferente da senha atual.');
      return;
    }
    if (!isStrongFirstAccessPassword(password)) {
      setError(FIRST_ACCESS_PASSWORD_REQUIREMENTS);
      return;
    }

    setWorking(true);
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError && !isAuthSessionMissingError(sessionError)) {
        setError('Não foi possível validar a sessão. Tente novamente.');
        return;
      }
      const token = data?.session?.access_token;
      if (!token) {
        navigate('/login', { replace: true, state: { errorMessage: LOGIN_REQUIRED } });
        return;
      }

      const response = await fetch('/api/auth/first-password', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, password }),
      });
      if (response.status === 401) {
        navigate('/login', { replace: true, state: { errorMessage: LOGIN_REQUIRED } });
        return;
      }
      // A API devolve 409 se a alteração já tiver sido concluída, inclusive após uma resposta perdida.
      if (response.status !== 409) {
        const result = await response.json();
        if (!response.ok || result?.ok !== true) {
          setError(typeof result?.error === 'string' ? result.error : CHANGE_ERROR);
          return;
        }
      }

      setSaved(true);
      setCurrentPassword('');
      setPassword('');
      setConfirmation('');
      await endLocalSession();
    } catch {
      setError(CHANGE_ERROR);
    } finally {
      setWorking(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'grid', placeItems: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: 'clamp(20px, 6vw, 32px)' }}>
        <p style={{ color: 'var(--accent-text)', fontFamily: 'Space Mono, monospace', fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.1em', margin: '0 0 8px' }}>
          {isGestao ? 'Gestão' : 'Mentoria IA'}
        </p>
        <h1 style={{ fontSize: '1.5rem', lineHeight: 1.2, margin: '0 0 12px' }}>Altere sua senha</h1>
        {loading ? (
          <p role="status">Carregando...</p>
        ) : saved ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            <p role="status" style={{ color: 'var(--success)', margin: 0 }}>Senha alterada com sucesso.</p>
            {error && <p role="alert" style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>}
            <button type="button" onClick={endLocalSession} disabled={working} style={submitStyle}>
              {working ? 'Encerrando sessão...' : 'Tentar encerrar sessão novamente'}
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 20px' }}>
              No primeiro acesso, você precisa escolher uma nova senha para continuar.
            </p>
            <form onSubmit={handleSubmit} aria-busy={working}>
              <fieldset disabled={working} style={{ display: 'grid', gap: '16px', border: 0, padding: 0, margin: 0, minWidth: 0 }}>
                <PasswordField id="current-password" label="Senha atual" value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" />
                <div style={{ display: 'grid', gap: '6px' }}>
                  <PasswordField id="new-password" label="Nova senha" value={password}
                    onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" describedBy="new-password-rules" />
                  <p id="new-password-rules" style={{ color: 'var(--muted)', fontSize: '.8rem', lineHeight: 1.5, margin: 0 }}>
                    {FIRST_ACCESS_PASSWORD_REQUIREMENTS}
                  </p>
                </div>
                <PasswordField id="confirm-password" label="Confirmar nova senha" value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" />
                {error && <p role="alert" style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>}
                <button type="submit" style={submitStyle}>{working ? 'Salvando...' : 'Alterar senha'}</button>
              </fieldset>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
