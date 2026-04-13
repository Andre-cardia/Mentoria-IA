import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';

export default function AdminProgressoPage() {
  const [rows, setRows] = useState([]);
  const [modules, setModules] = useState([]);
  const [filterModule, setFilterModule] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [profileMap, setProfileMap] = useState({});

  useEffect(() => {
    async function load() {
      const [progressRes, modulesRes, profilesRes] = await Promise.all([
        supabase
          .from('lesson_progress')
          .select(`
            completed_at,
            user_id,
            lessons (
              id,
              title,
              module_id,
              modules ( title )
            )
          `)
          .order('completed_at', { ascending: false }),
        supabase.from('modules').select('id, title').order('order', { ascending: true }),
        supabase.from('profiles').select('user_id, full_name'),
      ]);

      if (progressRes.error) {
        setError('Erro ao carregar progresso.');
      } else {
        setRows(progressRes.data ?? []);
      }
      if (!modulesRes.error) setModules(modulesRes.data ?? []);
      if (!profilesRes.error && profilesRes.data) {
        const map = {};
        profilesRes.data.forEach((p) => { map[p.user_id] = p.full_name; });
        setProfileMap(map);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filterModule
    ? rows.filter((r) => r.lessons?.module_id === filterModule)
    : rows;

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <AdminLayout>
      <div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
          Admin
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '24px' }}>Progresso dos Alunos</h1>

        {/* Filtro por módulo */}
        <div style={{ marginBottom: '24px' }}>
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              color: 'var(--text)', borderRadius: '6px',
              padding: '8px 14px', fontSize: '.875rem',
              fontFamily: 'Space Grotesk, sans-serif', cursor: 'pointer',
            }}
          >
            <option value="">Todos os módulos</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>

        {loading && <p style={{ color: 'var(--muted)' }}>Carregando...</p>}
        {error && <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.8rem' }}>{error}</p>}

        {!loading && !error && (
          <>
            <div style={{ marginBottom: '12px', fontFamily: 'Space Mono, monospace', fontSize: '.75rem', color: 'var(--muted)' }}>
              {filtered.length} conclusão{filtered.length !== 1 ? 'ões' : ''} registrada{filtered.length !== 1 ? 's' : ''}
            </div>

            <div style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: '6px', overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.5fr',
                padding: '12px 20px',
                borderBottom: '1px solid var(--line)',
                fontFamily: 'Space Mono, monospace', fontSize: '.7rem',
                letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)',
              }}>
                <span>Aluno</span>
                <span>Aula</span>
                <span>Módulo</span>
                <span>Concluída em</span>
              </div>

              {filtered.length === 0 ? (
                <p style={{ padding: '20px', color: 'var(--muted)', fontSize: '.875rem' }}>
                  Nenhuma aula concluída ainda.
                </p>
              ) : (
                filtered.map((row, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.5fr',
                      padding: '12px 20px',
                      borderBottom: idx < filtered.length - 1 ? '1px solid var(--line)' : 'none',
                      fontSize: '.875rem', alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '.875rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {profileMap[row.user_id] ?? row.user_id?.slice(0, 8) + '…'}
                    </span>
                    <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.lessons?.title ?? '—'}
                    </span>
                    <span style={{ color: 'var(--muted)', fontSize: '.8rem' }}>
                      {row.lessons?.modules?.title ?? '—'}
                    </span>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.75rem', color: 'var(--muted)' }}>
                      {formatDate(row.completed_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
