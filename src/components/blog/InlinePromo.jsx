export default function InlinePromo({ title, description, cta, href, badge }) {
  return (
    <div className="inline-promo" style={styles.container}>
      <div style={styles.textBlock}>
        {badge && <span style={styles.badge}>{badge}</span>}
        {title && <h4 style={styles.title}>{title}</h4>}
        {description && <p style={styles.description}>{description}</p>}
      </div>
      {cta && href && (
        <a href={href} style={styles.cta}>
          {cta}
        </a>
      )}

      <style>{`
        @media (max-width: 768px) {
          .inline-promo { flex-direction: column !important; align-items: stretch !important; }
          .inline-promo a { text-align: center; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    background: 'var(--panel-2)',
    borderLeft: '3px solid var(--accent)',
    padding: '20px 24px',
    borderRadius: 8,
    margin: '32px 0',
  },
  textBlock: {
    flex: 1,
  },
  badge: {
    display: 'inline-block',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '.72rem',
    fontWeight: 600,
    color: 'var(--accent)',
    background: 'var(--accent-soft)',
    padding: '3px 10px',
    borderRadius: 20,
    marginBottom: 6,
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text)',
    margin: '0 0 4px',
    lineHeight: 1.3,
  },
  description: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '.9rem',
    color: 'var(--muted)',
    margin: 0,
    lineHeight: 1.5,
  },
  cta: {
    display: 'inline-block',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '.85rem',
    fontWeight: 600,
    color: '#000',
    background: 'var(--accent)',
    padding: '10px 20px',
    borderRadius: 6,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
};
