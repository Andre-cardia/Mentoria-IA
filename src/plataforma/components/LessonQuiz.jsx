import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function LessonQuiz({ lessonId }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noQuiz, setNoQuiz] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUser(user);
    });
  }, []);

  useEffect(() => {
    // Busca questões + opções SEM is_correct (ocultado até submissão)
    supabase
      .from('quiz_questions')
      .select('id, question, order, quiz_options(id, label, order)')
      .eq('lesson_id', lessonId)
      .order('order')
      .then(({ data }) => {
        if (!data || data.length === 0) {
          setNoQuiz(true);
        } else {
          setQuestions(data.map((q) => ({
            ...q,
            quiz_options: [...(q.quiz_options || [])].sort((a, b) => a.order - b.order),
          })));
        }
        setLoading(false);
      });
  }, [lessonId]);

  useEffect(() => {
    if (!currentUser) return;
    supabase
      .from('quiz_attempts')
      .select('id, score, completed_at')
      .eq('lesson_id', lessonId)
      .eq('user_id', currentUser.id)
      .order('completed_at', { ascending: false })
      .then(({ data }) => { if (data) setAttempts(data); });
  }, [lessonId, currentUser]);

  function selectAnswer(questionId, optionId) {
    if (result) return;
    setAnswers((p) => ({ ...p, [questionId]: optionId }));
  }

  async function submit() {
    if (Object.keys(answers).length < questions.length) return;
    setSubmitting(true);

    // Busca com is_correct apenas após submissão para calcular score
    const { data: qWithCorrect } = await supabase
      .from('quiz_questions')
      .select('id, quiz_options(id, is_correct)')
      .eq('lesson_id', lessonId);

    let correct = 0;
    const correctMap = {};
    if (qWithCorrect) {
      for (const q of qWithCorrect) {
        const correctOpt = (q.quiz_options || []).find((o) => o.is_correct);
        if (correctOpt) {
          correctMap[q.id] = correctOpt.id;
          if (answers[q.id] === correctOpt.id) correct++;
        }
      }
    }

    const score = Math.round((correct / questions.length) * 100);

    const { data: attempt } = await supabase
      .from('quiz_attempts')
      .insert({ lesson_id: lessonId, user_id: currentUser.id, score, answers })
      .select('id, score, completed_at')
      .single();

    if (attempt) setAttempts((p) => [attempt, ...p]);
    setResult({ score, correct, total: questions.length, correctMap });
    setSubmitting(false);
  }

  function retry() {
    setAnswers({});
    setResult(null);
  }

  if (loading) {
    return <p style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.8rem' }}>Carregando quiz...</p>;
  }

  if (noQuiz) {
    return (
      <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '8px', padding: '32px', textAlign: 'center', color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.875rem' }}>
        Quiz ainda sem questões. O mentor adicionará em breve.
      </div>
    );
  }

  return (
    <div>
      {/* Banner de resultado */}
      {result && (
        <div style={{
          background: result.score >= 70 ? 'rgba(74,222,128,.08)' : 'rgba(248,113,113,.08)',
          border: `1px solid ${result.score >= 70 ? 'rgba(74,222,128,.3)' : 'rgba(248,113,113,.3)'}`,
          borderRadius: '8px', padding: '20px 24px', marginBottom: '28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
        }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: result.score >= 70 ? '#4ade80' : '#f87171' }}>
              {result.score}%
            </div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.75rem', color: 'var(--muted)', marginTop: '4px' }}>
              {result.correct} de {result.total} {result.total === 1 ? 'correta' : 'corretas'}
            </div>
          </div>
          <button onClick={retry} style={{
            padding: '8px 20px', background: 'transparent', border: '1px solid var(--line-strong)',
            borderRadius: '4px', color: 'var(--muted)', fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '.875rem', cursor: 'pointer',
          }}>
            Tentar novamente
          </button>
        </div>
      )}

      {/* Questões */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {questions.map((q, qi) => {
          const selected = answers[q.id];
          const correctOptId = result?.correctMap[q.id];
          return (
            <div key={q.id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '8px', padding: '20px 24px' }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Questão {qi + 1}
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 500, lineHeight: '1.5', color: 'var(--text)' }}>
                {q.question}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {q.quiz_options.map((o) => {
                  const isSelected = selected === o.id;
                  const isCorrect = result && correctOptId === o.id;
                  const isWrong = result && isSelected && !isCorrect;

                  let border = '1px solid var(--line-strong)';
                  let bg = 'var(--panel-2)';
                  if (isCorrect) { border = '1px solid rgba(74,222,128,.5)'; bg = 'rgba(74,222,128,.07)'; }
                  else if (isWrong) { border = '1px solid rgba(248,113,113,.5)'; bg = 'rgba(248,113,113,.07)'; }
                  else if (isSelected && !result) { border = '1px solid var(--accent)'; bg = 'rgba(255,106,0,.07)'; }

                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => selectAnswer(q.id, o.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 16px', background: bg, border, borderRadius: '6px',
                        color: 'var(--text)', cursor: result ? 'default' : 'pointer',
                        fontFamily: 'Space Grotesk, sans-serif', fontSize: '.9rem',
                        textAlign: 'left', transition: 'background .15s, border .15s',
                        width: '100%',
                      }}
                    >
                      <span style={{
                        width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                        border: isSelected || isCorrect
                          ? `5px solid ${isCorrect ? '#4ade80' : isWrong ? '#f87171' : 'var(--accent)'}`
                          : '2px solid var(--line-strong)',
                        transition: 'border .15s',
                      }} />
                      <span style={{ flex: 1 }}>{o.label}</span>
                      {isCorrect && <span style={{ color: '#4ade80', fontSize: '.8rem', flexShrink: 0 }}>✓ Correta</span>}
                      {isWrong && <span style={{ color: '#f87171', fontSize: '.8rem', flexShrink: 0 }}>✕ Errada</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão submeter */}
      {!result && currentUser && (
        <button
          onClick={submit}
          disabled={submitting || Object.keys(answers).length < questions.length}
          style={{
            marginTop: '24px', padding: '11px 28px', background: 'var(--accent)', color: '#000',
            border: 'none', borderRadius: '6px', fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700, fontSize: '.9rem', cursor: 'pointer',
            opacity: (submitting || Object.keys(answers).length < questions.length) ? .5 : 1,
          }}
        >
          {submitting
            ? 'Calculando...'
            : `Submeter Prova (${Object.keys(answers).length}/${questions.length})`
          }
        </button>
      )}

      {/* Histórico de tentativas */}
      {attempts.length > 0 && (
        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--line)' }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '12px' }}>
            Minhas Tentativas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {attempts.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 16px', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px' }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--muted)' }}>
                  #{attempts.length - i}
                </span>
                <span style={{ fontWeight: 700, color: a.score >= 70 ? '#4ade80' : '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.9rem' }}>
                  {a.score}%
                </span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--muted)', marginLeft: 'auto' }}>
                  {new Date(a.completed_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
