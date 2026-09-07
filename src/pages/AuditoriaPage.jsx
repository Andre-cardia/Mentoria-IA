import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { CHECKLIST_SECTIONS, TOTAL_CHECKLIST_ITEMS } from "../data/checklistSegurancaVibeCode.js";

const STORAGE_LEAD_KEY = "nh_auditoria_lead_v1";
const STORAGE_CHECKED_KEY = "nh_auditoria_checked_v1";

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
    console.error("[AuditoriaPage] Error loading local storage lead:", e);
  }
  return null;
}

function getInitialChecks() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return {};
    const savedChecks = localStorage.getItem(STORAGE_CHECKED_KEY);
    if (savedChecks) {
      return /** @type {Record<string, boolean>} */ (JSON.parse(savedChecks));
    }
  } catch (e) {
    console.error("[AuditoriaPage] Error loading local storage checks:", e);
  }
  return /** @type {Record<string, boolean>} */ ({});
}

export default function AuditoriaPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(/** @type {Record<string, string | undefined>} */ ({}));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [leadData, setLeadData] = useState(getInitialLead);
  const [isUnlocked, setIsUnlocked] = useState(() => Boolean(getInitialLead()));

  // Checked items set (mapped by item id)
  const [checkedItems, setCheckedItems] = useState(getInitialChecks);

  const [activeFilter, setActiveFilter] = useState("all"); // all | pending | done
  const [expandedSections, setExpandedSections] = useState({
    db: true,
    secrets: true,
    auth: true,
    "business-logic": true,
    platform: true,
    continuity: true,
    legal: true,
  });

  // Update check item
  const toggleCheck = (itemId) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      try {
        localStorage.setItem(STORAGE_CHECKED_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const handleResetChecklist = () => {
    if (window.confirm("Deseja redefinir todas as marcações do checklist?")) {
      setCheckedItems({});
      try {
        localStorage.removeItem(STORAGE_CHECKED_KEY);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const totalChecked = useMemo(() => {
    return Object.values(checkedItems).filter(Boolean).length;
  }, [checkedItems]);

  const scorePercentage = Math.round((totalChecked / TOTAL_CHECKLIST_ITEMS) * 100);

  const riskStatus = useMemo(() => {
    if (totalChecked === 0) return { label: "Não Auditado", color: "var(--muted)", text: "Inicie o checklist marcando os itens já conferidos." };
    if (scorePercentage < 40) return { label: "Vulnerabilidade Crítica", color: "var(--error)", text: "Risco iminente de vazamento de dados ou perda da aplicação." };
    if (scorePercentage < 75) return { label: "Alto Risco / Atenção", color: "#f59e0b", text: "Pontos essenciais de segurança e continuidade ainda estão expostos." };
    if (scorePercentage < 100) return { label: "Boa Postura (com pendências)", color: "#38bdf8", text: "Quase pronto para produção, mas ainda restam itens estratégicos." };
    return { label: "Blindado & Auditado", color: "var(--green)", text: "Excelente! Todas as 30 verificações foram checadas com sucesso." };
  }, [scorePercentage, totalChecked]);

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
        console.warn("[Auditoria] Supabase não configurado no ambiente local (verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env).");
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
          console.error("[Auditoria] Erro definitivo ao gravar lead em proposal_requests:", error);
        }

        // Grava também na tabela auxiliar leads caso exista no banco
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
          console.warn("[Auditoria] Tabela leads não alcançada ou indisponível:", leadTableErr);
        }
      }
    } catch (err) {
      console.warn("[Auditoria] Exceção ao conectar Supabase:", err);
    }

    // Unlocks checklist locally regardless of db network failures so user isn't blocked
    const lead = {
      name: form.name.trim(),
      email: form.email.trim(),
      whatsapp: form.whatsapp.trim(),
      company: form.company.trim(),
      date: new Date().toLocaleDateString("pt-BR"),
    };
    try {
      localStorage.setItem(STORAGE_LEAD_KEY, JSON.stringify(lead));
    } catch (e) {
      console.error(e);
    }
    setLeadData(lead);
    setIsUnlocked(true);
    setSubmitting(false);

    // Smooth scroll to checklist
    setTimeout(() => {
      const el = document.getElementById("checklist-interativo");
      if (typeof el?.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 150);
  };

  const handlePrint = () => {
    window.print();
  };

  const whatsappMessage = useMemo(() => {
    const comp = leadData?.company || form.company || "nossa empresa";
    const text = encodeURIComponent(
      `Olá! Realizei o Diagnóstico de Segurança Vibe Code na Neural Hub para a empresa ${comp}.\n` +
      `Resultado atual: ${totalChecked}/${TOTAL_CHECKLIST_ITEMS} itens verificados (${scorePercentage}% - ${riskStatus.label}).\n` +
      `Gostaria de agendar uma auditoria com especialistas ou conhecer os treinamentos in-company da Neural Hub.`
    );
    return `https://wa.me/5548988549556?text=${text}`;
  }, [leadData, form.company, totalChecked, scorePercentage, riskStatus.label]);

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
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
          content="Checklist executivo de cibersegurança para aplicações no-code e vibe code. Proteja seu banco de dados, chaves de API, regras de negócio e dados de clientes antes de colocar em produção."
        />
        <meta property="og:title" content="Diagnóstico de Segurança Vibe Code | Neural Hub" />
        <meta
          property="og:description"
          content="Baseado nas falhas reais de CVE-2025-48757, vazamentos de IA e caso Manus. Acesse o checklist interativo da Neural Hub."
        />
        <meta property="og:url" content="https://neuralhub.ia.br/auditoria" />
      </Helmet>

      {/* Embedded CSS for animations, background grids and print layout */}
      <style>{`
        .font-mono { font-family: "Space Mono", monospace; }
        .bg-grid-tech {
          background-image:
            linear-gradient(to right, rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 34px 34px;
        }
        .bg-noise-tech {
          background-image:
            radial-gradient(circle at 18% 18%, rgba(255,106,0,.12), transparent 22%),
            radial-gradient(circle at 82% 12%, rgba(255,255,255,.05), transparent 20%),
            radial-gradient(circle at 50% 100%, rgba(255,106,0,.08), transparent 30%);
        }
        @keyframes glow {
          0%,100% { box-shadow: 0 0 0 rgba(255,106,0,0); }
          50%      { box-shadow: 0 0 28px rgba(255,106,0,.22); }
        }
        @keyframes pulseLine {
          0%,100% { opacity: .28; transform: scaleX(.94); }
          50%     { opacity: .9;  transform: scaleX(1); }
        }
        .animate-glow { animation: glow 2.8s ease-in-out infinite; }
        .animate-pulseLine { animation: pulseLine 3s ease-in-out infinite; }
        
        /* Print layout for Executive PDF Export */
        @media print {
          body {
            background: #ffffff !important;
            color: #111111 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-card {
            border: 1px solid #ddd !important;
            background: #fdfdfd !important;
            color: #111111 !important;
            page-break-inside: avoid;
            box-shadow: none !important;
          }
          .print-header {
            border-bottom: 2px solid #ff6a00 !important;
            margin-bottom: 20px;
            padding-bottom: 15px;
          }
        }
        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>

      {/* Global tech background lines */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.07] bg-grid-tech" />
      <div className="fixed inset-0 pointer-events-none bg-noise-tech" />

      {/* Printable Executive Header (Shown only during PDF generation / Print) */}
      <div className="print-only p-8 text-black bg-white">
        <div className="print-header flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-[#ff6a00]">Neural Hub // Relatório de Auditoria</h1>
            <p className="text-xs text-gray-600 font-mono">Diagnóstico de Cibersegurança para Aplicações No-Code & Vibe Code</p>
          </div>
          <div className="text-right text-xs font-mono text-gray-700">
            <div><strong>Empresa:</strong> {leadData?.company || "Não identificada"}</div>
            <div><strong>Responsável:</strong> {leadData?.name || "Não identificado"}</div>
            <div><strong>Data da Avaliação:</strong> {leadData?.date || new Date().toLocaleDateString("pt-BR")}</div>
          </div>
        </div>
        <div className="mb-6 p-4 border border-gray-300 rounded bg-gray-50 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs uppercase font-bold text-gray-700">Índice de Conformidade:</span>
            <div className="text-xl font-bold text-[#ff6a00]">{scorePercentage}% ({totalChecked}/{TOTAL_CHECKLIST_ITEMS} itens conformes)</div>
          </div>
          <div className="text-right">
            <span className="font-mono text-xs uppercase font-bold text-gray-700">Status Geral:</span>
            <div className="text-sm font-bold uppercase text-gray-900">{riskStatus.label}</div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <header className="no-print sticky top-0 z-50 border-b border-[var(--line)] bg-[#060606]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 md:px-8">
          <a href="https://neuralhub.ia.br" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-[var(--accent)] flex items-center justify-center font-mono font-bold text-black text-sm group-hover:scale-105 transition-transform">
              NH
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Neural Hub</div>
              <div className="text-base font-bold tracking-tight text-[var(--text)]">Cibersegurança Vibe Code</div>
            </div>
          </a>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-2 border border-[var(--line)] bg-[var(--panel)] px-3 py-1 text-[11px] font-mono text-[var(--muted)] rounded">
              <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse"></span>
              CVE-2025/2026 Updated
            </span>
            <a
              href="#diagnostico"
              className="rounded bg-[var(--accent)] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-black transition hover:brightness-110 active:scale-95 animate-glow"
            >
              {isUnlocked ? "Ver Meu Checklist" : "Acessar Checklist"}
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="no-print relative border-b border-[var(--line)] overflow-hidden">
        <div className="mx-auto max-w-[1500px] px-4 py-16 md:px-8 md:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded border border-[rgba(255,106,0,.25)] bg-[var(--accent-soft)] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-6">
              <span>// Diagnóstico Executivo de Segurança</span>
            </div>
            <div className="h-px w-24 bg-[var(--accent)] mb-6 animate-pulseLine" />

            <h1 className="text-3xl font-extrabold uppercase leading-[1.05] tracking-[-0.03em] text-[var(--text)] sm:text-5xl md:text-6xl">
              Diagnóstico de Segurança para Aplicações <span className="text-[var(--accent)]">Vibe Code & No-Code</span>
            </h1>

            <p className="mt-6 border-l-2 border-[var(--accent)] pl-5 font-mono text-base md:text-lg leading-relaxed text-zinc-300 max-w-3xl">
              <strong>Antes de colocar em produção — ou hoje, se já estiver no ar.</strong><br />
              Vibe code é excelente para validar ideias rápido. Mas no dia em que entra dado real de cliente, o app deixa de ser protótipo e passa a ser responsabilidade legal e operacional. E responsabilidade se audita.
            </p>

            {/* Real incidents alert cards */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded border border-[var(--line)] bg-[var(--panel)] p-5 hover:border-[var(--line-strong)] transition">
                <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent)] font-semibold">Incidente 01</div>
                <div className="mt-2 text-sm font-bold text-[var(--text)]">CVE-2025-48757 (Supabase/Lovable)</div>
                <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed font-mono">
                  Políticas RLS criadas automaticamente com brechas que deixavam tabelas inteiras abertas na internet pública.
                </p>
              </div>

              <div className="rounded border border-[var(--line)] bg-[var(--panel)] p-5 hover:border-[var(--line-strong)] transition">
                <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent)] font-semibold">Incidente 02</div>
                <div className="mt-2 text-sm font-bold text-[var(--text)]">Vazamento de Código e Chats</div>
                <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed font-mono">
                  Exposição acidental de código-fonte e histórico de prompts com segredos, senhas e estratégias corporativas.
                </p>
              </div>

              <div className="rounded border border-[var(--line)] bg-[var(--panel)] p-5 hover:border-[var(--line-strong)] transition">
                <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent)] font-semibold">Incidente 03</div>
                <div className="mt-2 text-sm font-bold text-[var(--text)]">Desligamento Repentino (Caso Manus)</div>
                <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed font-mono">
                  Perda de automações e dados em janela de duas semanas. Sem backup e export Git externo, a empresa fica refém.
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#diagnostico"
                className="rounded bg-[var(--accent)] px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-black transition hover:brightness-110 active:scale-95 animate-glow"
              >
                {isUnlocked ? "Ir para o Checklist Interativo" : "Iniciar Diagnóstico Gratuito"}
              </a>
              <a
                href="#neural-hub-solucoes"
                className="rounded border border-[var(--line-strong)] bg-black/40 px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Soluções Corporativas da Neural Hub
              </a>
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
              <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--muted)] mt-1">Incidentes Mapeados</div>
            </div>
            <div className="border-l border-[var(--line)] pl-4">
              <div className="font-mono text-3xl md:text-4xl font-bold text-[var(--green)]">100%</div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--muted)] mt-1">Aplicável Imediatamente</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Diagnostic Gate / Checklist Container */}
      <section id="diagnostico" className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-[1500px] px-4 py-16 md:px-8">

          {!isUnlocked ? (
            /* Lead Capture Gate */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-block font-mono text-[11px] uppercase tracking-[0.26em] text-[var(--accent)] font-semibold">
                  // Desbloqueio do Diagnóstico
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-[var(--text)]">
                  Cadastre sua empresa para liberar o checklist completo e exportar em PDF.
                </h2>
                <p className="font-mono text-sm leading-relaxed text-[var(--muted)]">
                  Ao preencher, você terá acesso imediato ao painel interativo com 30 itens práticos de verificação, medidor de conformidade em tempo real e opção de gerar o relatório executivo em PDF para apresentar à sua diretoria ou time técnico.
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
                <div className="rounded border border-[var(--line-strong)] bg-[var(--panel)] p-6 md:p-8 relative scan-overlay shadow-2xl">
                  <div className="border-b border-[var(--line)] pb-4 mb-6">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--accent)] font-bold">Formulário de Acesso</span>
                    <h3 className="text-xl font-bold uppercase tracking-tight text-[var(--text)] mt-1">Preencha seus dados corporativos</h3>
                  </div>

                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    <div>
                      <label htmlFor="auditoria-name" className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5">
                        Nome Completo *
                      </label>
                      <input
                        id="auditoria-name"
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
                      <label htmlFor="auditoria-email" className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5">
                        E-mail Corporativo *
                      </label>
                      <input
                        id="auditoria-email"
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
                        <label htmlFor="auditoria-whatsapp" className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5">
                          WhatsApp *
                        </label>
                        <input
                          id="auditoria-whatsapp"
                          type="tel"
                          name="whatsapp"
                          value={form.whatsapp}
                          onChange={handleFormChange}
                          placeholder="(11) 98765-4321"
                          className={`w-full rounded bg-[var(--panel-2)] border px-4 py-3 font-mono text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none transition focus:border-[var(--accent)] ${
                            errors.whatsapp ? "border-[var(--error)]" : "border-[var(--line-strong)]"
                          }`}
                        />
                        {errors.whatsapp && <span className="font-mono text-[10px] text-[var(--error)] mt-1 block">{errors.whatsapp}</span>}
                      </div>

                      <div>
                        <label htmlFor="auditoria-company" className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5">
                          Empresa *
                        </label>
                        <input
                          id="auditoria-company"
                          type="text"
                          name="company"
                          value={form.company}
                          onChange={handleFormChange}
                          placeholder="Nome da sua organização"
                          className={`w-full rounded bg-[var(--panel-2)] border px-4 py-3 font-mono text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none transition focus:border-[var(--accent)] ${
                            errors.company ? "border-[var(--error)]" : "border-[var(--line-strong)]"
                          }`}
                        />
                        {errors.company && <span className="font-mono text-[10px] text-[var(--error)] mt-1 block">{errors.company}</span>}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full mt-2 rounded bg-[var(--accent)] py-4 font-mono text-xs font-bold uppercase tracking-[0.24em] text-black transition hover:brightness-110 active:scale-95 disabled:opacity-60 animate-glow"
                    >
                      {submitting ? "Processando..." : "Liberar Checklist Interativo & PDF"}
                    </button>

                    {submitError && (
                      <div className="p-3 bg-[rgba(239,68,68,.1)] border border-[var(--error)] text-[var(--error)] text-xs font-mono">
                        {submitError}
                      </div>
                    )}

                    <p className="text-center font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      🔒 Seus dados estão seguros e serão utilizados pela equipe de especialistas da Neural Hub.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* Unlocked Checklist Dashboard */
            <div id="checklist-interativo" className="space-y-8">
              {/* Top Banner with Company, Score and Actions */}
              <div className="rounded border border-[var(--line-strong)] bg-[var(--panel)] p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--line)]">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--green)]"></span>
                      Diagnóstico Ativo // {leadData?.company || "Empresa"}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-[var(--text)] mt-1">
                      Checklist de Auditoria Vibe Code
                    </h2>
                    <p className="text-xs font-mono text-[var(--muted)] mt-1">
                      Responsável: {leadData?.name} ({leadData?.email}) · Marque cada item verificado no seu aplicativo.
                    </p>
                  </div>

                  {/* Actions: Download PDF & Reset */}
                  <div className="no-print flex flex-wrap items-center gap-3">
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-2 rounded bg-[var(--accent)] px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider text-black transition hover:brightness-110 active:scale-95 animate-glow"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                        <path d="M6 14h12v8H6z" />
                      </svg>
                      Baixar Checklist em PDF
                    </button>
                    <button
                      onClick={handleResetChecklist}
                      className="rounded border border-[var(--line)] bg-[var(--panel-2)] px-4 py-3 font-mono text-xs text-[var(--muted)] hover:text-white hover:border-[var(--line-strong)] transition"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {/* Score & Progress Summary */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-4 border-r border-[var(--line)] pr-6">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-extrabold font-mono text-[var(--accent)]">{scorePercentage}%</span>
                      <span className="font-mono text-xs text-[var(--muted)]">({totalChecked} de {TOTAL_CHECKLIST_ITEMS} concluídos)</span>
                    </div>
                    <div className="w-full bg-black/50 h-2.5 rounded-full mt-3 overflow-hidden border border-[var(--line)]">
                      <div
                        className="h-full bg-[var(--accent)] transition-all duration-500"
                        style={{ width: `${scorePercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="md:col-span-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-mono text-xs uppercase tracking-wider text-[var(--muted)]">Status do Risco:</div>
                      <div className="text-lg font-bold uppercase tracking-tight mt-0.5" style={{ color: riskStatus.color }}>
                        {riskStatus.label}
                      </div>
                      <div className="font-mono text-xs text-[var(--muted)] mt-1">{riskStatus.text}</div>
                    </div>

                    <a
                      href={whatsappMessage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="no-print inline-flex items-center justify-center gap-2 rounded border border-[var(--line-strong)] bg-black/60 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-[var(--green)] hover:border-[var(--green)] transition"
                    >
                      <span>💬 Falar com Especialista</span>
                    </a>
                  </div>
                </div>

                {/* Interactive Filter Pills */}
                <div className="no-print mt-6 pt-4 border-t border-[var(--line)] flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] mr-2">Filtrar:</span>
                  <button
                    onClick={() => setActiveFilter("all")}
                    className={`px-3 py-1.5 rounded font-mono text-xs uppercase transition ${
                      activeFilter === "all" ? "bg-[var(--accent)] text-black font-bold" : "bg-[var(--panel-2)] text-[var(--muted)] hover:text-white"
                    }`}
                  >
                    Todos ({TOTAL_CHECKLIST_ITEMS})
                  </button>
                  <button
                    onClick={() => setActiveFilter("pending")}
                    className={`px-3 py-1.5 rounded font-mono text-xs uppercase transition ${
                      activeFilter === "pending" ? "bg-[var(--accent)] text-black font-bold" : "bg-[var(--panel-2)] text-[var(--muted)] hover:text-white"
                    }`}
                  >
                    Pendentes ({TOTAL_CHECKLIST_ITEMS - totalChecked})
                  </button>
                  <button
                    onClick={() => setActiveFilter("done")}
                    className={`px-3 py-1.5 rounded font-mono text-xs uppercase transition ${
                      activeFilter === "done" ? "bg-[var(--accent)] text-black font-bold" : "bg-[var(--panel-2)] text-[var(--muted)] hover:text-white"
                    }`}
                  >
                    Verificados ({totalChecked})
                  </button>
                </div>
              </div>

              {/* Checklist Sections */}
              <div className="space-y-6">
                {CHECKLIST_SECTIONS.map((section) => {
                  const filteredItems = section.items.filter((item) => {
                    const isChecked = Boolean(checkedItems[item.id]);
                    if (activeFilter === "pending") return !isChecked;
                    if (activeFilter === "done") return isChecked;
                    return true;
                  });

                  if (filteredItems.length === 0) return null;

                  const sectionCheckedCount = section.items.filter((item) => checkedItems[item.id]).length;
                  const isSectionComplete = sectionCheckedCount === section.items.length;
                  const isExpanded = expandedSections[section.id] !== false;

                  return (
                    <div
                      key={section.id}
                      className="print-card rounded border border-[var(--line)] bg-[var(--panel)] overflow-hidden transition"
                    >
                      {/* Section Header */}
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-5 text-left border-b border-[var(--line)] bg-[var(--panel-2)]/60 hover:bg-[var(--panel-2)] transition"
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-xs font-bold text-[var(--accent)] bg-black/40 border border-[var(--line)] px-2.5 py-1 rounded">
                            {section.number}
                          </span>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold uppercase tracking-tight text-[var(--text)]">
                                {section.title}
                              </h3>
                              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                                isSectionComplete
                                  ? "border-[var(--green)] bg-[rgba(132,204,22,.1)] text-[var(--green)]"
                                  : "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                              }`}>
                                {section.badge}
                              </span>
                            </div>
                            <p className="text-xs font-mono text-[var(--muted)] mt-1">
                              {section.description} · ({sectionCheckedCount}/{section.items.length} verificados)
                            </p>
                          </div>
                        </div>

                        <div className="font-mono text-sm text-[var(--muted)]">
                          {isExpanded ? "▲" : "▼"}
                        </div>
                      </button>

                      {/* Items List */}
                      {isExpanded && (
                        <div className="divide-y divide-[var(--line)]">
                          {filteredItems.map((item) => {
                            const isChecked = Boolean(checkedItems[item.id]);
                            return (
                              <div
                                key={item.id}
                                className={`p-5 transition flex items-start gap-4 ${
                                  isChecked ? "bg-black/30" : "hover:bg-[var(--panel-2)]/30"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  id={`item-${item.id}`}
                                  checked={isChecked}
                                  onChange={() => toggleCheck(item.id)}
                                  className="mt-1 w-5 h-5 rounded cursor-pointer accent-[var(--accent)]"
                                />

                                <div className="flex-1">
                                  <label
                                    htmlFor={`item-${item.id}`}
                                    className={`cursor-pointer block text-base font-bold transition ${
                                      isChecked ? "line-through text-[var(--muted)]" : "text-[var(--text)]"
                                    }`}
                                  >
                                    {item.title}
                                  </label>

                                  <p className="mt-1 text-xs font-mono leading-relaxed text-zinc-400">
                                    {item.details}
                                  </p>

                                  {item.codeSnippet && (
                                    <pre className="mt-2.5 p-3 rounded bg-black/60 border border-[var(--line)] font-mono text-xs text-[var(--accent)] overflow-x-auto">
                                      <code>{item.codeSnippet}</code>
                                    </pre>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Print & Recommendation CTA */}
              <div className="no-print rounded border border-[var(--accent)] bg-[var(--panel)] p-8 text-center space-y-4">
                <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)] font-bold">
                  // Conclusão da Auditoria
                </span>
                <h3 className="text-2xl font-bold uppercase tracking-tight text-[var(--text)]">
                  Precisa de uma auditoria técnica profunda antes do seu go-to-market?
                </h3>
                <p className="max-w-2xl mx-auto font-mono text-xs text-[var(--muted)] leading-relaxed">
                  A equipe da Neural Hub realiza pentests automatizados, revisão manual de schemas de banco, blindagem de RLS e arquitetura serverless para que você escale com tranquilidade e em total conformidade jurídica.
                </p>
                <div className="flex flex-wrap justify-center gap-4 pt-2">
                  <button
                    onClick={handlePrint}
                    className="rounded bg-[var(--accent)] px-8 py-4 font-mono text-xs font-bold uppercase tracking-widest text-black transition hover:brightness-110 active:scale-95 animate-glow"
                  >
                    Baixar Relatório em PDF
                  </button>
                  <a
                    href={whatsappMessage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded border border-[var(--line-strong)] bg-black/50 px-8 py-4 font-mono text-xs font-bold uppercase tracking-widest text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition"
                  >
                    Falar com Consultores no WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}

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
