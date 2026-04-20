import { Node, mergeAttributes } from '@tiptap/core';

export const Iframe = Node.create({
  name: 'iframe',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      frameborder: {
        default: 0,
      },
      allowfullscreen: {
        default: true,
      },
      width: {
        default: '100%',
      },
      height: {
        default: '400',
      },
      class: {
        default: 'embed-iframe',
      },
    };
  },

  parseHTML() {
    return [{
      tag: 'iframe',
    }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { class: 'embed-container' }, ['iframe', mergeAttributes(HTMLAttributes)]];
  },

  addCommands() {
    return {
      setIframe: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});

// Funções helper para processar URLs
export function getYouTubeEmbedUrl(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return null;
}

export function getLinkedInEmbedUrl(url) {
  // LinkedIn posts podem ser embedados diretamente
  // Formato: https://www.linkedin.com/embed/feed/update/urn:li:share:xxxxxxx

  // Se já for uma URL de embed, retorna
  if (url.includes('/embed/')) {
    return url;
  }

  // Para posts do LinkedIn, tentamos extrair o ID
  const postMatch = url.match(/\/feed\/update\/(urn:li:\w+:\d+)/);
  if (postMatch) {
    return `https://www.linkedin.com/embed/feed/update/${postMatch[1]}`;
  }

  // Para outros tipos de posts do LinkedIn
  const ugcMatch = url.match(/\/posts\/.*-(\d+)-/);
  if (ugcMatch) {
    return `https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:${ugcMatch[1]}`;
  }

  // Caso não consiga processar, retorna a URL original
  // O LinkedIn tem um sistema de oEmbed, mas requer API
  return url;
}

export function getTwitterEmbedUrl(url) {
  // Twitter/X embeds usando Twitter's embed API
  // Formato: https://platform.twitter.com/embed/Tweet.html?id=TWEET_ID

  const tweetMatch = url.match(/status\/(\d+)/);
  if (tweetMatch) {
    const tweetId = tweetMatch[1];
    return `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}`;
  }

  return null;
}

export function processEmbedUrl(url, type) {
  switch (type) {
    case 'youtube':
      return getYouTubeEmbedUrl(url);
    case 'linkedin':
      return getLinkedInEmbedUrl(url);
    case 'twitter':
      return getTwitterEmbedUrl(url);
    default:
      return url;
  }
}
