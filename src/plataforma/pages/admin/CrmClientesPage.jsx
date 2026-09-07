import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import CrmLayout from '../../components/CrmLayout';
import { useAuth } from '../../context/useAuth';
import ClientePanoramaDrawer from '../../components/crm/ClientePanoramaDrawer';
import { toast } from 'sonner';

const STATUSES = [
  { id: 'all', label: 'Todos os estágios' },
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
  fontSize: '.88rem',
  outline: 'none',
  padding: '9px 12px',
};

function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name) {
  if (!name) return 'C';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function CrmClientesPage() {
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [leads, setLeads] = useState([]);
  const [followUpsByLead, setFollowUpsByLead] = useState({});
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [datePreset, setDatePreset] = useState('all'); // all | today | 7d | 30d | this_month | custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest | oldest | name_asc

  const leadIdParam = searchParams.get('leadId');
  const selectedLead = useMemo(() => {
    if (!leadIdParam) return null;
    return leads.find((l) => l.id === leadIdParam) || null;
  }, [leadIdParam, leads]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    // Carrega leads
    const { data: leadsData, error: leadsError } = await supabase
      .from('proposal_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (leadsError) {
      console.error('[CrmClientes] erro ao carregar clientes:', leadsError);
      toast.error('Não foi possível carregar os clientes.');
      setLeads([]);
    } else {
      setLeads(leadsData ?? []);
    }

    // Carrega follow-ups pendentes para associar ao lead
    try {
      const { data: fuData } = await supabase
        .from('lead_follow_ups')
        .select('*')
        .eq('completed', false)
        .order('scheduled_at', { ascending: true });

      if (fuData) {
        const map = {};
        fuData.forEach((fu) => {
          if (!map[fu.lead_id]) {
            map[fu.lead_id] = fu; // Primeiro follow-up pendente mais próximo
          }
        });
        setFollowUpsByLead(map);
      }
    } catch (err) {
      console.warn('[CrmClientes] erro ao carregar follow-ups:', err);
    }

    setLoading(false);
  }

  function handleOpenPanorama(lead) {
    setSearchParams({ leadId: lead.id });
  }

  function handleClosePanorama() {
    setSearchParams({});
  }

  function handleUpdateLead(updated) {
    setLeads((items) => items.map((l) => (l.id === updated.id ? updated : l)));
  }

  async function handleDeleteLead(lead) {
    if (!window.confirm(`Excluir permanentemente o cliente ${lead.name}?`)) return;
    const { error } = await supabase.from('proposal_requests').delete().eq('id', lead.id);
    if (error) {
      toast.error('Erro ao excluir cliente.');
      return;
    }
    setLeads((items) => items.filter((l) => l.id !== lead.id));
    handleClosePanorama();
    toast.success('Cliente excluído com sucesso.');
  }

  // Filtragem e Ordenação
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Filtro textual
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          lead.name?.toLowerCase().includes(q) ||
          lead.email?.toLowerCase().includes(q) ||
          lead.whatsapp?.includes(q) ||
          lead.company?.toLowerCase().includes(q) ||
          lead.role?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Filtro de Estágio
      if (statusFilter !== 'all' && lead.status !== statusFilter) {
        return false;
      }

      // 3. Filtro de Data
      if (lead.created_at) {
        const createdDate = new Date(lead.created_at);
        const now = new Date();

        if (datePreset === 'today') {
          const isToday =
            createdDate.getDate() === now.getDate() &&
            createdDate.getMonth() === now.getMonth() &&
            createdDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (datePreset === '7d') {
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          if (createdDate < sevenDaysAgo) return false;
        } else if (datePreset === '30d') {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          if (createdDate < thirtyDaysAgo) return false;
        } else if (datePreset === 'this_month') {
          const isThisMonth =
            createdDate.getMonth() === now.getMonth() &&
            createdDate.getFullYear() === now.getFullYear();
          if (!isThisMonth) return false;
        } else if (datePreset === 'custom') {
          if (startDate && createdDate < new Date(startDate)) return false;
          if (endDate) {
            const endLimit = new Date(endDate);
            endLimit.setHours(23, 59, 59, 999);
            if (createdDate > endLimit) return false;
          }
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });
  }, [leads, search, statusFilter, datePreset, startDate, endDate, sortBy]);

  // Contadores
  const totalOpen = leads.filter((l) => ['new', 'contacted', 'qualified', 'proposal'].includes(l.status)).length;
  const totalWon = leads.filter((l) => l.status === 'won').length;
  const totalPendingFollowUps = Object.keys(followUpsByLead).length;

  return (
    <CrmLayout>
      <div style={{ width: '100%', margin: '0 auto' }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.72rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
              CRM / Base de Contatos
            </div>
            <h1 style={{ margin: 0, fontSize: '2.4rem', lineHeight: 1.05, letterSpacing: '-.04em' }}>Gestão de Clientes</h1>
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: '.95rem' }}>
              Consulte histórico de interações, estágio na jornada e agende lembretes de follow-up.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            style={{
              ...inputSx,
              background: 'var(--panel)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ↻ Atualizar lista
          </button>
        </div>

        {/* Métricas / KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <KpiCard label="Clientes Filtrados" value={filteredLeads.length} sub={`de ${leads.length} totais`} />
          <KpiCard label="Em Negociação" value={totalOpen} color="var(--accent)" />
          <KpiCard label="Clientes Ganhos" value={totalWon} color="#84cc16" />
          <KpiCard label="Com Follow-up Ativo" value={totalPendingFollowUps} color="#38bdf8" />
        </div>

        {/* Barra de Filtros */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '18px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Busca */}
            <div style={{ flex: '1 1 260px' }}>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, e-mail, telefone ou empresa..."
                aria-label="Buscar clientes"
                style={{ ...inputSx, width: '100%' }}
              />
            </div>

            {/* Estágio na Jornada */}
            <div>
              <select
                aria-label="Filtrar por estágio"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ ...inputSx, cursor: 'pointer' }}
              >
                {STATUSES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Intervalo de Data */}
            <div>
              <select
                aria-label="Filtrar por data de cadastro"
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                style={{ ...inputSx, cursor: 'pointer' }}
              >
                <option value="all">Todo o período</option>
                <option value="today">Cadastrados Hoje</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="this_month">Este mês</option>
                <option value="custom">Período customizado...</option>
              </select>
            </div>

            {/* Ordenação */}
            <div>
              <select
                aria-label="Ordenar resultados"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ ...inputSx, cursor: 'pointer' }}
              >
                <option value="newest">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
                <option value="name_asc">Nome (A - Z)</option>
              </select>
            </div>
          </div>

          {/* Filtro Customizado de Datas (De / Até) */}
          {datePreset === 'custom' && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--line)', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.72rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
                Intervalo:
              </span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '.82rem', color: 'var(--muted)' }}>
                De:
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ ...inputSx, padding: '6px 10px' }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '.82rem', color: 'var(--muted)' }}>
                Até:
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ ...inputSx, padding: '6px 10px' }}
                />
              </label>
            </div>
          )}
        </div>

        {/* Tabela de Clientes */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)', fontFamily: 'Space Mono, monospace' }}>
            Carregando clientes...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px' }}>Nenhum cliente encontrado</div>
            <p style={{ color: 'var(--muted)', fontSize: '.9rem', margin: 0 }}>
              Tente alterar os termos da busca ou os filtros de estágio e data.
            </p>
          </div>
        ) : (
          <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg-2)' }}>
                  <th style={thStyle}>Cliente / Empresa</th>
                  <th style={thStyle}>Contato</th>
                  <th style={thStyle}>Jornada (Kanban)</th>
                  <th style={thStyle}>Data de Entrada</th>
                  <th style={thStyle}>Próximo Follow-up</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Panorama</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
                  const statusInfo = STATUS_BY_ID[lead.status || 'new'] ?? STATUS_BY_ID.new;
                  const nextFollowUp = followUpsByLead[lead.id];
                  const isOverdue = nextFollowUp && new Date(nextFollowUp.scheduled_at) < new Date();

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => handleOpenPanorama(lead)}
                      style={{
                        borderBottom: '1px solid var(--line)',
                        cursor: 'pointer',
                        transition: 'background .15s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.03)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Cliente / Empresa */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: 'var(--bg-2)',
                              border: '1px solid var(--line-strong)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: 'Space Mono, monospace',
                              fontSize: '.82rem',
                              fontWeight: 700,
                              color: 'var(--accent)',
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(lead.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text)' }}>
                              {lead.name}
                            </div>
                            <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: '2px' }}>
                              {lead.company} {lead.role ? `• ${lead.role}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contato */}
                      <td style={tdStyle}>
                        <div style={{ fontSize: '.85rem' }}>{lead.whatsapp || '—'}</div>
                        <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '2px' }}>{lead.email}</div>
                      </td>

                      {/* Estágio na Jornada */}
                      <td style={tdStyle}>
                        <span
                          style={{
                            display: 'inline-block',
                            fontFamily: 'Space Mono, monospace',
                            fontSize: '.68rem',
                            padding: '3px 8px',
                            borderRadius: '3px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: `${statusInfo.color}1c`,
                            color: statusInfo.color,
                            border: `1px solid ${statusInfo.color}38`,
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Data de Entrada */}
                      <td style={tdStyle}>
                        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.78rem', color: 'var(--muted)' }}>
                          {fmtDate(lead.created_at)}
                        </span>
                      </td>

                      {/* Próximo Follow-up */}
                      <td style={tdStyle}>
                        {nextFollowUp ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '.75rem',
                              fontFamily: 'Space Mono, monospace',
                              padding: '2px 8px',
                              borderRadius: '3px',
                              background: isOverdue ? 'rgba(239,68,68,.12)' : 'rgba(56,189,248,.12)',
                              color: isOverdue ? '#f87171' : '#38bdf8',
                              border: `1px solid ${isOverdue ? 'rgba(239,68,68,.3)' : 'rgba(56,189,248,.3)'}`,
                            }}
                          >
                            🔔 {fmtDate(nextFollowUp.scheduled_at)} {isOverdue && '(Atrasado)'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: '.78rem' }}>Sem agendamento</span>
                        )}
                      </td>

                      {/* Ação */}
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPanorama(lead);
                          }}
                          style={{
                            background: 'var(--panel-2)',
                            border: '1px solid var(--line-strong)',
                            borderRadius: '4px',
                            color: 'var(--accent)',
                            fontFamily: 'Space Mono, monospace',
                            fontSize: '.75rem',
                            padding: '6px 12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Ver Panorama →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer Panorama 360° */}
      {selectedLead && (
        <ClientePanoramaDrawer
          key={selectedLead.id}
          lead={selectedLead}
          currentUser={user}
          isAdmin={isAdmin}
          onClose={handleClosePanorama}
          onUpdateLead={handleUpdateLead}
          onDeleteLead={handleDeleteLead}
        />
      )}
    </CrmLayout>
  );
}

/**
 * @param {{ label: string; value: number | string; sub?: string; color?: string }} props
 */
function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '14px 16px' }}>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.68rem', color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1, color: color || 'var(--text)' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

const thStyle = {
  fontFamily: 'Space Mono, monospace',
  fontSize: '.7rem',
  color: 'var(--muted)',
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  padding: '14px 18px',
  fontWeight: 700,
};

const tdStyle = {
  padding: '14px 18px',
  verticalAlign: 'middle',
};
