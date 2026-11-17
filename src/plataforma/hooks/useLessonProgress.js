import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/useAuth';

// A barra lateral e a página usam instâncias separadas deste hook; o evento
// mantém as duas em sincronia quando uma aula é concluída ou desmarcada.
const PROGRESS_EVENT = 'lesson-progress-changed';

function announce(lessonId, completed) {
  window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, { detail: { lessonId, completed } }));
}

export function useLessonProgress() {
  const { user } = useAuth();
  // A sessão renovada troca o objeto `user` sem trocar de pessoa: recarregar
  // só quando o id muda evita o contador piscar para zero.
  const userId = user?.id ?? null;
  const [completedIds, setCompletedIds] = useState(new Set());
  const [marking, setMarking] = useState(false);

  // Carrega progresso do usuário atual
  useEffect(() => {
    async function load() {
      // Reseta ao trocar de usuário — evita exibir dados do usuário anterior.
      setCompletedIds(new Set());
      if (!userId) return;
      const { data } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId);

      if (data) {
        setCompletedIds(new Set(data.map((r) => r.lesson_id)));
      }
    }

    load();
  }, [userId]);

  useEffect(() => {
    function onChange(event) {
      const { lessonId, completed } = event.detail ?? {};
      if (!lessonId) return;
      setCompletedIds((prev) => {
        if (prev.has(lessonId) === completed) return prev;
        const next = new Set(prev);
        if (completed) next.add(lessonId);
        else next.delete(lessonId);
        return next;
      });
    }
    window.addEventListener(PROGRESS_EVENT, onChange);
    return () => window.removeEventListener(PROGRESS_EVENT, onChange);
  }, []);

  const isComplete = useCallback(
    (lessonId) => completedIds.has(lessonId),
    [completedIds]
  );

  const toggleComplete = useCallback(
    async (lessonId) => {
      if (!user) return;
      setMarking(true);
      if (completedIds.has(lessonId)) {
        // Optimistic remove
        setCompletedIds((prev) => { const next = new Set(prev); next.delete(lessonId); return next; });
        const { error } = await supabase
          .from('lesson_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId);
        if (error) {
          console.error('[toggleComplete] DELETE falhou:', error);
          setCompletedIds((prev) => new Set([...prev, lessonId]));
        } else {
          announce(lessonId, false);
        }
      } else {
        // Optimistic add
        setCompletedIds((prev) => new Set([...prev, lessonId]));
        const { error } = await supabase.from('lesson_progress').insert({ user_id: user.id, lesson_id: lessonId });
        if (error) {
          console.error('[toggleComplete] INSERT falhou:', error);
          setCompletedIds((prev) => { const next = new Set(prev); next.delete(lessonId); return next; });
        } else {
          announce(lessonId, true);
        }
      }
      setMarking(false);
    },
    [user, completedIds]
  );

  const getModuleProgress = useCallback(
    (moduleId, lessons = []) => {
      const total = lessons.length;
      const completed = lessons.filter((l) => completedIds.has(l.id)).length;
      return { moduleId, total, completed };
    },
    [completedIds]
  );

  const getTotalProgress = useCallback(
    (modules = []) => {
      const allLessons = modules.flatMap((m) => m.lessons ?? []);
      const total = allLessons.length;
      const completed = allLessons.filter((l) => completedIds.has(l.id)).length;
      return { total, completed };
    },
    [completedIds]
  );

  return { isComplete, toggleComplete, getModuleProgress, getTotalProgress, marking, completedIds };
}
