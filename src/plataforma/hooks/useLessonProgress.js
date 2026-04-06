import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useLessonProgress() {
  const { user } = useAuth();
  const [completedIds, setCompletedIds] = useState(new Set());
  const [marking, setMarking] = useState(false);

  // Carrega progresso do usuário atual
  useEffect(() => {
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

  const markComplete = useCallback(
    async (lessonId) => {
      if (!user || completedIds.has(lessonId)) return;
      setMarking(true);
      // Optimistic update
      setCompletedIds((prev) => new Set([...prev, lessonId]));
      await supabase.from('lesson_progress').insert({ user_id: user.id, lesson_id: lessonId });
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

  return { isComplete, markComplete, getModuleProgress, getTotalProgress, marking };
}
