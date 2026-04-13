function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bom dia';
  if (h >= 12 && h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{
      flex: 1, minWidth: '90px',
      background: 'var(--panel)', border: '1px solid var(--line)',
      borderRadius: '8px', padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: '4px',
    }}>
      <span style={{
        fontFamily: 'Space Mono, monospace', fontSize: '.65rem',
        textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'Space Mono, monospace', fontSize: '1.5rem',
        fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--text)',
      }}>
        {value}
      </span>
    </div>
  );
}

export default function DashboardStats({ userName, completed, total, diasEstudando }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start',
      gap: '24px', marginBottom: '40px',
    }}>
      {/* Saudação + barra */}
      <div style={{ flex: '1 1 260px' }}>
        <div style={{
          fontFamily: 'Space Mono, monospace', fontSize: '.75rem',
          textTransform: 'uppercase', letterSpacing: '.14em',
          color: 'var(--accent)', marginBottom: '6px',
        }}>
          {getGreeting()}
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 18px', lineHeight: 1.1 }}>
          {userName} 👋
        </h1>

        {/* Barra de progresso */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{
              fontFamily: 'Space Mono, monospace', fontSize: '.65rem',
              textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)',
            }}>
              Progresso geral
            </span>
            <span style={{
              fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--accent)',
            }}>
              {completed}/{total} aulas · {pct}%
            </span>
          </div>
          <div style={{ height: '6px', background: 'var(--line)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: 'var(--accent)', borderRadius: '3px',
              transition: 'width .4s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Cards de stats */}
      <div style={{ display: 'flex', gap: '12px', flex: '1 1 240px', flexWrap: 'wrap' }}>
        <StatCard label="Aulas assistidas" value={completed} accent />
        <StatCard label="Certificados" value={0} />
        <StatCard label="Dias estudando" value={diasEstudando} />
      </div>
    </div>
  );
}
