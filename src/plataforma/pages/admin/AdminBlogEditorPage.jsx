import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import slugify from 'slugify';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/AdminLayout';

const inputSx = {
  width: '100%', background: 'var(--panel-2)', border: '1px solid var(--line-strong)',
  borderRadius: '4px', padding: '10px 14px', color: 'var(--text)',
  fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem', outline: 'none',
  boxSizing: 'border-box',
};

const btnSx = (variant = 'primary') => ({
  border: 'none', borderRadius: '4px', padding: '10px 18px',
  fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '.9rem', cursor: 'pointer',
  background: variant === 'primary' ? 'var(--accent)' : 'var(--panel-2)',
  color: variant === 'primary' ? '#000' : 'var(--text)',
  border: variant === 'secondary' ? '1px solid var(--line-strong)' : 'none',
});

const toolbarBtnSx = (active = false) => ({
  background: active ? 'var(--accent-soft)' : 'transparent',
  border: active ? '1px solid var(--accent)' : '1px solid var(--line)',
  borderRadius: '3px', padding: '4px 8px', cursor: 'pointer',
  color: active ? 'var(--accent)' : 'var(--text)',
  fontFamily: 'Space Mono, monospace', fontSize: '.8rem',
  minWidth: '30px',
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
      const { uploadUrl, imageUrl } = await res.json();
      if (!uploadUrl) throw new Error('Sem URL de upload');
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      onInsert(imageUrl);
    } catch {
      toast.error('Falha no upload da imagem');
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
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
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

export default function AdminBlogEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '', slug: '', status: 'draft', visibility: 'public',
    published_at: '', seo_title: '', seo_description: '',
  });
  const [coverUrl, setCoverUrl] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [slugManual, setSlugManual] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Escreva seu artigo aqui...' }),
    ],
    content: '',
    editorProps: {
      attributes: {
        style: 'min-height:300px;outline:none;padding:16px;font-family:Space Grotesk,sans-serif;font-size:.95rem;line-height:1.8;color:var(--text)',
      },
    },
  });

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? '';
  }

  // Load tags
  useEffect(() => {
    supabase.from('tags').select('*').order('name').then(({ data }) => setAllTags(data ?? []));
  }, []);

  // Load post in edit mode
  useEffect(() => {
    if (!isEdit || !editor) return;
    async function loadPost() {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*, post_tags(tag_id)')
        .eq('id', id)
        .single();
      if (error || !data) { toast.error('Post não encontrado.'); navigate('/admin/blog'); return; }
      setForm({
        title: data.title ?? '',
        slug: data.slug ?? '',
        status: data.status ?? 'draft',
        visibility: data.visibility ?? 'public',
        published_at: data.published_at ? data.published_at.slice(0, 16) : '',
        seo_title: data.seo_title ?? '',
        seo_description: data.seo_description ?? '',
      });
      setCoverUrl(data.cover_url ?? '');
      setCoverPreview(data.cover_url ?? '');
      setSelectedTags(data.post_tags?.map((pt) => pt.tag_id) ?? []);
      if (data.content_json) editor.commands.setContent(data.content_json);
      setSlugManual(true);
      setLoading(false);
    }
    loadPost();
  }, [isEdit, id, editor]);

  // Auto-slug from title
  function handleTitleChange(e) {
    const title = e.target.value;
    setForm((f) => ({
      ...f,
      title,
      slug: slugManual ? f.slug : slugify(title, { lower: true, strict: true }),
    }));
  }

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Cover deve ter no máximo 5 MB'); return; }
    setUploadingCover(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/blog/image-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, type: 'cover' }),
      });
      const { uploadUrl, imageUrl } = await res.json();
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      setCoverUrl(imageUrl);
      setCoverPreview(imageUrl);
      toast.success('Cover carregado.');
    } catch {
      toast.error('Falha no upload do cover');
    } finally {
      setUploadingCover(false);
    }
  }

  function handleInsertImage(url) {
    editor?.chain().focus().setImage({ src: url }).run();
    setShowImageModal(false);
  }

  async function handleAddTag() {
    const name = newTagInput.trim();
    if (!name) return;
    const slug = slugify(name, { lower: true, strict: true });
    // Check if tag already exists
    const existing = allTags.find((t) => t.slug === slug);
    if (existing) {
      if (!selectedTags.includes(existing.id)) setSelectedTags((p) => [...p, existing.id]);
      setNewTagInput('');
      return;
    }
    const { data, error } = await supabase.from('tags').insert({ name, slug }).select().single();
    if (error) { toast.error('Erro ao criar tag'); return; }
    setAllTags((p) => [...p, data]);
    setSelectedTags((p) => [...p, data.id]);
    setNewTagInput('');
  }

  function toggleTag(tagId) {
    setSelectedTags((p) => p.includes(tagId) ? p.filter((t) => t !== tagId) : [...p, tagId]);
  }

  async function save(publishNow = false) {
    if (!form.title.trim()) { toast.error('Título obrigatório'); return; }
    if (!form.slug.trim()) { toast.error('Slug obrigatório'); return; }
    setSaving(true);
    try {
      const content_json = editor ? editor.getJSON() : null;
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        content_json,
        cover_url: coverUrl || null,
        author_id: user.id,
        author_name: user.user_metadata?.full_name ?? user.email,
        status: publishNow ? 'published' : form.status,
        visibility: form.visibility,
        published_at: publishNow ? new Date().toISOString() : (form.published_at || null),
        seo_title: form.seo_title.trim() || null,
        seo_description: form.seo_description.trim() || null,
      };

      let postId = id;
      if (isEdit) {
        const { error } = await supabase.from('posts').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('posts').insert(payload).select('id').single();
        if (error) throw error;
        postId = data.id;
      }

      // Sync tags
      await supabase.from('post_tags').delete().eq('post_id', postId);
      if (selectedTags.length > 0) {
        await supabase.from('post_tags').insert(selectedTags.map((tag_id) => ({ post_id: postId, tag_id })));
      }

      toast.success(publishNow ? 'Post publicado!' : 'Post salvo.');
      if (!isEdit) navigate(`/admin/blog/${postId}/editar`);
    } catch (err) {
      toast.error(err.message ?? 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '32px', color: 'var(--muted)', fontFamily: 'Space Grotesk, sans-serif' }}>
          Carregando post...
        </div>
      </AdminLayout>
    );
  }

  const needsDate = form.status === 'scheduled' || form.status === 'published';

  return (
    <AdminLayout>
      {showImageModal && (
        <ImageModal
          onClose={() => setShowImageModal(false)}
          onInsert={handleInsertImage}
          getToken={getToken}
        />
      )}

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.5rem', color: 'var(--text)' }}>
            {isEdit ? 'Editar post' : 'Novo post'}
          </h1>
          <button onClick={() => navigate('/admin/blog')} style={{ ...btnSx('secondary'), padding: '8px 14px', fontSize: '.85rem' }}>
            ← Voltar
          </button>
        </div>

        {/* Cover */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', color: 'var(--muted)', marginBottom: '8px' }}>
            Imagem de capa
          </label>
          {coverPreview && (
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <img src={coverPreview} alt="cover" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--line)' }} />
              <button
                type="button"
                onClick={() => { setCoverUrl(''); setCoverPreview(''); }}
                style={{
                  position: 'absolute', top: '8px', right: '8px',
                  background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none',
                  borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '.8rem',
                }}
              >
                Remover
              </button>
            </div>
          )}
          <input
            type="file" accept="image/jpeg,image/png,image/webp"
            onChange={handleCoverUpload} disabled={uploadingCover}
            style={{ color: 'var(--text)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem' }}
          />
          {uploadingCover && <span style={{ color: 'var(--muted)', fontSize: '.8rem', marginLeft: '10px' }}>Enviando...</span>}
        </div>

        {/* Title + Slug */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', color: 'var(--muted)', marginBottom: '6px' }}>
            Título *
          </label>
          <input type="text" value={form.title} onChange={handleTitleChange} style={inputSx} placeholder="Título do post" />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', color: 'var(--muted)', marginBottom: '6px' }}>
            Slug *
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => { setSlugManual(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
            style={inputSx}
            placeholder="url-do-post"
          />
        </div>

        {/* Status / Visibility / Date row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', color: 'var(--muted)', marginBottom: '6px' }}>Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={{ ...inputSx, cursor: 'pointer' }}>
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
              <option value="scheduled">Agendado</option>
              <option value="archived">Arquivado</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', color: 'var(--muted)', marginBottom: '6px' }}>Visibilidade</label>
            <select value={form.visibility} onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))} style={{ ...inputSx, cursor: 'pointer' }}>
              <option value="public">Público</option>
              <option value="private">Privado</option>
            </select>
          </div>
          {needsDate && (
            <div>
              <label style={{ display: 'block', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', color: 'var(--muted)', marginBottom: '6px' }}>Data de publicação</label>
              <input
                type="datetime-local"
                value={form.published_at}
                onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value }))}
                style={inputSx}
              />
            </div>
          )}
        </div>

        {/* Tags */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', color: 'var(--muted)', marginBottom: '8px' }}>Tags</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {allTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                style={{
                  background: selectedTags.includes(tag.id) ? 'var(--accent)' : 'var(--panel-2)',
                  color: selectedTags.includes(tag.id) ? '#000' : 'var(--text)',
                  border: '1px solid var(--line-strong)', borderRadius: '20px',
                  padding: '4px 12px', cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: '.82rem',
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text" value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Nova tag (Enter para adicionar)"
              style={{ ...inputSx, maxWidth: '260px' }}
            />
            <button type="button" onClick={handleAddTag} style={btnSx('secondary')}>Adicionar</button>
          </div>
        </div>

        {/* SEO */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', color: 'var(--muted)', marginBottom: '6px' }}>
            SEO Title <span style={{ color: 'var(--line-strong)' }}>({form.seo_title.length}/60)</span>
          </label>
          <input
            type="text" maxLength={60} value={form.seo_title}
            onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
            style={inputSx} placeholder="Título para SEO (opcional)"
          />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', color: 'var(--muted)', marginBottom: '6px' }}>
            SEO Description <span style={{ color: 'var(--line-strong)' }}>({form.seo_description.length}/160)</span>
          </label>
          <textarea
            maxLength={160} rows={3} value={form.seo_description}
            onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))}
            style={{ ...inputSx, resize: 'vertical' }} placeholder="Descrição para SEO e cards (opcional)"
          />
        </div>

        {/* Tiptap Editor */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', color: 'var(--muted)', marginBottom: '8px' }}>
            Conteúdo
          </label>

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
            background: 'var(--panel-2)', minHeight: '320px',
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

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => save(false)} disabled={saving} style={{ ...btnSx('secondary'), opacity: saving ? .6 : 1 }}>
            {saving ? 'Salvando...' : 'Salvar rascunho'}
          </button>
          <button onClick={() => save(true)} disabled={saving} style={{ ...btnSx('primary'), opacity: saving ? .6 : 1 }}>
            {saving ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
