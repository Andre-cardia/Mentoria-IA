import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';

const inputSx = {
  width: '100%', background: 'var(--panel-2)',
  border: '1px solid var(--line-strong)', borderRadius: '4px',
  padding: '10px 14px', color: 'var(--text)',
  fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem', outline: 'none',
};

export default function AdminAulasPage() {
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [form, setForm] = useState({ title: '', lesson_type: 'video', video_url: '', content: '', duration: '', order: '' });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    supabase.from('modules').select('id, title').order('order').then(({ data }) => setModules(data ?? []));
  }, []);

  useEffect(() => {
    if (!selectedModule) { setLessons([]); return; }
    supabase.from('lessons').select('*').eq('module_id', selectedModule).order('order')
      .then(({ data }) => setLessons(data ?? []));
  }, [selectedModule]);

  async function save(e) {
    e.preventDefault();
    if (!selectedModule) return;
    setSaving(true);
    const payload = {
      module_id: selectedModule,
      title: form.title,
      lesson_type: form.lesson_type,
      video_url: form.lesson_type === 'video' ? (form.video_url || null) : null,
      content: ['text', 'activity'].includes(form.lesson_type) ? (form.content || null) : null,
      duration: form.duration ? Number(form.duration) : null,
      order: Number(form.order) || 0,
    };
    if (editing) {
      await supabase.from('lessons').update(payload).eq('id', editing);
      setLessons((p) => p.map((l) => l.id === editing ? { ...l, ...payload } : l));
    } else {
      const { data } = await supabase.from('lessons').insert(payload).select().single();
      if (data) setLessons((p) => [...p, data].sort((a, b) => a.order - b.order));
    }
    setForm({ title: '', lesson_type: 'video', video_url: '', content: '', duration: '', order: '' });
    setEditing(null); setShowForm(false); setSaving(false);
  }

  async function remove(id) {
    if (!confirm('Excluir esta aula?')) return;
    await supabase.from('lessons').delete().eq('id', id);
    setLessons((p) => p.filter((l) => l.id !== id));
  }

  function startEdit(lesson) {
    setForm({
      title: lesson.title,
      lesson_type: lesson.lesson_type ?? 'video',
      video_url: lesson.video_url ?? '',
      content: lesson.content ?? '',
      duration: lesson.duration ? String(lesson.duration) : '',
      order: String(lesson.order),
    });
    setEditing(lesson.id); setShowForm(true);
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: '820px' }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>Admin</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '28px' }}>Aulas</h1>

        {/* Seletor de módulo */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Módulo</label>
          <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)}
            style={{ ...inputSx, width: '340px', cursor: 'pointer' }}>
            <option value="">Selecione um módulo...</option>
            {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>

        {selectedModule && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={() => { setEditing(null); setForm({ title: '', lesson_type: 'video', video_url: '', content: '', duration: '', order: '' }); setShowForm(true); }}
                style={{ padding: '9px 20px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '4px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '.875rem', cursor: 'pointer' }}>
                + Nova Aula
              </button>
            </div>

            {showForm && (
              <form onSubmit={save} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '24px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>{editing ? 'Editar Aula' : 'Nova Aula'}</div>

                <input style={inputSx} placeholder="Título da aula" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />

                {/* Seletor de tipo */}
                <div>
                  <label style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Tipo de aula</label>
                  <select
                    value={form.lesson_type}
                    onChange={(e) => setForm((p) => ({ ...p, lesson_type: e.target.value }))}
                    style={{ ...inputSx, cursor: 'pointer' }}
                  >
                    <option value="video">Vídeo</option>
                    <option value="text">Texto / Leitura</option>
                    <option value="activity">Atividade</option>
                    <option value="quiz">Quiz</option>
                  </select>
                </div>

                {/* Campo condicional: URL do vídeo */}
                {form.lesson_type === 'video' && (
                  <input
                    style={inputSx}
                    placeholder="URL do vídeo (YouTube ou Vimeo)"
                    value={form.video_url}
                    onChange={(e) => setForm((p) => ({ ...p, video_url: e.target.value }))}
                  />
                )}

                {/* Campo condicional: conteúdo texto/atividade */}
                {(form.lesson_type === 'text' || form.lesson_type === 'activity') && (
                  <textarea
                    style={{ ...inputSx, minHeight: '140px', resize: 'vertical', lineHeight: '1.6' }}
                    placeholder={form.lesson_type === 'activity' ? 'Instruções da atividade...' : 'Conteúdo da aula (texto ou markdown)...'}
                    value={form.content}
                    onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                    required
                  />
                )}

                {form.lesson_type === 'quiz' && (
                  <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)', margin: 0 }}>
                    Quiz Builder disponível após salvar a aula (Story 3.2).
                  </p>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <input style={{ ...inputSx, flex: 1 }} placeholder="Duração em segundos" type="number" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} />
                  <input style={{ ...inputSx, width: '120px' }} placeholder="Ordem" type="number" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))} />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" disabled={saving} style={{ padding: '9px 20px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '4px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '.875rem', cursor: 'pointer' }}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--line-strong)', borderRadius: '4px', color: 'var(--muted)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.875rem', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {lessons.map((lesson) => (
                <div key={lesson.id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)', minWidth: '28px' }}>#{lesson.order}</span>
                  <span style={{ flex: 1, fontWeight: 500, color: 'var(--text)' }}>{lesson.title}</span>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.6rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--accent)', background: 'rgba(255,106,0,.08)', border: '1px solid rgba(255,106,0,.2)', borderRadius: '3px', padding: '2px 7px' }}>
                    {lesson.lesson_type ?? 'video'}
                  </span>
                  {lesson.duration && <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)' }}>{Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}</span>}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => startEdit(lesson)} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--line-strong)', borderRadius: '4px', color: 'var(--muted)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.8rem', cursor: 'pointer' }}>Editar</button>
                    <button onClick={() => remove(lesson.id)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(248,113,113,.3)', borderRadius: '4px', color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.7rem', cursor: 'pointer' }}>Excluir</button>
                  </div>
                </div>
              ))}
              {lessons.length === 0 && <p style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.875rem' }}>Nenhuma aula neste módulo.</p>}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
