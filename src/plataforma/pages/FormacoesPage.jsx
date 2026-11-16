import Layout from '../components/Layout';

export default function FormacoesPage() {
  return (
    <Layout>
      <div style={{ maxWidth: '800px' }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent-text)', marginBottom: '8px' }}>
          Formação
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '12px' }}>Cursos de Formação</h1>
        <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '32px' }}>
          Cursos completos, com começo, meio e fim, independentes das aulas da mentoria.
        </p>

        <div style={{
          background: 'var(--panel)', border: '1px dashed var(--line-strong)',
          borderRadius: '8px', padding: '40px 24px', textAlign: 'center',
        }}>
          <span style={{
            display: 'inline-block', marginBottom: '14px',
            fontFamily: 'Space Mono, monospace', fontSize: '.7rem',
            color: 'var(--accent-text)', background: 'var(--accent-soft)',
            border: '1px solid rgba(255,106,0,.25)', borderRadius: '3px',
            padding: '3px 12px',
          }}>
            Em breve
          </span>
          <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text)', marginBottom: '6px' }}>
            Os cursos de formação estão sendo preparados
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '.95rem' }}>
            Avisaremos aqui na plataforma quando o primeiro curso for lançado.
          </div>
        </div>
      </div>
    </Layout>
  );
}
