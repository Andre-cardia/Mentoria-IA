import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

const STATUSES = [
  { id: 'new', label: 'Novo', color: 'var(--accent)' },
  { id: 'contacted', label: 'Contato', color: '#38bdf8' },
  { id: 'qualified', label: 'Qualificado', color: '#a855f7' },
  { id: 'proposal', label: 'Proposta', color: '#f59e0b' },
  { id: 'won', label: 'Ganho', color: '#84cc16' },
  { id: 'lost', label: 'Perdido', color: '#ef4444' },
];

const STATUS_BY_ID = Object.fromEntries(STATUSES.map((status) => [status.id, status]));

/** @type {import('react').CSSProperties} */
const inputSx = {
  background: 'var(--panel-2)',
  border: '1px solid var(--line-strong)',
  borderRadius: '4px',
  color: 'var(--text)',
  fontFamily: 'Space Grotesk, sans-serif',
  fontSize: '.9rem',
  outline: 'none',
  padding: '10px 12px',
};

function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function cleanPhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

export default function ClientePanoramaDrawer({
  lead,
  currentUser,
  isAdmin,
  onClose,
  onUpdateLead,
  onDeleteLead,
}) {
  const panelRef = useRef(null);
  const status = STATUS_BY_ID[lead.status || 'new'] ?? STATUS_BY_ID.new;

  const [notes, setNotes] = useState(lead.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  // Follow-ups state
  const [followUps, setFollowUps] = useState([]);
  const [loadingFollowUps, setLoadingFollowUps] = useState(true);
  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [newFollowUp, setNewFollowUp] = useState({
    title: '',
    scheduled_at: '',
    notes: '',
  });
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    let isSubscribed = true;

    async function loadFollowUps() {
      setLoadingFollowUps(true);
      const { data, error } = await supabase
        .from('lead_follow_ups')
        .select('*')
        .eq('lead_id', lead.id)
        .order('scheduled_at', { ascending: true });

      if (!isSubscribed) return;

      if (error) {
        console.error('[Panorama] erro ao carregar follow-ups:', error);
        setFollowUps([]);
      } else {
        setFollowUps(data ?? []);
      }
      setLoadingFollowUps(false);
    }

    loadFollowUps();
    return () => {
      isSubscribed = false;
    };
  }, [lead.id]);

  async function handleSaveNotes() {
    setSavingNotes(true);
    const trimmed = notes.trim() || null;
    const { error } = await supabase
      .from('proposal_requests')
      .update({ notes: trimmed })
      .eq('id', lead.id);

    setSavingNotes(false);
    if (error) {
      toast.error('Erro ao salvar notas.');
      return;
    }

    onUpdateLead?.({ ...lead, notes: trimmed });
    toast.success('Notas salvas.');
  }

  async function handleStatusChange(nextStatus) {
    if (nextStatus === lead.status) return;
    const { error } = await supabase
      .from('proposal_requests')
      .update({ status: nextStatus })
      .eq('id', lead.id);

    if (error) {
      toast.error('Erro ao alterar estágio.');
      return;
    }

    onUpdateLead?.({ ...lead, status: nextStatus });
    toast.success(`Estágio alterado para ${STATUS_BY_ID[nextStatus]?.label || nextStatus}`);
  }

  async function handleCreateFollowUp(e) {
    e.preventDefault();
    if (!newFollowUp.title.trim()) {
      toast.error('Informe o título do follow-up');
      return;
    }
    if (!newFollowUp.scheduled_at) {
      toast.error('Informe a data e horário do follow-up');
      return;
    }

    setSavingFollowUp(true);
    const payload = {
      lead_id: lead.id,
      title: newFollowUp.title.trim(),
      notes: newFollowUp.notes.trim() || null,
      scheduled_at: new Date(newFollowUp.scheduled_at).toISOString(),
      completed: false,
      created_by_user_id: currentUser?.id || null,
      created_by_name: currentUser?.user_metadata?.full_name || currentUser?.email || 'Equipe Comercial',
    };

    const { data, error } = await supabase
      .from('lead_follow_ups')
      .insert([payload])
      .select('*')
      .single();

    setSavingFollowUp(false);
    if (error) {
      console.error('[Panorama] erro ao criar follow-up:', error);
      toast.error('Não foi possível agendar o follow-up.');
      return;
    }

    setFollowUps((items) => [...items, data].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()));
    setNewFollowUp({ title: '', scheduled_at: '', notes: '' });
    setShowAddFollowUp(false);
    toast.success('Follow-up agendado com sucesso!');
  }

  async function handleToggleComplete(item) {
    const nextCompleted = !item.completed;
    const { error } = await supabase
      .from('lead_follow_ups')
      .update({
        completed: nextCompleted,
        completed_at: nextCompleted ? new Date().toISOString() : null,
      })
      .eq('id', item.id);

    if (error) {
      toast.error('Erro ao atualizar follow-up.');
      return;
    }

    setFollowUps((items) =>
      items.map((f) => (f.id === item.id ? { ...f, completed: nextCompleted, completed_at: nextCompleted ? new Date().toISOString() : null } : f))
    );
    toast.success(nextCompleted ? 'Follow-up concluído!' : 'Follow-up reaberto.');
  }

  async function handleDeleteFollowUp(itemId) {
    if (!window.confirm('Excluir este lembrete de follow-up?')) return;
    const { error } = await supabase
      .from('lead_follow_ups')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast.error('Erro ao excluir follow-up.');
      return;
    }

    setFollowUps((items) => items.filter((f) => f.id !== itemId));
    toast.success('Follow-up removido.');
  }

  const cleanWhats = cleanPhone(lead.whatsapp);
  const pendingFollowUps = followUps.filter((f) => !f.completed);
  const completedFollowUps = followUps.filter((f) => f.completed);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.75)', display: 'flex', justifyContent: 'flex-end' }}
      onClick={onClose}
    >
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panorama-lead-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(640px, 100vw)',
          height: '100%',
          background: 'var(--bg-2)',
          borderLeft: '1px solid var(--line-strong)',
          padding: '32px 28px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '.68rem',
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  background: `${status.color}22`,
                  color: status.color,
                  border: `1px solid ${status.color}44`,
                  fontWeight: 700,
                }}
              >
                {status.label}
              </span>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.68rem', color: 'var(--muted)' }}>
                Cadastrado em {fmtDate(lead.created_at)}
              </span>
            </div>
            <h2 id="panorama-lead-title" style={{ margin: 0, fontSize: '1.8rem', lineHeight: 1.1, letterSpacing: '-.04em' }}>
              {lead.name}
            </h2>
            <div style={{ marginTop: '6px', color: 'var(--muted)', fontSize: '.95rem' }}>
              <strong style={{ color: 'var(--text)' }}>{lead.company}</strong>
              {lead.role ? ` • ${lead.role}` : ''}
            </div>
          </div>
          <button
            type="button"
            aria-label="Fechar panorama do cliente"
            onClick={onClose}
            style={{ ...inputSx, cursor: 'pointer', padding: '8px 14px' }}
          >
            Fechar
          </button>
        </div>

        {/* Botões de Contato Rápido */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {cleanWhats && (
            <a
              href={`https://wa.me/55${cleanWhats}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(34,197,94,.12)',
                color: '#22c55e',
                border: '1px solid rgba(34,197,94,.35)',
                borderRadius: '4px',
                padding: '9px 14px',
                textDecoration: 'none',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '.85rem',
                fontWeight: 600,
              }}
            >
              <span>💬 Abrir WhatsApp ({lead.whatsapp})</span>
            </a>
          )}

          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(56,189,248,.12)',
                color: '#38bdf8',
                border: '1px solid rgba(56,189,248,.35)',
                borderRadius: '4px',
                padding: '9px 14px',
                textDecoration: 'none',
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '.85rem',
                fontWeight: 600,
              }}
            >
              <span>✉️ Enviar E-mail</span>
            </a>
          )}
        </div>

        {/* Estágio na Jornada Kanban */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '16px' }}>
          <label
            htmlFor="panorama-status-select"
            style={{
              display: 'block',
              fontFamily: 'Space Mono, monospace',
              fontSize: '.68rem',
              color: 'var(--muted)',
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Posição na Jornada Comercial
          </label>
          <select
            id="panorama-status-select"
            value={lead.status || 'new'}
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{ ...inputSx, width: '100%', cursor: 'pointer' }}
          >
            {STATUSES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Panorama Cadastral */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
          <InfoCard label="Porte da Empresa" value={lead.company_size || 'Não informado'} />
          <InfoCard label="Momento / Urgência" value={lead.urgency || 'Não informado'} />
          <InfoCard label="Responsável" value={lead.owner_name || 'Sistema Neural Hub'} />
          <InfoCard label="Canal de Origem" value={formatSource(lead.source)} />
        </div>

        {/* Objetivo e Contexto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '14px 16px' }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.68rem', color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Objetivo Principal
            </div>
            <div style={{ fontSize: '.9rem', lineHeight: 1.5, color: 'var(--text)' }}>
              {lead.objective || 'Nenhum objetivo registrado.'}
            </div>
          </div>

          <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '14px 16px' }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.68rem', color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Contexto do Lead
            </div>
            <div style={{ fontSize: '.9rem', lineHeight: 1.5, color: 'var(--text)' }}>
              {lead.context || 'Nenhum contexto registrado.'}
            </div>
          </div>
        </div>

        {/* Seção Follow-ups e Lembretes */}
        <section style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '-.02em' }}>🔔 Follow-ups & Próximos Passos</h3>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.68rem', color: 'var(--muted)', marginTop: '4px' }}>
                {pendingFollowUps.length} pendente(s) • {completedFollowUps.length} concluído(s)
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddFollowUp((prev) => !prev)}
              style={{
                ...inputSx,
                background: showAddFollowUp ? 'var(--line)' : 'var(--accent)',
                color: showAddFollowUp ? 'var(--text)' : '#000',
                border: 'none',
                fontWeight: 700,
                fontSize: '.78rem',
                cursor: 'pointer',
                padding: '8px 12px',
              }}
            >
              {showAddFollowUp ? 'Cancelar' : '+ Agendar Follow-up'}
            </button>
          </div>

          {/* Formulário Novo Follow-up */}
          {showAddFollowUp && (
            <form onSubmit={handleCreateFollowUp} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-2)', padding: '16px', borderRadius: '6px', border: '1px solid var(--line-strong)', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'Space Mono, monospace', fontSize: '.68rem', color: 'var(--muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Ação / Título *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ligar para feedback da proposta, Reunião de alinhamento..."
                  value={newFollowUp.title}
                  onChange={(e) => setNewFollowUp((p) => ({ ...p, title: e.target.value }))}
                  style={{ ...inputSx, width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'Space Mono, monospace', fontSize: '.68rem', color: 'var(--muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Data e Horário do Lembrete *
                </label>
                <input
                  type="datetime-local"
                  value={newFollowUp.scheduled_at}
                  onChange={(e) => setNewFollowUp((p) => ({ ...p, scheduled_at: e.target.value }))}
                  style={{ ...inputSx, width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'Space Mono, monospace', fontSize: '.68rem', color: 'var(--muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Observações (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Pontos para abordar, link de meet, etc."
                  value={newFollowUp.notes}
                  onChange={(e) => setNewFollowUp((p) => ({ ...p, notes: e.target.value }))}
                  style={{ ...inputSx, width: '100%', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={savingFollowUp}
                style={{
                  background: 'var(--accent)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px',
                  fontWeight: 700,
                  cursor: savingFollowUp ? 'not-allowed' : 'pointer',
                  marginTop: '4px',
                }}
              >
                {savingFollowUp ? 'Agendando...' : 'Salvar e Ativar Alerta'}
              </button>
            </form>
          )}

          {/* Lista de Follow-ups */}
          {loadingFollowUps ? (
            <div style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.8rem', textAlign: 'center', padding: '16px' }}>
              Carregando lembretes...
            </div>
          ) : followUps.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.8rem', textAlign: 'center', padding: '16px' }}>
              Nenhum follow-up agendado para este lead.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {followUps.map((item) => {
                const isOverdue = !item.completed && new Date(item.scheduled_at) < new Date();
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                      background: item.completed ? 'rgba(255,255,255,.02)' : isOverdue ? 'rgba(239,68,68,.08)' : 'var(--bg-2)',
                      border: `1px solid ${item.completed ? 'var(--line)' : isOverdue ? 'rgba(239,68,68,.4)' : 'var(--line-strong)'}`,
                      borderRadius: '6px',
                      padding: '12px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleComplete(item)}
                        style={{ marginTop: '3px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                        aria-label={`Concluir follow-up: ${item.title}`}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '.9rem',
                            textDecoration: item.completed ? 'line-through' : 'none',
                            color: item.completed ? 'var(--muted)' : 'var(--text)',
                          }}
                        >
                          {item.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontFamily: 'Space Mono, monospace',
                              fontSize: '.68rem',
                              color: item.completed ? 'var(--muted)' : isOverdue ? '#f87171' : 'var(--accent)',
                              fontWeight: isOverdue ? 700 : 400,
                            }}
                          >
                            📅 {fmtDate(item.scheduled_at)} {isOverdue && '(Vencido)'}
                          </span>
                          <span style={{ color: 'var(--muted)', fontSize: '.7rem' }}>
                            • Criado por {item.created_by_name}
                          </span>
                        </div>
                        {item.notes && (
                          <div style={{ marginTop: '6px', fontSize: '.82rem', color: 'var(--muted)', lineHeight: 1.4 }}>
                            {item.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteFollowUp(item.id)}
                      title="Excluir follow-up"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        fontSize: '.85rem',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Notas Internas */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '20px' }}>
          <label
            htmlFor="panorama-notes"
            style={{
              display: 'block',
              fontFamily: 'Space Mono, monospace',
              fontSize: '.68rem',
              color: 'var(--muted)',
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Histórico & Notas Internas
          </label>
          <textarea
            id="panorama-notes"
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Registre observações estratégicas, decisões, reuniões ou detalhes do cliente..."
            style={{ ...inputSx, width: '100%', resize: 'vertical', lineHeight: 1.55 }}
          />
          <button
            type="button"
            onClick={handleSaveNotes}
            disabled={savingNotes}
            style={{
              marginTop: '10px',
              background: 'var(--accent)',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              padding: '10px 16px',
              fontWeight: 700,
              cursor: savingNotes ? 'not-allowed' : 'pointer',
            }}
          >
            {savingNotes ? 'Salvando...' : 'Salvar Notas'}
          </button>
        </div>

        {/* Exclusão Administrativa */}
        {isAdmin && (
          <div style={{ borderTop: '1px solid rgba(239,68,68,.25)', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={() => onDeleteLead?.(lead)}
              style={{
                width: '100%',
                background: 'rgba(239,68,68,.08)',
                border: '1px solid rgba(239,68,68,.4)',
                borderRadius: '4px',
                color: '#f87171',
                padding: '12px',
                cursor: 'pointer',
                fontFamily: 'Space Mono, monospace',
                fontSize: '.72rem',
                fontWeight: 700,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
              }}
            >
              Excluir Cliente Permanentemente
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '12px 14px' }}>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--text)' }}>
        {value}
      </div>
    </div>
  );
}

function formatSource(source) {
  if (source === 'crm-manual') return 'Cadastro manual no CRM';
  if (source === 'neural-hub-auditoria') return 'Diagnóstico No-Code (/auditoria)';
  if (source === 'neural-hub-proposta') return 'Solicitação (/solicitar-proposta)';
  return source || 'Site Neural Hub';
}
