import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LessonQuiz from '../components/LessonQuiz';

const mockUser = { id: 'user-123' };
const mockInsert = vi.fn();

let questionsResult;
let correctQuestionsResult;
let attemptsResult;
let insertResult;
let userResult;

function eqReturning(value) {
  return vi.fn(() => value);
}

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve(userResult)),
    },
    from: vi.fn((table) => {
      if (table === 'quiz_questions') {
        return {
          select: vi.fn((columns) => ({
            eq: vi.fn(() => {
              if (columns.includes('is_correct')) return Promise.resolve(correctQuestionsResult);
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
          insert: vi.fn((payload) => {
            mockInsert(payload);
            return {
              select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve(insertResult)),
              })),
            };
          }),
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
    correctQuestionsResult = {
      data: [
        {
          id: 'question-1',
          quiz_options: [
            { id: 'option-1', is_correct: true },
            { id: 'option-2', is_correct: false },
          ],
        },
      ],
      error: null,
    };
    attemptsResult = { data: [], error: null };
    insertResult = {
      data: { id: 'attempt-1', score: 100, completed_at: '2026-05-08T12:00:00Z' },
      error: null,
    };
  });

  it('salva a tentativa no servidor antes de exibir o resultado', async () => {
    render(<LessonQuiz lessonId="lesson-1" />);

    await screen.findByText('Qual resposta esta correta?');
    fireEvent.click(screen.getByText('Resposta A'));
    fireEvent.click(screen.getByRole('button', { name: /submeter prova/i }));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        lesson_id: 'lesson-1',
        user_id: 'user-123',
        score: 100,
        answers: { 'question-1': 'option-1' },
      });
    });

    await waitFor(() => {
      expect(screen.getAllByText('100%')).toHaveLength(2);
    });
    expect(screen.getByText(/1 de 1 correta/i)).toBeTruthy();
  });

  it('mostra erro e nao exibe resultado quando o Supabase rejeita o salvamento', async () => {
    insertResult = { data: null, error: { message: 'RLS denied' } };

    render(<LessonQuiz lessonId="lesson-1" />);

    await screen.findByText('Qual resposta esta correta?');
    fireEvent.click(screen.getByText('Resposta A'));
    fireEvent.click(screen.getByRole('button', { name: /submeter prova/i }));

    expect(await screen.findByText(/não foi possível salvar suas respostas/i)).toBeTruthy();
    expect(screen.queryByText('100%')).toBeNull();
  });
});
