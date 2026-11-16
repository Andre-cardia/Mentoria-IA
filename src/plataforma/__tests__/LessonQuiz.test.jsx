import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LessonQuiz from '../components/LessonQuiz';

const mockUser = { id: 'user-123' };
const mockRpc = vi.fn();

let questionsResult;
let attemptsResult;
let submitResult;
let userResult;

function eqReturning(value) {
  return vi.fn(() => value);
}

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve(userResult)),
    },
    rpc: vi.fn((name, params) => {
      mockRpc(name, params);
      return Promise.resolve(submitResult);
    }),
    from: vi.fn((table) => {
      if (table === 'quiz_questions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => {
              return {
                order: vi.fn(() => Promise.resolve(questionsResult)),
              };
            }),
          })),
        };
      }

      if (table === 'quiz_attempts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve(attemptsResult)),
              })),
            })),
          })),
        };
      }

      return { select: vi.fn(() => ({ eq: eqReturning(Promise.resolve({ data: [], error: null })) })) };
    }),
  },
}));

describe('LessonQuiz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userResult = { data: { user: mockUser }, error: null };
    questionsResult = {
      data: [
        {
          id: 'question-1',
          question: 'Qual resposta esta correta?',
          order: 0,
          quiz_options: [
            { id: 'option-2', label: 'Resposta B', order: 1 },
            { id: 'option-1', label: 'Resposta A', order: 0 },
          ],
        },
      ],
      error: null,
    };
    attemptsResult = { data: [], error: null };
    submitResult = {
      data: {
        id: 'attempt-1', score: 100, correct: 1, total: 1,
        correct_map: { 'question-1': 'option-1' },
        completed_at: '2026-05-08T12:00:00Z', points_earned: 20,
      },
      error: null,
    };
  });

  it('salva a tentativa no servidor antes de exibir o resultado', async () => {
    render(<LessonQuiz lessonId="lesson-1" />);

    await screen.findByText('Qual resposta esta correta?');
    fireEvent.click(screen.getByText('Resposta A'));
    fireEvent.click(screen.getByRole('button', { name: /submeter prova/i }));

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('submit_quiz_attempt', {
        p_lesson_id: 'lesson-1',
        p_answers: { 'question-1': 'option-1' },
      });
    });

    await waitFor(() => {
      expect(screen.getAllByText('100%')).toHaveLength(2);
    });
    expect(screen.getByText(/1 de 1 correta/i)).toBeTruthy();
    expect(screen.getByText(/\+20 pontos na Corrida Estelar/)).toBeTruthy();
  });

  it('não promete pontos quando a nota fica abaixo de 70%', async () => {
    submitResult = {
      data: { id: 'attempt-2', score: 0, correct: 0, total: 1, correct_map: { 'question-1': 'option-1' }, completed_at: '2026-05-08T12:00:00Z', points_earned: 0 },
      error: null,
    };
    render(<LessonQuiz lessonId="lesson-1" />);

    await screen.findByText('Qual resposta esta correta?');
    fireEvent.click(screen.getByText('Resposta B'));
    fireEvent.click(screen.getByRole('button', { name: /submeter prova/i }));

    expect(await screen.findByText(/Acerte 70% ou mais/)).toBeTruthy();
    expect(screen.queryByText(/pontos na Corrida Estelar$/)).toBeNull();
  });

  it('mostra erro e nao exibe resultado quando o Supabase rejeita o salvamento', async () => {
    submitResult = { data: null, error: { message: 'denied' } };

    render(<LessonQuiz lessonId="lesson-1" />);

    await screen.findByText('Qual resposta esta correta?');
    fireEvent.click(screen.getByText('Resposta A'));
    fireEvent.click(screen.getByRole('button', { name: /submeter prova/i }));

    expect(await screen.findByText(/não foi possível salvar suas respostas/i)).toBeTruthy();
    expect(screen.queryByText('100%')).toBeNull();
  });
});
