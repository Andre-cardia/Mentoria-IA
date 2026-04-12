import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const inputStyle = {
  width: '100%', background: 'var(--panel-2)',
  border: '1px solid var(--line-strong)', borderRadius: '4px',
  padding: '12px 16px', color: 'var(--text)',
  fontFamily: 'Space Grotesk, sans-serif', fontSize: '.925rem',
  outline: 'none', transition: 'border-color .15s',
};

const labelStyle = {
  fontFamily: 'Space Mono, monospace', fontSize: '.7rem',
  color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? data.error ?? 'Erro ao criar conta.');
        return;
      }

      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--accent)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: '1rem', color: '#000' }}>M</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.1 }}>Mentoria IA</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Zero-to-Hero</div>
          </div>
        </div>

        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '32px' }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
            Criar Conta
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', lineHeight: 1.2 }}>
            Acesse a plataforma
          </h1>
          <p style={{ fontSize: '.875rem', color: 'var(--muted)', marginBottom: '28px', lineHeight: 1.5 }}>
            Use o e-mail com que você realizou a compra.
          </p>

          {done ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>✓</div>
              <p style={{ fontWeight: 600, marginBottom: '6px' }}>Conta criada com sucesso!</p>
              <p style={{ fontSize: '.875rem', color: 'var(--muted)' }}>Redirecionando para o login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>E-mail da compra</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required placeholder="seu@email.com" style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--line-strong)'}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Senha</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required placeholder="mínimo 6 caracteres" style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--line-strong)'}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Confirmar senha</label>
                <input
                  type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  required placeholder="repita a senha" style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--line-strong)'}
                />
              </div>

              {error && (
                <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.75rem', lineHeight: 1.5 }}>
                  {error}
                </p>
              )}

              <button
                type="submit" disabled={loading}
                style={{
                  padding: '12px 28px', background: loading ? 'rgba(255,106,0,.5)' : 'var(--accent)',
                  color: '#000', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700,
                  fontSize: '.95rem', borderRadius: '4px', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px',
                }}
              >
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>
          )}

          <p style={{ marginTop: '20px', fontSize: '.875rem', color: 'var(--muted)', textAlign: 'center' }}>
            Já tem conta?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
