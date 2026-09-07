import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

function fmtTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function FollowUpAlertNotifier() {
  const navigate = useNavigate();
  const [activeAlert, setActiveAlert] = useState(null);
  const [dismissedIds, setDismissedIds] = useState(() => new Set());
  const [acting, setActing] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    async function checkDueFollowUps() {
      try {
        const nowLimit = new Date(Date.now() + 60 * 1000).toISOString(); // Próximos 60 segundos ou vencidos
        const selectBuilder = supabase
          .from('lead_follow_ups')
          ?.select?.(`
            id,
            title,
            notes,
            scheduled_at,
            lead_id,
            proposal_requests (
              id,
              name,
              company,
              whatsapp,
              email,
              status
            )
          `);

        if (typeof selectBuilder?.eq !== 'function') {
          return;
        }

        const { data, error } = await selectBuilder
          .eq('completed', false)
          .lte('scheduled_at', nowLimit)
          .order('scheduled_at', { ascending: true })
          .limit(5);

        if (!isSubscribed || error || !data || data.length === 0) return;

        // Encontra o primeiro que ainda não foi dispensado nesta sessão
        const nextDue = data.find((item) => !dismissedIds.has(item.id));
        if (nextDue) {
          setActiveAlert((current) => (current?.id === nextDue.id ? current : nextDue));
        }
      } catch (err) {
        console.warn('[FollowUpAlert] erro ao verificar alertas:', err);
      }
    }

    // Checagem imediata e intervalo a cada 30 segundos
    checkDueFollowUps();
    const interval = setInterval(checkDueFollowUps, 30000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [dismissedIds]);

  async function handleComplete() {
    if (!activeAlert) return;
    setActing(true);
    const { error } = await supabase
      .from('lead_follow_ups')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', activeAlert.id);

    setActing(false);
    if (error) {
      toast.error('Erro ao concluir follow-up.');
      return;
    }

    toast.success('Follow-up marcado como concluído!');
    setDismissedIds((prev) => new Set([...prev, activeAlert.id]));
    setActiveAlert(null);
  }

  async function handleSnooze(minutes = 15) {
    if (!activeAlert) return;
    setActing(true);
    const nextTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('lead_follow_ups')
      .update({ scheduled_at: nextTime })
      .eq('id', activeAlert.id);

    setActing(false);
    if (error) {
      toast.error('Erro ao adiar lembrete.');
      return;
    }

    toast.info(`Lembrete adiado em ${minutes} minutos.`);
    setDismissedIds((prev) => new Set([...prev, activeAlert.id]));
    setActiveAlert(null);
  }

  function handleDismiss() {
    if (activeAlert) {
      setDismissedIds((prev) => new Set([...prev, activeAlert.id]));
      setActiveAlert(null);
    }
  }

  function handleOpenClient() {
    if (activeAlert?.lead_id) {
      setDismissedIds((prev) => new Set([...prev, activeAlert.id]));
      const leadId = activeAlert.lead_id;
      setActiveAlert(null);
      navigate(`/crm/clientes?leadId=${leadId}`);
    }
  }

  if (!activeAlert) return null;

  const lead = activeAlert.proposal_requests;
  const isOverdue = new Date(activeAlert.scheduled_at) < new Date();

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-followup-title"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 100,
        width: 'min(420px, calc(100vw - 32px))',
        background: 'var(--panel)',
        border: '2px solid var(--accent)',
        boxShadow: '0 16px 36px rgba(0,0,0,.6), 0 0 24px rgba(255,106,0,.2)',
        borderRadius: '8px',
        padding: '20px',
        animation: 'slideUpAlert .25s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.3rem' }}>🔔</span>
          <div>
            <div
              id="alert-followup-title"
              style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '.72rem',
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: isOverdue ? '#f87171' : 'var(--accent)',
                fontWeight: 700,
              }}
            >
              {isOverdue ? 'Lembrete Atrasado' : 'Lembrete de Follow-up'}
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '2px' }}>
              Horário previsto: {fmtDate(activeAlert.scheduled_at)} às {fmtTime(activeAlert.scheduled_at)}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dispensar alerta de follow-up"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '2px 6px',
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ background: 'var(--bg)', borderRadius: '6px', padding: '12px', marginBottom: '14px', border: '1px solid var(--line)' }}>
        <div style={{ fontWeight: 700, fontSize: '.98rem', color: 'var(--text)', marginBottom: '4px' }}>
          {activeAlert.title}
        </div>
        {lead && (
          <div style={{ fontSize: '.85rem', color: 'var(--accent)', fontWeight: 600 }}>
            {lead.name} • <span style={{ color: 'var(--muted)' }}>{lead.company}</span>
          </div>
        )}
        {activeAlert.notes && (
          <div style={{ marginTop: '8px', fontSize: '.8rem', color: 'var(--muted)', lineHeight: 1.4 }}>
            {activeAlert.notes}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button
          type="button"
          disabled={acting}
          onClick={handleComplete}
          style={{
            background: 'var(--accent)',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            padding: '9px 12px',
            fontWeight: 700,
            fontSize: '.82rem',
            cursor: acting ? 'not-allowed' : 'pointer',
          }}
        >
          ✓ Marcar Feito
        </button>

        <button
          type="button"
          disabled={acting}
          onClick={() => handleSnooze(15)}
          style={{
            background: 'var(--panel-2)',
            color: 'var(--text)',
            border: '1px solid var(--line-strong)',
            borderRadius: '4px',
            padding: '9px 12px',
            fontSize: '.82rem',
            cursor: acting ? 'not-allowed' : 'pointer',
          }}
        >
          ⏱ Adiar 15 min
        </button>

        <button
          type="button"
          onClick={handleOpenClient}
          style={{
            gridColumn: '1 / -1',
            background: 'transparent',
            color: 'var(--muted)',
            border: '1px solid var(--line)',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '.78rem',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          Visualizar Panorama do Cliente →
        </button>
      </div>
    </div>
  );
}
