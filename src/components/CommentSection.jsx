import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * CommentSection — usado em BlogPostPage (public) e PlataformaBlogPostPage.
 * @param {string} postId
 * @param {string} [loginHref='/plataforma/login'] — link para login
 */
export default function CommentSection({ postId, loginHref = '/plataforma/login' }) {
  const [comments, setComments] = useState([]);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadComments();
    loadUser();
  }, [postId]);

  async function loadComments() {
    const { data } = await supabase
      .from('post_comments')
      .select('id, user_name, content, created_at')
      .eq('post_id', postId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true });
    setComments(data ?? []);
  }

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);
    const { data: prof } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .maybeSingle();
    setProfile(prof);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (content.trim().length < 10) { toast.error('Comentário deve ter pelo menos 10 caracteres.'); return; }
    if (!user) return;
    setSending(true);

    // Garante que o token JWT está válido antes do INSERT (evita falha de RLS por sessão expirada)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      setSending(false);
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    const user_name = profile?.full_name ?? user.email;
    const { error } = await supabase.from('post_comments').insert({
      post_id: postId,
      user_id: session.user.id,
      user_name,
      content: content.trim(),
      status: 'pending',
    });
    setSending(false);
    if (error) {
      console.error('[CommentSection] erro ao inserir comentário:', error);
      toast.error(`Erro ao enviar comentário: ${error.message}`);
      return;
    }
    toast.success('Comentário enviado! Aguardando moderação.');
    setContent('');
  }

  return (
    <section style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--line)' }}>
      <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text)', margin: '0 0 24px' }}>
        Comentários {comments.length > 0 && `(${comments.length})`}
      </h2>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--muted)', fontSize: '.9rem', marginBottom: '32px' }}>
          Seja o primeiro a comentar.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
          {comments.map((c) => (
            <div key={c.id} style={{
              background: 'var(--panel-2)', borderRadius: '6px',
              padding: '14px 16px', border: '1px solid var(--line)',
            }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '.875rem', fontWeight: 600, color: 'var(--text)' }}>
                  {c.user_name}
                </span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.75rem', color: 'var(--muted)' }}>
                  {fmtDate(c.created_at)}
                </span>
              </div>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem', color: 'var(--text)', margin: 0, lineHeight: 1.7 }}>
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Leave a comment */}
      <div style={{ background: 'var(--panel-2)', borderRadius: '8px', padding: '20px', border: '1px solid var(--line)' }}>
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1rem', fontWeight: 600, color: 'var(--text)', margin: '0 0 16px' }}>
          Deixe um comentário
        </h3>
        {!user ? (
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem', color: 'var(--muted)', margin: 0 }}>
            <a href={loginHref} style={{ color: 'var(--accent)' }}>Faça login</a> para comentar.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Escreva seu comentário (mínimo 10 caracteres)..."
              style={{
                width: '100%', background: 'var(--bg)', border: '1px solid var(--line-strong)',
                borderRadius: '4px', padding: '10px 14px', color: 'var(--text)',
                fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem',
                resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: '12px',
              }}
            />
            <button
              type="submit"
              disabled={sending}
              style={{
                background: 'var(--accent)', color: '#000', border: 'none',
                borderRadius: '4px', padding: '10px 20px',
                fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '.9rem',
                cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? .6 : 1,
              }}
            >
              {sending ? 'Enviando...' : 'Enviar comentário'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
