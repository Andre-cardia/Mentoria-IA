export default function ConfirmModal({ isOpen, title, message, confirmLabel = 'Excluir', onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}
    onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--panel)', border: '1px solid var(--line-strong)',
          borderRadius: '8px', padding: '28px 32px', maxWidth: '440px', width: '100%',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}
      >
        <div id="confirm-modal-title" style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
          {title}
        </div>
        {message && (
          <div style={{ fontSize: '.9rem', color: 'var(--muted)', lineHeight: 1.5 }}>
            {message}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 18px', background: 'transparent',
              border: '1px solid var(--line-strong)', borderRadius: '4px', color: 'var(--muted)',
              fontFamily: 'Space Grotesk, sans-serif', fontSize: '.875rem', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 18px', background: 'transparent',
              border: '1px solid rgba(248,113,113,.4)', borderRadius: '4px', color: '#f87171',
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '.875rem', cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
