# 🎬 Funcionalidade de Embeds - Editor de Texto Rico

## Visão Geral

O editor de texto rico agora suporta incorporação (embedding) de conteúdo de redes sociais e vídeos diretamente no campo "Sobre o curso".

## Plataformas Suportadas

### 1. YouTube 🎥
- Incorpore vídeos do YouTube
- Responsivo (16:9 aspect ratio)
- Suporta URLs nos formatos:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - `https://www.youtube.com/embed/VIDEO_ID`

### 2. LinkedIn 💼
- Incorpore posts públicos do LinkedIn
- Altura automática ajustada para conteúdo
- Suporta URLs de posts no formato:
  - `https://www.linkedin.com/posts/...`
  - `https://www.linkedin.com/feed/update/...`

### 3. X (Twitter) 🐦
- Incorpore tweets
- Renderização nativa do Twitter
- Suporta URLs no formato:
  - `https://twitter.com/username/status/TWEET_ID`
  - `https://x.com/username/status/TWEET_ID`

## Como Usar

### No Editor de Curso:

1. Acesse Admin → Cursos & Aulas → Criar/Editar curso
2. No campo "Sobre o curso", clique no botão **🎬** na barra de ferramentas
3. Selecione a plataforma desejada (YouTube, LinkedIn ou X)
4. Cole a URL completa do conteúdo
5. Ajuste a altura (opcional, exceto para LinkedIn)
6. Clique em "Inserir"

### No Editor de Blog:

1. Acesse Admin → Blog → Criar/Editar post
2. No editor de conteúdo, clique no botão **🎬** na barra de ferramentas
3. Selecione a plataforma desejada (YouTube, LinkedIn ou X)
4. Cole a URL completa do conteúdo
5. Ajuste a altura (opcional, exceto para LinkedIn)
6. Clique em "Inserir"

### Exemplo de Uso:

**YouTube:**
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**LinkedIn:**
```
https://www.linkedin.com/posts/username-123456789_post-content
```

**Twitter/X:**
```
https://twitter.com/username/status/1234567890
```

## Arquivos Criados/Modificados

### Componentes Criados:
- ✨ `/src/plataforma/components/EmbedModal.jsx` - Modal para inserir embeds
- ✨ `/src/plataforma/components/extensions/Iframe.js` - Extensão TipTap para iframes
- ✨ `/src/plataforma/components/RichTextEditor.css` - Estilos responsivos

### Componentes Modificados:
- 🔧 `/src/plataforma/components/RichTextEditor.jsx` - Editor de curso (+ embed)
- 🔧 `/src/plataforma/pages/admin/AdminModulosPage.jsx` - Integração do editor rico
- 🔧 `/src/plataforma/pages/admin/AdminBlogEditorPage.jsx` - Editor de blog (+ embed)
- 🔧 `/src/pages/BlogPostPage.jsx` - Renderização pública de posts (+ embed)
- 🔧 `/src/plataforma/pages/PlataformaBlogPostPage.jsx` - Renderização na plataforma (+ embed)

## Funcionalidades Técnicas

### Processamento de URLs
- **YouTube**: Extrai video ID e converte para formato embed
- **LinkedIn**: Processa URLs de posts para formato embed
- **Twitter**: Extrai tweet ID e usa Twitter Embed API

### Responsividade
- YouTube: Aspect ratio 16:9 automático
- LinkedIn: Altura mínima de 500px (desktop) / 400px (mobile)
- Twitter: Altura mínima de 400px (desktop) / 350px (mobile)

### Segurança
- Validação de URLs (deve começar com http/https)
- Validação de formato por plataforma
- Sandbox de iframes com allowfullscreen

## Personalização

### Alterar Altura Padrão:
No `RichTextEditor.jsx`, o prop `minHeight` controla a altura inicial do editor.

### Adicionar Novas Plataformas:
1. Edite `/src/plataforma/components/extensions/Iframe.js`
2. Adicione nova função `get[Plataforma]EmbedUrl(url)`
3. Atualize `processEmbedUrl()` com o novo tipo
4. Adicione nova tab no `EmbedModal.jsx`

## Suporte ao Usuário

### Problemas Comuns:

**Embed não aparece:**
- Verifique se a URL está correta e pública
- Alguns conteúdos privados não podem ser incorporados
- LinkedIn requer posts públicos

**Vídeo do YouTube não carrega:**
- Certifique-se de que o vídeo não está privado
- Verifique se o vídeo permite incorporação

**Tweet não aparece:**
- O tweet deve ser público
- Contas protegidas não permitem embed

## Próximos Passos (Futuro)

- [ ] Suporte para Vimeo
- [ ] Suporte para Instagram (requer API)
- [ ] Suporte para TikTok
- [ ] Preview antes de inserir
- [ ] Biblioteca de embeds salvos
