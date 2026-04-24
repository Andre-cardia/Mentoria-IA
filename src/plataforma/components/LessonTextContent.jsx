export default function LessonTextContent({ content }) {
  if (!content) {
    return (
      <p style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.875rem' }}>
        Conteúdo não disponível.
      </p>
    );
  }

  const isHtml = content.startsWith('<');

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
      {isHtml ? (
        <>
          <style>{`
            .lesson-rich-content h1 { font-size: 1.8rem; margin: 1em 0 .5em; color: var(--text); }
            .lesson-rich-content h2 { font-size: 1.4rem; margin: 1em 0 .5em; color: var(--text); }
            .lesson-rich-content h3 { font-size: 1.1rem; margin: 1em 0 .4em; color: var(--text); }
            .lesson-rich-content p { margin: .5em 0; line-height: 1.75; color: var(--text); font-family: Space Grotesk, sans-serif; font-size: 1rem; }
            .lesson-rich-content ul, .lesson-rich-content ol { padding-left: 1.5em; margin: .5em 0; color: var(--text); font-family: Space Grotesk, sans-serif; font-size: 1rem; line-height: 1.75; }
            .lesson-rich-content blockquote { border-left: 3px solid var(--accent); padding-left: 1em; color: var(--muted); margin: 1em 0; }
            .lesson-rich-content img { max-width: 100%; border-radius: 4px; margin: .5em 0; }
            .lesson-rich-content a { color: var(--accent); }
            .lesson-rich-content strong { font-weight: 700; }
            .lesson-rich-content em { font-style: italic; }
          `}</style>
          <div
            className="lesson-rich-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </>
      ) : (
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
      )}
    </div>
  );
}
