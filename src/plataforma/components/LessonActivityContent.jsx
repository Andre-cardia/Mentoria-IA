// Renderiza aulas do tipo "activity": instruções + campo de entrega (sem persistência nesta story)
export default function LessonActivityContent({ content }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Instruções da atividade */}
      {content && (
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            padding: '24px 28px',
          }}
        >
          <div
            style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '.65rem',
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: '12px',
            }}
          >
            Instruções
          </div>
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
      )}

      {/* Campo de entrega */}
      <div>
        <label
          style={{
            display: 'block',
            fontFamily: 'Space Mono, monospace',
            fontSize: '.65rem',
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: '8px',
          }}
        >
          Sua entrega
        </label>
        <textarea
          placeholder="Descreva sua entrega aqui..."
          rows={6}
          style={{
            width: '100%',
            background: 'var(--panel)',
            border: '1px solid var(--line-strong)',
            borderRadius: '6px',
            padding: '14px 16px',
            color: 'var(--text)',
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '.95rem',
            lineHeight: '1.6',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <p
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '.65rem',
            color: 'var(--muted)',
            marginTop: '6px',
          }}
        >
          Submissão de atividades em breve.
        </p>
      </div>
    </div>
  );
}
