import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';
import { GRANTABLE_RANKS } from '../../lib/starRace';
import {
  ANNIVERSARY_NOTICE_DAYS, INACTIVITY_ALERT_DAYS, filterByJoinDate, inactivityStatus,
  sortStudents, studentsEmailCsv, upcomingAnniversaries, withOverview,
} from '../../lib/students';

const STATUS_LABEL = { active: 'Ativo', suspended: 'Suspenso', cancelled: 'Cancelado' };
const STATUS_COLOR = {
  active:    { color: 'var(--success)', bg: 'rgba(34,197,94,.1)',  border: 'rgba(34,197,94,.25)' },
  suspended: { color: 'var(--warning)', bg: 'rgba(251,191,36,.1)', border: 'rgba(251,191,36,.25)' },
  cancelled: { color: 'var(--danger)', bg: 'rgba(248,113,113,.1)', border: 'rgba(248,113,113,.25)' },
};

/** @typedef {{ user_id: string, full_name?: string, email?: string, phone?: string, origin?: string, status?: keyof typeof STATUS_COLOR, created_at?: string }} Student */
/** @typedef {{ email: string, plan?: string, amount?: number, purchased_at?: string }} PendingRegistration */

const inputStyle = {
  width: '100%', background: 'var(--bg-2)', border: '1px solid var(--line-strong)',
  borderRadius: '4px', padding: '10px 14px', color: 'var(--text)',
  fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem', outline: 'none',
};

const labelStyle = {
  fontFamily: 'Space Mono, monospace', fontSize: '.65rem',
  color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em',
};

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` };
}

// ── Modal genérico ────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
      <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '8px', width: '100%', maxWidth: '480px', padding: '32px', position: 'relative' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px' }}>{title}</h2>
        {children}
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
      </div>
    </div>
  );
}

// ── Aval de patente (Corrida Estelar) ────────────────────────
const RANK_EFFECT = {
  primeiro_oficial: 'promoção por mérito',
  comandante: 'libera a Galáxia Avançada',
  master: 'certificação aprovada',
};

function RankForm({ initial = /** @type {{ rank?: string, note?: string }} */ ({}), onSave, onCancel, loading }) {
  const [rank, setRank] = useState(initial.rank ?? '');
  const [note, setNote] = useState(initial.note ?? '');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ rank, note }); }} style={{ display: 'grid', gap: '16px' }}>
      <p style={{ color: 'var(--muted)', fontSize: '.875rem', lineHeight: 1.6, margin: 0 }}>
        Cadete e Primeiro Oficial vêm dos pontos do aluno na Corrida Estelar. Comandante e Master só existem com o seu aval:
        Comandante libera a Galáxia Avançada e Master leva o aluno à Estrela da Certificação.
      </p>
      <div style={{ display: 'grid', gap: '6px' }}>
        <label htmlFor="rank-select" style={labelStyle}>Patente concedida</label>
        <select id="rank-select" value={rank} onChange={(e) => setRank(e.target.value)} style={inputStyle}>
          <option value="">Sem aval (o aluno para antes da Galáxia Avançada)</option>
          {GRANTABLE_RANKS.map((item) => (
            <option key={item.id} value={item.id}>{'★'.repeat(item.stars)} {item.name} — {RANK_EFFECT[item.id]}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'grid', gap: '6px' }}>
        <label htmlFor="rank-note" style={labelStyle}>Motivo (opcional)</label>
        <input id="rank-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Ex.: ajudou colegas no fórum" style={inputStyle} />
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="submit" disabled={loading} style={{
          flex: 1, padding: '10px', background: 'var(--accent)', color: '#261000', border: 'none', borderRadius: '4px',
          fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
        }}>
          {loading ? 'Salvando...' : 'Salvar patente'}
        </button>
        <button type="button" onClick={onCancel} style={{
          padding: '10px 20px', background: 'transparent', border: '1px solid var(--line)',
          borderRadius: '4px', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
        }}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── Formulário de alteração de senha ─────────────────────────
function ChangePasswordForm({ onSave, onCancel, loading }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setLocalError('Senha deve ter pelo menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError('As senhas não coincidem');
      return;
    }
    setLocalError('');
    onSave({ password: newPassword });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={labelStyle}>Nova senha *</label>
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
          placeholder="mínimo 8 caracteres"
          style={inputStyle}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={labelStyle}>Confirmar nova senha *</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          placeholder="repita a senha"
          style={inputStyle}
        />
      </div>
      {localError && (
        <p style={{ color: 'var(--danger)', fontFamily: 'Space Mono, monospace', fontSize: '.75rem', margin: 0 }}>
          {localError}
        </p>
      )}
      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <button type="submit" disabled={loading} style={{
          flex: 1, padding: '10px', background: loading ? 'rgba(255,106,0,.5)' : 'var(--accent)',
          color: '#000', border: 'none', borderRadius: '4px',
          fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Redefinindo...' : 'Redefinir'}
        </button>
        <button type="button" onClick={onCancel} style={{
          padding: '10px 20px', background: 'transparent', border: '1px solid var(--line)',
          borderRadius: '4px', color: 'var(--muted)', cursor: 'pointer',
          fontFamily: 'Space Grotesk, sans-serif',
        }}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── Formulário de aluno (criar / editar) ──────────────────────
function StudentForm({ initial = /** @type {{ full_name?: string, email?: string, phone?: string, origin?: string, status?: string, user_id?: string }} */ ({}), onSave, onCancel, loading }) {
  const [fullName, setFullName] = useState(initial.full_name ?? '');
  const [email, setEmail] = useState(initial.email ?? '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [origin, setOrigin] = useState(initial.origin ?? '');
  const [status, setStatus] = useState(initial.status ?? 'active');
  const isNew = !initial.user_id;

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ full_name: fullName, email, password, phone, origin, status });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={labelStyle}>Nome completo *</label>
        <input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Nome completo" style={inputStyle} />
      </div>

      {isNew && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={labelStyle}>E-mail *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="email@exemplo.com" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={labelStyle}>Senha *</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="mínimo 6 caracteres" style={inputStyle} />
          </div>
        </>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={labelStyle}>WhatsApp</label>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(48) 99999-9999" style={inputStyle} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={labelStyle}>Como ficou sabendo?</label>
        <select value={origin} onChange={e => setOrigin(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Selecione</option>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
          <option value="linkedin">LinkedIn</option>
          <option value="indicacao">Indicação</option>
          <option value="google">Google</option>
          <option value="outro">Outro</option>
        </select>
      </div>

      {!isNew && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={labelStyle}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="active">Ativo</option>
            <option value="suspended">Suspenso</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <button type="submit" disabled={loading} style={{
          flex: 1, padding: '10px', background: loading ? 'rgba(255,106,0,.5)' : 'var(--accent)',
          color: '#000', border: 'none', borderRadius: '4px',
          fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Salvando...' : isNew ? 'Criar aluno' : 'Salvar'}
        </button>
        <button type="button" onClick={onCancel} style={{
          padding: '10px 20px', background: 'transparent', border: '1px solid var(--line)',
          borderRadius: '4px', color: 'var(--muted)', cursor: 'pointer',
          fontFamily: 'Space Grotesk, sans-serif',
        }}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── Alerta de inatividade: desativar com observação ou reativar ──
function InactivityForm({ initialNote = '', days, onSave, onCancel, loading }) {
  const [note, setNote] = useState(initialNote);
  const dismissed = Boolean(initialNote);

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (note.trim()) onSave(note.trim()); }} style={{ display: 'grid', gap: '16px' }}>
      <p style={{ color: 'var(--muted)', fontSize: '.875rem', lineHeight: 1.6, margin: 0 }}>
        Sem acesso há {days} dias. Registre uma observação para desativar o alerta deste aluno.
        Se ele voltar a acessar a plataforma, o alerta some sozinho e a observação deixa de valer.
      </p>
      <div style={{ display: 'grid', gap: '6px' }}>
        <label htmlFor="inactivity-note" style={labelStyle}>Observação</label>
        <textarea id="inactivity-note" value={note} onChange={(e) => setNote(e.target.value)} required rows={3} maxLength={500}
          placeholder="Ex.: avisou que está em viagem até o fim do mês" style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button type="submit" disabled={loading || !note.trim()} style={{
          flex: 1, padding: '10px', background: 'var(--accent)', color: '#261000', border: 'none', borderRadius: '4px',
          fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading || !note.trim() ? 0.6 : 1,
        }}>
          {loading ? 'Salvando...' : dismissed ? 'Salvar observação' : 'Desativar alerta'}
        </button>
        {dismissed && (
          <button type="button" onClick={() => onSave('')} disabled={loading} style={{
            padding: '10px 16px', background: 'transparent', border: '1px solid var(--danger)',
            borderRadius: '4px', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
          }}>
            Reativar alerta
          </button>
        )}
        <button type="button" onClick={onCancel} style={{
          padding: '10px 20px', background: 'transparent', border: '1px solid var(--line)',
          borderRadius: '4px', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
        }}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── Cabeçalho de coluna ordenável ─────────────────────────────
function SortHeader({ label, sortKey, sort, onSort }) {
  const active = sort.key === sortKey;
  const ascending = sort.direction === 'asc';
  return (
    <button
      type="button" onClick={() => onSort(sortKey)}
      aria-label={`Ordenar por ${label.toLowerCase()}${active ? (ascending ? ', crescente' : ', decrescente') : ''}`}
      style={{
        all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
        color: active ? 'var(--text)' : 'inherit', fontWeight: active ? 700 : 400,
      }}
    >
      {label}
      <span aria-hidden="true">{active ? (ascending ? '↑' : '↓') : '↕'}</span>
    </button>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function AdminAlunosPage() {
  const [students, setStudents] = useState(/** @type {Student[]} */ ([]));
  const [pendingRegistration, setPendingRegistration] = useState(/** @type {PendingRegistration[]} */ ([]));
  const [tab, setTab] = useState('enrolled'); // 'enrolled' | 'pending'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | { type: 'create' | 'edit' | 'delete', student? }
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [sort, setSort] = useState({ key: 'created_at', direction: 'desc' });
  const [overview, setOverview] = useState([]);

  // Pontos e último acesso: complemento da lista; se falhar, a tela segue sem eles.
  const loadOverview = useCallback(async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc('admin_student_overview');
      if (!rpcError) setOverview(data ?? []);
    } catch (loadError) {
      console.error('Error in loadOverview:', loadError);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(loadOverview); }, [loadOverview]);

  async function handleInactivity(note) {
    setSaving(true); setActionError('');
    const { error: rpcError } = await supabase.rpc('admin_set_inactivity_alert', {
      p_user_id: modal.student.user_id, p_note: note || null,
    });
    setSaving(false);
    if (rpcError) { setActionError(rpcError.message || 'Não foi possível salvar a observação.'); return; }
    setModal(null);
    loadOverview();
  }

  const [joinFrom, setJoinFrom] = useState('');
  const [joinTo, setJoinTo] = useState('');
  const [promotions, setPromotions] = useState(/** @type {Record<string, { rank: string, note?: string }>} */ ({}));

  const loadPromotions = useCallback(async () => {
    // As patentes são um complemento: se a leitura falhar, a lista de alunos segue normal.
    try {
      const { data } = await supabase.from('rank_promotions').select('user_id, rank, note');
      setPromotions(Object.fromEntries((data ?? []).map((row) => [row.user_id, row])));
    } catch (loadError) {
      console.error('Error in loadPromotions:', loadError);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(loadPromotions); }, [loadPromotions]);

  async function handleRank({ rank, note }) {
    setSaving(true); setActionError('');
    const { error: rpcError } = await supabase.rpc('admin_set_rank_promotion', {
      p_user_id: modal.student.user_id, p_rank: rank || null, p_note: note || null,
    });
    setSaving(false);
    if (rpcError) { setActionError(rpcError.message || 'Não foi possível salvar a patente.'); return; }
    setModal(null);
    loadPromotions();
  }

  const load = useCallback(async () => {
    setLoading(true);
    const headers = await authHeaders();
    const res = await fetch('/api/admin/students', { headers });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Erro ao carregar'); }
    else { setStudents(data.students ?? []); setPendingRegistration(data.pendingRegistration ?? []); }
    setLoading(false);
  }, []);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const enriched = withOverview(students, overview);
  const inactiveCount = enriched.filter((student) => inactivityStatus(student).alert).length;
  const searched = tab === 'enrolled'
    ? enriched.filter(s =>
        !search ||
        s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.phone?.includes(search)
      )
    : enriched;
  const filtered = sortStudents(filterByJoinDate(searched, joinFrom, joinTo), sort.key, sort.direction);
  const anniversaries = upcomingAnniversaries(students);

  // Clicar no cabeçalho ordena por ele; clicar de novo inverte a ordem.
  function toggleSort(key) {
    setSort((current) => (current.key === key
      ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { key, direction: key === 'name' ? 'asc' : 'desc' }));
  }

  // Exporta os e-mails da lista como está na tela (busca e filtro de data aplicados).
  function exportEmails() {
    const blob = new Blob(['\uFEFF' + studentsEmailCsv(filtered)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alunos-emails-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleCreate({ full_name, email, password, phone, origin }) {
    setSaving(true); setActionError('');
    const headers = await authHeaders();
    const res = await fetch('/api/admin/students', {
      method: 'POST', headers,
      body: JSON.stringify({ full_name, email, password, phone, origin }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setActionError(data.error ?? 'Erro ao criar aluno'); return; }
    setModal(null);
    setTab('enrolled');
    load();
  }

  async function handleEdit({ full_name, phone, origin, status }) {
    setSaving(true); setActionError('');
    const headers = await authHeaders();
    const res = await fetch(`/api/admin/students/${modal.student.user_id}`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ full_name, phone, origin, status }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setActionError(data.error ?? 'Erro ao salvar'); return; }
    setModal(null);
    load();
  }

  async function handleDelete() {
    setSaving(true); setActionError('');
    const headers = await authHeaders();
    const res = await fetch(`/api/admin/students/${modal.student.user_id}`, {
      method: 'DELETE', headers,
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setActionError(data.error ?? 'Erro ao excluir'); return; }
    setModal(null);
    load();
  }

  async function handleChangePassword({ password }) {
    setSaving(true); setActionError('');
    const headers = await authHeaders();
    const res = await fetch(`/api/admin/students/${modal.student.user_id}/password`, {
      method: 'POST', headers,
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setActionError(data.error ?? 'Erro ao redefinir senha'); return; }
    setModal(null);
    load();
  }

  async function quickStatus(student, status) {
    const headers = await authHeaders();
    await fetch(`/api/admin/students/${student.user_id}`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent-text)', marginBottom: '6px' }}>
              Gestão
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Alunos</h1>
            <p style={{ color: 'var(--muted)', fontSize: '.875rem', margin: '6px 0 0' }}>
              {students.length} aluno{students.length !== 1 ? 's' : ''} cadastrado{students.length !== 1 ? 's' : ''}
              {pendingRegistration.length > 0 && (
                <span style={{ marginLeft: '10px', fontFamily: 'Space Mono, monospace', fontSize: '.7rem',
                  color: 'var(--warning)', background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.25)',
                  borderRadius: '3px', padding: '1px 7px' }}>
                  {pendingRegistration.length} aguardando cadastro
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => { setActionError(''); setModal({ type: 'create' }); }}
            style={{
              padding: '10px 22px', background: 'var(--accent)', color: '#000',
              border: 'none', borderRadius: '4px', fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700, fontSize: '.9rem', cursor: 'pointer',
            }}
          >
            + Novo aluno
          </button>
        </div>

        {/* Aviso automático: alunos perto de completar 1 ano de plataforma */}
        {anniversaries.length > 0 && (
          <section aria-labelledby="aviso-um-ano" style={{ border: '1px solid var(--accent)', background: 'var(--accent-soft)', borderRadius: '6px', padding: '16px 20px', marginBottom: '24px' }}>
            <h2 id="aviso-um-ano" style={{ ...labelStyle, fontSize: '.7rem', fontWeight: 700, color: 'var(--accent-text)', margin: '0 0 10px' }}>
              1 ano de plataforma nos próximos {ANNIVERSARY_NOTICE_DAYS} dias · {anniversaries.length} aluno{anniversaries.length === 1 ? '' : 's'}
            </h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '6px' }}>
              {anniversaries.map((student) => (
                <li key={student.user_id} style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', alignItems: 'baseline', fontSize: '.9rem' }}>
                  <strong style={{ fontWeight: 600 }}>{student.full_name}</strong>
                  <span style={{ color: 'var(--muted)' }}>{student.email}</span>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.75rem', marginLeft: 'auto' }}>
                    {student.anniversary.toLocaleDateString('pt-BR')} · {student.daysLeft === 0 ? 'hoje' : `em ${student.daysLeft} dia${student.daysLeft === 1 ? '' : 's'}`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {inactiveCount > 0 && (
          <p role="status" style={{ color: 'var(--danger)', fontSize: '.875rem', fontWeight: 600, margin: '0 0 20px' }}>
            {inactiveCount} aluno{inactiveCount === 1 ? '' : 's'} sem acessar a plataforma há mais de {INACTIVITY_ALERT_DAYS} dias (em vermelho na lista).
          </p>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '0' }}>
          {[
            { key: 'enrolled', label: 'Matriculados', count: students.length },
            { key: 'pending',  label: 'Aguardando cadastro', count: pendingRegistration.length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setSearch(''); }}
              style={{
                padding: '8px 18px', background: 'transparent', border: 'none',
                borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
                color: tab === key ? 'var(--text)' : 'var(--muted)',
                fontFamily: 'Space Grotesk, sans-serif', fontWeight: tab === key ? 600 : 400,
                fontSize: '.875rem', cursor: 'pointer', marginBottom: '-1px',
                transition: 'color .15s',
              }}
            >
              {label}
              {count > 0 && (
                <span style={{
                  marginLeft: '7px', fontFamily: 'Space Mono, monospace', fontSize: '.65rem',
                  background: tab === key ? 'var(--accent-soft)' : 'var(--bg-2)',
                  color: tab === key ? 'var(--accent-text)' : 'var(--muted)',
                  border: `1px solid ${tab === key ? 'rgba(255,106,0,.25)' : 'var(--line)'}`,
                  borderRadius: '3px', padding: '1px 6px',
                }}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 16px', alignItems: 'flex-end', marginBottom: '20px' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            aria-label="Buscar"
            placeholder={tab === 'enrolled' ? 'Buscar por nome, e-mail ou telefone...' : 'Buscar por e-mail...'}
            style={{ ...inputStyle, flex: '1 1 260px', maxWidth: '400px' }}
          />
          {tab === 'enrolled' && (
            <>
              <div style={{ display: 'grid', gap: '4px' }}>
                <label htmlFor="join-from" style={labelStyle}>Ingresso de</label>
                <input id="join-from" type="date" value={joinFrom} max={joinTo || undefined} onChange={e => setJoinFrom(e.target.value)} style={{ ...inputStyle, width: 'auto' }} />
              </div>
              <div style={{ display: 'grid', gap: '4px' }}>
                <label htmlFor="join-to" style={labelStyle}>até</label>
                <input id="join-to" type="date" value={joinTo} min={joinFrom || undefined} onChange={e => setJoinTo(e.target.value)} style={{ ...inputStyle, width: 'auto' }} />
              </div>
              {(joinFrom || joinTo) && (
                <button type="button" onClick={() => { setJoinFrom(''); setJoinTo(''); }} style={{ padding: '10px 14px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem' }}>
                  Limpar datas
                </button>
              )}
              <button type="button" onClick={exportEmails} disabled={filtered.length === 0} style={{ marginLeft: 'auto', padding: '10px 16px', background: 'transparent', border: '1px solid var(--line-strong)', borderRadius: '4px', color: 'var(--text)', cursor: filtered.length === 0 ? 'not-allowed' : 'pointer', opacity: filtered.length === 0 ? 0.5 : 1, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '.85rem' }}>
                Exportar e-mails (.csv)
              </button>
            </>
          )}
        </div>
        {tab === 'enrolled' && (search || joinFrom || joinTo) && !loading && (
          <p style={{ color: 'var(--muted)', fontSize: '.8rem', margin: '-8px 0 14px' }}>
            Mostrando {filtered.length} de {students.length} aluno{students.length === 1 ? '' : 's'}.
          </p>
        )}

        {loading && <p style={{ color: 'var(--muted)' }}>Carregando...</p>}
        {error && <p style={{ color: 'var(--danger)', fontFamily: 'Space Mono, monospace', fontSize: '.8rem' }}>{error}</p>}

        {/* Tabela — Matriculados */}
        {!loading && tab === 'enrolled' && (
          <div style={{ border: '1px solid var(--line)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1.2fr) minmax(0,.8fr) minmax(0,.6fr) minmax(0,.45fr) minmax(0,.6fr) auto',
              padding: '10px 20px', background: 'var(--bg-2)',
              borderBottom: '1px solid var(--line)',
              fontFamily: 'Space Mono, monospace', fontSize: '.65rem',
              color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', gap: '12px',
            }}>
              <SortHeader label="Nome" sortKey="name" sort={sort} onSort={toggleSort} />
              <span>E-mail</span><span>WhatsApp</span>
              <SortHeader label="Ingresso" sortKey="created_at" sort={sort} onSort={toggleSort} />
              <SortHeader label="Pontos" sortKey="points" sort={sort} onSort={toggleSort} />
              <span>Status</span><span>Ações</span>
            </div>

            {filtered.length === 0 && (
              <p style={{ padding: '24px 20px', color: 'var(--muted)', fontSize: '.875rem' }}>
                {search || joinFrom || joinTo ? 'Nenhum aluno encontrado.' : 'Nenhum aluno cadastrado.'}
              </p>
            )}

            {filtered.map((s, i) => {
              const sc = STATUS_COLOR[s.status] ?? STATUS_COLOR.active;
              const inactivity = inactivityStatus(s);
              const rowBg = inactivity.alert ? 'rgba(248,113,113,.08)' : 'transparent';
              return (
                <div key={s.user_id} style={{
                  display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1.2fr) minmax(0,.8fr) minmax(0,.6fr) minmax(0,.45fr) minmax(0,.6fr) auto',
                  padding: '14px 20px', gap: '12px', alignItems: 'center',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--line)' : 'none',
                  transition: 'background .15s',
                  background: rowBg,
                  boxShadow: inactivity.alert ? 'inset 3px 0 0 var(--danger)' : 'none',
                }}
                data-inactive={inactivity.alert ? 'true' : undefined}
                onMouseOver={e => e.currentTarget.style.background = 'var(--hover)'}
                onMouseOut={e => e.currentTarget.style.background = rowBg}
                >
                  <div>
                    <div style={{ fontWeight: inactivity.alert ? 700 : 500, fontSize: '.9rem', color: inactivity.alert ? 'var(--danger)' : 'inherit' }}>
                      {s.full_name}
                      {promotions[s.user_id] && (
                        <span title="Patente concedida" style={{ color: 'var(--accent-text)', marginLeft: '8px', fontSize: '.75rem', letterSpacing: '.1em' }}>
                          {'★'.repeat(GRANTABLE_RANKS.find((item) => item.id === promotions[s.user_id].rank)?.stars ?? 0)}
                        </span>
                      )}
                    </div>
                    {inactivity.alert && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', alignItems: 'baseline', marginTop: '4px', fontSize: '.75rem', color: 'var(--danger)' }}>
                        <span>Sem acesso há {inactivity.days} dias</span>
                        <button type="button" onClick={() => { setActionError(''); setModal({ type: 'inactivity', student: s }); }}
                          style={{ all: 'unset', cursor: 'pointer', textDecoration: 'underline', color: 'var(--danger)' }}>
                          Desativar alerta
                        </button>
                      </div>
                    )}
                    {inactivity.dismissed && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', alignItems: 'baseline', marginTop: '4px', fontSize: '.75rem', color: 'var(--muted)' }}>
                        <span>Alerta de inatividade desativado: {inactivity.note}</span>
                        <button type="button" onClick={() => { setActionError(''); setModal({ type: 'inactivity', student: s }); }}
                          style={{ all: 'unset', cursor: 'pointer', textDecoration: 'underline' }}>
                          Rever
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '.875rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.email ?? '—'}
                  </div>
                  <div style={{ fontSize: '.875rem', color: 'var(--muted)' }}>{s.phone ?? '—'}</div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.75rem', color: 'var(--muted)' }}>
                    {s.created_at ? new Date(s.created_at).toLocaleDateString('pt-BR') : '—'}
                  </div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.8rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {s.points}
                  </div>
                  <div>
                    <span style={{
                      fontFamily: 'Space Mono, monospace', fontSize: '.65rem', fontWeight: 700,
                      color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`,
                      borderRadius: '3px', padding: '2px 8px',
                    }}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => { setActionError(''); setModal({ type: 'edit', student: s }); }}
                      title="Editar"
                      style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--muted)', cursor: 'pointer', fontSize: '.8rem' }}
                    >✏️</button>

                    <button
                      onClick={() => { setActionError(''); setModal({ type: 'rank', student: s }); }}
                      title="Aval de patente" aria-label={`Aval de patente de ${s.full_name}`}
                      style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--accent-text)', cursor: 'pointer', fontSize: '.8rem' }}
                    >★</button>

                    {s.status === 'active' && (
                      <button onClick={() => quickStatus(s, 'suspended')} title="Suspender"
                        style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--warning)', cursor: 'pointer', fontSize: '.8rem' }}>
                        ⏸
                      </button>
                    )}
                    {s.status === 'suspended' && (
                      <button onClick={() => quickStatus(s, 'active')} title="Reativar"
                        style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--success)', cursor: 'pointer', fontSize: '.8rem' }}>
                        ▶
                      </button>
                    )}
                    {s.status !== 'cancelled' && (
                      <button onClick={() => quickStatus(s, 'cancelled')} title="Cancelar matrícula"
                        style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--danger)', cursor: 'pointer', fontSize: '.8rem' }}>
                        ✕
                      </button>
                    )}
                    {s.status === 'cancelled' && (
                      <button onClick={() => quickStatus(s, 'active')} title="Reativar"
                        style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--success)', cursor: 'pointer', fontSize: '.8rem' }}>
                        ↩
                      </button>
                    )}

                    <button
                      onClick={() => { setActionError(''); setModal({ type: 'change-password', student: s }); }}
                      title="Redefinir senha"
                      style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--muted)', cursor: 'pointer', fontSize: '.8rem' }}>
                      🔑
                    </button>
                    <button
                      onClick={() => { setActionError(''); setModal({ type: 'delete', student: s }); }}
                      title="Excluir permanentemente"
                      style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--danger)', cursor: 'pointer', fontSize: '.8rem' }}>
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tabela — Aguardando cadastro */}
        {!loading && tab === 'pending' && (() => {
          const filteredPending = pendingRegistration.filter(p =>
            !search || p.email?.toLowerCase().includes(search.toLowerCase())
          );
          return (
            <div style={{ border: '1px solid var(--line)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1.5fr .7fr .7fr .8fr auto',
                padding: '10px 20px', background: 'var(--bg-2)',
                borderBottom: '1px solid var(--line)',
                fontFamily: 'Space Mono, monospace', fontSize: '.65rem',
                color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', gap: '12px',
              }}>
                <span>E-mail</span><span>Plano</span><span>Valor</span><span>Compra</span><span>Ação</span>
              </div>

              {filteredPending.length === 0 && (
                <p style={{ padding: '24px 20px', color: 'var(--muted)', fontSize: '.875rem' }}>
                  {search ? 'Nenhum comprador encontrado.' : 'Nenhum comprador sem cadastro.'}
                </p>
              )}

              {filteredPending.map((p, i) => (
                <div key={p.email} style={{
                  display: 'grid', gridTemplateColumns: '1.5fr .7fr .7fr .8fr auto',
                  padding: '14px 20px', gap: '12px', alignItems: 'center',
                  borderBottom: i < filteredPending.length - 1 ? '1px solid var(--line)' : 'none',
                  transition: 'background .15s',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--hover)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontSize: '.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.email}
                  </div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
                    {p.plan}
                  </div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.75rem', color: 'var(--muted)' }}>
                    {p.amount != null
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount / 100)
                      : '—'}
                  </div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)' }}>
                    {new Date(p.purchased_at).toLocaleDateString('pt-BR')}
                  </div>
                  <button
                    onClick={() => {
                      setActionError('');
                      setModal({ type: 'create', prefillEmail: p.email });
                    }}
                    title="Criar conta para este comprador"
                    style={{
                      padding: '6px 12px', background: 'var(--accent-soft)',
                      border: '1px solid rgba(255,106,0,.25)', borderRadius: '4px',
                      color: 'var(--accent-text)', cursor: 'pointer',
                      fontFamily: 'Space Grotesk, sans-serif', fontSize: '.8rem', fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Criar conta
                  </button>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Modal — Criar */}
      {modal?.type === 'create' && (
        <Modal title="Novo aluno" onClose={() => setModal(null)}>
          {actionError && <p style={{ color: 'var(--danger)', fontFamily: 'Space Mono, monospace', fontSize: '.75rem', marginBottom: '12px' }}>{actionError}</p>}
          <StudentForm
            initial={modal.prefillEmail ? { email: modal.prefillEmail } : {}}
            onSave={handleCreate}
            onCancel={() => setModal(null)}
            loading={saving}
          />
        </Modal>
      )}

      {/* Modal — Editar */}
      {modal?.type === 'edit' && (
        <Modal title="Editar aluno" onClose={() => setModal(null)}>
          {actionError && <p style={{ color: 'var(--danger)', fontFamily: 'Space Mono, monospace', fontSize: '.75rem', marginBottom: '12px' }}>{actionError}</p>}
          <StudentForm initial={modal.student} onSave={handleEdit} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      )}

      {/* Modal — Alerta de inatividade */}
      {modal?.type === 'inactivity' && (
        <Modal title={`Inatividade — ${modal.student.full_name}`} onClose={() => setModal(null)}>
          {actionError && <p style={{ color: 'var(--danger)', fontFamily: 'Space Mono, monospace', fontSize: '.75rem', marginBottom: '12px' }}>{actionError}</p>}
          <InactivityForm
            initialNote={modal.student.alert_note ?? ''}
            days={inactivityStatus(modal.student).days}
            onSave={handleInactivity} onCancel={() => setModal(null)} loading={saving}
          />
        </Modal>
      )}

      {/* Modal — Aval de patente */}
      {modal?.type === 'rank' && (
        <Modal title={`Patente — ${modal.student.full_name}`} onClose={() => setModal(null)}>
          {actionError && <p style={{ color: 'var(--danger)', fontFamily: 'Space Mono, monospace', fontSize: '.75rem', marginBottom: '12px' }}>{actionError}</p>}
          <RankForm initial={promotions[modal.student.user_id]} onSave={handleRank} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      )}

      {/* Modal — Redefinir senha */}
      {modal?.type === 'change-password' && (
        <Modal title={`Redefinir senha — ${modal.student.full_name}`} onClose={() => setModal(null)}>
          {actionError && <p style={{ color: 'var(--danger)', fontFamily: 'Space Mono, monospace', fontSize: '.75rem', marginBottom: '12px' }}>{actionError}</p>}
          <ChangePasswordForm onSave={handleChangePassword} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      )}

      {/* Modal — Confirmar exclusão */}
      {modal?.type === 'delete' && (
        <Modal title="Excluir aluno" onClose={() => setModal(null)}>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: '8px' }}>
            Você está prestes a excluir permanentemente:
          </p>
          <p style={{ fontWeight: 600, marginBottom: '4px' }}>{modal.student.full_name}</p>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '.8rem', color: 'var(--muted)', marginBottom: '24px' }}>{modal.student.email}</p>
          <p style={{ color: 'var(--danger)', fontSize: '.85rem', marginBottom: '20px' }}>
            ⚠️ Esta ação é irreversível. Todo o histórico de progresso também será removido.
          </p>
          {actionError && <p style={{ color: 'var(--danger)', fontFamily: 'Space Mono, monospace', fontSize: '.75rem', marginBottom: '12px' }}>{actionError}</p>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleDelete} disabled={saving} style={{
              flex: 1, padding: '10px', background: saving ? 'rgba(248,113,113,.4)' : 'var(--danger)',
              color: '#fff', border: 'none', borderRadius: '4px',
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              {saving ? 'Excluindo...' : 'Excluir permanentemente'}
            </button>
            <button onClick={() => setModal(null)} style={{
              padding: '10px 20px', background: 'transparent', border: '1px solid var(--line)',
              borderRadius: '4px', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
            }}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
