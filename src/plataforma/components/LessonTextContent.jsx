// Renderiza conteúdo de aulas do tipo "text" (markdown/texto simples)
// react-markdown não está instalado — usa fallback pre-wrap
export default function LessonTextContent({ content }) {
  if (!content) {
    return (
      <p style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.875rem' }}>
        Conteúdo não disponível.
      </p>
    );
  }

  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: '8px',
        padding: '28px 32px',
        marginBottom: '8px',
      }}
    >
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '1rem',
          lineHeight: '1.75',
          color: 'var(--text)',
          margin: 0,
        }}
      >
        {content}
      </pre>
    </div>
  );
}
