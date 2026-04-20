import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const TYPE_CONFIG = {
  info: {
    bg: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(59, 130, 246, 0.3)',
    icon: 'ℹ️',
    color: '#3b82f6',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: '⚠️',
    color: '#f59e0b',
  },
  success: {
    bg: 'rgba(34, 197, 94, 0.08)',
    border: 'rgba(34, 197, 94, 0.3)',
    icon: '✅',
    color: '#22c55e',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: '❌',
    color: '#ef4444',
  },
  update: {
    bg: 'rgba(168, 85, 247, 0.08)',
    border: 'rgba(168, 85, 247, 0.3)',
    icon: '🚀',
    color: '#a855f7',
  },
};

function AnnouncementCard({ announcement, onDismiss }) {
  const config = TYPE_CONFIG[announcement.type] || TYPE_CONFIG.info;

  return (
    <div
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: '8px',
        padding: '16px 18px',
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start',
        position: 'relative',
      }}
    >
      {/* Icon */}
      <div
        style={{
          fontSize: '1.3rem',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            margin: '0 0 6px 0',
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '.95rem',
            fontWeight: 700,
            color: config.color,
            lineHeight: 1.3,
          }}
        >
          {announcement.title}
        </h3>
        <p
          style={{
            margin: 0,
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '.85rem',
            color: 'var(--text)',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}
        >
          {announcement.body}
        </p>
      </div>

      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={() => onDismiss(announcement.id)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: '1.2rem',
            lineHeight: 1,
            flexShrink: 0,
            fontFamily: 'monospace',
          }}
          title="Dispensar"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const stored = localStorage.getItem('dismissed_featured_announcements');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('featured', true)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Erro ao carregar avisos em destaque:', error);
      return;
    }

    // Filtrar avisos não dispensados
    const active = (data || []).filter((a) => !dismissedIds.has(a.id));

    setAnnouncements(active);
  }

  function handleDismiss(id) {
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(id);
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissed_featured_announcements', JSON.stringify([...newDismissed]));
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }

  if (announcements.length === 0) return null;

  return (
    <section style={{ marginBottom: '32px' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {announcements.map((announcement) => (
          <AnnouncementCard
            key={announcement.id}
            announcement={announcement}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </section>
  );
}
