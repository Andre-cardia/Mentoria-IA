import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import CrmLayout from '../../components/CrmLayout';
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
const SYSTEM_OWNER = 'Sistema Neural Hub';

const panelSx = {
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  borderRadius: '6px',
  padding: '18px',
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

function pct(value, total) {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

function daysSince(value) {
  if (!value) return 0;
  return Math.max(0, (Date.now() - new Date(value).getTime()) / 86400000);
}

function groupCount(leads, getKey) {
  return leads.reduce((acc, lead) => {
    const key = getKey(lead) || 'Nao informado';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function toRows(grouped) {
  return Object.entries(grouped)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function sourceLabel(source) {
  if (source === 'crm-manual') return 'Cadastro manual';
  if (source === 'neural-hub-proposta') return 'Site Neural Hub';
  return source || 'Nao informado';
}

function ownerLabel(lead) {
  if ((lead.owner_type || 'system') === 'system') return SYSTEM_OWNER;
  return lead.owner_name || lead.owner_email || 'Responsavel nao informado';
}

export default function CrmReportsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ownerFilter, setOwnerFilter] = useState('all');

  useEffect(() => { loadLeads(); }, []);

  async function loadLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from('proposal_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CrmReports] load error:', error);
      toast.error('Nao foi possivel carregar os relatorios.');
      setLeads([]);
    } else {
      setLeads(data ?? []);
    }
    setLoading(false);
  }

  const ownerOptions = useMemo(() => {
    const names = new Set([SYSTEM_OWNER]);
    leads.forEach((lead) => names.add(ownerLabel(lead)));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [leads]);

  const scopedLeads = useMemo(() => (
    ownerFilter === 'all' ? leads : leads.filter((lead) => ownerLabel(lead) === ownerFilter)
  ), [leads, ownerFilter]);

  const metrics = useMemo(() => {
    const total = scopedLeads.length;
    const open = scopedLeads.filter((lead) => !['won', 'lost'].includes(lead.status || 'new'));
    const won = scopedLeads.filter((lead) => lead.status === 'won').length;
    const lost = scopedLeads.filter((lead) => lead.status === 'lost').length;
    const closed = won + lost;
    const proposalReached = scopedLeads.filter((lead) => ['proposal', 'won'].includes(lead.status || 'new')).length;
    const averageOpenAge = open.length
      ? Math.round(open.reduce((sum, lead) => sum + daysSince(lead.created_at), 0) / open.length)
      : 0;

    return {
      total,
      open: open.length,
      won,
      lost,
      winRate: pct(won, closed),
      proposalRate: pct(proposalReached, total),
      lossRate: pct(lost, closed),
      averageOpenAge,
      statusRows: STATUSES.map((status) => ({
        label: status.label,
        value: scopedLeads.filter((lead) => (lead.status || 'new') === status.id).length,
        color: status.color,
      })),
      sourceRows: toRows(groupCount(scopedLeads, (lead) => sourceLabel(lead.source))),
      ownerRows: toRows(groupCount(scopedLeads, ownerLabel)),
      sizeRows: toRows(groupCount(scopedLeads, (lead) => lead.company_size)),
      urgencyRows: toRows(groupCount(scopedLeads, (lead) => lead.urgency)),
    };
  }, [scopedLeads]);

  return (
    <CrmLayout>
      <div style={{ width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
              CRM / Relatorios
            </div>
            <h1 style={{ margin: 0, fontSize: '2rem', lineHeight: 1, letterSpacing: '-.04em' }}>Metricas Comerciais</h1>
            <p style={{ margin: '10px 0 0', maxWidth: '760px', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.82rem', lineHeight: 1.7 }}>
              Visao executiva do funil: volume, conversao, origem, responsaveis e distribuicao dos leads.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)} style={{ ...inputSx, minWidth: '240px', cursor: 'pointer' }}>
              <option value="all">Todos os responsaveis</option>
              {ownerOptions.map((owner) => <option key={owner} value={owner}>{owner}</option>)}
            </select>
            <button
              onClick={loadLeads}
              disabled={loading}
              style={{ ...inputSx, cursor: loading ? 'not-allowed' : 'pointer', color: 'var(--accent)', fontFamily: 'Space Mono, monospace', fontSize: '.72rem', letterSpacing: '.12em', textTransform: 'uppercase' }}
            >
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ ...panelSx, padding: '48px', color: 'var(--muted)' }}>Carregando relatorios...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '18px' }}>
              <Metric label="Leads totais" value={metrics.total} />
              <Metric label="Em aberto" value={metrics.open} />
              <Metric label="Ganhos" value={metrics.won} />
              <Metric label="Perdidos" value={metrics.lost} />
              <Metric label="Win rate" value={metrics.winRate} />
              <Metric label="Taxa proposta" value={metrics.proposalRate} />
              <Metric label="Loss rate" value={metrics.lossRate} />
              <Metric label="Idade media" value={`${metrics.averageOpenAge}d`} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', alignItems: 'start' }}>
              <ReportPanel title="Funil por etapa" rows={metrics.statusRows} total={metrics.total} />
              <ReportPanel title="Origem dos leads" rows={metrics.sourceRows} total={metrics.total} />
              <ReportPanel title="Responsaveis" rows={metrics.ownerRows} total={metrics.total} />
              <ReportPanel title="Porte da empresa" rows={metrics.sizeRows} total={metrics.total} />
              <ReportPanel title="Momento comercial" rows={metrics.urgencyRows} total={metrics.total} wide />
              <section style={{ ...panelSx }}>
                <h2 style={{ margin: 0, fontSize: '1rem', letterSpacing: '-.02em' }}>Leitura rapida</h2>
                <div style={{ marginTop: '14px', display: 'grid', gap: '10px', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.76rem', lineHeight: 1.7 }}>
                  <p style={{ margin: 0 }}>Win rate considera apenas leads fechados como ganho ou perdido.</p>
                  <p style={{ margin: 0 }}>Taxa de proposta mede quantos leads chegaram em proposta ou ganho.</p>
                  <p style={{ margin: 0 }}>Idade media usa apenas leads em aberto para indicar envelhecimento do pipeline.</p>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </CrmLayout>
  );
}

function Metric({ label, value }) {
  return (
    <div style={panelSx}>
      <div style={{ color: 'var(--accent)', fontSize: '1.8rem', fontWeight: 700, lineHeight: 1 }}>{value}</div>
      <div style={{ marginTop: '8px', fontFamily: 'Space Mono, monospace', fontSize: '.68rem', color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}

function ReportPanel({ title, rows, total, wide }) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <section style={{ ...panelSx, gridColumn: wide ? '1 / -1' : undefined }}>
      <h2 style={{ margin: 0, fontSize: '1rem', letterSpacing: '-.02em' }}>{title}</h2>
      <div style={{ marginTop: '14px', display: 'grid', gap: '12px' }}>
        {rows.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.76rem' }}>Sem dados.</div>
        ) : rows.map((row) => {
          const width = `${Math.max(4, (row.value / max) * 100)}%`;
          return (
            <div key={row.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: 'var(--text)', fontSize: '.86rem' }}>
                <span>{STATUS_BY_ID[row.label]?.label ?? row.label}</span>
                <span style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace' }}>{row.value} / {pct(row.value, total)}</span>
              </div>
              <div style={{ height: '8px', marginTop: '7px', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width, height: '100%', background: row.color || 'var(--accent)' }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
