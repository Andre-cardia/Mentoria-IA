import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!isSupabaseConfigured) {
      setError('Supabase não configurado no ambiente local.');
      return;
    }

    setLoading(true);
    const { error: authError } = await resetPassword(email);
    setLoading(false);

    if (authError) {
      setError(`Erro: ${authError.message || authError.status || JSON.stringify(authError)}`);
      return;
    }

    setSubmitted(true);
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
            Recuperar Acesso
          </div>

          {submitted ? (
            <>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px', lineHeight: 1.2 }}>
                Verifique seu e-mail
              </h1>
              <p style={{ fontSize: '.9rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '24px' }}>
                Se este e-mail estiver cadastrado, você receberá um link em breve para redefinir sua senha.
              </p>
              <Link to="/login" style={{
                display: 'inline-block',
                fontFamily: 'Space Mono, monospace',
                fontSize: '.75rem',
                color: 'var(--accent)',
                textDecoration: 'none',
                letterSpacing: '.04em',
              }}>
                ← Voltar ao login
              </Link>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', lineHeight: 1.2 }}>
                Esqueci minha senha
              </h1>
              <p style={{ fontSize: '.875rem', color: 'var(--muted)', marginBottom: '28px', lineHeight: 1.5 }}>
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--line-strong)'}
                  />
                </div>

                {error && (
                  <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.75rem' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    padding: '12px 28px',
                    background: loading ? 'rgba(255,106,0,.5)' : 'var(--accent)',
                    color: '#000', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700,
                    fontSize: '.95rem', borderRadius: '4px', border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity .15s',
                    marginTop: '8px',
                  }}
                >
                  {loading ? 'Enviando...' : 'Enviar link'}
                </button>
              </form>

              <p style={{ marginTop: '20px', fontSize: '.875rem', color: 'var(--muted)', textAlign: 'center' }}>
                <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                  ← Voltar ao login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
