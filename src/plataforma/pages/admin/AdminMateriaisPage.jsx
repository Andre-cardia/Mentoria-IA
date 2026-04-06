import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';

const inputSx = {
  width: '100%', background: 'var(--panel-2)',
  border: '1px solid var(--line-strong)', borderRadius: '4px',
  padding: '10px 14px', color: 'var(--text)',
  fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem', outline: 'none',
};

export default function AdminMateriaisPage() {
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({ title: '', description: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadMaterials(); }, []);

  async function loadMaterials() {
    const { data } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
    setMaterials(data ?? []);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file || !form.title.trim()) return;
    setUploading(true);

    try {
      const session = (await supabase.auth.getSession()).data.session;

      // 1. Obter presigned URL do servidor
      setUploadProgress('Gerando URL de upload...');
      const res = await fetch('/api/materials/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          title: form.title.trim(),
          description: form.description.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Falha ao obter URL de upload');
      const { uploadUrl } = await res.json();

      // 2. Upload direto para o S3
      setUploadProgress('Enviando arquivo para S3...');
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });

      if (!uploadRes.ok) throw new Error('Falha no upload para S3');

      setUploadProgress('Concluído!');
      setForm({ title: '', description: '' });
      setFile(null);
      setShowForm(false);
      await loadMaterials();
    } catch (err) {
      console.error('[AdminMateriais] Erro no upload:', err);
      setUploadProgress(`Erro: ${err.message}`);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(''), 3000);
    }
  }

  async function remove(id) {
    if (!confirm('Excluir este material?')) return;
    await supabase.from('materials').delete().eq('id', id);
    setMaterials((p) => p.filter((m) => m.id !== id));
  }

  function formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: '820px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>Admin</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Materiais</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '9px 20px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '4px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '.875rem', cursor: 'pointer' }}>
            + Upload Material
          </button>
        </div>

        {/* Form upload */}
        {showForm && (
          <form onSubmit={handleUpload} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '24px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Novo Material</div>
            <input style={inputSx} placeholder="Título do material" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
            <input style={inputSx} placeholder="Descrição (opcional)" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />

            {/* File input estilizado */}
            <div>
              <label style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Arquivo</label>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: 'var(--panel-2)', border: `1px solid ${file ? 'var(--accent)' : 'var(--line-strong)'}`,
                borderRadius: '4px', padding: '12px 16px', cursor: 'pointer',
              }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.75rem', color: 'var(--accent)', background: 'var(--accent-soft)', border: '1px solid rgba(255,106,0,.25)', borderRadius: '3px', padding: '3px 10px' }}>
                  Escolher
                </span>
                <span style={{ color: file ? 'var(--text)' : 'var(--muted)', fontSize: '.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file ? file.name : 'Nenhum arquivo selecionado'}
                </span>
                <input type="file" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0] ?? null)} required />
              </label>
            </div>

            {uploadProgress && (
              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '.8rem', color: uploadProgress.startsWith('Erro') ? '#f87171' : 'var(--green)' }}>
                {uploadProgress}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={uploading} style={{ padding: '9px 20px', background: uploading ? 'rgba(255,106,0,.5)' : 'var(--accent)', color: '#000', border: 'none', borderRadius: '4px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '.875rem', cursor: uploading ? 'not-allowed' : 'pointer' }}>
                {uploading ? 'Enviando...' : 'Enviar'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setFile(null); }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--line-strong)', borderRadius: '4px', color: 'var(--muted)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.875rem', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {materials.map((m) => (
            <div key={m.id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '36px', height: '36px', flexShrink: 0, background: 'var(--accent-soft)', border: '1px solid rgba(255,106,0,.25)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--accent)' }}>
                FILE
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{m.title}</div>
                {m.description && <div style={{ fontSize: '.85rem', color: 'var(--muted)' }}>{m.description}</div>}
              </div>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)', flexShrink: 0 }}>{formatSize(m.file_size)}</span>
              <button onClick={() => remove(m.id)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(248,113,113,.3)', borderRadius: '4px', color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.7rem', cursor: 'pointer', flexShrink: 0 }}>
                Excluir
              </button>
            </div>
          ))}
          {materials.length === 0 && <p style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.875rem' }}>Nenhum material cadastrado.</p>}
        </div>
      </div>
    </AdminLayout>
  );
}
