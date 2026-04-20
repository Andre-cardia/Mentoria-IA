import { useState } from 'react';
import { toast } from 'sonner';
import { processEmbedUrl } from './extensions/Iframe';

const inputSx = {
  width: '100%',
  background: 'var(--panel-2)',
  border: '1px solid var(--line-strong)',
  borderRadius: '4px',
  padding: '10px 14px',
  color: 'var(--text)',
  fontFamily: 'Space Grotesk, sans-serif',
  fontSize: '.9rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const btnSx = (variant = 'primary') => ({
  border: 'none',
  borderRadius: '4px',
  padding: '10px 18px',
  fontFamily: 'Space Grotesk, sans-serif',
  fontWeight: 600,
  fontSize: '.9rem',
  cursor: 'pointer',
  background: variant === 'primary' ? 'var(--accent)' : 'var(--panel-2)',
  color: variant === 'primary' ? '#000' : 'var(--text)',
  border: variant === 'secondary' ? '1px solid var(--line-strong)' : 'none',
});

const tabBtnSx = (active) => ({
  padding: '8px 16px',
  background: active ? 'var(--accent-soft)' : 'transparent',
  border: 'none',
  borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
  color: active ? 'var(--accent)' : 'var(--muted)',
  fontFamily: 'Space Grotesk, sans-serif',
  fontSize: '.9rem',
  cursor: 'pointer',
  fontWeight: active ? 600 : 400,
});

export default function EmbedModal({ onClose, onInsert }) {
  const [type, setType] = useState('youtube');
  const [url, setUrl] = useState('');
  const [height, setHeight] = useState('400');

  function handleInsert() {
    if (!url) {
      toast.error('Por favor, insira uma URL');
      return;
    }

    if (!url.startsWith('http')) {
      toast.error('URL deve começar com http ou https');
      return;
    }

    const embedUrl = processEmbedUrl(url, type);

    if (!embedUrl) {
      toast.error('URL inválida para o tipo selecionado');
      return;
    }

    // Configurações específicas por tipo
    const embedConfig = {
      src: embedUrl,
      width: '100%',
      height: type === 'linkedin' ? '600' : height,
      frameborder: 0,
      allowfullscreen: true,
    };

    onInsert(embedConfig);
    onClose();
  }

  const examples = {
    youtube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    linkedin: 'https://www.linkedin.com/posts/username-123456789_example-post',
    twitter: 'https://twitter.com/username/status/1234567890',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          padding: '24px',
          width: '520px',
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: '0 0 20px',
            fontFamily: 'Space Grotesk, sans-serif',
            color: 'var(--text)',
            fontSize: '1.2rem',
            fontWeight: 600,
          }}
        >
          Inserir Embed
        </h3>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--line)',
            marginBottom: '20px',
          }}
        >
          <button
            style={tabBtnSx(type === 'youtube')}
            onClick={() => setType('youtube')}
          >
            <span style={{ marginRight: '6px' }}>▶️</span>
            YouTube
          </button>
          <button
            style={tabBtnSx(type === 'linkedin')}
            onClick={() => setType('linkedin')}
          >
            <span style={{ marginRight: '6px' }}>💼</span>
            LinkedIn
          </button>
          <button
            style={tabBtnSx(type === 'twitter')}
            onClick={() => setType('twitter')}
          >
            <span style={{ marginRight: '6px' }}>🐦</span>
            X (Twitter)
          </button>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '.85rem',
                color: 'var(--muted)',
              }}
            >
              URL do {type === 'youtube' ? 'vídeo' : type === 'linkedin' ? 'post' : 'tweet'}
            </label>
            <input
              type="text"
              placeholder={examples[type]}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={inputSx}
              autoFocus
            />
          </div>

          {type !== 'linkedin' && (
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '.85rem',
                  color: 'var(--muted)',
                }}
              >
                Altura (pixels)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                style={{ ...inputSx, maxWidth: '150px' }}
                min="200"
                max="800"
              />
            </div>
          )}

          {/* Dicas */}
          <div
            style={{
              background: 'rgba(255,255,255,.03)',
              border: '1px solid var(--line)',
              borderRadius: '4px',
              padding: '12px',
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: 'Space Mono, monospace',
                fontSize: '.75rem',
                color: 'var(--muted)',
                lineHeight: 1.6,
              }}
            >
              {type === 'youtube' && '💡 Cole a URL completa do vídeo do YouTube'}
              {type === 'linkedin' && '💡 Cole a URL do post público do LinkedIn'}
              {type === 'twitter' && '💡 Cole a URL do tweet que deseja incorporar'}
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              onClick={handleInsert}
              disabled={!url}
              style={{
                ...btnSx('primary'),
                opacity: !url ? 0.6 : 1,
                cursor: !url ? 'not-allowed' : 'pointer',
              }}
            >
              Inserir
            </button>
            <button onClick={onClose} style={btnSx('secondary')}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
