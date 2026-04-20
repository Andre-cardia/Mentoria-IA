import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState } from 'react';
import { Iframe } from './extensions/Iframe';
import EmbedModal from './EmbedModal';
import './RichTextEditor.css';

const toolbarBtnSx = (active = false) => ({
  background: active ? 'var(--accent-soft)' : 'transparent',
  border: active ? '1px solid var(--accent)' : '1px solid var(--line)',
  borderRadius: '3px',
  padding: '6px 10px',
  cursor: 'pointer',
  color: active ? 'var(--accent)' : 'var(--text)',
  fontFamily: 'Space Mono, monospace',
  fontSize: '.75rem',
  minWidth: '32px',
  transition: 'all 0.2s',
});

function ToolbarButton({ active, onClick, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={toolbarBtnSx(active)}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Digite aqui...',
  minHeight = '200px'
}) {
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({ placeholder }),
      Iframe,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        style: `min-height:${minHeight};outline:none;padding:16px;font-family:Space Grotesk,sans-serif;font-size:.9rem;line-height:1.7;color:var(--text)`,
      },
    },
  });

  function handleInsertEmbed(embedConfig) {
    if (editor) {
      editor.chain().focus().setIframe(embedConfig).run();
    }
  }

  // Sincronizar conteúdo externo com o editor
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div style={{
      border: '1px solid var(--line-strong)',
      borderRadius: '4px',
      background: 'var(--panel-2)',
      overflow: 'hidden',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '8px',
        borderBottom: '1px solid var(--line)',
        background: 'rgba(0,0,0,.1)',
        flexWrap: 'wrap',
      }}>
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Negrito (Ctrl+B)"
        >
          <strong>B</strong>
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Itálico (Ctrl+I)"
        >
          <em>I</em>
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Riscado"
        >
          <s>S</s>
        </ToolbarButton>

        <div style={{ width: '1px', background: 'var(--line)', margin: '0 4px' }} />

        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Título 2"
        >
          H2
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Título 3"
        >
          H3
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive('paragraph')}
          onClick={() => editor.chain().focus().setParagraph().run()}
          title="Parágrafo"
        >
          P
        </ToolbarButton>

        <div style={{ width: '1px', background: 'var(--line)', margin: '0 4px' }} />

        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Lista com marcadores"
        >
          •
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Lista numerada"
        >
          1.
        </ToolbarButton>

        <ToolbarButton
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Citação"
        >
          "
        </ToolbarButton>

        <div style={{ width: '1px', background: 'var(--line)', margin: '0 4px' }} />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Desfazer (Ctrl+Z)"
        >
          ↶
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Refazer (Ctrl+Shift+Z)"
        >
          ↷
        </ToolbarButton>

        <div style={{ width: '1px', background: 'var(--line)', margin: '0 4px' }} />

        <ToolbarButton
          onClick={() => setShowEmbedModal(true)}
          title="Incorporar YouTube, LinkedIn ou X (Twitter)"
        >
          🎬
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Embed Modal */}
      {showEmbedModal && (
        <EmbedModal
          onClose={() => setShowEmbedModal(false)}
          onInsert={handleInsertEmbed}
        />
      )}
    </div>
  );
}
