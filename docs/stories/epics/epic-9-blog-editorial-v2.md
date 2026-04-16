# Epic 9 — Blog Editorial v2

## Vision

Transformar o blog de uma vitrine simples de posts em um canal editorial completo de aquisicao, engajamento e promocao de produtos (Mentoria Zero-to-Hero IA e Pulsemind).

## Goals

1. Layout 2 colunas com sidebar em BlogPage e BlogPostPage
2. Sidebar com posts recentes e banners promocionais (imagem, video, texto)
3. Post em destaque controlado via admin (flag `featured`)
4. Banner inline promocional dentro dos artigos

## Scope

### IN
- Componentes: RecentPostsWidget, PromoWidget (3 variantes), BlogSidebar, FeaturedPost, InlinePromo
- Refatoracao de layout: BlogPage e BlogPostPage para grid 2 colunas
- Migration Supabase: coluna `featured` em `posts`
- Toggle featured no AdminBlogEditorPage
- Mobile responsive: sidebar colapsa abaixo do conteudo em <768px

### OUT (Backlog)
- Newsletter propria (Resend + subscribers + admin) — Wave 3 futura
- Integracao com analytics
- Sistema de recomendacao por tags

## Waves

### Wave 1 — Layout + Sidebar + Banners
- 9.1: RecentPostsWidget
- 9.2: PromoWidget (3 variantes)
- 9.3: BlogSidebar + BlogPage layout 2 colunas
- 9.4: BlogPostPage layout com sidebar sticky

### Wave 2 — Post em Destaque + Inline Promo
- 9.5: Migration `featured` + toggle no admin
- 9.6: FeaturedPost hero na BlogPage
- 9.7: InlinePromo banner horizontal no BlogPostPage

## Assets

| Asset | Path | Uso |
|---|---|---|
| Pulsemind imagem | `src/assets/pulsemind01.jpeg` | PromoWidget variant=image |
| Pulsemind video | `src/assets/pulsemind-promo.mp4` | PromoWidget variant=video |
| Pulsemind URL | `https://pulsemind.com.br` | CTA link |
| Mentoria URL | `/#planos` | CTA link |

## Dependencies

- Epic 8 (Blog) completo
- CSS variables no `index.html` (ja aplicado)
- `blog-prose.css` (ja existe)
