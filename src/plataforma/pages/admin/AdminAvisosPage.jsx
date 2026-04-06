import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';

const inputSx = {
  width: '100%', background: 'var(--panel-2)',
  border: '1px solid var(--line-strong)', borderRadius: '4px',
  padding: '10px 14px', color: 'var(--text)',
  fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem', outline: 'none',
};

export default function AdminAvisosPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', published_at: '' });
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('announcements').select('*').order('published_at', { ascending: false });
    setAnnouncements(data ?? []);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      published_at: form.published_at || new Date().toISOString(),
    };
    if (editing) {
      await supabase.from('announcements').update(payload).eq('id', editing);
      setAnnouncements((p) => p.map((a) => a.id === editing ? { ...a, ...payload } : a));
    } else {
      const { data } = await supabase.from('announcements').insert(payload).select().single();
      if (data) setAnnouncements((p) => [data, ...p]);
    }
    setForm({ title: '', body: '', published_at: '' });
    setEditing(null); setShowForm(false); setSaving(false);
  }

  async function remove(id) {
    if (!confirm('Excluir este aviso?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    setAnnouncements((p) => p.filter((a) => a.id !== id));
  }

  function startEdit(a) {
    setForm({
      title: a.title,
      body: a.body,
      published_at: a.published_at ? a.published_at.slice(0, 16) : '',
    });
    setEditing(a.id); setShowForm(true);
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: '820px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>Admin</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Avisos</h1>
          </div>
          <button onClick={() => { setEditing(null); setForm({ title: '', body: '', published_at: '' }); setShowForm(true); }}
            style={{ padding: '9px 20px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '4px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '.875rem', cursor: 'pointer' }}>
            + Novo Aviso
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={save} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '24px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>{editing ? 'Editar Aviso' : 'Novo Aviso'}</div>
            <input style={inputSx} placeholder="Título do aviso" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
            <textarea style={{ ...inputSx, resize: 'vertical' }} rows={5} placeholder="Conteúdo do aviso..." value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} required />
            <div>
              <label style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Data de publicação (opcional)</label>
              <input type="datetime-local" style={{ ...inputSx, width: '280px' }} value={form.published_at} onChange={(e) => setForm((p) => ({ ...p, published_at: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={saving} style={{ padding: '9px 20px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '4px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '.875rem', cursor: 'pointer' }}>
                {saving ? 'Salvando...' : 'Publicar'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--line-strong)', borderRadius: '4px', color: 'var(--muted)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.875rem', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {announcements.map((a) => (
            <div key={a.id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{a.title}</div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)' }}>{formatDate(a.published_at)}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => startEdit(a)} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--line-strong)', borderRadius: '4px', color: 'var(--muted)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.8rem', cursor: 'pointer' }}>Editar</button>
                  <button onClick={() => remove(a.id)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(248,113,113,.3)', borderRadius: '4px', color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.7rem', cursor: 'pointer' }}>Excluir</button>
                </div>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{a.body}</p>
            </div>
          ))}
          {announcements.length === 0 && <p style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.875rem' }}>Nenhum aviso publicado.</p>}
        </div>
      </div>
    </AdminLayout>
  );
}
