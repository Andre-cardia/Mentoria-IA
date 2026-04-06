# Epic 1: Mentoria Zero-to-Hero IA

## Visão Geral

Criação da plataforma de mentoria educacional "Zero-to-Hero IA" — um ambiente completo de gestão de ensino online com área do aluno, área de admin e acesso autenticado.

## Objetivo

Desenvolver uma plataforma web que permita ao mentor gerenciar e aos alunos consumir o conteúdo da mentoria, incluindo aulas gravadas, fórum de discussão, materiais didáticos e quadro de avisos.

## Stories

| ID | Título | Status |
|----|--------|--------|
| 1.1 | Criação da Plataforma da Mentoria | Draft |

## Requisitos Funcionais

- RF-01: Autenticação de alunos (login/logout)
- RF-02: Área do aluno com acesso a aulas gravadas
- RF-03: Fórum de discussão entre alunos e mentor
- RF-04: Repositório de materiais didáticos
- RF-05: Quadro de avisos visível para todos os alunos
- RF-06: Painel de Admin para gestão da plataforma
- RF-07: Controle de acesso (admin vs aluno)

## Requisitos Não-Funcionais

- NFR-01: Interface seguindo o Design System Mentoria IA (dark theme, Space Grotesk/Mono, accent #ff6a00)
- NFR-02: Supabase como backend de autenticação e banco de dados
- NFR-03: React + Vite como stack frontend
- NFR-04: Deploy na Vercel

## Restrições

- CON-01: Reutilizar o cliente Supabase já configurado em `src/lib/supabase.js`
- CON-02: Seguir o Design System documentado em `docs/Detalhes do Design System.md`
- CON-03: Manter compatibilidade com a estrutura multi-entry do Vite (`vite.config.js`)
