import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';

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

export default function CompletarPerfilPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [origin, setOrigin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Nome completo é obrigatório.');
      return;
    }

    setLoading(true);
    const { error: dbError } = await supabase.from('profiles').insert({
      user_id: user.id,
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      origin: origin.trim() || null,
    });

    setLoading(false);

    if (dbError) {
      console.error('[completar-perfil]', dbError);
      setError('Erro ao salvar perfil. Tente novamente.');
      return;
    }

    navigate('/modulos', { replace: true });
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
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
            Bem-vindo
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', lineHeight: 1.2 }}>
            Complete seu perfil
          </h1>
          <p style={{ fontSize: '.875rem', color: 'var(--muted)', marginBottom: '28px', lineHeight: 1.5 }}>
            Antes de começar, precisamos de algumas informações.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Nome completo *</label>
              <input
                type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                required placeholder="Seu nome completo" style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--line-strong)'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>WhatsApp</label>
              <input
                type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="(48) 99999-9999" style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--line-strong)'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Como ficou sabendo da mentoria?</label>
              <select
                value={origin} onChange={(e) => setOrigin(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">Selecione (opcional)</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="linkedin">LinkedIn</option>
                <option value="indicacao">Indicação de amigo</option>
                <option value="google">Google</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            {error && (
              <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.75rem' }}>
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
              {loading ? 'Salvando...' : 'Entrar na plataforma →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
