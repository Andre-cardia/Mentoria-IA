import { useState } from "react";
import { Helmet } from "react-helmet-async";
import cyberHeroBg from "../assets/auditoria-cyber-hero.jpg";
import { CHECKLIST_SECTIONS } from "../data/checklistSegurancaVibeCode.js";

const STORAGE_LEAD_KEY = "nh_auditoria_lead_v1";

const INITIAL_FORM = {
  name: "",
  email: "",
  whatsapp: "",
  company: "",
};

function getInitialLead() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const savedLead = localStorage.getItem(STORAGE_LEAD_KEY);
    if (savedLead) {
      const parsed = JSON.parse(savedLead);
      if (parsed?.name && parsed?.email) {
        return /** @type {{ name: string, email: string, whatsapp: string, company: string, date?: string }} */ (parsed);
      }
    }
  } catch (e) {
    console.error("[AuditoriaLandingPage] Error loading local storage lead:", e);
  }
  return null;
}

/**
 * @param {{ onNavigateToChecklist?: () => void }} [props]
 */
export default function AuditoriaLandingPage({ onNavigateToChecklist } = {}) {
  const [leadData, setLeadData] = useState(getInitialLead);
  const isUnlocked = Boolean(leadData);

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(/** @type {Record<string, string | undefined>} */ ({}));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleGoToChecklist = (e) => {
    if (e) e.preventDefault();
    if (onNavigateToChecklist) {
      onNavigateToChecklist();
    } else if (typeof window !== "undefined") {
      window.location.href = "/auditoria/checklist";
    }
  };

  const handleActionClick = (e) => {
    if (isUnlocked) {
      handleGoToChecklist(e);
    } else {
      if (e) e.preventDefault();
      const el = document.getElementById("cadastro");
      if (typeof el?.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Informe seu nome completo";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = "Informe um e-mail válido";
    if (!form.whatsapp.trim()) errs.whatsapp = "Informe seu WhatsApp com DDD";
    if (!form.company.trim()) errs.company = "Informe o nome da sua empresa";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      whatsapp: form.whatsapp.trim(),
      company: form.company.trim(),
      role: "Lead Diagnóstico No-Code",
      company_size: "Vibe Code / No-Code",
      objective: "Diagnóstico de Segurança Vibe Code",
      urgency: "Checklist Interativo",
      context: "Lead registrado na landing page /auditoria para acesso ao checklist de segurança",
      source: "neural-hub-auditoria",
      status: "new",
    };

    try {
      const { supabase, isSupabaseConfigured } = await import("../lib/supabase.js");
      if (!isSupabaseConfigured) {
        console.warn("[Auditoria] Supabase não configurado no ambiente local.");
      } else {
        let { error } = await supabase.from("proposal_requests").insert([payload]);
        if (error) {
          console.warn("[Auditoria] Erro na gravação com source default, tentando fallback:", error);
          const fallbackRes = await supabase.from("proposal_requests").insert([{
            ...payload,
            source: "crm-manual",
            context: `[Origem: /auditoria] ${payload.context}`,
          }]);
          error = fallbackRes.error;
        }

        if (error) {
          console.error("[Auditoria] Erro ao gravar lead em proposal_requests:", error);
        }

        // Grava também na tabela leads
        try {
          const nameParts = form.name.trim().split(" ");
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";
          await supabase.from("leads").insert([{
            nome: firstName,
            sobrenome: lastName,
            email: form.email.trim().toLowerCase(),
            whatsapp: form.whatsapp.trim(),
            empresa: form.company.trim(),
            ramo: "No-Code / Vibe Code",
            escolaridade: "Graduação Completa",
            lote: "auditoria-vibe-code",
          }]);
        } catch (leadTableErr) {
          console.warn("[Auditoria] Tabela leads não alcançada:", leadTableErr);
        }
      }
    } catch (err) {
      console.warn("[Auditoria] Exceção ao conectar Supabase:", err);
    }

    const lead = {
      name: form.name.trim(),
      email: form.email.trim(),
      whatsapp: form.whatsapp.trim(),
      company: form.company.trim(),
      date: new Date().toLocaleDateString("pt-BR"),
    };

    try {
      localStorage.setItem(STORAGE_LEAD_KEY, JSON.stringify(lead));
    } catch (err) {
      console.error(err);
    }

    setLeadData(lead);
    setSubmitting(false);

    // Navega para a ferramenta interativa
    handleGoToChecklist();
  };

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--accent)] selection:text-black font-sans"
      style={/** @type {import('react').CSSProperties & Record<`--${string}`, string | number>} */ ({
        "--bg": "#060606",
        "--bg-2": "#0b0b0b",
        "--panel": "#101010",
        "--panel-2": "#141414",
        "--line": "rgba(255,255,255,.08)",
        "--line-strong": "rgba(255,255,255,.16)",
        "--text": "#f5f2ea",
        "--muted": "#8b867c",
        "--accent": "#ff6a00",
        "--accent-soft": "rgba(255,106,0,.14)",
        "--green": "#84cc16",
        "--error": "#ef4444",
        fontFamily: '"Space Grotesk", sans-serif',
      })}
    >
      <Helmet>
        <title>Diagnóstico de Segurança para Vibe Code & No-Code | Neural Hub</title>
        <meta
          name="description"
          content="Landing page executiva de cibersegurança para aplicações no-code e vibe code. Proteja seu banco de dados, chaves de API, regras de negócio e dados de clientes antes de colocar em produção."
        />
        <meta property="og:title" content="Diagnóstico de Segurança Vibe Code | Neural Hub" />
        <meta
          property="og:description"
          content="Baseado nas falhas reais de CVE-2025-48757, vazamentos de IA e caso Manus. Acesse o checklist interativo da Neural Hub."
        />
        <meta property="og:url" content="https://neuralhub.ia.br/auditoria" />
      </Helmet>

      {/* Embedded CSS for animations, background grids and glowing states */}
      <style>{`
        .font-mono { font-family: "Space Mono", monospace; }
        .bg-grid-tech {
          background-image:
            linear-gradient(to right, rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 34px 34px;
        }
        @keyframes glow {
          0%,100% { box-shadow: 0 0 0 rgba(255,106,0,0); }
          50%      { box-shadow: 0 0 28px rgba(255,106,0,.22); }
        }
        @keyframes pulseLine {
          0%,100% { opacity: .28; transform: scaleX(.94); }
          50%     { opacity: .9;  transform: scaleX(1); }
        }
        @keyframes cyberScan {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 0.85; }
          85% { opacity: 0.85; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-glow { animation: glow 2.8s ease-in-out infinite; }
        .animate-pulseLine { animation: pulseLine 3s ease-in-out infinite; }
        .animate-cyberScan { animation: cyberScan 7s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
      `}</style>

      {/* Header */}
      <header className="no-print sticky top-0 z-50 border-b border-[var(--line)] bg-[#060606]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 md:px-8">
          <a href="/auditoria" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-[var(--accent)] flex items-center justify-center font-mono font-bold text-black text-sm group-hover:scale-105 transition-transform">
              NH
            </div>
            <div>
              <div className="text-xs font-mono tracking-widest text-[var(--muted)] uppercase">Neural Hub · SecOps</div>
              <div className="text-base font-bold tracking-tight text-[var(--text)]">Cibersegurança Vibe Code</div>
            </div>
          </a>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-2 border border-[var(--line)] bg-[var(--panel)] px-3 py-1 text-[11px] font-mono text-[var(--muted)] rounded">
              <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse"></span>
              CVE-2025/2026 Updated
            </span>
            <a
              href={isUnlocked ? "/auditoria/checklist" : "#cadastro"}
              onClick={handleActionClick}
              className="rounded bg-[var(--accent)] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-black transition hover:brightness-110 active:scale-95 animate-glow flex items-center gap-2"
            >
              <span>{isUnlocked ? "Ver Meu Checklist" : "Acessar Checklist Gratuito"}</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="no-print relative border-b border-[var(--line)] overflow-hidden">
        {/* Epic Cyber Security Hero Background Layer */}
        <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
          <img
            src={cyberHeroBg}
            alt="Cyber Security Defense & Ethical Hacker Operations"
            className="w-full h-full object-cover object-[78%_center] lg:object-[82%_center] opacity-45 md:opacity-65 lg:opacity-85 mix-blend-screen scale-[1.02] transition-transform duration-1000"
            loading="eager"
          />
          {/* Gradient Fades for optimal contrast, readability and seamless page blending */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#060606] via-[#060606]/85 to-transparent sm:w-4/5 lg:w-3/5" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060606] via-transparent to-[#060606]/80" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060606]/70 via-transparent to-[#060606]" />

          {/* Radial Ambient Orange Glow centered on the holographic security shield */}
          <div className="absolute right-[-5%] top-1/4 w-[650px] h-[650px] bg-[radial-gradient(circle,rgba(255,106,0,0.22)_0%,transparent_65%)] blur-3xl pointer-events-none" />

          {/* Animated Cyber Security Scan Beam */}
          <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[rgba(255,106,0,0.65)] to-transparent animate-cyberScan pointer-events-none" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1500px] px-4 py-16 md:px-8 md:py-24">
          <div className="max-w-4xl">
            {/* Telemetry Status Bar */}
            <div className="mb-6 flex flex-wrap items-center gap-2.5 sm:gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
              <div className="inline-flex items-center gap-2 rounded border border-[rgba(255,106,0,.35)] bg-[rgba(255,106,0,.1)] backdrop-blur-md px-3.5 py-1.5 text-[var(--accent)] font-bold shadow-[0_0_20px_rgba(255,106,0,.2)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
                </span>
                <span>SEC-OPS GRID: ATIVO</span>
              </div>
              <span className="hidden sm:inline text-zinc-600">//</span>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-zinc-300">
                <span className="text-[var(--accent)] font-semibold">PROTOCOL:</span> VIBE CODE SECURITY
              </span>
              <span className="hidden md:inline text-zinc-600">//</span>
              <span className="hidden md:inline-flex items-center gap-1.5 text-zinc-400">
                <span className="text-[var(--accent)] font-semibold">THREAT VECTORS:</span> 30 CHECKS
              </span>
            </div>

            <div className="h-px w-24 bg-[var(--accent)] mb-6 animate-pulseLine" />

            <h1 className="text-3xl font-extrabold uppercase leading-[1.05] tracking-[-0.03em] text-[var(--text)] sm:text-5xl md:text-6xl drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]">
              Diagnóstico de Segurança para Aplicações <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6a00] via-[#ff8d3b] to-[#ffaa66] drop-shadow-[0_0_35px_rgba(255,106,0,0.45)]">Vibe Code & No-Code</span>
            </h1>

            <div className="mt-6 border-l-2 border-[var(--accent)] pl-5 font-mono text-base md:text-lg leading-relaxed text-zinc-300 max-w-3xl backdrop-blur-md bg-black/55 p-4 rounded-r border border-l-0 border-[var(--line)] shadow-xl">
              <strong className="text-[var(--accent)]">Antes de colocar em produção — ou hoje, se já estiver no ar.</strong><br />
              Vibe code é excelente para validar ideias rápido. Mas no dia em que entra dado real de cliente, o app deixa de ser protótipo e passa a ser responsabilidade legal e operacional. E responsabilidade se audita.
            </div>

            {/* Real incidents alert cards with glassmorphism & HUD hover indicators */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded border border-[var(--line)] bg-black/75 backdrop-blur-md p-5 hover:border-[rgba(255,106,0,.5)] hover:shadow-[0_0_30px_rgba(255,106,0,.18)] transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent)] font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                    Incidente 01
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 border border-zinc-800 bg-zinc-900/80 px-1.5 py-0.5 rounded">RLS LEAK</span>
                </div>
                <div className="mt-2 text-sm font-bold text-[var(--text)] group-hover:text-white transition-colors">CVE-2025-48757 (Supabase/Lovable)</div>
                <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed font-mono">
                  Políticas RLS criadas automaticamente com brechas que deixavam tabelas inteiras abertas na internet pública.
                </p>
              </div>

              <div className="rounded border border-[var(--line)] bg-black/75 backdrop-blur-md p-5 hover:border-[rgba(255,106,0,.5)] hover:shadow-[0_0_30px_rgba(255,106,0,.18)] transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent)] font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                    Incidente 02
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 border border-zinc-800 bg-zinc-900/80 px-1.5 py-0.5 rounded">KEYS & PROMPTS</span>
                </div>
                <div className="mt-2 text-sm font-bold text-[var(--text)] group-hover:text-white transition-colors">Vazamento de Código e Chats</div>
                <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed font-mono">
                  Exposição acidental de código-fonte e histórico de prompts com segredos, senhas e estratégias corporativas.
                </p>
              </div>

              <div className="rounded border border-[var(--line)] bg-black/75 backdrop-blur-md p-5 hover:border-[rgba(255,106,0,.5)] hover:shadow-[0_0_30px_rgba(255,106,0,.18)] transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent)] font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                    Incidente 03
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 border border-zinc-800 bg-zinc-900/80 px-1.5 py-0.5 rounded">LOCK-IN & SHUTDOWN</span>
                </div>
                <div className="mt-2 text-sm font-bold text-[var(--text)] group-hover:text-white transition-colors">Desligamento Repentino (Caso Manus)</div>
                <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed font-mono">
                  Perda de automações e dados em janela de duas semanas. Sem backup e export Git externo, a empresa fica refém.
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href={isUnlocked ? "/auditoria/checklist" : "#cadastro"}
                onClick={handleActionClick}
                className="rounded bg-[var(--accent)] px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-black transition hover:brightness-110 active:scale-95 shadow-[0_0_30px_rgba(255,106,0,.35)] hover:shadow-[0_0_45px_rgba(255,106,0,.55)] animate-glow inline-flex items-center gap-2"
              >
                <span>{isUnlocked ? "Acessar checklist e Skill de segurança" : "Liberar checklist e Skill de segurança"}</span>
                <span>→</span>
              </a>
              <a
                href="#dimensoes"
                className="rounded border border-[rgba(255,255,255,.16)] bg-black/60 backdrop-blur-md px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-black/80"
              >
                Conhecer as 7 Dimensões
              </a>
            </div>

            {/* Quick Spec Badge Strip */}
            <div className="mt-8 flex flex-wrap items-center gap-4 font-mono text-[11px] text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="text-[var(--accent)] font-bold">✓</span> 7 Dimensões Críticas
              </span>
              <span className="text-zinc-700">•</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-[var(--accent)] font-bold">✓</span> 30 Verificações Práticas
              </span>
              <span className="text-zinc-700">•</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-[var(--accent)] font-bold">✓</span> Skill para Claude Code / Cursor / BMAD
              </span>
              <span className="text-zinc-700">•</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-[var(--accent)] font-bold">✓</span> Relatório PDF para Diretoria
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Numbers */}
      <section className="no-print border-b border-[var(--line)] bg-[var(--bg-2)]">
        <div className="mx-auto max-w-[1500px] px-4 py-8 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="border-l border-[var(--line)] pl-4">
              <div className="font-mono text-3xl md:text-4xl font-bold text-[var(--accent)]">7</div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--muted)] mt-1">Dimensões Críticas</div>
            </div>
            <div className="border-l border-[var(--line)] pl-4">
              <div className="font-mono text-3xl md:text-4xl font-bold text-[var(--accent)]">30</div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--muted)] mt-1">Pontos de Verificação</div>
            </div>
            <div className="border-l border-[var(--line)] pl-4">
              <div className="font-mono text-3xl md:text-4xl font-bold text-[var(--accent)]">03</div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--muted)] mt-1">Minutos para Diagnóstico</div>
            </div>
            <div className="border-l border-[var(--line)] pl-4">
              <div className="font-mono text-3xl md:text-4xl font-bold text-[var(--green)]">100%</div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--muted)] mt-1">Aplicável Imediatamente</div>
            </div>
          </div>
        </div>
      </section>

      {/* LEAD CAPTURE FORM SECTION (Directly on the Landing Page for CRM Storage) */}
      <section id="cadastro" className="no-print border-b border-[var(--line)] py-16 md:py-24 bg-gradient-to-b from-[#060606] to-[#0b0b0b]">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-block font-mono text-[11px] uppercase tracking-[0.26em] text-[var(--accent)] font-semibold">
                // Desbloqueio do Diagnóstico & CRM
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-[var(--text)]">
                Cadastre sua empresa para liberar o checklist e a Skill para Agentes de IA.
              </h2>
              <p className="font-mono text-sm leading-relaxed text-[var(--muted)]">
                Ao preencher, os dados da sua empresa são registrados no CRM com segurança e você tem acesso imediato à ferramenta interativa (30 verificações) e às instruções para instalar a Skill automatizada no harness de sua preferência (Claude Code, Cursor, BMAD ou Codex).
              </p>

              <div className="border border-[var(--line)] bg-[var(--panel)] p-6 rounded space-y-4 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)]"></span>
                  <span className="text-zinc-300">Auditoria prática de Row Level Security (RLS) e SQL Injection</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)]"></span>
                  <span className="text-zinc-300">Detecção de vazamento de chaves (OpenAI, Stripe, Maps, Resend)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)]"></span>
                  <span className="text-zinc-300">Prevenção de adulteração de preços e permissões no DevTools</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)]"></span>
                  <span className="text-zinc-300">Conformidade com a LGPD e plano de resiliência e backup</span>
                </div>
              </div>
            </div>

            {/* Form Box */}
            <div className="lg:col-span-6">
              <div className="rounded border border-[var(--line-strong)] bg-[var(--panel)] p-6 md:p-8 relative shadow-2xl">
                {isUnlocked ? (
                  /* State when already registered */
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-[rgba(132,204,22,.15)] border border-[var(--green)] mx-auto flex items-center justify-center text-[var(--green)] font-bold text-xl">
                      ✓
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--green)] font-bold">
                        Acesso Ativo e Registrado
                      </span>
                      <h3 className="text-xl font-bold uppercase tracking-tight text-[var(--text)] mt-1">
                        Olá, {leadData?.name}!
                      </h3>
                      <p className="font-mono text-xs text-[var(--muted)] mt-1">
                        Seu diagnóstico corporativo para a empresa <strong>{leadData?.company}</strong> está liberado.
                      </p>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                      <a
                        href="/auditoria/checklist"
                        onClick={handleGoToChecklist}
                        className="rounded bg-[var(--accent)] px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-black transition hover:brightness-110 active:scale-95 animate-glow"
                      >
                        Abrir Meu Checklist de Auditoria →
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setLeadData(null);
                          try {
                            localStorage.removeItem(STORAGE_LEAD_KEY);
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="rounded border border-[var(--line)] px-4 py-3 font-mono text-xs text-[var(--muted)] hover:text-white transition"
                      >
                        Cadastrar outra empresa
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Form to capture lead into CRM */
                  <>
                    <div className="border-b border-[var(--line)] pb-4 mb-6">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--accent)] font-bold">
                        Formulário de Acesso Corporativo
                      </span>
                      <h3 className="text-xl font-bold uppercase tracking-tight text-[var(--text)] mt-1">
                        Preencha seus dados para liberar o checklist
                      </h3>
                    </div>

                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                      <div>
                        <label htmlFor="auditoria-landing-name" className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5">
                          Nome Completo *
                        </label>
                        <input
                          id="auditoria-landing-name"
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleFormChange}
                          placeholder="Ex.: Carlos Mendes"
                          className={`w-full rounded bg-[var(--panel-2)] border px-4 py-3 font-mono text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none transition focus:border-[var(--accent)] ${
                            errors.name ? "border-[var(--error)]" : "border-[var(--line-strong)]"
                          }`}
                        />
                        {errors.name && <span className="font-mono text-[10px] text-[var(--error)] mt-1 block">{errors.name}</span>}
                      </div>

                      <div>
                        <label htmlFor="auditoria-landing-email" className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5">
                          E-mail Corporativo *
                        </label>
                        <input
                          id="auditoria-landing-email"
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleFormChange}
                          placeholder="carlos@empresa.com.br"
                          className={`w-full rounded bg-[var(--panel-2)] border px-4 py-3 font-mono text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none transition focus:border-[var(--accent)] ${
                            errors.email ? "border-[var(--error)]" : "border-[var(--line-strong)]"
                          }`}
                        />
                        {errors.email && <span className="font-mono text-[10px] text-[var(--error)] mt-1 block">{errors.email}</span>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="auditoria-landing-whatsapp" className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5">
                            WhatsApp com DDD *
                          </label>
                          <input
                            id="auditoria-landing-whatsapp"
                            type="tel"
                            name="whatsapp"
                            value={form.whatsapp}
                            onChange={handleFormChange}
                            placeholder="(11) 99999-8888"
                            className={`w-full rounded bg-[var(--panel-2)] border px-4 py-3 font-mono text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none transition focus:border-[var(--accent)] ${
                              errors.whatsapp ? "border-[var(--error)]" : "border-[var(--line-strong)]"
                            }`}
                          />
                          {errors.whatsapp && <span className="font-mono text-[10px] text-[var(--error)] mt-1 block">{errors.whatsapp}</span>}
                        </div>

                        <div>
                          <label htmlFor="auditoria-landing-company" className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5">
                            Nome da Empresa *
                          </label>
                          <input
                            id="auditoria-landing-company"
                            type="text"
                            name="company"
                            value={form.company}
                            onChange={handleFormChange}
                            placeholder="Sua Empresa ou Projeto"
                            className={`w-full rounded bg-[var(--panel-2)] border px-4 py-3 font-mono text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none transition focus:border-[var(--accent)] ${
                              errors.company ? "border-[var(--error)]" : "border-[var(--line-strong)]"
                            }`}
                          />
                          {errors.company && <span className="font-mono text-[10px] text-[var(--error)] mt-1 block">{errors.company}</span>}
                        </div>
                      </div>

                      {submitError && (
                        <div className="rounded border border-[var(--error)] bg-[rgba(239,68,68,.1)] p-3 font-mono text-xs text-[var(--error)]">
                          {submitError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full mt-2 rounded bg-[var(--accent)] py-4 font-mono text-xs font-bold uppercase tracking-[0.24em] text-black transition hover:brightness-110 active:scale-95 disabled:opacity-60 animate-glow"
                      >
                        {submitting ? "Salvando no CRM e Liberando..." : "Liberar checklist e Skill de segurança"}
                      </button>

                      <div className="flex items-center justify-center gap-2 font-mono text-[11px] text-[var(--muted)] text-center pt-2">
                        <span>🔒 Armazenamento protegido. Seus dados nunca são compartilhados.</span>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 7 Critical Dimensions Overview */}
      <section id="dimensoes" className="no-print border-b border-[var(--line)] py-16 md:py-24">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <div className="max-w-3xl mb-12">
            <div className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--accent)] font-bold">
              // O Que Auditamos
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight text-[var(--text)] mt-3">
              As 7 Dimensões Críticas de Segurança para Aplicações Vibe Code
            </h2>
            <p className="font-mono text-sm leading-relaxed text-[var(--muted)] mt-4">
              O checklist cobre desde as falhas silenciosas de banco de dados e vazamentos de chaves até conformidade jurídica LGPD e resiliência contra desligamento repentino de plataformas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CHECKLIST_SECTIONS.map((section) => (
              <div
                key={section.id}
                className="rounded border border-[var(--line)] bg-[var(--panel)] p-6 hover:border-[var(--accent)] hover:shadow-[0_0_30px_rgba(255,106,0,.15)] transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-[var(--accent)] bg-black/50 border border-[var(--line)] px-2.5 py-1 rounded">
                      Dimensão {section.number}
                    </span>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                      section.badge === "Crítico"
                        ? "border-[var(--error)] bg-[rgba(239,68,68,.1)] text-[var(--error)]"
                        : "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    }`}>
                      {section.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold uppercase tracking-tight text-[var(--text)] group-hover:text-white transition-colors">
                    {section.title}
                  </h3>

                  <p className="font-mono text-xs text-[var(--muted)] leading-relaxed mt-2.5">
                    {section.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-[var(--line)] space-y-2">
                    <div className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                      Itens Auditados ({section.items.length}):
                    </div>
                    <ul className="space-y-1.5 font-mono text-xs text-zinc-300">
                      {section.items.slice(0, 3).map((item) => (
                        <li key={item.id} className="flex items-start gap-2">
                          <span className="text-[var(--accent)] font-bold">›</span>
                          <span className="line-clamp-1">{item.title}</span>
                        </li>
                      ))}
                      {section.items.length > 3 && (
                        <li className="text-[11px] text-[var(--muted)] italic pt-1">
                          + {section.items.length - 3} outros itens detalhados...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--line)]">
                  <a
                    href={isUnlocked ? "/auditoria/checklist" : "#cadastro"}
                    onClick={handleActionClick}
                    className="font-mono text-xs uppercase text-[var(--accent)] font-bold tracking-wider hover:underline inline-flex items-center gap-1.5"
                  >
                    <span>Auditar esta dimensão</span>
                    <span>→</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Banner Direct to Checklist */}
          <div className="mt-12 rounded border border-[rgba(255,106,0,.4)] bg-gradient-to-r from-[rgba(255,106,0,.15)] via-[var(--panel)] to-black p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_40px_rgba(255,106,0,.15)]">
            <div className="max-w-2xl">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--accent)] font-bold">
                // Diagnóstico Online Gratuito
              </span>
              <h3 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-[var(--text)] mt-1">
                Pronto para descobrir o índice de risco real da sua aplicação?
              </h3>
              <p className="font-mono text-xs text-zinc-300 mt-2 leading-relaxed">
                Acesse a ferramenta interativa de diagnóstico com todos os 30 itens, medidor de conformidade instantâneo e instruções de instalação da Skill de segurança.
              </p>
            </div>
            <a
              href={isUnlocked ? "/auditoria/checklist" : "#cadastro"}
              onClick={handleActionClick}
              className="rounded bg-[var(--accent)] px-8 py-4 font-mono text-xs font-bold uppercase tracking-widest text-black transition hover:brightness-110 active:scale-95 animate-glow whitespace-nowrap"
            >
              {isUnlocked ? "Acessar checklist e Skill de segurança →" : "Liberar checklist e Skill de segurança →"}
            </a>
          </div>
        </div>
      </section>

      {/* Corporate Pitch: Treinamentos e Soluções Neural Hub */}
      <section id="neural-hub-solucoes" className="no-print border-b border-[var(--line)] bg-[var(--bg-2)]">
        <div className="mx-auto max-w-[1500px] px-4 py-16 md:px-8 md:py-24">
          <div className="max-w-3xl mb-12">
            <div className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--accent)] font-bold">
              // Neural Hub Enterprise
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight text-[var(--text)] mt-3">
              Capacite sua equipe e estruture soluções de IA com segurança militar.
            </h2>
            <p className="font-mono text-sm leading-relaxed text-[var(--muted)] mt-4">
              A Neural Hub acelera empresas e executivos na adoção de inteligência artificial de ponta a ponta — do treinamento hands-on à consultoria de infraestrutura cognitiva.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded border border-[var(--line)] bg-[var(--panel)] p-8 hover:border-[var(--line-strong)] transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded bg-[var(--accent-soft)] border border-[rgba(255,106,0,.2)] flex items-center justify-center font-mono font-bold text-[var(--accent)] text-lg mb-6">
                  01
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-[var(--text)]">
                  Treinamentos In-Company
                </h3>
                <p className="font-mono text-xs text-[var(--muted)] leading-relaxed mt-3">
                  Workshops e imersões personalizadas para líderes, desenvolvedores e times de negócios. Ensine seu time a criar aplicações com IA, vibe coding seguro, agentes inteligentes e esteiras de automação com critério técnico.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-[var(--line)]">
                <a href="/solicitar-proposta" className="font-mono text-xs uppercase text-[var(--accent)] font-bold tracking-wider hover:underline">
                  Solicitar Programa In-Company →
                </a>
              </div>
            </div>

            <div className="rounded border border-[var(--accent)] bg-[var(--panel)] p-8 transition flex flex-col justify-between shadow-lg shadow-[rgba(255,106,0,.08)]">
              <div>
                <div className="w-10 h-10 rounded bg-[var(--accent)] text-black flex items-center justify-center font-mono font-bold text-lg mb-6 animate-glow">
                  02
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-[var(--text)]">
                  Consultoria em Governança & Arquitetura de IA
                </h3>
                <p className="font-mono text-xs text-[var(--muted)] leading-relaxed mt-3">
                  Diagnóstico de vulnerabilidades, auditoria de código, conformidade com a LGPD, gestão de segredos, infraestrutura de RAG corporativo e seleção criteriosa dos melhores modelos (OpenAI, Claude, Gemini, DeepSeek).
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-[var(--line)]">
                <a href="/solicitar-proposta" className="font-mono text-xs uppercase text-[var(--accent)] font-bold tracking-wider hover:underline">
                  Fazer Diagnóstico Corporativo →
                </a>
              </div>
            </div>

            <div className="rounded border border-[var(--line)] bg-[var(--panel)] p-8 hover:border-[var(--line-strong)] transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded bg-[var(--accent-soft)] border border-[rgba(255,106,0,.2)] flex items-center justify-center font-mono font-bold text-[var(--accent)] text-lg mb-6">
                  03
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-[var(--text)]">
                  Desenvolvimento de Soluções & Agentes IA
                </h3>
                <p className="font-mono text-xs text-[var(--muted)] leading-relaxed mt-3">
                  Construção de ecossistemas autônomos, assistentes corporativos integrados ao ERP/CRM, pipelines no n8n e agentes de atendimento omnicanal com observabilidade total e máxima segurança.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-[var(--line)]">
                <a href="/solicitar-proposta" className="font-mono text-xs uppercase text-[var(--accent)] font-bold tracking-wider hover:underline">
                  Desenvolver Projeto com IA →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="no-print border-t border-[var(--line)] bg-[#060606] py-10">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-[var(--accent)] animate-glow"></div>
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
              Neural Hub · Segurança & Governança de IA · 2026
            </span>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs text-[var(--muted)]">
            <a href="https://neuralhub.ia.br" className="hover:text-[var(--accent)] transition">
              Home
            </a>
            <a href="/solicitar-proposta" className="hover:text-[var(--accent)] transition">
              Solicitar Proposta
            </a>
            <a href="/privacidade.html" className="hover:text-[var(--accent)] transition">
              Privacidade
            </a>
            <a href="/termos.html" className="hover:text-[var(--accent)] transition">
              Termos
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
