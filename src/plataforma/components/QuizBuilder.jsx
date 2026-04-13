import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const inputSx = {
  background: 'var(--panel-2)', border: '1px solid var(--line-strong)',
  borderRadius: '4px', padding: '8px 12px', color: 'var(--text)',
  fontFamily: 'Space Grotesk, sans-serif', fontSize: '.875rem', outline: 'none',
  width: '100%', boxSizing: 'border-box',
};

const btnSmSx = {
  padding: '4px 8px', background: 'transparent', border: '1px solid var(--line-strong)',
  borderRadius: '3px', color: 'var(--muted)', fontFamily: 'Space Mono, monospace',
  fontSize: '.65rem', cursor: 'pointer',
};

function uid() {
  return Math.random().toString(36).slice(2);
}

function newOption() {
  return { _id: uid(), label: '', is_correct: false };
}

function newQuestion() {
  return { _id: uid(), question: '', options: [newOption(), newOption()] };
}

function QuestionCard({ q, qi, total, onUpdate, onRemove, onMove, onAddOption, onRemoveOption, onUpdateOption, onSetCorrect, onMoveOption }) {
  return (
    <div style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: '6px', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', color: 'var(--accent)', minWidth: '24px' }}>
          Q{qi + 1}
        </span>
        <input
          style={{ ...inputSx, flex: 1 }}
          placeholder={`Texto da questão ${qi + 1}...`}
          value={q.question}
          onChange={(e) => onUpdate(q._id, e.target.value)}
        />
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button type="button" onClick={() => onMove(q._id, -1)} disabled={qi === 0} style={btnSmSx}>▲</button>
          <button type="button" onClick={() => onMove(q._id, 1)} disabled={qi === total - 1} style={btnSmSx}>▼</button>
          {total > 1 && (
            <button type="button" onClick={() => onRemove(q._id)} style={{ ...btnSmSx, color: '#f87171', borderColor: 'rgba(248,113,113,.3)' }}>✕</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px' }}>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.6rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
          Opções — marque a correta
        </div>
        {q.options.map((o, oi) => (
          <div key={o._id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="radio"
              name={`correct-${q._id}`}
              checked={o.is_correct}
              onChange={() => onSetCorrect(q._id, o._id)}
              title="Marcar como correta"
              style={{ accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0, width: '16px', height: '16px' }}
            />
            <input
              style={{ ...inputSx, flex: 1 }}
              placeholder={`Opção ${oi + 1}...`}
              value={o.label}
              onChange={(e) => onUpdateOption(q._id, o._id, e.target.value)}
            />
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              <button type="button" onClick={() => onMoveOption(q._id, o._id, -1)} disabled={oi === 0} style={btnSmSx}>▲</button>
              <button type="button" onClick={() => onMoveOption(q._id, o._id, 1)} disabled={oi === q.options.length - 1} style={btnSmSx}>▼</button>
              {q.options.length > 2 && (
                <button type="button" onClick={() => onRemoveOption(q._id, o._id)} style={{ ...btnSmSx, color: '#f87171', borderColor: 'rgba(248,113,113,.3)' }}>✕</button>
              )}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onAddOption(q._id)}
          style={{
            marginTop: '2px', padding: '5px 12px', background: 'transparent',
            border: '1px dashed var(--line-strong)', borderRadius: '4px',
            color: 'var(--muted)', fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '.78rem', cursor: 'pointer', alignSelf: 'flex-start',
          }}
        >
          + Opção
        </button>
      </div>
    </div>
  );
}

export default function QuizBuilder({ lessonId }) {
  const [questions, setQuestions] = useState([newQuestion()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase
      .from('quiz_questions')
      .select('id, question, order, quiz_options(id, label, is_correct, order)')
      .eq('lesson_id', lessonId)
      .order('order')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setQuestions(data.map((q) => ({
            _id: q.id,
            dbId: q.id,
            question: q.question,
            options: [...(q.quiz_options || [])]
              .sort((a, b) => a.order - b.order)
              .map((o) => ({ _id: o.id, dbId: o.id, label: o.label, is_correct: o.is_correct })),
          })));
        }
        setLoading(false);
      });
  }, [lessonId]);

  function addQuestion() {
    setQuestions((p) => [...p, newQuestion()]);
  }

  function removeQuestion(qId) {
    setQuestions((p) => p.filter((q) => q._id !== qId));
  }

  function updateQuestion(qId, text) {
    setQuestions((p) => p.map((q) => q._id === qId ? { ...q, question: text } : q));
  }

  function moveQuestion(qId, dir) {
    setQuestions((p) => {
      const idx = p.findIndex((q) => q._id === qId);
      if ((dir === -1 && idx === 0) || (dir === 1 && idx === p.length - 1)) return p;
      const arr = [...p];
      [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
      return arr;
    });
  }

  function addOption(qId) {
    setQuestions((p) => p.map((q) => q._id === qId ? { ...q, options: [...q.options, newOption()] } : q));
  }

  function removeOption(qId, oId) {
    setQuestions((p) => p.map((q) => q._id === qId ? { ...q, options: q.options.filter((o) => o._id !== oId) } : q));
  }

  function updateOption(qId, oId, label) {
    setQuestions((p) => p.map((q) => q._id === qId
      ? { ...q, options: q.options.map((o) => o._id === oId ? { ...o, label } : o) }
      : q
    ));
  }

  function setCorrect(qId, oId) {
    setQuestions((p) => p.map((q) => q._id === qId
      ? { ...q, options: q.options.map((o) => ({ ...o, is_correct: o._id === oId })) }
      : q
    ));
  }

  function moveOption(qId, oId, dir) {
    setQuestions((p) => p.map((q) => {
      if (q._id !== qId) return q;
      const idx = q.options.findIndex((o) => o._id === oId);
      if ((dir === -1 && idx === 0) || (dir === 1 && idx === q.options.length - 1)) return q;
      const arr = [...q.options];
      [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
      return { ...q, options: arr };
    }));
  }

  async function saveQuiz() {
    setError('');
    for (const q of questions) {
      if (!q.question.trim()) { setError('Preencha o texto de todas as questões.'); return; }
      for (const o of q.options) {
        if (!o.label.trim()) { setError('Preencha o texto de todas as opções.'); return; }
      }
      if (!q.options.some((o) => o.is_correct)) { setError('Marque a opção correta em cada questão.'); return; }
    }

    setSaving(true);

    // Delete all existing (cascade to options)
    await supabase.from('quiz_questions').delete().eq('lesson_id', lessonId);

    // Re-insert
    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi];
      const { data: qData } = await supabase
        .from('quiz_questions')
        .insert({ lesson_id: lessonId, question: q.question.trim(), order: qi })
        .select('id')
        .single();

      if (qData) {
        await supabase.from('quiz_options').insert(
          q.options.map((o, oi) => ({
            question_id: qData.id,
            label: o.label.trim(),
            is_correct: o.is_correct,
            order: oi,
          }))
        );
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return <p style={{ color: 'var(--muted)', fontFamily: 'Space Mono, monospace', fontSize: '.8rem' }}>Carregando quiz...</p>;
  }

  return (
    <div style={{ marginTop: '8px', padding: '16px', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px' }}>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--accent)', marginBottom: '14px' }}>
        Quiz Builder — {questions.length} {questions.length === 1 ? 'questão' : 'questões'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {questions.map((q, qi) => (
          <QuestionCard
            key={q._id}
            q={q} qi={qi} total={questions.length}
            onUpdate={updateQuestion} onRemove={removeQuestion} onMove={moveQuestion}
            onAddOption={addOption} onRemoveOption={removeOption} onUpdateOption={updateOption}
            onSetCorrect={setCorrect} onMoveOption={moveOption}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addQuestion}
        style={{
          marginTop: '10px', padding: '8px 18px', background: 'transparent',
          border: '1px dashed var(--line-strong)', borderRadius: '4px',
          color: 'var(--muted)', fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '.875rem', cursor: 'pointer', width: '100%',
        }}
      >
        + Adicionar Questão
      </button>

      {error && (
        <p style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: '.75rem', margin: '10px 0 0' }}>{error}</p>
      )}

      <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          onClick={saveQuiz}
          disabled={saving}
          style={{
            padding: '9px 24px', background: 'var(--accent)', color: '#000',
            border: 'none', borderRadius: '4px', fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700, fontSize: '.875rem', cursor: 'pointer', opacity: saving ? .6 : 1,
          }}
        >
          {saving ? 'Salvando...' : 'Salvar Quiz'}
        </button>
        {saved && (
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.7rem', color: '#4ade80' }}>✓ Quiz salvo!</span>
        )}
      </div>
    </div>
  );
}
