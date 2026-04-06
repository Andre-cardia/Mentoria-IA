import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function ForumPage() {
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [openTopic, setOpenTopic] = useState(null);
  const [replies, setReplies] = useState({});
  const [loading, setLoading] = useState(true);
  const [newTopic, setNewTopic] = useState({ title: '', body: '' });
  const [newReply, setNewReply] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadTopics(); }, []);

  async function loadTopics() {
    const { data } = await supabase
      .from('forum_topics')
      .select('id, title, body, created_at, user_id')
      .order('created_at', { ascending: false });
    setTopics(data ?? []);
    setLoading(false);
  }

  async function loadReplies(topicId) {
    if (replies[topicId]) return;
    const { data } = await supabase
      .from('forum_replies')
      .select('id, body, created_at, user_id')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });
    setReplies((prev) => ({ ...prev, [topicId]: data ?? [] }));
  }

  async function openThread(topicId) {
    if (openTopic === topicId) { setOpenTopic(null); return; }
    setOpenTopic(topicId);
    await loadReplies(topicId);
  }

  async function submitTopic(e) {
    e.preventDefault();
    if (!newTopic.title.trim() || !newTopic.body.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('forum_topics').insert({
      title: newTopic.title.trim(),
      body: newTopic.body.trim(),
      user_id: user.id,
    });
    if (!error) {
      setNewTopic({ title: '', body: '' });
      setShowForm(false);
      await loadTopics();
    }
    setSubmitting(false);
  }

  async function submitReply(e, topicId) {
    e.preventDefault();
    if (!newReply.trim()) return;
    setSubmitting(true);
    const { data, error } = await supabase.from('forum_replies').insert({
      topic_id: topicId,
      user_id: user.id,
      body: newReply.trim(),
    }).select().single();
    if (!error) {
      setReplies((prev) => ({ ...prev, [topicId]: [...(prev[topicId] ?? []), data] }));
      setNewReply('');
    }
    setSubmitting(false);
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const inputSx = {
    width: '100%', background: 'var(--panel-2)',
    border: '1px solid var(--line-strong)', borderRadius: '4px',
    padding: '10px 14px', color: 'var(--text)',
    fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem',
    outline: 'none', resize: 'vertical',
  };

  return (
    <Layout>
      <div style={{ maxWidth: '780px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
              Comunidade
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Fórum</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: '10px 22px', background: 'var(--accent)', color: '#000',
            border: 'none', borderRadius: '4px',
            fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '.875rem',
            cursor: 'pointer',
          }}>
            + Novo Tópico
          </button>
        </div>

        {/* Form novo tópico */}
        {showForm && (
          <form onSubmit={submitTopic} style={{
            background: 'var(--panel)', border: '1px solid var(--line)',
            borderRadius: '6px', padding: '24px', marginBottom: '24px',
            display: 'flex', flexDirection: 'column', gap: '14px',
          }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Novo Tópico
            </div>
            <input
              type="text" placeholder="Título do tópico" value={newTopic.title}
              onChange={(e) => setNewTopic((p) => ({ ...p, title: e.target.value }))}
              style={inputSx} required
            />
            <textarea
              placeholder="Descreva sua dúvida ou discussão..." value={newTopic.body}
              onChange={(e) => setNewTopic((p) => ({ ...p, body: e.target.value }))}
              rows={4} style={inputSx} required
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={submitting} style={{
                padding: '10px 22px', background: 'var(--accent)', color: '#000',
                border: 'none', borderRadius: '4px',
                fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '.875rem',
                cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? .6 : 1,
              }}>
                {submitting ? 'Publicando...' : 'Publicar'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{
                padding: '10px 22px', background: 'transparent',
                border: '1px solid var(--line-strong)', borderRadius: '4px',
                color: 'var(--muted)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '.875rem', cursor: 'pointer',
              }}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {loading && <p style={{ color: 'var(--muted)' }}>Carregando tópicos...</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {topics.map((topic) => (
            <div key={topic.id} style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: '6px', overflow: 'hidden',
            }}>
              <button onClick={() => openThread(topic.id)} style={{
                width: '100%', padding: '18px 20px', background: 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{topic.title}</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--muted)', fontFamily: 'Space Mono, monospace' }}>
                    {formatDate(topic.created_at)}
                  </div>
                </div>
                <span style={{ color: 'var(--accent)', fontSize: '1rem', flexShrink: 0 }}>
                  {openTopic === topic.id ? '▲' : '▼'}
                </span>
              </button>

              {openTopic === topic.id && (
                <div style={{ borderTop: '1px solid var(--line)' }}>
                  {/* Post original */}
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--line)', background: 'rgba(255,106,0,.04)' }}>
                    <p style={{ color: 'var(--text)', lineHeight: 1.7, fontSize: '.925rem' }}>{topic.body}</p>
                  </div>

                  {/* Respostas */}
                  {(replies[topic.id] ?? []).map((reply) => (
                    <div key={reply.id} style={{ padding: '14px 20px 14px 36px', borderBottom: '1px solid var(--line)' }}>
                      <div style={{ fontSize: '.75rem', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', marginBottom: '6px' }}>
                        {formatDate(reply.created_at)}
                      </div>
                      <p style={{ color: 'var(--text)', fontSize: '.9rem', lineHeight: 1.7 }}>{reply.body}</p>
                    </div>
                  ))}

                  {/* Form de resposta */}
                  <form onSubmit={(e) => submitReply(e, topic.id)} style={{
                    padding: '16px 20px', display: 'flex', gap: '10px', alignItems: 'flex-end',
                  }}>
                    <textarea
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      placeholder="Escreva uma resposta..."
                      rows={2} style={{ ...inputSx, flex: 1, resize: 'none' }}
                    />
                    <button type="submit" disabled={submitting || !newReply.trim()} style={{
                      padding: '10px 18px', background: 'var(--accent)', color: '#000',
                      border: 'none', borderRadius: '4px',
                      fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '.85rem',
                      cursor: (submitting || !newReply.trim()) ? 'not-allowed' : 'pointer',
                      opacity: (submitting || !newReply.trim()) ? .5 : 1, whiteSpace: 'nowrap',
                    }}>
                      Responder
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
          {!loading && topics.length === 0 && (
            <p style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.875rem' }}>
              Nenhum tópico ainda. Seja o primeiro a perguntar!
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
