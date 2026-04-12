import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';

const STATUS_LABEL = { active: 'Ativo', suspended: 'Suspenso', cancelled: 'Cancelado' };
const STATUS_COLOR = {
  active:    { color: '#4ade80', bg: 'rgba(34,197,94,.1)',  border: 'rgba(34,197,94,.25)' },
  suspended: { color: '#fbbf24', bg: 'rgba(251,191,36,.1)', border: 'rgba(251,191,36,.25)' },
  cancelled: { color: '#f87171', bg: 'rgba(248,113,113,.1)', border: 'rgba(248,113,113,.25)' },
};

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

// ── Formulário de aluno (criar / editar) ──────────────────────
function StudentForm({ initial = {}, onSave, onCancel, loading }) {
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

// ── Página principal ──────────────────────────────────────────
export default function AdminAlunosPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | { type: 'create' | 'edit' | 'delete', student? }
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const headers = await authHeaders();
    const res = await fetch('/api/admin/students', { headers });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Erro ao carregar'); }
    else { setStudents(data.students); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = students.filter(s =>
    !search ||
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  );

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
      <div style={{ maxWidth: '960px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '6px' }}>
              Gestão
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Alunos</h1>
            <p style={{ color: 'var(--muted)', fontSize: '.875rem', margin: '6px 0 0' }}>
              {students.length} aluno{students.length !== 1 ? 's' : ''} cadastrado{students.length !== 1 ? 's' : ''}
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

        {/* Search */}
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou telefone..."
          style={{ ...inputStyle, marginBottom: '20px', maxWidth: '400px' }}
        />

        {loading && <p style={{ color: 'var(--muted)' }}>Carregando...</p>}
        {error && <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.8rem' }}>{error}</p>}

        {/* Tabela */}
        {!loading && (
          <div style={{ border: '1px solid var(--line)', borderRadius: '6px', overflow: 'hidden' }}>
            {/* Header da tabela */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr .8fr .8fr auto',
              padding: '10px 20px', background: 'var(--bg-2)',
              borderBottom: '1px solid var(--line)',
              fontFamily: 'Space Mono, monospace', fontSize: '.65rem',
              color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', gap: '12px',
            }}>
              <span>Nome</span><span>E-mail</span><span>WhatsApp</span><span>Status</span><span>Ações</span>
            </div>

            {filtered.length === 0 && (
              <p style={{ padding: '24px 20px', color: 'var(--muted)', fontSize: '.875rem' }}>
                {search ? 'Nenhum aluno encontrado.' : 'Nenhum aluno cadastrado.'}
              </p>
            )}

            {filtered.map((s, i) => {
              const sc = STATUS_COLOR[s.status] ?? STATUS_COLOR.active;
              return (
                <div key={s.user_id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr .8fr .8fr auto',
                  padding: '14px 20px', gap: '12px', alignItems: 'center',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--line)' : 'none',
                  transition: 'background .15s',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '.9rem' }}>{s.full_name}</div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--muted)', marginTop: '2px' }}>
                      {new Date(s.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div style={{ fontSize: '.875rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.email ?? '—'}
                  </div>
                  <div style={{ fontSize: '.875rem', color: 'var(--muted)' }}>{s.phone ?? '—'}</div>
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
                    {/* Editar */}
                    <button
                      onClick={() => { setActionError(''); setModal({ type: 'edit', student: s }); }}
                      title="Editar"
                      style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--muted)', cursor: 'pointer', fontSize: '.8rem' }}
                    >✏️</button>

                    {/* Toggle status rápido */}
                    {s.status === 'active' && (
                      <button onClick={() => quickStatus(s, 'suspended')} title="Suspender"
                        style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: '#fbbf24', cursor: 'pointer', fontSize: '.8rem' }}>
                        ⏸
                      </button>
                    )}
                    {s.status === 'suspended' && (
                      <button onClick={() => quickStatus(s, 'active')} title="Reativar"
                        style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: '#4ade80', cursor: 'pointer', fontSize: '.8rem' }}>
                        ▶
                      </button>
                    )}
                    {s.status !== 'cancelled' && (
                      <button onClick={() => quickStatus(s, 'cancelled')} title="Cancelar matrícula"
                        style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: '#f87171', cursor: 'pointer', fontSize: '.8rem' }}>
                        ✕
                      </button>
                    )}
                    {s.status === 'cancelled' && (
                      <button onClick={() => quickStatus(s, 'active')} title="Reativar"
                        style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: '#4ade80', cursor: 'pointer', fontSize: '.8rem' }}>
                        ↩
                      </button>
                    )}

                    {/* Excluir */}
                    <button
                      onClick={() => { setActionError(''); setModal({ type: 'delete', student: s }); }}
                      title="Excluir permanentemente"
                      style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: '#f87171', cursor: 'pointer', fontSize: '.8rem' }}>
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal — Criar */}
      {modal?.type === 'create' && (
        <Modal title="Novo aluno" onClose={() => setModal(null)}>
          {actionError && <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.75rem', marginBottom: '12px' }}>{actionError}</p>}
          <StudentForm onSave={handleCreate} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      )}

      {/* Modal — Editar */}
      {modal?.type === 'edit' && (
        <Modal title="Editar aluno" onClose={() => setModal(null)}>
          {actionError && <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.75rem', marginBottom: '12px' }}>{actionError}</p>}
          <StudentForm initial={modal.student} onSave={handleEdit} onCancel={() => setModal(null)} loading={saving} />
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
          <p style={{ color: '#f87171', fontSize: '.85rem', marginBottom: '20px' }}>
            ⚠️ Esta ação é irreversível. Todo o histórico de progresso também será removido.
          </p>
          {actionError && <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.75rem', marginBottom: '12px' }}>{actionError}</p>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleDelete} disabled={saving} style={{
              flex: 1, padding: '10px', background: saving ? 'rgba(248,113,113,.4)' : '#ef4444',
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
