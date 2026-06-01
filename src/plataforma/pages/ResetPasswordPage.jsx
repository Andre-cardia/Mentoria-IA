import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [canReset, setCanReset] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [matchError, setMatchError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Se não há hash na URL (acesso direto sem token), redirecionar para /esqueci-senha
    if (!window.location.hash) {
      navigate('/esqueci-senha', { replace: true });
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setCanReset(true);
      }
    });

    // Timeout: se após 5s o evento não chegar, o token é inválido/expirado
    const timer = setTimeout(() => {
      setCanReset((prev) => {
        if (!prev) setTokenError(true);
        return prev;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [navigate]);

  function handlePasswordChange(e) {
    setPassword(e.target.value);
    if (confirm && e.target.value !== confirm) {
      setMatchError('As senhas não coincidem.');
    } else {
      setMatchError('');
    }
  }

  function handleConfirmChange(e) {
    setConfirm(e.target.value);
    if (password && e.target.value !== password) {
      setMatchError('As senhas não coincidem.');
    } else {
      setMatchError('');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setMatchError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await updatePassword(password);
    setLoading(false);

    if (updateError) {
      setError('Não foi possível redefinir a senha. Tente solicitar um novo link.');
      return;
    }

    navigate('/login', { state: { successMessage: 'Senha redefinida com sucesso. Faça login.' }, replace: true });
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--panel-2)',
    border: '1px solid var(--line-strong)',
    borderRadius: '4px',
    padding: '12px 16px',
    color: 'var(--text)',
    fontFamily: 'Space Grotesk, sans-serif',
    fontSize: '.925rem',
    outline: 'none',
    transition: 'border-color .15s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'var(--accent)',
            borderRadius: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '1rem', color: '#000',
          }}>M</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.1 }}>Mentoria IA</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
              Zero-to-Hero
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: '6px',
          padding: '32px',
        }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
            Nova Senha
          </div>

          {tokenError ? (
            <>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px', lineHeight: 1.2 }}>
                Link inválido ou expirado
              </h1>
              <p style={{ fontSize: '.9rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '24px' }}>
                Este link expirou ou é inválido. Solicite um novo link de recuperação.
              </p>
              <Link to="/esqueci-senha" style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: '12px 28px',
                background: 'var(--accent)',
                color: '#000', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700,
                fontSize: '.95rem', borderRadius: '4px', textDecoration: 'none',
              }}>
                Solicitar novo link
              </Link>
            </>
          ) : !canReset ? (
            <p style={{ fontSize: '.9rem', color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>
              Validando link...
            </p>
          ) : (
            <>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '28px', lineHeight: 1.2 }}>
                Redefina sua senha
              </h1>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    Nova senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    placeholder="••••••••"
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--line-strong)'}
                  />
                  <PasswordStrengthIndicator password={password} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    Confirmar senha
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={handleConfirmChange}
                    required
                    placeholder="••••••••"
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--line-strong)'}
                  />
                  {matchError && (
                    <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.72rem', margin: 0 }}>
                      {matchError}
                    </p>
                  )}
                </div>

                {error && (
                  <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.75rem' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !!matchError}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    padding: '12px 28px',
                    background: (loading || matchError) ? 'rgba(255,106,0,.5)' : 'var(--accent)',
                    color: '#000', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700,
                    fontSize: '.95rem', borderRadius: '4px', border: 'none',
                    cursor: (loading || matchError) ? 'not-allowed' : 'pointer',
                    transition: 'opacity .15s', marginTop: '8px',
                  }}
                >
                  {loading ? 'Salvando...' : 'Redefinir senha'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
