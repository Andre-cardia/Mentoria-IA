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
    console.error("[AuditoriaChecklistPage] Error loading local storage lead:", e);
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
    console.error("[AuditoriaChecklistPage] Error loading local storage checks:", e);
  }
  return /** @type {Record<string, boolean>} */ ({});
}

const HARNESSES = [
  {
    id: "claude",
    name: "Claude Code",
    badge: "Oficial .claude",
    icon: "🤖",
    installCmd: "mkdir -p .claude/skills/vibe-security-audit && curl -sSL https://neuralhub.ia.br/skills/vibe-security.md -o .claude/skills/vibe-security-audit/SKILL.md",
    runHint: "No Claude Code, digite: 'Execute a skill vibe-security-audit para auditar a segurança deste projeto'",
    description: "Instala a skill nativa em `.claude/skills/` com varredura autônoma de RLS, segredos no front-end e variáveis de ambiente.",
  },
  {
    id: "cursor",
    name: "Cursor / Composer",
    badge: "Regra .mdc",
    icon: "⚡",
    installCmd: "mkdir -p .cursor/rules && curl -sSL https://neuralhub.ia.br/skills/cursor-vibe-security.mdc -o .cursor/rules/vibe-security.mdc",
    runHint: "No Composer (Cmd+I / Ctrl+I), digite: '@vibe-security audite todas as tabelas Supabase e procure chaves vazadas'",
    description: "Configura a regra de contexto do Cursor para que o agente inspecione seus arquivos de migração e alerte sobre brechas antes de commitar.",
  },
  {
    id: "bmad",
    name: "BMAD / Antigravity",
    badge: "Agent Skill",
    icon: "🧠",
    installCmd: "mkdir -p .agents/skills/vibe-security-audit && curl -sSL https://neuralhub.ia.br/skills/vibe-security.md -o .agents/skills/vibe-security-audit/SKILL.md",
    runHint: "No chat com o agente, chame: 'bmad-build audite a segurança das migrações e do front-end deste app'",
    description: "Compatível com o formato BMAD e Antigravity IDE, integrando o diagnóstico na suíte de skills do agente.",
  },
  {
    id: "codex",
    name: "Codex",
    badge: "OpenAI / Codex",
    icon: "📜",
    installCmd: "mkdir -p .codex/skills/vibe-security-audit && curl -sSL https://neuralhub.ia.br/skills/vibe-security.md -o .codex/skills/vibe-security-audit/SKILL.md",
    runHint: "No Codex CLI / chat, digite: 'Execute a skill vibe-security-audit para auditar vulnerabilidades e RLS deste projeto'",
    description: "Instala a skill no diretório `.codex/skills/` permitindo que o OpenAI Codex inspecione esquemas SQL, RLS e chaves do projeto.",
  },
  {
    id: "cli",
    name: "Terminal (npx CLI)",
    badge: "Sem Agente",
    icon: "💻",
    installCmd: "npx --yes @neuralhub/vibe-audit",
    runHint: "Rode diretamente no terminal na raiz do seu projeto para receber um relatório de conformidade em segundos.",
    description: "Script leve de terminal que varre schemas SQL e diretórios do front sem exigir que você abra um agente de IA.",
  },
];

/**
 * @param {{ onNavigateToLanding?: () => void }} [props]
 */
export default function AuditoriaChecklistPage({ onNavigateToLanding } = {}) {
  const [activeHarness, setActiveHarness] = useState("claude");
  const [copiedKey, setCopiedKey] = useState("");
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

  const handleCopyCmd = (text, key) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(""), 2200);
    }
  };

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
      context: "Lead registrado na página de checklist /auditoria/checklist para acesso aos 30 pontos de verificação",
      source: "neural-hub-auditoria-checklist",
      status: "new",
    };

    try {
      const { supabase, isSupabaseConfigured } = await import("../lib/supabase.js");
      if (!isSupabaseConfigured) {
        console.warn("[Auditoria] Supabase não configurado no ambiente local.");
      } else {
        let { error } = await supabase.from("proposal_requests").insert([payload]);
        if (error) {
          const fallbackRes = await supabase.from("proposal_requests").insert([{
            ...payload,
            source: "crm-manual",
            context: `[Origem: /auditoria/checklist] ${payload.context}`,
          }]);
          error = fallbackRes.error;
        }

        if (error) {
          console.error("[Auditoria] Erro definitivo ao gravar lead em proposal_requests:", error);
        }

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
    } catch (e) {
      console.error(e);
    }
    setLeadData(lead);
    setIsUnlocked(true);
    setSubmitting(false);
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

  const handleGoToLanding = (e) => {
    if (onNavigateToLanding) {
      e.preventDefault();
      onNavigateToLanding();
    }
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
        <title>Checklist Interativo de Cibersegurança Vibe Code | Neural Hub</title>
        <meta
          name="description"
          content="Ferramenta prática de auditoria com 30 itens essenciais para aplicações criadas com IA e No-Code. Verifique RLS, chaves de API, lógica de negócio e gere seu relatório PDF."
        />
        <meta property="og:title" content="Checklist Interativo de Cibersegurança Vibe Code | Neural Hub" />
        <meta property="og:url" content="https://neuralhub.ia.br/auditoria/checklist" />
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
        @keyframes glow {
          0%,100% { box-shadow: 0 0 0 rgba(255,106,0,0); }
          50%      { box-shadow: 0 0 28px rgba(255,106,0,.22); }
        }
        .animate-glow { animation: glow 2.8s ease-in-out infinite; }
        
        /* Print layout for Executive PDF Export */
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            display: block !important;
          }
          .print-card {
            border: 1px solid #d1d5db !important;
            background: #ffffff !important;
            color: #000000 !important;
            page-break-inside: avoid;
            margin-bottom: 1.5rem;
          }
        }
      `}</style>

      {/* Header */}
      <header className="no-print sticky top-0 z-50 border-b border-[var(--line)] bg-[#060606]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <a
              href="/auditoria"
              onClick={handleGoToLanding}
              className="inline-flex items-center gap-2 font-mono text-xs text-[var(--muted)] hover:text-[var(--accent)] transition py-1"
            >
              <span>←</span>
              <span>Voltar para Apresentação</span>
            </a>
            <span className="text-zinc-700 hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[var(--accent)] flex items-center justify-center font-mono font-bold text-black text-xs">
                NH
              </div>
              <span className="text-xs font-mono text-zinc-300 font-bold">Checklist de Auditoria</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2 border border-[var(--line)] bg-[var(--panel)] px-3 py-1 text-[11px] font-mono text-[var(--muted)] rounded">
              <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse"></span>
              <span>SEC-OPS: ATIVO</span>
            </span>
          </div>
        </div>
      </header>

      {/* Print-only Header for PDF Report */}
      <div className="hidden print-header mb-8 pb-4 border-b-2 border-black">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold uppercase">Relatório de Diagnóstico de Segurança Vibe Code</h1>
            <p className="text-xs text-gray-600 mt-1">
              Neural Hub · Inteligência Artificial & Cibersegurança Corporativa
            </p>
          </div>
          <div className="text-right text-xs">
            <div><strong>Empresa:</strong> {leadData?.company || "Não informada"}</div>
            <div><strong>Responsável:</strong> {leadData?.name || "Não informado"}</div>
            <div><strong>Data da Auditoria:</strong> {leadData?.date || new Date().toLocaleDateString("pt-BR")}</div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-gray-100 rounded flex justify-between items-center text-xs">
          <div><strong>Conformidade:</strong> {scorePercentage}% ({totalChecked} de {TOTAL_CHECKLIST_ITEMS} itens checados)</div>
          <div><strong>Status de Risco:</strong> {riskStatus.label}</div>
        </div>
      </div>

      {/* Main Container */}
      <main className="mx-auto max-w-[1500px] px-4 py-10 md:px-8">
        {!isUnlocked ? (
          /* Lead Capture Gate (Dedicated Full Focus) */
          <div className="max-w-4xl mx-auto my-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded border border-[rgba(255,106,0,.35)] bg-[rgba(255,106,0,.1)] px-3.5 py-1.5 text-[var(--accent)] font-mono text-xs font-bold uppercase tracking-widest mb-4">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
                Desbloqueio de Acesso Gratuito
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight text-[var(--text)]">
                Checklist Interativo de Cibersegurança
              </h1>
              <p className="font-mono text-sm leading-relaxed text-[var(--muted)] mt-3 max-w-2xl mx-auto">
                Identifique-se para liberar o painel com as 30 verificações técnicas, cálculo de vulnerabilidade em tempo real e exportação do relatório executivo em PDF.
              </p>
            </div>

            <div className="rounded border border-[var(--line-strong)] bg-[var(--panel)] p-6 md:p-10 relative shadow-2xl">
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

                  <div>
                    <label htmlFor="auditoria-whatsapp" className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5">
                      WhatsApp com DDD *
                    </label>
                    <input
                      id="auditoria-whatsapp"
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
                    <label htmlFor="auditoria-company" className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5">
                      Nome da Empresa / Projeto *
                    </label>
                    <input
                      id="auditoria-company"
                      type="text"
                      name="company"
                      value={form.company}
                      onChange={handleFormChange}
                      placeholder="Ex.: Startup ou Corporação"
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

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded bg-[var(--accent)] py-4 font-mono text-xs font-bold uppercase tracking-[0.24em] text-black transition hover:brightness-110 active:scale-95 disabled:opacity-60 animate-glow"
                  >
                    {submitting ? "Processando e Liberando..." : "Liberar checklist e Skill de segurança"}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 font-mono text-[11px] text-[var(--muted)] text-center pt-2">
                  <span>🔒 Seus dados estão seguros e protegidos segundo as normas da LGPD.</span>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-[var(--line)] grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--accent)] font-bold">✓</span> Acesso instantâneo às 7 dimensões
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--accent)] font-bold">✓</span> Cálculo dinâmico de score e risco
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--accent)] font-bold">✓</span> Snippets de código SQL e mitigação
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--accent)] font-bold">✓</span> Skill automatizada para Claude Code, Cursor, BMAD e Codex
                </div>
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
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--muted)] mt-1">
                    <span>Responsável: <strong className="text-zinc-300">{leadData?.name}</strong> ({leadData?.email})</span>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => setIsUnlocked(false)}
                      className="text-[var(--accent)] hover:underline font-bold"
                    >
                      [Editar cadastro]
                    </button>
                  </div>
                </div>

                {/* Actions: Reset */}
                <div className="no-print flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleResetChecklist}
                    className="rounded border border-[var(--line)] bg-[var(--panel-2)] px-4 py-2.5 font-mono text-xs text-[var(--muted)] hover:text-white hover:border-[var(--line-strong)] transition"
                  >
                    Limpar marcações
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
            </div>

            {/* AI Harness Skill Installation Box */}
            <div className="no-print rounded border border-[rgba(255,106,0,.4)] bg-[var(--panel)] p-6 md:p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--line)]">
                <div>
                  <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[var(--accent)] font-bold">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
                    Automação com IA // Instalação de Skill
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-[var(--text)] mt-1">
                    Prefere que o seu Agente de IA audite o código por você?
                  </h3>
                  <p className="font-mono text-xs text-[var(--muted)] mt-1.5 max-w-3xl leading-relaxed">
                    Instale a Skill oficial da Neural Hub no harness de sua escolha (Claude Code, Cursor, BMAD, Codex ou Terminal). O agente varre automaticamente suas migrações SQL, detecta chaves expostas e gera o relatório sem trabalho manual.
                  </p>
                </div>

                <a
                  href="/skills/vibe-security.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-[var(--muted)] hover:text-white border border-[var(--line)] bg-[var(--panel-2)] px-3.5 py-2 rounded self-start md:self-auto flex items-center gap-2 whitespace-nowrap transition"
                >
                  <span>Ver SKILL.md</span>
                  <span>↗</span>
                </a>
              </div>

              {/* Harness Selector Tabs */}
              <div className="mt-6 flex flex-wrap gap-2 border-b border-[var(--line)] pb-4">
                {HARNESSES.map((harness) => {
                  const isActive = activeHarness === harness.id;
                  return (
                    <button
                      key={harness.id}
                      type="button"
                      onClick={() => setActiveHarness(harness.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded font-mono text-xs transition ${
                        isActive
                          ? "bg-[var(--accent)] text-black font-bold shadow-[0_0_15px_rgba(255,106,0,.3)]"
                          : "bg-[var(--panel-2)] text-[var(--muted)] hover:text-white hover:bg-black/50"
                      }`}
                    >
                      <span>{harness.icon}</span>
                      <span>{harness.name}</span>
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded border ${
                        isActive ? "border-black/30 bg-black/15 text-black" : "border-zinc-700 text-zinc-400"
                      }`}>
                        {harness.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Harness Panel */}
              {(() => {
                const current = HARNESSES.find((h) => h.id === activeHarness) || HARNESSES[0];
                return (
                  <div className="mt-6 space-y-4">
                    <p className="font-mono text-xs text-zinc-300">
                      {current.description}
                    </p>

                    {/* Command Box with Copy Button */}
                    <div>
                      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1.5">
                        <span>1. Comando de Instalação (Execute na raiz do seu projeto):</span>
                        <button
                          type="button"
                          onClick={() => handleCopyCmd(current.installCmd, current.id)}
                          className="text-[var(--accent)] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === current.id ? "Copiado com sucesso! ✓" : "Copiar Comando 📋"}
                        </button>
                      </div>
                      <div className="p-3.5 rounded bg-black/80 border border-[var(--line-strong)] font-mono text-xs text-[var(--accent)] flex items-center justify-between gap-4 overflow-x-auto">
                        <code>{current.installCmd}</code>
                      </div>
                    </div>

                    {/* How to trigger */}
                    <div className="rounded border border-[var(--line)] bg-black/40 p-4 font-mono text-xs space-y-1">
                      <div className="text-[var(--muted)] uppercase text-[10px] tracking-wider font-bold">
                        2. Como acionar no seu agente / chat:
                      </div>
                      <div className="text-zinc-200">
                        {current.runHint}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Filter Tabs */}
            <div className="no-print flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`px-3.5 py-1.5 rounded transition ${
                    activeFilter === "all" ? "bg-[var(--accent)] text-black font-bold" : "bg-[var(--panel-2)] text-[var(--muted)] hover:text-white"
                  }`}
                >
                  Todos ({TOTAL_CHECKLIST_ITEMS})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("pending")}
                  className={`px-3.5 py-1.5 rounded transition ${
                    activeFilter === "pending" ? "bg-[var(--accent)] text-black font-bold" : "bg-[var(--panel-2)] text-[var(--muted)] hover:text-white"
                  }`}
                >
                  Pendentes ({TOTAL_CHECKLIST_ITEMS - totalChecked})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("done")}
                  className={`px-3.5 py-1.5 rounded transition ${
                    activeFilter === "done" ? "bg-[var(--accent)] text-black font-bold" : "bg-[var(--panel-2)] text-[var(--muted)] hover:text-white"
                  }`}
                >
                  Concluídos ({totalChecked})
                </button>
              </div>

              <div className="font-mono text-xs text-[var(--muted)]">
                Dica: Clique no item para expandir os comandos SQL e regras de mitigação.
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
                <a
                  href={whatsappMessage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-[var(--accent)] px-8 py-4 font-mono text-xs font-bold uppercase tracking-widest text-black transition hover:brightness-110 active:scale-95 animate-glow"
                >
                  Falar com Consultores no WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-[var(--line)] bg-[#060606] py-8 mt-16">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-[var(--muted)]">
          <div>Neural Hub · Diagnóstico de Segurança Vibe Code & No-Code · 2026</div>
          <div className="flex items-center gap-6">
            <a href="/auditoria" onClick={handleGoToLanding} className="hover:text-[var(--accent)] transition">
              Apresentação
            </a>
            <a href="https://neuralhub.ia.br" className="hover:text-[var(--accent)] transition">
              Home
            </a>
            <a href="/solicitar-proposta" className="hover:text-[var(--accent)] transition">
              Solicitar Proposta
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
