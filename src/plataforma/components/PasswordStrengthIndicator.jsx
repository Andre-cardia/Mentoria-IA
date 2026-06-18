function getStrength(password) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return 'fraca';
  if (score <= 3) return 'média';
  return 'forte';
}

const COLORS = { fraca: '#f87171', média: '#fbbf24', forte: '#4ade80' };
const WIDTHS = { fraca: '33%', média: '66%', forte: '100%' };

export default function PasswordStrengthIndicator({ password }) {
  const strength = getStrength(password);
  if (!strength) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ height: '3px', background: 'var(--line)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: WIDTHS[strength],
          background: COLORS[strength],
          borderRadius: '2px',
          transition: 'width .2s, background .2s',
        }} />
      </div>
      <span style={{
        fontFamily: 'Space Mono, monospace',
        fontSize: '.65rem',
        color: COLORS[strength],
        textTransform: 'uppercase',
        letterSpacing: '.08em',
      }}>
        Senha {strength}
      </span>
    </div>
  );
}
