import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const PAGE_SIZE = 10;

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
}

function Avatar({ name }) {
  const initial = (name || '?')[0].toUpperCase();
  return (
    <div style={{
      width: '32px', height: '32px', borderRadius: '50%',
      background: 'rgba(255,106,0,.15)', border: '1px solid rgba(255,106,0,.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Space Mono, monospace', fontSize: '.75rem', fontWeight: 700,
      color: 'var(--accent)', flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}

function ReplyForm({ onSubmit, onCancel }) {
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!body.trim() || body.trim().length < 5) return;
    setSaving(true);
    await onSubmit(body.trim());
    setBody('');
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Escreva sua resposta..."
        style={{
          width: '100%', background: 'var(--panel-2)', border: '1px solid var(--line-strong)',
          borderRadius: '4px', padding: '10px 12px', color: 'var(--text)',
          fontFamily: 'Space Grotesk, sans-serif', fontSize: '.875rem', outline: 'none',
          resize: 'vertical', minHeight: '80px', lineHeight: '1.5', boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" disabled={saving || body.trim().length < 5} style={{
          padding: '7px 16px', background: 'var(--accent)', color: '#000', border: 'none',
          borderRadius: '4px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700,
          fontSize: '.8rem', cursor: 'pointer', opacity: (saving || body.trim().length < 5) ? .5 : 1,
        }}>
          {saving ? 'Salvando...' : 'Responder'}
        </button>
        <button type="button" onClick={onCancel} style={{
          padding: '7px 14px', background: 'transparent', border: '1px solid var(--line-strong)',
          borderRadius: '4px', color: 'var(--muted)', fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '.8rem', cursor: 'pointer',
        }}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function QAItem({ item, isAdmin, currentUserId, onDelete, onMarkOfficial, onReply }) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <Avatar name={item.profiles?.full_name} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <span style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--text)' }}>
            {item.profiles?.full_name || 'Usuário'}
          </span>
          {item.is_official && (
            <span style={{
              fontFamily: 'Space Mono, monospace', fontSize: '.6rem', textTransform: 'uppercase',
              letterSpacing: '.08em', color: '#4ade80', background: 'rgba(74,222,128,.1)',
              border: '1px solid rgba(74,222,128,.25)', borderRadius: '3px', padding: '2px 6px',
            }}>
              ✓ Resposta Oficial
            </span>
          )}
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--muted)' }}>
            {timeAgo(item.created_at)}
          </span>
        </div>

        <p style={{ margin: '0 0 8px', fontSize: '.9rem', lineHeight: '1.55', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
          {item.body}
        </p>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {onReply && (
            <button onClick={() => setShowReplyForm((v) => !v)} style={{
              background: 'none', border: 'none', padding: 0,
              fontFamily: 'Space Mono, monospace', fontSize: '.65rem', textTransform: 'uppercase',
              letterSpacing: '.08em', color: 'var(--muted)', cursor: 'pointer',
            }}>
              {showReplyForm ? 'Cancelar' : 'Responder'}
            </button>
          )}
          {isAdmin && onMarkOfficial && (
            <button onClick={() => onMarkOfficial(item.id, !item.is_official)} style={{
              background: 'none', border: 'none', padding: 0,
              fontFamily: 'Space Mono, monospace', fontSize: '.65rem', textTransform: 'uppercase',
              letterSpacing: '.08em', color: item.is_official ? '#4ade80' : 'var(--muted)', cursor: 'pointer',
            }}>
              {item.is_official ? '✓ Oficial' : 'Marcar oficial'}
            </button>
          )}
          {(isAdmin || currentUserId === item.user_id) && (
            <button onClick={() => onDelete(item.id)} style={{
              background: 'none', border: 'none', padding: 0,
              fontFamily: 'Space Mono, monospace', fontSize: '.65rem', textTransform: 'uppercase',
              letterSpacing: '.08em', color: '#f87171', cursor: 'pointer',
            }}>
              Excluir
            </button>
          )}
        </div>

        {showReplyForm && (
          <ReplyForm
            onSubmit={async (body) => {
              await onReply(item.id, body);
              setShowReplyForm(false);
            }}
            onCancel={() => setShowReplyForm(false)}
          />
        )}

        {/* Respostas aninhadas */}
        {item.replies && item.replies.length > 0 && (
          <div style={{ marginTop: '12px', paddingLeft: '16px', borderLeft: '2px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {item.replies.map((reply) => (
              <QAItem
                key={reply.id}
                item={reply}
                isAdmin={isAdmin}
                currentUserId={currentUserId}
                onDelete={onDelete}
                onMarkOfficial={onMarkOfficial}
                onReply={null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LessonQA({ lessonId }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [newQuestion, setNewQuestion] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user);
        setIsAdmin((user.user_metadata?.role) === 'admin');
      }
    });
  }, []);

  const fetchQuestions = useCallback(async (reset = false) => {
    const start = reset ? 0 : offset;
    const { data, error } = await supabase
      .from('lesson_qa')
      .select(`
        id, body, is_official, created_at, user_id,
        profiles(full_name),
        replies:lesson_qa!parent_id(
          id, body, is_official, created_at, user_id,
          profiles(full_name)
        )
      `)
      .eq('lesson_id', lessonId)
      .is('parent_id', null)
      .order('created_at', { ascending: true })
      .range(start, start + PAGE_SIZE - 1);

    if (!error && data) {
      setQuestions((prev) => reset ? data : [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      setOffset(start + data.length);
    }
    return data;
  }, [lessonId, offset]);

  useEffect(() => {
    setLoading(true);
    fetchQuestions(true).finally(() => setLoading(false));
  }, [lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadMore() {
    setLoadingMore(true);
    await fetchQuestions(false);
    setLoadingMore(false);
  }

  async function submitQuestion(e) {
    e.preventDefault();
    if (!newQuestion.trim() || newQuestion.trim().length < 5) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('lesson_qa')
      .insert({ lesson_id: lessonId, user_id: currentUser.id, body: newQuestion.trim() })
      .select(`id, body, is_official, created_at, user_id, profiles(full_name), replies:lesson_qa!parent_id(id, body, is_official, created_at, user_id, profiles(full_name))`)
      .single();
    if (!error && data) {
      setQuestions((prev) => [...prev, data]);
      setNewQuestion('');
    }
    setSaving(false);
  }

  async function handleReply(parentId, body) {
    const { data, error } = await supabase
      .from('lesson_qa')
      .insert({ lesson_id: lessonId, user_id: currentUser.id, parent_id: parentId, body })
      .select(`id, body, is_official, created_at, user_id, profiles(full_name)`)
      .single();
    if (!error && data) {
      setQuestions((prev) => prev.map((q) =>
        q.id === parentId ? { ...q, replies: [...(q.replies || []), data] } : q
      ));
    }
  }

  async function handleDelete(id) {
    await supabase.from('lesson_qa').delete().eq('id', id);
    setQuestions((prev) => prev
      .filter((q) => q.id !== id)
      .map((q) => ({ ...q, replies: (q.replies || []).filter((r) => r.id !== id) }))
    );
  }

  async function handleMarkOfficial(id, value) {
    await supabase.from('lesson_qa').update({ is_official: value }).eq('id', id);
    setQuestions((prev) => prev.map((q) => ({
      ...q,
      is_official: q.id === id ? value : q.is_official,
      replies: (q.replies || []).map((r) => r.id === id ? { ...r, is_official: value } : r),
    })));
  }

  return (
    <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--line)' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        Perguntas e Respostas
        {questions.length > 0 && (
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--muted)', fontWeight: 400 }}>
            {questions.length} {questions.length === 1 ? 'pergunta' : 'perguntas'}
          </span>
        )}
      </h2>

      {/* Form nova pergunta */}
      {currentUser ? (
        <form onSubmit={submitQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Tem alguma dúvida sobre esta aula? Pergunte aqui..."
            style={{
              width: '100%', background: 'var(--panel)', border: '1px solid var(--line-strong)',
              borderRadius: '6px', padding: '12px 14px', color: 'var(--text)',
              fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem', outline: 'none',
              resize: 'vertical', minHeight: '90px', lineHeight: '1.55', boxSizing: 'border-box',
            }}
          />
          <div>
            <button type="submit" disabled={saving || newQuestion.trim().length < 5} style={{
              padding: '9px 22px', background: 'var(--accent)', color: '#000', border: 'none',
              borderRadius: '4px', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700,
              fontSize: '.875rem', cursor: 'pointer', opacity: (saving || newQuestion.trim().length < 5) ? .5 : 1,
            }}>
              {saving ? 'Enviando...' : 'Perguntar'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{
          padding: '14px 18px', background: 'var(--panel)', border: '1px solid var(--line)',
          borderRadius: '6px', fontFamily: 'Space Mono, monospace', fontSize: '.75rem',
          color: 'var(--muted)', marginBottom: '32px',
        }}>
          Faça login para participar do Q&A.
        </div>
      )}

      {/* Lista de perguntas */}
      {loading ? (
        <p style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.8rem' }}>Carregando perguntas...</p>
      ) : questions.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.8rem' }}>
          Nenhuma pergunta ainda. Seja o primeiro a perguntar!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {questions.map((q) => (
            <QAItem
              key={q.id}
              item={q}
              isAdmin={isAdmin}
              currentUserId={currentUser?.id}
              onDelete={handleDelete}
              onMarkOfficial={handleMarkOfficial}
              onReply={currentUser ? handleReply : null}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <button onClick={loadMore} disabled={loadingMore} style={{
          marginTop: '24px', padding: '9px 22px', background: 'transparent',
          border: '1px solid var(--line-strong)', borderRadius: '4px', color: 'var(--muted)',
          fontFamily: 'Space Grotesk, sans-serif', fontSize: '.875rem', cursor: 'pointer',
        }}>
          {loadingMore ? 'Carregando...' : 'Ver mais'}
        </button>
      )}
    </div>
  );
}
