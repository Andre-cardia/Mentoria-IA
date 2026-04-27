import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';

const ROLE_LABEL = {
  admin: 'Administrador',
  comercial: 'Comercial',
};

const ROLE_HELP = {
  admin: 'Acesso completo à gestão da mentoria e ao CRM.',
  comercial: 'Acesso restrito ao CRM Neural Hub.',
};

const inputStyle = {
  width: '100%',
  background: 'var(--bg-2)',
  border: '1px solid var(--line-strong)',
  borderRadius: '4px',
  padding: '10px 14px',
  color: 'var(--text)',
  fontFamily: 'Space Grotesk, sans-serif',
  fontSize: '.9rem',
  outline: 'none',
};

const labelStyle = {
  fontFamily: 'Space Mono, monospace',
  fontSize: '.65rem',
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '.08em',
};

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` };
}

function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }} onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="platform-user-modal-title"
        onClick={(event) => event.stopPropagation()}
        style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '8px', width: '100%', maxWidth: '520px', padding: '30px', position: 'relative' }}
      >
        <h2 id="platform-user-modal-title" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px' }}>{title}</h2>
        {children}
        <button type="button" onClick={onClose} aria-label="Fechar" style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
      </section>
    </div>
  );
}

function UserForm({ initial = {}, loading, onCancel, onSave }) {
  const isNew = !initial.id;
  const [fullName, setFullName] = useState(initial.full_name ?? '');
  const [email, setEmail] = useState(initial.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initial.role ?? 'comercial');

  function submit(event) {
    event.preventDefault();
    onSave({
      full_name: fullName,
      email,
      password,
      role,
    });
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={labelStyle}>Nome completo *</span>
        <input value={fullName} onChange={(event) => setFullName(event.target.value)} required placeholder="Nome do usuário" style={inputStyle} />
      </label>

      {isNew && (
        <>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={labelStyle}>E-mail *</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="email@empresa.com.br" style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={labelStyle}>Senha inicial *</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} placeholder="mínimo 6 caracteres" style={inputStyle} />
          </label>
        </>
      )}

      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={labelStyle}>Nível de acesso *</span>
        <select value={role} onChange={(event) => setRole(event.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="comercial">Comercial</option>
          <option value="admin">Administrador</option>
        </select>
        <span style={{ color: 'var(--muted)', fontSize: '.78rem', lineHeight: 1.5 }}>{ROLE_HELP[role]}</span>
      </label>

      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px',
            background: loading ? 'rgba(255,106,0,.5)' : 'var(--accent)',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Salvando...' : isNew ? 'Criar usuário' : 'Salvar'}
        </button>
        <button type="button" onClick={onCancel} style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--muted)', cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const headers = await authHeaders();
    const res = await fetch('/api/admin/platform-users', { headers });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Erro ao carregar usuários');
      setUsers([]);
    } else {
      setUsers(data.users ?? []);
      setCurrentUserId(data.currentUserId ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredUsers = useMemo(() => users.filter((user) => {
    const haystack = [user.full_name, user.email, user.role].filter(Boolean).join(' ').toLowerCase();
    return !search || haystack.includes(search.trim().toLowerCase());
  }), [users, search]);

  async function createUser(payload) {
    setSaving(true);
    setActionError('');
    const headers = await authHeaders();
    const res = await fetch('/api/admin/platform-users', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setActionError(data.error ?? 'Erro ao criar usuário');
      return;
    }
    setModal(null);
    load();
  }

  async function updateUser(payload) {
    setSaving(true);
    setActionError('');
    const headers = await authHeaders();
    const res = await fetch(`/api/admin/platform-users/${modal.user.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        full_name: payload.full_name,
        role: payload.role,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setActionError(data.error ?? 'Erro ao atualizar usuário');
      return;
    }
    setModal(null);
    load();
  }

  async function deleteUser() {
    setSaving(true);
    setActionError('');
    const headers = await authHeaders();
    const res = await fetch(`/api/admin/platform-users/${modal.user.id}`, {
      method: 'DELETE',
      headers,
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setActionError(data.error ?? 'Erro ao excluir usuário');
      return;
    }
    setModal(null);
    load();
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1120px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '18px', flexWrap: 'wrap', marginBottom: '28px' }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '6px' }}>
              Gestão / Acesso
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Usuários da Plataforma</h1>
            <p style={{ color: 'var(--muted)', fontSize: '.875rem', lineHeight: 1.6, margin: '8px 0 0', maxWidth: '720px' }}>
              Cadastre administradores e usuários comerciais. Alunos continuam sendo gerenciados em Admin / Alunos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setActionError(''); setModal({ type: 'create' }); }}
            style={{ padding: '10px 22px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}
          >
            + Novo usuário
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {[
            ['Total', users.length],
            ['Admins', users.filter((user) => user.role === 'admin').length],
            ['Comercial', users.filter((user) => user.role === 'comercial').length],
          ].map(([label, value]) => (
            <div key={label} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', padding: '16px' }}>
              <div style={{ color: 'var(--accent)', fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 }}>{value}</div>
              <div style={{ marginTop: '8px', fontFamily: 'Space Mono, monospace', fontSize: '.68rem', color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome, e-mail ou nível..."
          style={{ ...inputStyle, maxWidth: '420px', marginBottom: '18px' }}
        />

        {loading && <p style={{ color: 'var(--muted)' }}>Carregando usuários...</p>}
        {error && <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.8rem' }}>{error}</p>}

        {!loading && !error && (
          <div style={{ border: '1px solid var(--line)', borderRadius: '6px', overflowX: 'auto' }}>
            <div style={{ minWidth: '820px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1.4fr .8fr .8fr auto',
                gap: '12px',
                padding: '10px 18px',
                background: 'var(--bg-2)',
                borderBottom: '1px solid var(--line)',
                fontFamily: 'Space Mono, monospace',
                fontSize: '.65rem',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
              }}>
                <span>Nome</span><span>E-mail</span><span>Acesso</span><span>Criado em</span><span>Ações</span>
              </div>

              {filteredUsers.length === 0 && (
                <p style={{ padding: '24px 18px', color: 'var(--muted)', fontSize: '.875rem' }}>
                  {search ? 'Nenhum usuário encontrado.' : 'Nenhum usuário administrativo cadastrado.'}
                </p>
              )}

              {filteredUsers.map((user, index) => {
                const isCurrentUser = user.id === currentUserId;
                return (
                  <div
                    key={user.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1.4fr .8fr .8fr auto',
                      gap: '12px',
                      padding: '14px 18px',
                      alignItems: 'center',
                      borderBottom: index < filteredUsers.length - 1 ? '1px solid var(--line)' : 'none',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '.92rem' }}>{user.full_name}</div>
                      {isCurrentUser && (
                        <div style={{ marginTop: '3px', fontFamily: 'Space Mono, monospace', color: 'var(--accent)', fontSize: '.62rem', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                          Sua conta
                        </div>
                      )}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                    <div>
                      <span style={{
                        fontFamily: 'Space Mono, monospace',
                        fontSize: '.66rem',
                        fontWeight: 700,
                        color: user.role === 'admin' ? 'var(--accent)' : '#38bdf8',
                        background: user.role === 'admin' ? 'var(--accent-soft)' : 'rgba(56,189,248,.1)',
                        border: `1px solid ${user.role === 'admin' ? 'rgba(255,106,0,.25)' : 'rgba(56,189,248,.25)'}`,
                        borderRadius: '3px',
                        padding: '2px 8px',
                        textTransform: 'uppercase',
                      }}>
                        {ROLE_LABEL[user.role] ?? user.role}
                      </span>
                    </div>
                    <div style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.72rem' }}>{fmtDate(user.created_at)}</div>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => { setActionError(''); setModal({ type: 'edit', user }); }}
                        style={{ padding: '7px 11px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--muted)', cursor: 'pointer' }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={isCurrentUser}
                        title={isCurrentUser ? 'Você não pode excluir sua própria conta' : 'Excluir usuário'}
                        onClick={() => { setActionError(''); setModal({ type: 'delete', user }); }}
                        style={{ padding: '7px 11px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: isCurrentUser ? 'rgba(248,113,113,.35)' : '#f87171', cursor: isCurrentUser ? 'not-allowed' : 'pointer' }}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {modal?.type === 'create' && (
        <Modal title="Novo usuário da plataforma" onClose={() => setModal(null)}>
          {actionError && <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.75rem', marginBottom: '12px' }}>{actionError}</p>}
          <UserForm onSave={createUser} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title="Editar usuário" onClose={() => setModal(null)}>
          {actionError && <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.75rem', marginBottom: '12px' }}>{actionError}</p>}
          <UserForm initial={modal.user} onSave={updateUser} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      )}

      {modal?.type === 'delete' && (
        <Modal title="Excluir usuário" onClose={() => setModal(null)}>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: '8px' }}>
            Você está prestes a excluir o usuário de acesso à plataforma:
          </p>
          <p style={{ fontWeight: 600, marginBottom: '4px' }}>{modal.user.full_name}</p>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '.8rem', color: 'var(--muted)', marginBottom: '20px' }}>{modal.user.email}</p>
          <p style={{ color: '#f87171', fontSize: '.85rem', marginBottom: '20px' }}>
            Esta ação remove o usuário do Supabase Auth e não deve ser usada para alunos.
          </p>
          {actionError && <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.75rem', marginBottom: '12px' }}>{actionError}</p>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={deleteUser}
              disabled={saving}
              style={{ flex: 1, padding: '10px', background: saving ? 'rgba(248,113,113,.4)' : '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Excluindo...' : 'Excluir usuário'}
            </button>
            <button type="button" onClick={() => setModal(null)} style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '4px', color: 'var(--muted)', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
