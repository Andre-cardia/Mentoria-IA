import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LessonPlayer, { toEmbedUrl } from '../components/LessonPlayer';

// ── toEmbedUrl unit tests ─────────────────────────────────────

describe('toEmbedUrl', () => {
  it('converte URL de watch do YouTube para embed', () => {
    const result = toEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('converte URL curta do YouTube (youtu.be) para embed', () => {
    const result = toEmbedUrl('https://youtu.be/dQw4w9WgXcQ');
    expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('converte URL do Vimeo para embed', () => {
    const result = toEmbedUrl('https://vimeo.com/123456789');
    expect(result).toBe('https://player.vimeo.com/video/123456789');
  });

  it('retorna null para URL inválida', () => {
    expect(toEmbedUrl('https://example.com/video')).toBeNull();
  });

  it('retorna null para valor nulo', () => {
    expect(toEmbedUrl(null)).toBeNull();
  });
});

// ── LessonPlayer render tests ─────────────────────────────────

describe('LessonPlayer', () => {
  it('renderiza iframe com URL do YouTube', () => {
    render(<LessonPlayer videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />);
    const iframe = document.querySelector('iframe');
    expect(iframe).toBeTruthy();
    // Verifica o atributo src sem disparar fetch no happy-dom
    expect(iframe.getAttribute('src')).toContain('youtube.com/embed/dQw4w9WgXcQ');
  });

  it('renderiza iframe com URL do Vimeo', () => {
    render(<LessonPlayer videoUrl="https://vimeo.com/123456789" />);
    const iframe = document.querySelector('iframe');
    expect(iframe).toBeTruthy();
    expect(iframe.getAttribute('src')).toContain('player.vimeo.com/video/123456789');
  });

  it('renderiza mensagem de fallback para URL inválida', () => {
    render(<LessonPlayer videoUrl="https://example.com/video" />);
    expect(screen.getByText(/vídeo não disponível/i)).toBeTruthy();
  });

  it('renderiza mensagem de fallback quando videoUrl é null', () => {
    render(<LessonPlayer videoUrl={null} />);
    expect(screen.getByText(/vídeo não disponível/i)).toBeTruthy();
  });
});
