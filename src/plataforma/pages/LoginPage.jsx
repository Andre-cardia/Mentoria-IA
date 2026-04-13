import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: authError } = await signIn(email, password);
    setLoading(false);
    if (authError) {
      setError('Email ou senha inválidos.');
      return;
    }
    navigate('/inicio', { replace: true });
  }

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
        {/* Logo */}
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

        {/* Card */}
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: '6px',
          padding: '32px',
        }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
            Acesso à Plataforma
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '28px', lineHeight: 1.2 }}>
            Entre na sua conta
          </h1>

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
                style={{
                  width: '100%', background: 'var(--panel-2)',
                  border: '1px solid var(--line-strong)', borderRadius: '4px',
                  padding: '12px 16px', color: 'var(--text)',
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: '.925rem',
                  outline: 'none', transition: 'border-color .15s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--line-strong)'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%', background: 'var(--panel-2)',
                  border: '1px solid var(--line-strong)', borderRadius: '4px',
                  padding: '12px 16px', color: 'var(--text)',
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: '.925rem',
                  outline: 'none', transition: 'border-color .15s',
                }}
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
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px 28px', background: loading ? 'rgba(255,106,0,.5)' : 'var(--accent)',
                color: '#000', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700,
                fontSize: '.95rem', borderRadius: '4px', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity .15s',
                marginTop: '8px',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <p style={{ marginTop: '20px', fontSize: '.875rem', color: 'var(--muted)', textAlign: 'center' }}>
            Ainda não tem conta?{' '}
            <Link to="/registro" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
