import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';
import { toast } from 'sonner';

const STATUS_LABELS = { draft: 'Rascunho', published: 'Publicado', scheduled: 'Agendado', archived: 'Arquivado' };
const STATUS_COLORS = { draft: 'var(--muted)', published: '#22c55e', scheduled: '#f59e0b', archived: 'var(--muted)' };
const VISIBILITY_LABELS = { public: 'Público', private: 'Privado' };

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminBlogPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVisibility, setFilterVisibility] = useState('');
  const [deleting, setDeleting] = useState(null);

  // Pending comments state
  const [pendingComments, setPendingComments] = useState([]);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'comments'

  useEffect(() => { loadPosts(); loadPendingComments(); }, []);

  async function loadPosts() {
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('id, title, slug, status, visibility, published_at, author_name, post_tags(tags(name))')
      .order('updated_at', { ascending: false });
    setPosts(data ?? []);
    setLoading(false);
  }

  async function loadPendingComments() {
    const { data } = await supabase
      .from('post_comments')
      .select('id, content, user_name, created_at, post_id, posts(title)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setPendingComments(data ?? []);
  }

  async function handleDelete(post) {
    if (!window.confirm(`Excluir o post "${post.title}"? Esta ação é irreversível.`)) return;
    setDeleting(post.id);
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (error) {
      toast.error('Erro ao excluir post.');
    } else {
      setPosts((p) => p.filter((x) => x.id !== post.id));
      toast.success('Post excluído.');
    }
    setDeleting(null);
  }

  async function handleApprove(comment) {
    const { error } = await supabase.from('post_comments').update({ status: 'approved' }).eq('id', comment.id);
    if (error) { toast.error('Erro ao aprovar.'); return; }
    setPendingComments((p) => p.filter((c) => c.id !== comment.id));
    toast.success('Comentário aprovado.');
  }

  async function handleReject(comment) {
    const { error } = await supabase.from('post_comments').update({ status: 'rejected' }).eq('id', comment.id);
    if (error) { toast.error('Erro ao rejeitar.'); return; }
    setPendingComments((p) => p.filter((c) => c.id !== comment.id));
    toast.success('Comentário rejeitado.');
  }

  const filtered = posts.filter((p) => {
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterVisibility && p.visibility !== filterVisibility) return false;
    return true;
  });

  const selectSx = {
    background: 'var(--panel-2)', border: '1px solid var(--line-strong)',
    borderRadius: '4px', padding: '8px 12px', color: 'var(--text)',
    fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', cursor: 'pointer',
  };

  const tabStyle = (active) => ({
    padding: '8px 18px', borderRadius: '4px 4px 0 0',
    background: active ? 'var(--panel-2)' : 'transparent',
    border: active ? '1px solid var(--line)' : '1px solid transparent',
    borderBottom: active ? '1px solid var(--panel-2)' : '1px solid var(--line)',
    color: active ? 'var(--text)' : 'var(--muted)',
    fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem',
    cursor: 'pointer', fontWeight: active ? 600 : 400,
  });

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.5rem', color: 'var(--text)' }}>
            Blog
          </h1>
          <button
            onClick={() => navigate('/admin/blog/novo')}
            style={{
              background: 'var(--accent)', color: '#000', border: 'none',
              borderRadius: '4px', padding: '10px 18px',
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '.9rem',
              cursor: 'pointer',
            }}
          >
            + Novo post
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '-1px', position: 'relative', zIndex: 1 }}>
          <button style={tabStyle(activeTab === 'posts')} onClick={() => setActiveTab('posts')}>
            Posts ({posts.length})
          </button>
          <button style={tabStyle(activeTab === 'comments')} onClick={() => setActiveTab('comments')}>
            Comentários Pendentes
            {pendingComments.length > 0 && (
              <span style={{
                marginLeft: '6px', background: 'var(--accent)', color: '#000',
                borderRadius: '10px', padding: '1px 7px', fontSize: '.75rem', fontWeight: 700,
              }}>
                {pendingComments.length}
              </span>
            )}
          </button>
        </div>

        {/* Panel */}
        <div style={{ background: 'var(--panel-2)', borderRadius: '0 4px 4px 4px', border: '1px solid var(--line)', padding: '24px' }}>

          {activeTab === 'posts' && (
            <>
              {/* Filters */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectSx}>
                  <option value="">Todos os status</option>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={filterVisibility} onChange={(e) => setFilterVisibility(e.target.value)} style={selectSx}>
                  <option value="">Todas as visibilidades</option>
                  {Object.entries(VISIBILITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <span style={{ color: 'var(--muted)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', alignSelf: 'center' }}>
                  {filtered.length} post{filtered.length !== 1 ? 's' : ''}
                </span>
              </div>

              {loading ? (
                <p style={{ color: 'var(--muted)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem' }}>Carregando...</p>
              ) : filtered.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem' }}>Nenhum post encontrado.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {/* Table header */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 110px 90px 110px 120px',
                    padding: '8px 12px', background: 'var(--bg)', borderRadius: '4px',
                    fontFamily: 'Space Grotesk, sans-serif', fontSize: '.8rem', color: 'var(--muted)', fontWeight: 600,
                  }}>
                    <span>Título</span>
                    <span>Status</span>
                    <span>Visib.</span>
                    <span>Publicado</span>
                    <span style={{ textAlign: 'right' }}>Ações</span>
                  </div>
                  {filtered.map((post) => (
                    <div key={post.id} style={{
                      display: 'grid', gridTemplateColumns: '1fr 110px 90px 110px 120px',
                      padding: '12px', background: 'var(--bg)', borderRadius: '4px',
                      alignItems: 'center', borderBottom: '1px solid var(--line)',
                    }}>
                      <div>
                        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem', color: 'var(--text)', fontWeight: 500 }}>
                          {post.title}
                        </div>
                        {post.post_tags?.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                            {post.post_tags.map((pt, i) => (
                              <span key={i} style={{
                                background: 'var(--panel-2)', border: '1px solid var(--line)',
                                borderRadius: '3px', padding: '1px 6px',
                                fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)',
                              }}>{pt.tags?.name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontFamily: 'Space Grotesk, sans-serif', fontSize: '.8rem',
                        color: STATUS_COLORS[post.status] ?? 'var(--muted)',
                        fontWeight: 600,
                      }}>
                        {STATUS_LABELS[post.status] ?? post.status}
                      </span>
                      <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '.8rem', color: 'var(--muted)' }}>
                        {VISIBILITY_LABELS[post.visibility] ?? post.visibility}
                      </span>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.78rem', color: 'var(--muted)' }}>
                        {fmtDate(post.published_at)}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => navigate(`/admin/blog/${post.id}/editar`)}
                          style={{
                            background: 'transparent', border: '1px solid var(--line-strong)',
                            borderRadius: '4px', padding: '5px 10px', color: 'var(--text)',
                            fontFamily: 'Space Grotesk, sans-serif', fontSize: '.8rem', cursor: 'pointer',
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(post)}
                          disabled={deleting === post.id}
                          style={{
                            background: 'transparent', border: '1px solid #ef4444',
                            borderRadius: '4px', padding: '5px 10px', color: '#ef4444',
                            fontFamily: 'Space Grotesk, sans-serif', fontSize: '.8rem', cursor: 'pointer',
                          }}
                        >
                          {deleting === post.id ? '...' : 'Excluir'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'comments' && (
            <>
              {pendingComments.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem' }}>
                  Nenhum comentário pendente.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingComments.map((c) => (
                    <div key={c.id} style={{
                      background: 'var(--bg)', border: '1px solid var(--line)',
                      borderRadius: '6px', padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', color: 'var(--text)', fontWeight: 600 }}>
                            {c.user_name}
                          </span>
                          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.75rem', color: 'var(--muted)', marginLeft: '8px' }}>
                            {fmtDate(c.created_at)}
                          </span>
                        </div>
                        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '.8rem', color: 'var(--muted)' }}>
                          Post: <em>{c.posts?.title ?? '—'}</em>
                        </span>
                      </div>
                      <p style={{ margin: '0 0 12px', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem', color: 'var(--text)', lineHeight: 1.6 }}>
                        {c.content}
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleApprove(c)}
                          style={{
                            background: '#22c55e', color: '#000', border: 'none',
                            borderRadius: '4px', padding: '6px 14px',
                            fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleReject(c)}
                          style={{
                            background: 'transparent', border: '1px solid #ef4444',
                            borderRadius: '4px', padding: '6px 14px', color: '#ef4444',
                            fontFamily: 'Space Grotesk, sans-serif', fontSize: '.85rem', cursor: 'pointer',
                          }}
                        >
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
