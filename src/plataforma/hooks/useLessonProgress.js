import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useLessonProgress() {
  const { user } = useAuth();
  const [completedIds, setCompletedIds] = useState(new Set());
  const [marking, setMarking] = useState(false);

  // Carrega progresso do usuário atual
  useEffect(() => {
    // Reseta imediatamente ao trocar de usuário — evita exibir dados do usuário anterior
    setCompletedIds(new Set());
    if (!user) return;

    async function load() {
      const { data } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id);

      if (data) {
        setCompletedIds(new Set(data.map((r) => r.lesson_id)));
      }
    }

    load();
  }, [user]);

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
        }
      } else {
        // Optimistic add
        setCompletedIds((prev) => new Set([...prev, lessonId]));
        const { error } = await supabase.from('lesson_progress').insert({ user_id: user.id, lesson_id: lessonId });
        if (error) {
          console.error('[toggleComplete] INSERT falhou:', error);
          setCompletedIds((prev) => { const next = new Set(prev); next.delete(lessonId); return next; });
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
