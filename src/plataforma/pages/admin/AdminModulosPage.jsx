import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '../../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';
import ConfirmModal from '../../components/ConfirmModal';

// ─── Estilos base ────────────────────────────────────────────────────────────

const inputSx = {
  width: '100%', background: 'var(--panel-2)',
  border: '1px solid var(--line-strong)', borderRadius: '4px',
  padding: '10px 14px', color: 'var(--text)',
  fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem', outline: 'none',
  boxSizing: 'border-box',
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

const EMPTY_MOD = { title: '', description: '' };
const EMPTY_LESSON = { title: '', video_url: '', duration: '' };

// ─── Utilitários DnD ────────────────────────────────────────────────────────

async function persistModuleOrder(modules) {
  const updates = modules.map((m, i) =>
    supabase.from('modules').update({ order: i }).eq('id', m.id)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed) throw failed.error;
}

async function persistLessonOrder(lessons) {
  const updates = lessons.map((l, i) =>
    supabase.from('lessons').update({ order: i }).eq('id', l.id)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed) throw failed.error;
}

// ─── Componente: Handle de drag ──────────────────────────────────────────────

function DragHandle({ listeners, attributes, isDragging }) {
  return (
    <span
      {...listeners}
      {...attributes}
      title="Arrastar para reordenar"
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        color: 'var(--muted)',
        fontSize: '1rem',
        lineHeight: 1,
        padding: '0 6px',
        userSelect: 'none',
        touchAction: 'none',
        flexShrink: 0,
      }}
    >
      ⠿
    </span>
  );
}

// ─── Componente: Item sortável de módulo ─────────────────────────────────────

function SortableModuleItem({ mod, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mod.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    background: 'var(--panel)',
    border: isDragging ? '1px solid var(--accent)' : '1px solid var(--line)',
    borderRadius: '6px',
    overflow: 'hidden',
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ dragHandle: <DragHandle listeners={listeners} attributes={attributes} isDragging={isDragging} /> })}
    </div>
  );
}

// ─── Componente: Item sortável de aula ──────────────────────────────────────

function SortableLessonItem({ lesson, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    borderBottom: '1px solid var(--line)',
    background: isDragging ? 'var(--panel-2)' : 'transparent',
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ dragHandle: <DragHandle listeners={listeners} attributes={attributes} isDragging={isDragging} /> })}
    </div>
  );
}

// ─── Componente Principal ────────────────────────────────────────────────────

export default function AdminModulosPage() {
  const [modules, setModules] = useState([]);
  const [openModule, setOpenModule] = useState(null);
  const [lessons, setLessons] = useState({});
  const [loading, setLoading] = useState(true);

  // Estado do form de módulo inline
  const [editingModId, setEditingModId] = useState(null);
  const [modForm, setModForm] = useState(EMPTY_MOD);

  // Estado da form de nova aula
  const [showLessonForm, setShowLessonForm] = useState(null);
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON);

  // Estado de edição inline de aula
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [lessonEditForm, setLessonEditForm] = useState(EMPTY_LESSON);

  const [saving, setSaving] = useState(false);

  // Modal de confirmação
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Sensores dnd-kit — distância mínima de 5px evita cliques acidentais
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => { loadModules(); }, []);

  // ── Módulos ──────────────────────────────────────────────────────────────

  async function loadModules() {
    const { data } = await supabase.from('modules').select('*').order('order');
    setModules(data ?? []);
    setLoading(false);
  }

  async function toggleModule(id) {
    if (openModule === id) { setOpenModule(null); return; }
    setOpenModule(id);
    if (!lessons[id]) await loadLessons(id);
  }

  async function loadLessons(moduleId) {
    const { data } = await supabase.from('lessons').select('*').eq('module_id', moduleId).order('order');
    setLessons((p) => ({ ...p, [moduleId]: data ?? [] }));
  }

  function startNewMod() {
    setModForm(EMPTY_MOD);
    setEditingModId('new');
  }

  function startEditMod(mod) {
    setModForm({ title: mod.title, description: mod.description ?? '' });
    setEditingModId(mod.id);
    if (openModule !== mod.id) toggleModule(mod.id);
  }

  function cancelModForm() {
    setEditingModId(null);
    setModForm(EMPTY_MOD);
  }

  async function saveMod(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingModId === 'new') {
        const { error } = await supabase.from('modules').insert({
          title: modForm.title,
          description: modForm.description || null,
          order: modules.length,
        });
        if (error) throw error;
        toast.success('Módulo criado com sucesso');
      } else {
        const { error } = await supabase.from('modules').update({
          title: modForm.title,
          description: modForm.description || null,
        }).eq('id', editingModId);
        if (error) throw error;
        toast.success('Módulo atualizado');
      }
      cancelModForm();
      await loadModules();
    } catch {
      toast.error('Erro ao salvar módulo');
    } finally {
      setSaving(false);
    }
  }

  function confirmDeleteMod(mod) {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir módulo',
      message: `Excluir "${mod.title}" e todas as suas aulas? Esta ação não pode ser desfeita.`,
      onConfirm: () => deleteMod(mod.id),
    });
  }

  async function deleteMod(id) {
    closeConfirm();
    try {
      const { error } = await supabase.from('modules').delete().eq('id', id);
      if (error) throw error;
      setModules((p) => p.filter((m) => m.id !== id));
      if (openModule === id) setOpenModule(null);
      toast.success('Módulo excluído');
    } catch {
      toast.error('Erro ao excluir módulo');
    }
  }

  // ── Drag módulos ─────────────────────────────────────────────────────────

  async function handleModuleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = modules.findIndex((m) => m.id === active.id);
    const newIndex = modules.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(modules, oldIndex, newIndex);

    // Optimistic update
    setModules(reordered);

    try {
      await persistModuleOrder(reordered);
      toast.success('Ordem dos módulos salva');
    } catch {
      // Reverter
      setModules(modules);
      toast.error('Erro ao salvar ordem — revertido');
    }
  }

  // ── Aulas ────────────────────────────────────────────────────────────────

  async function saveLesson(e, moduleId) {
    e.preventDefault();
    setSaving(true);
    try {
      const currentLessons = lessons[moduleId] ?? [];
      const { error } = await supabase.from('lessons').insert({
        module_id: moduleId,
        title: lessonForm.title,
        video_url: lessonForm.video_url || null,
        duration: lessonForm.duration ? Number(lessonForm.duration) : null,
        order: currentLessons.length,
      });
      if (error) throw error;
      toast.success('Aula adicionada');
      setLessonForm(EMPTY_LESSON);
      setShowLessonForm(null);
      await loadLessons(moduleId);
    } catch {
      toast.error('Erro ao adicionar aula');
    } finally {
      setSaving(false);
    }
  }

  function startEditLesson(lesson) {
    setEditingLessonId(lesson.id);
    setLessonEditForm({
      title: lesson.title,
      video_url: lesson.video_url ?? '',
      duration: lesson.duration != null ? String(lesson.duration) : '',
    });
  }

  function cancelEditLesson() {
    setEditingLessonId(null);
    setLessonEditForm(EMPTY_LESSON);
  }

  async function updateLesson(moduleId) {
    setSaving(true);
    try {
      const { error } = await supabase.from('lessons').update({
        title: lessonEditForm.title,
        video_url: lessonEditForm.video_url || null,
        duration: lessonEditForm.duration ? Number(lessonEditForm.duration) : null,
      }).eq('id', editingLessonId);
      if (error) throw error;
      toast.success('Aula atualizada');
      cancelEditLesson();
      await loadLessons(moduleId);
    } catch {
      toast.error('Erro ao atualizar aula');
    } finally {
      setSaving(false);
    }
  }

  function confirmDeleteLesson(lesson, moduleId) {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir aula',
      message: `Excluir a aula "${lesson.title}"?`,
      onConfirm: () => deleteLesson(lesson.id, moduleId),
    });
  }

  async function deleteLesson(lessonId, moduleId) {
    closeConfirm();
    try {
      const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
      if (error) throw error;
      setLessons((p) => ({ ...p, [moduleId]: p[moduleId].filter((l) => l.id !== lessonId) }));
      toast.success('Aula excluída');
    } catch {
      toast.error('Erro ao excluir aula');
    }
  }

  // ── Duplicar aula ────────────────────────────────────────────────────────

  async function duplicateLesson(lesson, moduleId) {
    try {
      const current = lessons[moduleId] ?? [];
      // Incrementar order das aulas após a original
      const affected = current.filter((l) => l.order > lesson.order);
      await Promise.all(
        affected.map((l) => supabase.from('lessons').update({ order: l.order + 1 }).eq('id', l.id))
      );

      const { data, error } = await supabase
        .from('lessons')
        .insert({
          title: `${lesson.title} (cópia)`,
          video_url: lesson.video_url,
          duration: lesson.duration,
          module_id: moduleId,
          order: lesson.order + 1,
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistic update: inserir na posição correta e renumerar
      const updated = [...current];
      const insertAt = updated.findIndex((l) => l.id === lesson.id) + 1;
      updated.splice(insertAt, 0, data);
      setLessons((p) => ({ ...p, [moduleId]: updated.map((l, i) => ({ ...l, order: i })) }));
      toast.success('Aula duplicada');
    } catch {
      toast.error('Erro ao duplicar aula');
    }
  }

  // ── Drag aulas ───────────────────────────────────────────────────────────

  async function handleLessonDragEnd(event, moduleId) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const current = lessons[moduleId] ?? [];
    const oldIndex = current.findIndex((l) => l.id === active.id);
    const newIndex = current.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(current, oldIndex, newIndex);

    // Optimistic update
    setLessons((p) => ({ ...p, [moduleId]: reordered }));

    try {
      await persistLessonOrder(reordered);
      toast.success('Ordem das aulas salva');
    } catch {
      setLessons((p) => ({ ...p, [moduleId]: current }));
      toast.error('Erro ao salvar ordem — revertido');
    }
  }

  // ── Modal ────────────────────────────────────────────────────────────────

  function closeConfirm() {
    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div style={{ maxWidth: '820px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>Admin</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Módulos & Aulas</h1>
          </div>
          {editingModId !== 'new' && (
            <button style={btnPrimary} onClick={startNewMod}>+ Novo Módulo</button>
          )}
        </div>

        {/* Form inline — Novo Módulo */}
        {editingModId === 'new' && (
          <ModForm
            title="Novo Módulo"
            form={modForm}
            onChange={setModForm}
            onSubmit={saveMod}
            onCancel={cancelModForm}
            saving={saving}
          />
        )}

        {loading && <p style={{ color: 'var(--muted)' }}>Carregando...</p>}

        {/* Lista de módulos com DnD */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleModuleDragEnd}>
          <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {modules.map((mod) => (
                <SortableModuleItem key={mod.id} mod={mod}>
                  {({ dragHandle }) => (
                    <>
                      {/* Cabeçalho — modo edição inline */}
                      {editingModId === mod.id ? (
                        <div style={{ padding: '20px 20px 0' }}>
                          <ModForm
                            title="Editar Módulo"
                            form={modForm}
                            onChange={setModForm}
                            onSubmit={saveMod}
                            onCancel={cancelModForm}
                            saving={saving}
                          />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: '8px' }}>
                          {dragHandle}
                          <button
                            onClick={() => toggleModule(mod.id)}
                            style={{ flex: 1, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--text)', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '1rem', padding: 0 }}
                          >
                            <span style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.75rem', marginRight: '10px' }}>#{mod.order}</span>
                            {mod.title}
                            <span style={{ marginLeft: '12px', color: 'var(--accent)', fontSize: '.85rem' }}>{openModule === mod.id ? '▲' : '▼'}</span>
                          </button>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button style={btnOutline} onClick={() => startEditMod(mod)}>Editar</button>
                            <button style={btnDanger} onClick={() => confirmDeleteMod(mod)}>Excluir</button>
                          </div>
                        </div>
                      )}

                      {/* Aulas */}
                      {openModule === mod.id && editingModId !== mod.id && (
                        <div style={{ borderTop: '1px solid var(--line)' }}>
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(e) => handleLessonDragEnd(e, mod.id)}
                          >
                            <SortableContext
                              items={(lessons[mod.id] ?? []).map((l) => l.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              {(lessons[mod.id] ?? []).map((lesson) => (
                                <SortableLessonItem key={lesson.id} lesson={lesson}>
                                  {({ dragHandle: lessonDragHandle }) => (
                                    <>
                                      {editingLessonId !== lesson.id ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px 12px 20px' }}>
                                          {lessonDragHandle}
                                          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)', minWidth: '24px' }}>#{lesson.order}</span>
                                          <span style={{ flex: 1, fontSize: '.9rem', color: 'var(--text)' }}>{lesson.title}</span>
                                          {lesson.duration != null && (
                                            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)' }}>
                                              {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}
                                            </span>
                                          )}
                                          <div style={{ display: 'flex', gap: '6px' }}>
                                            <button style={btnOutline} onClick={() => startEditLesson(lesson)}>Editar</button>
                                            <button style={btnOutline} onClick={() => duplicateLesson(lesson, mod.id)} title="Duplicar aula">Duplicar</button>
                                            <button style={btnDanger} onClick={() => confirmDeleteLesson(lesson, mod.id)}>Excluir</button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,.02)' }}>
                                          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--accent)', textTransform: 'uppercase' }}>Editando aula</div>
                                          <input style={inputSx} placeholder="Título da aula" value={lessonEditForm.title} onChange={(e) => setLessonEditForm((p) => ({ ...p, title: e.target.value }))} required />
                                          <input style={inputSx} placeholder="URL do vídeo (opcional)" value={lessonEditForm.video_url} onChange={(e) => setLessonEditForm((p) => ({ ...p, video_url: e.target.value }))} />
                                          <input style={{ ...inputSx, maxWidth: '220px' }} placeholder="Duração (segundos)" type="number" value={lessonEditForm.duration} onChange={(e) => setLessonEditForm((p) => ({ ...p, duration: e.target.value }))} />
                                          <div style={{ display: 'flex', gap: '8px' }}>
                                            <button style={btnPrimary} onClick={() => updateLesson(mod.id)} disabled={saving || !lessonEditForm.title}>{saving ? 'Salvando...' : 'Salvar'}</button>
                                            <button style={btnOutline} onClick={cancelEditLesson}>Cancelar</button>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </SortableLessonItem>
                              ))}
                            </SortableContext>
                          </DndContext>

                          {/* Form nova aula */}
                          {showLessonForm === mod.id ? (
                            <form onSubmit={(e) => saveLesson(e, mod.id)} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--line)', background: 'rgba(255,255,255,.02)' }}>
                              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Nova Aula</div>
                              <input style={inputSx} placeholder="Título da aula" value={lessonForm.title} onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))} required />
                              <input style={inputSx} placeholder="URL do vídeo (opcional)" value={lessonForm.video_url} onChange={(e) => setLessonForm((p) => ({ ...p, video_url: e.target.value }))} />
                              <input style={{ ...inputSx, maxWidth: '220px' }} placeholder="Duração (segundos)" type="number" value={lessonForm.duration} onChange={(e) => setLessonForm((p) => ({ ...p, duration: e.target.value }))} />
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="submit" style={btnPrimary} disabled={saving}>{saving ? 'Salvando...' : 'Adicionar Aula'}</button>
                                <button type="button" style={btnOutline} onClick={() => { setShowLessonForm(null); setLessonForm(EMPTY_LESSON); }}>Cancelar</button>
                              </div>
                            </form>
                          ) : (
                            <div style={{ padding: '12px 20px' }}>
                              <button style={btnOutline} onClick={() => { setLessonForm(EMPTY_LESSON); setShowLessonForm(mod.id); cancelEditLesson(); }}>
                                + Adicionar Aula
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </SortableModuleItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />
    </AdminLayout>
  );
}

// ─── Subcomponente: form de módulo ───────────────────────────────────────────

function ModForm({ title, form, onChange, onSubmit, onCancel, saving }) {
  return (
    <form
      onSubmit={onSubmit}
      style={{
        background: 'var(--panel-2)', border: '1px solid var(--line-strong)',
        borderRadius: '6px', padding: '20px', marginBottom: '16px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}
    >
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
        {title}
      </div>
      <input
        style={inputSx}
        placeholder="Título do módulo"
        value={form.title}
        onChange={(e) => onChange((p) => ({ ...p, title: e.target.value }))}
        required
        autoFocus
      />
      <input
        style={inputSx}
        placeholder="Descrição (opcional)"
        value={form.description}
        onChange={(e) => onChange((p) => ({ ...p, description: e.target.value }))}
      />
      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="submit" style={btnPrimary} disabled={saving || !form.title}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
        <button type="button" style={btnOutline} onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}
