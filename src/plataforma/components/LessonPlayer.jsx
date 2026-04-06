export function toEmbedUrl(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vi = url.match(/vimeo\.com\/(\d+)/);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
  return null;
}

export default function LessonPlayer({ videoUrl }) {
  const embedUrl = toEmbedUrl(videoUrl);

  if (!embedUrl) {
    return (
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: '6px',
        padding: '40px',
        textAlign: 'center',
        color: 'var(--muted)',
        fontFamily: 'Space Mono, monospace',
        fontSize: '.8rem',
      }}>
        Vídeo não disponível para esta aula.
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      aspectRatio: '16 / 9',
      borderRadius: '6px',
      overflow: 'hidden',
      background: '#000',
    }}>
      <iframe
        src={embedUrl}
        title="Player de aula"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 'none',
        }}
      />
    </div>
  );
}
