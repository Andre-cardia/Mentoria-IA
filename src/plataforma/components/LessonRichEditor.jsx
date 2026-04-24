import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { toast } from 'sonner';

const toolbarBtnSx = (active = false) => ({
  background: active ? 'var(--accent-soft)' : 'transparent',
  border: active ? '1px solid var(--accent)' : '1px solid var(--line)',
  borderRadius: '3px', padding: '4px 8px', cursor: 'pointer',
  color: active ? 'var(--accent)' : 'var(--text)',
  fontFamily: 'Space Mono, monospace', fontSize: '.8rem',
  minWidth: '30px',
});

const btnSx = (variant = 'primary') => ({
  border: variant === 'secondary' ? '1px solid var(--line-strong)' : 'none',
  borderRadius: '4px', padding: '10px 18px',
  fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '.9rem', cursor: 'pointer',
  background: variant === 'primary' ? 'var(--accent)' : 'var(--panel-2)',
  color: variant === 'primary' ? '#000' : 'var(--text)',
});

const inputSx = {
  width: '100%', background: 'var(--panel-2)', border: '1px solid var(--line-strong)',
  borderRadius: '4px', padding: '10px 14px', color: 'var(--text)',
  fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem', outline: 'none',
  boxSizing: 'border-box',
};

function ToolbarButton({ active, onClick, children, title }) {
  return (
    <button type="button" onClick={onClick} title={title} style={toolbarBtnSx(active)}>
      {children}
    </button>
  );
}

function ImageModal({ onClose, onInsert, getToken }) {
  const [tab, setTab] = useState('upload');
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 5 MB'); return; }
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/blog/image-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, type: 'image' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const { uploadUrl, imageUrl } = await res.json();
      const putRes = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!putRes.ok) throw new Error('Falha no envio para S3');
      onInsert(imageUrl);
    } catch (err) {
      toast.error(`Falha no upload: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleUrl() {
    if (!url.startsWith('http')) { toast.error('URL deve começar com http'); return; }
    onInsert(url);
  }

  const tabBtnSx = (active) => ({
    padding: '6px 14px', background: active ? 'var(--accent-soft)' : 'transparent',
    border: 'none', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem', cursor: 'pointer',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: '8px',
        padding: '24px', width: '420px', maxWidth: '90vw',
      }}>
        <h3 style={{ margin: '0 0 16px', fontFamily: 'Space Grotesk, sans-serif', color: 'var(--text)', fontSize: '1rem' }}>
          Inserir imagem
        </h3>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: '16px' }}>
          <button style={tabBtnSx(tab === 'upload')} onClick={() => setTab('upload')}>Upload</button>
          <button style={tabBtnSx(tab === 'url')} onClick={() => setTab('url')}>URL externa</button>
        </div>
        {tab === 'upload' ? (
          <div>
            <input
              type="file" accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ marginBottom: '12px', color: 'var(--text)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem' }}
            />
            <button onClick={handleUpload} disabled={!file || loading} style={{ ...btnSx('primary'), opacity: !file || loading ? .6 : 1 }}>
              {loading ? 'Enviando...' : 'Confirmar'}
            </button>
          </div>
        ) : (
          <div>
            <input
              type="text" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)}
              style={{ ...inputSx, marginBottom: '12px' }}
            />
            <button onClick={handleUrl} disabled={!url} style={{ ...btnSx('primary'), opacity: !url ? .6 : 1 }}>
              Confirmar
            </button>
          </div>
        )}
        <button onClick={onClose} style={{ ...btnSx('secondary'), marginTop: '12px', marginLeft: '8px' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function LessonRichEditor({ value = '', onChange, placeholder = 'Conteúdo da aula...', getToken }) {
  const [showImageModal, setShowImageModal] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      Image,
      Placeholder.configure({ placeholder }),
    ],
    content: '',
    editorProps: {
      attributes: {
        style: 'min-height:200px;outline:none;padding:16px;font-family:Space Grotesk,sans-serif;font-size:.95rem;line-height:1.8;color:var(--text)',
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
  });

  // Inicializa conteúdo quando o editor monta ou value muda de vazio para preenchido
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, false);
    } else if (!value && current !== '<p></p>') {
      editor.commands.clearContent();
    }
  }, [editor, value]);

  function handleInsertImage(url) {
    editor?.chain().focus().setImage({ src: url }).run();
    setShowImageModal(false);
  }

  return (
    <div>
      {showImageModal && (
        <ImageModal
          onClose={() => setShowImageModal(false)}
          onInsert={handleInsertImage}
          getToken={getToken}
        />
      )}

      {/* Toolbar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px',
        background: 'var(--bg)', border: '1px solid var(--line)', borderBottom: 'none',
        borderRadius: '4px 4px 0 0',
      }}>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Negrito">B</ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Itálico"><em>I</em></ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive('heading', { level: 1 })} title="H1">H1</ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="H2">H2</ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="H3">H3</ToolbarButton>
        <span style={{ width: '1px', background: 'var(--line)', margin: '0 4px', alignSelf: 'stretch' }} />
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Lista">• —</ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Lista numerada">1.</ToolbarButton>
        <span style={{ width: '1px', background: 'var(--line)', margin: '0 4px', alignSelf: 'stretch' }} />
        <ToolbarButton
          onClick={() => {
            const href = window.prompt('URL do link:');
            if (href) editor?.chain().focus().setLink({ href }).run();
          }}
          active={editor?.isActive('link')} title="Link"
        >🔗</ToolbarButton>
        <ToolbarButton onClick={() => setShowImageModal(true)} title="Imagem">🖼</ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="Citação">" "</ToolbarButton>
      </div>

      {/* Editor area */}
      <div style={{
        border: '1px solid var(--line)', borderRadius: '0 0 4px 4px',
        background: 'var(--panel-2)', minHeight: '200px',
      }}>
        <style>{`
          .tiptap p.is-editor-empty:first-child::before {
            color: var(--muted); content: attr(data-placeholder); float: left; height: 0; pointer-events: none;
          }
          .tiptap h1 { font-size: 1.8rem; margin: 1em 0 .5em; }
          .tiptap h2 { font-size: 1.4rem; margin: 1em 0 .5em; }
          .tiptap h3 { font-size: 1.1rem; margin: 1em 0 .4em; }
          .tiptap ul, .tiptap ol { padding-left: 1.5em; margin: .5em 0; }
          .tiptap blockquote { border-left: 3px solid var(--accent); padding-left: 1em; color: var(--muted); margin: 1em 0; }
          .tiptap img { max-width: 100%; border-radius: 4px; margin: .5em 0; }
          .tiptap a { color: var(--accent); }
        `}</style>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
