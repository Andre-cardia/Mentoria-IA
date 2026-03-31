### Detalhes do Design System

## Cores (CSS Vars)
--bg: #060606 (Fundo primário)
--bg-2: #0b0b0b (Fundo secundário)
--panel: #101010 (Cards e painéis)
--panel-2: #141414 (Painéis alternativos)
--accent: #ff6a00 (Laranja da marca)
--accent-soft: rgba(255,106,0,.14) (Transparência de acento)
--green: #84cc16 (Status de sucesso/ativo)
--text: #f5f2ea (Texto principal)
--muted: #8b867c (Texto secundário/desativado)
--line: rgba(255,255,255,.08) (Borda sutil)
--line-strong: rgba(255,255,255,.16) (Borda de foco/hover)

## Tipografia

- Primária: Space Grotesk (Humanista, 400-700) - Headlines, Body, CTAs.
- Técnica: Space Mono (Monospaced, 400-700) - Labels, Badges, Code.
- Escala: Hero (clamp 2.5-4rem), H1 (2-2.5rem), H2 (1.5-1.75rem), H3 (1.1-1.25rem).
Espaçamento: Base 4px (xs:4, sm:8, md:16, lg:24, xl:32, 2xl:48, 3xl:80).
Bordas: --line (rgba 255/255/255/.08), --line-strong (rgba 255/255/255/.16).
Radius: 3px (badges), 4px (buttons/inputs/logo), 6px (cards).
Fundos: Grid (34px, .06 opacity), Noise (orange/white hints).
Badges: Space Mono 700, .7rem, uppercase, radius 3px. Eyebrows com --accent e letter-spacing .14em.

## Cards:
    - Base: --panel, borda sutil.
    - Accent: Borda lateral/topo laranja.
    - Terminal: Borda laranja .3, scan-overlay, brilho externo.
    - Formulários: Inputs escuros, foco laranja, labels Space Mono.

- Voz & Tom: Técnico, direto, sem jargões vagos, sem emojis em títulos, foco em verbos de ação.
- Princípios:
- Autenticidade Técnica (grid, mono, precisão).
- Hierarquia de Intenção (um CTA primário, laranja aponta).
- Escassez Honesta (urgência real).
- Movimento com Propósito (funcional, não decorativo).
- Preto como Fundação (contraste extremo).
Marca: Mentoria IA (Zero-to-Hero). Use logo em fundo escuro.

## Botões e Interação

- Primário: bg: --accent, color: black, animação glow.
- Outline: border: --line-strong, hover com bg: --accent-soft.
- Ghost: Sem fundo, texto --muted.
- Interação: Efeito active:scale-95.
- Animações (Design Spells)
- animate-glow: Pulsação sutil no acento.
rise: Entrada suave de elementos.
pulse-green: Status ativo.
scan: Efeito de terminal.

## Notas

Seguir o padrão visual "Mentoria IA".
Escrita em pt-br.


Marca: Mentoria IA (Zero-to-Hero). Use logo em fundo escuro.