import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';

const inputSx = {
  width: '100%', background: 'var(--panel-2)',
  border: '1px solid var(--line-strong)', borderRadius: '4px',
  padding: '10px 14px', color: 'var(--text)',
  fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem', outline: 'none',
};

const btnPrimary = {
  padding: '9px 20px', background: 'var(--accent)', color: '#000',
  border: 'none', borderRadius: '4px',
  fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '.875rem', cursor: 'pointer',
};

const btnOutline = {
  padding: '8px 16px', background: 'transparent',
  border: '1px solid var(--line-strong)', borderRadius: '4px', color: 'var(--muted)',
  fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', cursor: 'pointer',
};

const btnDanger = {
  padding: '6px 12px', background: 'transparent',
  border: '1px solid rgba(248,113,113,.3)', borderRadius: '4px', color: '#f87171',
  fontFamily: 'Space Mono, monospace', fontSize: '.7rem', cursor: 'pointer',
};

export default function AdminModulosPage() {
  const [modules, setModules] = useState([]);
  const [openModule, setOpenModule] = useState(null);
  const [lessons, setLessons] = useState({});
  const [loading, setLoading] = useState(true);

  // Forms
  const [modForm, setModForm] = useState({ title: '', description: '', order: '' });
  const [lessonForm, setLessonForm] = useState({ title: '', video_url: '', duration: '', order: '' });
  const [editingMod, setEditingMod] = useState(null);
  const [showModForm, setShowModForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadModules(); }, []);

  async function loadModules() {
    const { data } = await supabase.from('modules').select('*').order('order');
    setModules(data ?? []);
    setLoading(false);
  }

  async function loadLessons(moduleId) {
    if (lessons[moduleId]) return;
    const { data } = await supabase.from('lessons').select('*').eq('module_id', moduleId).order('order');
    setLessons((p) => ({ ...p, [moduleId]: data ?? [] }));
  }

  async function toggleModule(id) {
    if (openModule === id) { setOpenModule(null); return; }
    setOpenModule(id);
    await loadLessons(id);
  }

  async function saveMod(e) {
    e.preventDefault();
    setSaving(true);
    const payload = { title: modForm.title, description: modForm.description || null, order: Number(modForm.order) || 0 };
    if (editingMod) {
      await supabase.from('modules').update(payload).eq('id', editingMod);
    } else {
      await supabase.from('modules').insert(payload);
    }
    setModForm({ title: '', description: '', order: '' });
    setEditingMod(null); setShowModForm(false);
    await loadModules();
    setSaving(false);
  }

  async function deleteMod(id) {
    if (!confirm('Excluir módulo e todas as aulas?')) return;
    await supabase.from('modules').delete().eq('id', id);
    setModules((p) => p.filter((m) => m.id !== id));
    if (openModule === id) setOpenModule(null);
  }

  function editMod(mod) {
    setModForm({ title: mod.title, description: mod.description ?? '', order: String(mod.order) });
    setEditingMod(mod.id); setShowModForm(true);
  }

  async function saveLesson(e, moduleId) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      module_id: moduleId,
      title: lessonForm.title,
      video_url: lessonForm.video_url || null,
      duration: lessonForm.duration ? Number(lessonForm.duration) : null,
      order: Number(lessonForm.order) || 0,
    };
    await supabase.from('lessons').insert(payload);
    setLessonForm({ title: '', video_url: '', duration: '', order: '' });
    setShowLessonForm(null);
    const { data } = await supabase.from('lessons').select('*').eq('module_id', moduleId).order('order');
    setLessons((p) => ({ ...p, [moduleId]: data ?? [] }));
    setSaving(false);
  }

  async function deleteLesson(lessonId, moduleId) {
    if (!confirm('Excluir esta aula?')) return;
    await supabase.from('lessons').delete().eq('id', lessonId);
    setLessons((p) => ({ ...p, [moduleId]: p[moduleId].filter((l) => l.id !== lessonId) }));
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: '820px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>Admin</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Módulos & Aulas</h1>
          </div>
          <button style={btnPrimary} onClick={() => { setEditingMod(null); setModForm({ title: '', description: '', order: '' }); setShowModForm(true); }}>
            + Novo Módulo
          </button>
        </div>

        {/* Form módulo */}
        {showModForm && (
          <form onSubmit={saveMod} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '24px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
              {editingMod ? 'Editar Módulo' : 'Novo Módulo'}
            </div>
            <input style={inputSx} placeholder="Título do módulo" value={modForm.title} onChange={(e) => setModForm((p) => ({ ...p, title: e.target.value }))} required />
            <input style={inputSx} placeholder="Descrição (opcional)" value={modForm.description} onChange={(e) => setModForm((p) => ({ ...p, description: e.target.value }))} />
            <input style={{ ...inputSx, width: '120px' }} placeholder="Ordem" type="number" value={modForm.order} onChange={(e) => setModForm((p) => ({ ...p, order: e.target.value }))} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={btnPrimary} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              <button type="button" style={btnOutline} onClick={() => { setShowModForm(false); setEditingMod(null); }}>Cancelar</button>
            </div>
          </form>
        )}

        {loading && <p style={{ color: 'var(--muted)' }}>Carregando...</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {modules.map((mod) => (
            <div key={mod.id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: '12px' }}>
                <button onClick={() => toggleModule(mod.id)} style={{ flex: 1, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--text)', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '1rem' }}>
                  <span style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.75rem', marginRight: '10px' }}>#{mod.order}</span>
                  {mod.title}
                  <span style={{ marginLeft: '12px', color: 'var(--accent)', fontSize: '.85rem' }}>{openModule === mod.id ? '▲' : '▼'}</span>
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={btnOutline} onClick={() => editMod(mod)}>Editar</button>
                  <button style={btnDanger} onClick={() => deleteMod(mod.id)}>Excluir</button>
                </div>
              </div>

              {/* Aulas */}
              {openModule === mod.id && (
                <div style={{ borderTop: '1px solid var(--line)' }}>
                  {(lessons[mod.id] ?? []).map((lesson) => (
                    <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 20px 12px 36px', borderBottom: '1px solid var(--line)' }}>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)', minWidth: '24px' }}>#{lesson.order}</span>
                      <span style={{ flex: 1, fontSize: '.9rem', color: 'var(--text)' }}>{lesson.title}</span>
                      {lesson.duration && <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)' }}>{Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}</span>}
                      <button style={btnDanger} onClick={() => deleteLesson(lesson.id, mod.id)}>Excluir</button>
                    </div>
                  ))}

                  {/* Form nova aula */}
                  {showLessonForm === mod.id ? (
                    <form onSubmit={(e) => saveLesson(e, mod.id)} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--line)', background: 'rgba(255,255,255,.02)' }}>
                      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Nova Aula</div>
                      <input style={inputSx} placeholder="Título da aula" value={lessonForm.title} onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))} required />
                      <input style={inputSx} placeholder="URL do vídeo (opcional)" value={lessonForm.video_url} onChange={(e) => setLessonForm((p) => ({ ...p, video_url: e.target.value }))} />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input style={{ ...inputSx, width: '160px' }} placeholder="Duração (segundos)" type="number" value={lessonForm.duration} onChange={(e) => setLessonForm((p) => ({ ...p, duration: e.target.value }))} />
                        <input style={{ ...inputSx, width: '100px' }} placeholder="Ordem" type="number" value={lessonForm.order} onChange={(e) => setLessonForm((p) => ({ ...p, order: e.target.value }))} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="submit" style={btnPrimary} disabled={saving}>{saving ? 'Salvando...' : 'Adicionar Aula'}</button>
                        <button type="button" style={btnOutline} onClick={() => setShowLessonForm(null)}>Cancelar</button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ padding: '12px 20px' }}>
                      <button style={btnOutline} onClick={() => { setLessonForm({ title: '', video_url: '', duration: '', order: '' }); setShowLessonForm(mod.id); }}>
                        + Adicionar Aula
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
