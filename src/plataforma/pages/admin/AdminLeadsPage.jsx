import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import CrmLayout from '../../components/CrmLayout';
import { useAuth } from '../../context/AuthContext';
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
const SYSTEM_OWNER_KEY = 'system';
const SYSTEM_OWNER = {
  user_id: SYSTEM_OWNER_KEY,
  email: 'sistema@neuralhub.ia.br',
  full_name: 'Sistema Neural Hub',
  role: 'system',
};

const EMPTY_LEAD_FORM = {
  name: '',
  email: '',
  whatsapp: '',
  company: '',
  role: '',
  company_size: '',
  objective: '',
  urgency: '',
  context: '',
  status: 'new',
};

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

function getOwnerKey(lead) {
  if ((lead.owner_type || 'system') === 'system') return SYSTEM_OWNER_KEY;
  return lead.owner_user_id || lead.owner_email || SYSTEM_OWNER_KEY;
}

function getOwnerLabel(lead) {
  if ((lead.owner_type || 'system') === 'system') return SYSTEM_OWNER.full_name;
  return lead.owner_name || lead.owner_email || 'Responsável não informado';
}

export default function AdminLeadsPage() {
  const { isAdmin } = useAuth();
  const [leads, setLeads] = useState([]);
  const [crmUsers, setCrmUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [draggingId, setDraggingId] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_LEAD_FORM);
  const [createErrors, setCreateErrors] = useState({});
  const [savingLead, setSavingLead] = useState(false);

  useEffect(() => {
    loadLeads();
    loadCrmUsers();
  }, []);

  async function loadCrmUsers() {
    const { data, error } = await supabase.rpc('list_crm_users');
    if (error) {
      console.error('[AdminLeads] users error:', error);
      setCrmUsers([]);
      return;
    }
    setCrmUsers(data ?? []);
  }

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

  async function updateOwner(leadId, nextOwnerKey) {
    if (!isAdmin) return;
    const current = leads.find((lead) => lead.id === leadId);
    if (!current || getOwnerKey(current) === nextOwnerKey) return;

    const nextOwner = ownerOptions.find((owner) => owner.key === nextOwnerKey);
    if (!nextOwner) return;

    const payload = nextOwner.key === SYSTEM_OWNER_KEY
      ? {
          owner_type: 'system',
          owner_user_id: null,
          owner_name: SYSTEM_OWNER.full_name,
          owner_email: SYSTEM_OWNER.email,
        }
      : {
          owner_type: 'user',
          owner_user_id: nextOwner.user_id,
          owner_name: nextOwner.full_name,
          owner_email: nextOwner.email,
        };

    setLeads((items) => items.map((lead) => lead.id === leadId ? { ...lead, ...payload } : lead));
    if (selectedLead?.id === leadId) setSelectedLead((lead) => ({ ...lead, ...payload }));

    const { error } = await supabase.from('proposal_requests').update(payload).eq('id', leadId);
    if (error) {
      setLeads((items) => items.map((lead) => lead.id === leadId ? current : lead));
      if (selectedLead?.id === leadId) setSelectedLead(current);
      toast.error('Não foi possível trocar o responsável.');
      return;
    }

    toast.success(`Responsável alterado para ${payload.owner_name}.`);
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

  function updateCreateForm(field, value) {
    setCreateForm((current) => ({ ...current, [field]: value }));
    setCreateErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validateCreateForm() {
    const errors = {};
    Object.entries(createForm).forEach(([field, value]) => {
      if (!String(value ?? '').trim()) errors[field] = 'Campo obrigatório';
    });
    if (createForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim())) {
      errors.email = 'E-mail inválido';
    }
    return errors;
  }

  async function createLead() {
    const errors = validateCreateForm();
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingLead(true);
    const payload = Object.fromEntries(
      Object.entries(createForm).map(([field, value]) => [field, String(value).trim()])
    );

    const { data, error } = await supabase
      .from('proposal_requests')
      .insert([{ ...payload, source: 'crm-manual' }])
      .select('*')
      .single();

    setSavingLead(false);
    if (error) {
      console.error('[AdminLeads] create error:', error);
      toast.error('Não foi possível criar o lead.');
      return;
    }

    setLeads((items) => [data, ...items]);
    setCreateForm(EMPTY_LEAD_FORM);
    setCreateErrors({});
    setShowCreateLead(false);
    toast.success('Lead criado manualmente.');
  }

  const ownerOptions = useMemo(() => {
    const users = new Map([[SYSTEM_OWNER_KEY, { ...SYSTEM_OWNER, key: SYSTEM_OWNER_KEY }]]);

    crmUsers.forEach((user) => {
      if (user.user_id) users.set(user.user_id, { ...user, key: user.user_id });
    });

    leads.forEach((lead) => {
      const key = getOwnerKey(lead);
      if (!users.has(key)) {
        users.set(key, {
          key,
          user_id: lead.owner_user_id || key,
          email: lead.owner_email,
          full_name: getOwnerLabel(lead),
          role: lead.owner_type || 'system',
        });
      }
    });

    return Array.from(users.values());
  }, [crmUsers, leads]);

  const filteredLeads = useMemo(() => leads.filter((lead) => {
    const matchesOwner = ownerFilter === 'all' || getOwnerKey(lead) === ownerFilter;
    return matchesOwner && matchLead(lead, query);
  }), [leads, ownerFilter, query]);
  const columns = useMemo(() => STATUSES.map((status) => ({
    ...status,
    leads: filteredLeads.filter((lead) => (lead.status || 'new') === status.id),
  })), [filteredLeads]);

  const totalOpen = leads.filter((lead) => !['won', 'lost'].includes(lead.status || 'new')).length;
  const won = leads.filter((lead) => lead.status === 'won').length;
  const proposals = leads.filter((lead) => lead.status === 'proposal').length;

  return (
    <CrmLayout>
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
              CRM / Neural Hub
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
          <button
            onClick={() => setShowCreateLead(true)}
            style={{
              ...inputSx,
              cursor: 'pointer',
              background: 'var(--accent)',
              borderColor: 'var(--accent)',
              color: '#000',
              fontFamily: 'Space Mono, monospace',
              fontSize: '.72rem',
              fontWeight: 700,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
            }}
          >
            Novo lead
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
          <select
            value={ownerFilter}
            onChange={(event) => setOwnerFilter(event.target.value)}
            aria-label="Filtrar por responsável"
            style={{ ...inputSx, minWidth: '240px', cursor: 'pointer' }}
          >
            <option value="all">Todos os responsáveis</option>
            {ownerOptions.map((owner) => (
              <option key={owner.key} value={owner.key}>{owner.full_name}</option>
            ))}
          </select>
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
          ownerOptions={ownerOptions}
          isAdmin={isAdmin}
          onClose={() => setSelectedLead(null)}
          onSaveNotes={saveNotes}
          onStatusChange={(status) => updateStatus(selectedLead.id, status)}
          onOwnerChange={(ownerKey) => updateOwner(selectedLead.id, ownerKey)}
        />
      )}

      {showCreateLead && (
        <CreateLeadModal
          form={createForm}
          errors={createErrors}
          saving={savingLead}
          onChange={updateCreateForm}
          onClose={() => {
            setShowCreateLead(false);
            setCreateErrors({});
          }}
          onSubmit={createLead}
        />
      )}
    </CrmLayout>
  );
}

function CreateLeadModal({ form, errors, saving, onChange, onClose, onSubmit }) {
  const panelRef = useRef(null);

  useEffect(() => {
    panelRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function submit(event) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,.72)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '32px 16px', overflowY: 'auto' }} onClick={onClose}>
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-lead-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        style={{ width: 'min(820px, 100%)', background: 'var(--bg-2)', border: '1px solid var(--line-strong)', borderRadius: '8px', padding: '28px' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.68rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
              CRM / Cadastro manual
            </div>
            <h2 id="create-lead-title" style={{ margin: 0, fontSize: '1.8rem', lineHeight: 1.05, letterSpacing: '-.04em' }}>Novo lead</h2>
          </div>
          <button type="button" aria-label="Fechar cadastro de lead" onClick={onClose} style={{ ...inputSx, cursor: 'pointer', padding: '8px 12px' }}>Fechar</button>
        </div>

        <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
          <LeadInput label="Nome" field="name" value={form.name} error={errors.name} onChange={onChange} />
          <LeadInput label="E-mail" field="email" type="email" value={form.email} error={errors.email} onChange={onChange} />
          <LeadInput label="WhatsApp" field="whatsapp" value={form.whatsapp} error={errors.whatsapp} onChange={onChange} />
          <LeadInput label="Empresa" field="company" value={form.company} error={errors.company} onChange={onChange} />
          <LeadInput label="Cargo" field="role" value={form.role} error={errors.role} onChange={onChange} />
          <LeadSelect
            label="Porte"
            field="company_size"
            value={form.company_size}
            error={errors.company_size}
            onChange={onChange}
            options={['1-10 pessoas', '11-50 pessoas', '51-200 pessoas', '201-500 pessoas', '500+ pessoas']}
          />
          <LeadSelect
            label="Momento"
            field="urgency"
            value={form.urgency}
            error={errors.urgency}
            onChange={onChange}
            options={['Preciso de proposta com urgência', 'Quero planejar este trimestre', 'Estou pesquisando possibilidades']}
          />
          <LeadSelect
            label="Estágio"
            field="status"
            value={form.status}
            error={errors.status}
            onChange={onChange}
            options={STATUSES.map((status) => status.label)}
            values={STATUSES.map((status) => status.id)}
          />
          <LeadTextarea label="Objetivo principal" field="objective" value={form.objective} error={errors.objective} onChange={onChange} />
          <LeadTextarea label="Contexto" field="context" value={form.context} error={errors.context} onChange={onChange} />

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ ...inputSx, cursor: 'pointer' }}>Cancelar</button>
            <button
              type="submit"
              disabled={saving}
              style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '4px', padding: '10px 16px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Salvando...' : 'Criar lead'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function LeadInput({ label, field, type = 'text', value, error, onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.68rem', color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(field, event.target.value)} style={{ ...inputSx, width: '100%' }} />
      {error && <span style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.68rem' }}>{error}</span>}
    </label>
  );
}

function LeadSelect({ label, field, value, error, onChange, options, values }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.68rem', color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>{label}</span>
      <select value={value} onChange={(event) => onChange(field, event.target.value)} style={{ ...inputSx, width: '100%', cursor: 'pointer' }}>
        <option value="">Selecione</option>
        {options.map((option, index) => (
          <option key={values?.[index] ?? option} value={values?.[index] ?? option}>{option}</option>
        ))}
      </select>
      {error && <span style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.68rem' }}>{error}</span>}
    </label>
  );
}

function LeadTextarea({ label, field, value, error, onChange }) {
  return (
    <label style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.68rem', color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>{label}</span>
      <textarea value={value} onChange={(event) => onChange(field, event.target.value)} rows={4} style={{ ...inputSx, width: '100%', resize: 'vertical', lineHeight: 1.55 }} />
      {error && <span style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.68rem' }}>{error}</span>}
    </label>
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
          <span>Resp.: {getOwnerLabel(lead)}</span>
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

function LeadDrawer({ lead, notes, setNotes, savingNotes, ownerOptions, isAdmin, onClose, onSaveNotes, onStatusChange, onOwnerChange }) {
  const status = STATUS_BY_ID[lead.status || 'new'] ?? STATUS_BY_ID.new;
  const panelRef = useRef(null);
  const statusId = `lead-${lead.id}-status`;
  const ownerId = `lead-${lead.id}-owner`;
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
          <Info label="Cadastrado por" value={lead.created_by_name || SYSTEM_OWNER.full_name} />
          <Info label="Origem" value={lead.source === 'crm-manual' ? 'Cadastro manual' : 'Site Neural Hub'} />
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
          <label htmlFor={ownerId} style={{ display: 'block', fontFamily: 'Space Mono, monospace', fontSize: '.68rem', color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Responsável
          </label>
          <select
            id={ownerId}
            value={getOwnerKey(lead)}
            onChange={(event) => onOwnerChange(event.target.value)}
            disabled={!isAdmin}
            style={{ ...inputSx, width: '100%', cursor: isAdmin ? 'pointer' : 'not-allowed', opacity: isAdmin ? 1 : .72 }}
          >
            {ownerOptions.map((owner) => <option key={owner.key} value={owner.key}>{owner.full_name}</option>)}
          </select>
          {!isAdmin && (
            <div style={{ marginTop: '8px', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.68rem', lineHeight: 1.5 }}>
              Apenas administradores podem trocar o responsável.
            </div>
          )}
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
