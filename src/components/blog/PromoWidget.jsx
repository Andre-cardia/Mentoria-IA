import { useRef, useCallback, useState } from 'react';

export default function PromoWidget({
  variant = 'text',
  image,
  video,
  title,
  description,
  badge,
  cta,
  href,
}) {
  return (
    <div style={styles.container}>
      {variant === 'image' && (
        <ImageVariant image={image} title={title} description={description} cta={cta} href={href} />
      )}
      {variant === 'video' && (
        <VideoVariant video={video} title={title} cta={cta} href={href} />
      )}
      {variant === 'text' && (
        <TextVariant badge={badge} title={title} description={description} cta={cta} href={href} />
      )}
    </div>
  );
}

function ImageVariant({ image, title, description, cta, href }) {
  return (
    <>
      <div style={styles.mediaWrap}>
        <img src={image} alt={title || ''} style={styles.image} />
      </div>
      <div style={styles.body}>
        {title && <h4 style={styles.title}>{title}</h4>}
        {description && <p style={styles.description}>{description}</p>}
        {cta && href && (
          <a href={href} target="_blank" rel="noopener noreferrer" style={styles.ctaButton}>
            {cta}
          </a>
        )}
      </div>
    </>
  );
}

function VideoVariant({ video, title, cta, href }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  }, []);

  return (
    <>
      <div style={styles.mediaWrap}>
        <video
          ref={videoRef}
          src={video}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          style={styles.video}
        />
        <button onClick={toggleMute} style={styles.muteButton} aria-label={muted ? 'Ativar áudio' : 'Silenciar'}>
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
      <div style={styles.body}>
        {title && <h4 style={styles.title}>{title}</h4>}
        {cta && href && (
          <a href={href} target="_blank" rel="noopener noreferrer" style={styles.ctaButton}>
            {cta}
          </a>
        )}
      </div>
    </>
  );
}

function TextVariant({ badge, title, description, cta, href }) {
  return (
    <div style={styles.textBody}>
      {badge && <span style={styles.badge}>{badge}</span>}
      {title && <h4 style={styles.textTitle}>{title}</h4>}
      {description && <p style={styles.description}>{description}</p>}
      {cta && href && (
        <a href={href} target="_blank" rel="noopener noreferrer" style={styles.ctaButton}>
          {cta}
        </a>
      )}
    </div>
  );
}

const styles = {
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid var(--line)',
    marginBottom: 20,
    background: 'var(--panel-2)',
  },
  mediaWrap: {
    position: 'relative',
    lineHeight: 0,
  },
  image: {
    width: '100%',
    display: 'block',
    objectFit: 'cover',
    borderRadius: '6px 6px 0 0',
  },
  video: {
    width: '100%',
    display: 'block',
    objectFit: 'cover',
  },
  muteButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    background: 'rgba(0,0,0,.6)',
    border: 'none',
    borderRadius: 4,
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '1rem',
    lineHeight: 1,
    zIndex: 2,
  },
  body: {
    padding: 16,
  },
  textBody: {
    padding: 16,
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '.95rem',
    fontWeight: 600,
    color: 'var(--text)',
    margin: '0 0 6px',
    lineHeight: 1.3,
  },
  textTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text)',
    margin: '0 0 8px',
    lineHeight: 1.3,
  },
  description: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '.85rem',
    color: 'var(--muted)',
    margin: '0 0 12px',
    lineHeight: 1.5,
  },
  badge: {
    display: 'inline-block',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '.75rem',
    fontWeight: 600,
    color: 'var(--accent)',
    background: 'var(--accent-soft)',
    padding: '3px 10px',
    borderRadius: 20,
    marginBottom: 10,
  },
  ctaButton: {
    display: 'inline-block',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '.85rem',
    fontWeight: 600,
    color: '#000',
    background: 'var(--accent)',
    padding: '8px 18px',
    borderRadius: 6,
    textDecoration: 'none',
    transition: 'opacity .2s',
  },
};
