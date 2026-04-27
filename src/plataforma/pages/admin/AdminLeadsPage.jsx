import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';
import { toast } from 'sonner';

const STATUSES = [
  { id: 'new', label: 'Novo', hint: 'Entrada do formulário', color: 'var(--accent)' },
  { id: 'contacted', label: 'Contato', hint: 'Primeira conversa', color: '#38bdf8' },
  { id: 'qualified', label: 'Qualificado', hint: 'Fit validado', color: '#a855f7' },
  { id: 'proposal', label: 'Proposta', hint: 'Proposta enviada', color: '#f59e0b' },
  { id: 'won', label: 'Ganho', hint: 'Fechado', color: '#84cc16' },
  { id: 'lost', label: 'Perdido', hint: 'Sem avanço', color: '#ef4444' },
];

const STATUS_BY_ID = Object.fromEntries(STATUSES.map((status) => [status.id, status]));

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
    hour: '2-digit',
    minute: '2-digit',
  });
}

function matchLead(lead, query) {
  if (!query.trim()) return true;
  const haystack = [
    lead.name,
    lead.email,
    lead.whatsapp,
    lead.company,
    lead.role,
    lead.company_size,
    lead.objective,
    lead.urgency,
    lead.context,
    lead.notes,
  ].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => { loadLeads(); }, []);

  async function loadLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from('proposal_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[AdminLeads] load error:', error);
      toast.error('Não foi possível carregar os leads.');
      setLeads([]);
    } else {
      setLeads(data ?? []);
    }
    setLoading(false);
  }

  async function updateStatus(leadId, status) {
    const current = leads.find((lead) => lead.id === leadId);
    if (!current || current.status === status) return;

    setLeads((items) => items.map((lead) => lead.id === leadId ? { ...lead, status } : lead));
    const { error } = await supabase.from('proposal_requests').update({ status }).eq('id', leadId);

    if (error) {
      setLeads((items) => items.map((lead) => lead.id === leadId ? { ...lead, status: current.status } : lead));
      toast.error('Não foi possível mover o lead.');
      return;
    }

    if (selectedLead?.id === leadId) {
      setSelectedLead((lead) => ({ ...lead, status }));
    }
    toast.success(`Lead movido para ${STATUS_BY_ID[status]?.label ?? status}.`);
  }

  function openLead(lead) {
    setSelectedLead(lead);
    setNotes(lead.notes ?? '');
  }

  async function saveNotes() {
    if (!selectedLead) return;
    setSavingNotes(true);
    const { error } = await supabase
      .from('proposal_requests')
      .update({ notes: notes.trim() || null })
      .eq('id', selectedLead.id);

    setSavingNotes(false);
    if (error) {
      toast.error('Não foi possível salvar as notas.');
      return;
    }

    setLeads((items) => items.map((lead) => lead.id === selectedLead.id ? { ...lead, notes: notes.trim() || null } : lead));
    setSelectedLead((lead) => ({ ...lead, notes: notes.trim() || null }));
    toast.success('Notas salvas.');
  }

  const filteredLeads = useMemo(() => leads.filter((lead) => matchLead(lead, query)), [leads, query]);
  const columns = useMemo(() => STATUSES.map((status) => ({
    ...status,
    leads: filteredLeads.filter((lead) => (lead.status || 'new') === status.id),
  })), [filteredLeads]);

  const totalOpen = leads.filter((lead) => !['won', 'lost'].includes(lead.status || 'new')).length;
  const won = leads.filter((lead) => lead.status === 'won').length;
  const proposals = leads.filter((lead) => lead.status === 'proposal').length;

  return (
    <AdminLayout>
      <style>{`
        .admin-leads-focus :focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
          border-radius: 4px;
        }
      `}</style>
      <div className="admin-leads-focus" style={{ width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
              Admin / CRM
            </div>
            <h1 style={{ margin: 0, fontSize: '2rem', lineHeight: 1, letterSpacing: '-.04em' }}>Leads de Proposta</h1>
            <p style={{ margin: '10px 0 0', maxWidth: '720px', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.82rem', lineHeight: 1.7 }}>
              Kanban comercial para acompanhar solicitações vindas da página de proposta da Neural Hub.
            </p>
          </div>

          <button
            onClick={loadLeads}
            disabled={loading}
            style={{
              ...inputSx,
              cursor: loading ? 'not-allowed' : 'pointer',
              color: 'var(--accent)',
              fontFamily: 'Space Mono, monospace',
              fontSize: '.72rem',
              letterSpacing: '.12em',
              textTransform: 'uppercase',
            }}
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {[
            ['Leads totais', leads.length],
            ['Em aberto', totalOpen],
            ['Em proposta', proposals],
            ['Ganhos', won],
          ].map(([label, value]) => (
            <div key={label} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '16px' }}>
              <div style={{ color: 'var(--accent)', fontSize: '1.7rem', fontWeight: 700, lineHeight: 1 }}>{value}</div>
              <div style={{ marginTop: '8px', fontFamily: 'Space Mono, monospace', fontSize: '.68rem', color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, empresa, e-mail, objetivo..."
            style={{ ...inputSx, minWidth: '320px', flex: '1 1 420px' }}
          />
          <span style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.72rem', letterSpacing: '.12em', textTransform: 'uppercase' }}>
            {filteredLeads.length} lead{filteredLeads.length === 1 ? '' : 's'} no filtro
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '48px', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', color: 'var(--muted)' }}>
            Carregando leads...
          </div>
        ) : (
          <div style={{ overflowX: 'auto', paddingBottom: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(210px, 1fr))', gap: '10px', minWidth: '1320px' }}>
              {columns.map((column) => (
                <section
                  key={column.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggingId) updateStatus(draggingId, column.id);
                    setDraggingId(null);
                  }}
                  style={{
                    minHeight: '420px',
                    background: 'var(--panel)',
                    border: '1px solid var(--line)',
                    borderTop: `2px solid ${column.color}`,
                    borderRadius: '6px',
                    padding: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '.95rem', letterSpacing: '-.02em' }}>{column.label}</h2>
                      <div style={{ marginTop: '4px', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.58rem', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                        {column.hint}
                      </div>
                    </div>
                    <span style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '999px', padding: '2px 8px', color: column.color, fontSize: '.78rem', fontWeight: 700 }}>
                      {column.leads.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {column.leads.length === 0 ? (
                      <div style={{ border: '1px dashed var(--line-strong)', borderRadius: '6px', padding: '18px 12px', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.64rem', lineHeight: 1.6, textTransform: 'uppercase' }}>
                        Solte leads aqui
                      </div>
                    ) : column.leads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onOpen={() => openLead(lead)}
                        onDragStart={() => setDraggingId(lead.id)}
                        onDragEnd={() => setDraggingId(null)}
                        onStatusChange={(status) => updateStatus(lead.id, status)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          notes={notes}
          setNotes={setNotes}
          savingNotes={savingNotes}
          onClose={() => setSelectedLead(null)}
          onSaveNotes={saveNotes}
          onStatusChange={(status) => updateStatus(selectedLead.id, status)}
        />
      )}
    </AdminLayout>
  );
}

function LeadCard({ lead, onOpen, onDragStart, onDragEnd, onStatusChange }) {
  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--line)',
        borderRadius: '6px',
        padding: '12px',
        cursor: 'grab',
      }}
    >
      <button onClick={onOpen} style={{ display: 'block', width: '100%', padding: 0, background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: '.95rem', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lead.name}
            </div>
            <div style={{ color: 'var(--accent)', fontFamily: 'Space Mono, monospace', fontSize: '.68rem', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lead.company}
            </div>
          </div>
          <span style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.62rem', whiteSpace: 'nowrap' }}>
            {fmtDate(lead.created_at)}
          </span>
        </div>

        <div style={{ marginTop: '10px', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.7rem', lineHeight: 1.55 }}>
          {lead.objective || 'Objetivo não informado'}
        </div>

        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--muted)', fontSize: '.78rem' }}>
          <span>{lead.role || 'Cargo não informado'}</span>
          <span>{lead.company_size || 'Porte não informado'}</span>
          <span>{lead.email}</span>
          <span>{lead.whatsapp}</span>
        </div>
      </button>

      <select
        value={lead.status || 'new'}
        onChange={(event) => onStatusChange(event.target.value)}
        style={{ ...inputSx, marginTop: '12px', width: '100%', fontSize: '.78rem', padding: '8px 10px', cursor: 'pointer' }}
      >
        {STATUSES.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}
      </select>
    </article>
  );
}

function LeadDrawer({ lead, notes, setNotes, savingNotes, onClose, onSaveNotes, onStatusChange }) {
  const status = STATUS_BY_ID[lead.status || 'new'] ?? STATUS_BY_ID.new;
  const panelRef = useRef(null);
  const statusId = `lead-${lead.id}-status`;
  const notesId = `lead-${lead.id}-notes`;

  useEffect(() => {
    panelRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.72)', display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-drawer-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        style={{ width: 'min(560px, 100vw)', height: '100%', background: 'var(--bg-2)', borderLeft: '1px solid var(--line-strong)', padding: '28px', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.68rem', letterSpacing: '.14em', textTransform: 'uppercase', color: status.color, marginBottom: '8px' }}>
              {status.label}
            </div>
            <h2 id="lead-drawer-title" style={{ margin: 0, fontSize: '1.7rem', lineHeight: 1.05, letterSpacing: '-.04em' }}>{lead.name}</h2>
            <div style={{ marginTop: '8px', color: 'var(--muted)' }}>{lead.company} / {lead.role}</div>
          </div>
          <button aria-label="Fechar detalhes do lead" onClick={onClose} style={{ ...inputSx, cursor: 'pointer', padding: '8px 12px' }}>Fechar</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
          <Info label="E-mail" value={lead.email} />
          <Info label="WhatsApp" value={lead.whatsapp} />
          <Info label="Porte" value={lead.company_size} />
          <Info label="Momento" value={lead.urgency} />
        </div>

        <Info label="Objetivo principal" value={lead.objective} full />
        <Info label="Contexto" value={lead.context} full />

        <div style={{ marginTop: '18px' }}>
          <label htmlFor={statusId} style={{ display: 'block', fontFamily: 'Space Mono, monospace', fontSize: '.68rem', color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Estágio
          </label>
          <select id={statusId} value={lead.status || 'new'} onChange={(event) => onStatusChange(event.target.value)} style={{ ...inputSx, width: '100%', cursor: 'pointer' }}>
            {STATUSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </div>

        <div style={{ marginTop: '18px' }}>
          <label htmlFor={notesId} style={{ display: 'block', fontFamily: 'Space Mono, monospace', fontSize: '.68rem', color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Notas internas
          </label>
          <textarea
            id={notesId}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={6}
            placeholder="Registre próximos passos, objeções, reunião marcada..."
            style={{ ...inputSx, width: '100%', resize: 'vertical', lineHeight: 1.55 }}
          />
          <button
            onClick={onSaveNotes}
            disabled={savingNotes}
            style={{ marginTop: '10px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '4px', padding: '10px 16px', fontWeight: 700, cursor: savingNotes ? 'not-allowed' : 'pointer' }}
          >
            {savingNotes ? 'Salvando...' : 'Salvar notas'}
          </button>
        </div>
      </aside>
    </div>
  );
}

function Info({ label, value, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '12px' }}>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.64rem', color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
      <div style={{ color: 'var(--text)', fontSize: '.9rem', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{value || '—'}</div>
    </div>
  );
}
