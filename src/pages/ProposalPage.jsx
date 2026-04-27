import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import training05 from "../assets/training-05.jpg";
import training10 from "../assets/training-10.jpg";

const COMPANY_SIZES = [
  "1 a 10 pessoas",
  "11 a 50 pessoas",
  "51 a 200 pessoas",
  "201 a 1.000 pessoas",
  "Mais de 1.000 pessoas",
];

const URGENCY_LEVELS = [
  "Quero entender possibilidades",
  "Preciso treinar uma equipe",
  "Tenho um projeto de IA para estruturar",
  "Preciso de proposta com urgência",
];

const OBJECTIVES = [
  "Capacitar lideranças e equipes",
  "Automatizar processos internos",
  "Criar agentes de IA para atendimento ou operação",
  "Desenhar uma estratégia de IA para a empresa",
  "Outro objetivo",
];

const SIGNALS = [
  ["+100", "organizações treinadas"],
  ["+1000", "Executivos treinados"],
  ["Instrutores", "especialistas"],
  ["IA", "aplicada ao negócio"],
];

const JOURNEY = [
  [
    "Diagnóstico",
    "Entendemos maturidade, gargalos, equipe, dados, operação e oportunidades reais de IA.",
  ],
  [
    "Arquitetura",
    "Transformamos necessidade em escopo: trilha, carga, entregáveis, formato e critérios de sucesso.",
  ],
  [
    "Proposta",
    "Você recebe um plano claro, com recomendação de formato, investimento e próximos passos.",
  ],
];

const PROOF_POINTS = [
  "Treinamentos aplicados em empresas, associações e centros de inovação.",
  "Conteúdo vivo: GPT, Claude, Gemini, RAG, agentes, n8n, MCP, APIs e segurança.",
  "Foco em equipes que precisam sair do uso improvisado para a execução com critério.",
  "Formato adaptável para lideranças, times comerciais, operação, marketing, tecnologia e educação.",
];

const initialForm = {
  name: "",
  email: "",
  whatsapp: "",
  company: "",
  role: "",
  companySize: "",
  objective: "",
  urgency: "",
  context: "",
};

const HERO_BACKGROUND =
  "https://images.unsplash.com/photo-1764690690771-b4522d66b433?auto=format&fit=crop&w=1800&q=82";

export default function ProposalPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const whatsappMessage = useMemo(() => {
    const text = encodeURIComponent(
      `Olá! Solicitei uma proposta pela página da Neural Hub.\n\nNome: ${form.name || ""}\nEmpresa: ${form.company || ""}\nObjetivo: ${form.objective || ""}`,
    );
    return `https://wa.me/5548988549556?text=${text}`;
  }, [form.company, form.name, form.objective]);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }));
    }
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Informe seu nome";
    if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Informe um e-mail válido";
    if (!form.whatsapp.trim()) next.whatsapp = "Informe seu WhatsApp";
    if (!form.company.trim()) next.company = "Informe a empresa";
    if (!form.role.trim()) next.role = "Informe seu cargo";
    if (!form.companySize) next.companySize = "Selecione o porte";
    if (!form.objective) next.objective = "Selecione o objetivo";
    if (!form.urgency) next.urgency = "Selecione o momento";
    if (!form.context.trim()) next.context = "Conte rapidamente o contexto";
    return next;
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setSubmitError("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      whatsapp: form.whatsapp.trim(),
      company: form.company.trim(),
      role: form.role.trim(),
      company_size: form.companySize,
      objective: form.objective,
      urgency: form.urgency,
      context: form.context.trim(),
      source: "neural-hub-proposta",
    };

    let error = null;
    try {
      const { supabase } = await import("../lib/supabase.js");
      ({ error } = await supabase.from("proposal_requests").insert([payload]));
    } catch (err) {
      error = err;
    }

    setLoading(false);

    if (error) {
      console.error("[Proposal request]", error);
      setSubmitError("Não foi possível enviar agora. Tente novamente ou fale direto pelo WhatsApp.");
      return;
    }

    setSubmitted(true);
  };

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--accent)] selection:text-black"
      style={{
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
        "--error-soft": "rgba(239,68,68,.08)",
        fontFamily: '"Space Grotesk", "Arial Narrow", sans-serif',
      }}
    >
      <Helmet>
        <title>Solicitar proposta | Neural Hub</title>
        <meta
          name="description"
          content="Solicite uma proposta personalizada da Neural Hub para treinamentos, mentoria corporativa e projetos de inteligência artificial aplicada."
        />
      </Helmet>

      <style>{`
        html { scroll-behavior: smooth; }
        body { background: #060606; }
        .font-mono-tech { font-family: "Space Mono", monospace; }
        .bg-grid-tech {
          background-image:
            linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,.06) 1px, transparent 1px);
          background-size: 34px 34px;
        }
        .bg-noise-tech {
          background-image:
            radial-gradient(circle at 20% 20%, rgba(255,106,0,.1), transparent 20%),
            radial-gradient(circle at 80% 10%, rgba(255,255,255,.05), transparent 18%),
            radial-gradient(circle at 50% 100%, rgba(255,106,0,.08), transparent 28%);
        }
        @keyframes glow {
          0%,100% { box-shadow: 0 0 0 rgba(255,106,0,0); }
          50% { box-shadow: 0 0 28px rgba(255,106,0,.22); }
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes pulseLine {
          0%,100% { opacity: .28; transform: scaleX(.94); }
          50% { opacity: .9; transform: scaleX(1); }
        }
        .animate-glow { animation: glow 3.4s ease-in-out infinite; }
        .animate-rise { animation: rise .8s cubic-bezier(.16,1,.3,1) both; }
        .animate-rise-delay { animation: rise .8s cubic-bezier(.16,1,.3,1) .16s both; }
        .animate-pulseLine { animation: pulseLine 3s ease-in-out infinite; }
        .scan-overlay::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,.08), transparent);
          animation: scan 5.8s linear infinite;
          pointer-events: none;
        }
        input:-webkit-autofill,
        textarea:-webkit-autofill,
        select:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #101010 inset !important;
          -webkit-text-fill-color: #f5f2ea !important;
          caret-color: #f5f2ea;
        }
        :focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
          border-radius: 2px;
        }
        :focus:not(:focus-visible) { outline: none; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
        @media (max-width: 640px) {
          *, *::before, *::after {
            box-sizing: border-box;
          }
          html,
          body,
          #root {
            overflow-x: hidden;
          }
          header > div {
            align-items: flex-start !important;
            flex-direction: column !important;
            gap: 14px !important;
          }
          .proposal-header-title {
            font-size: 1.05rem !important;
          }
          .proposal-header-cta,
          .proposal-button {
            box-sizing: border-box !important;
            letter-spacing: .14em !important;
            max-width: calc(100vw - 32px) !important;
            width: 100% !important;
          }
          .proposal-hero {
            min-height: auto !important;
          }
          .proposal-hero h1 {
            max-width: calc(100vw - 32px) !important;
            font-size: clamp(1.7rem, 8.8vw, 2.05rem) !important;
            overflow-wrap: anywhere !important;
          }
          .proposal-hero p,
          .proposal-hero span,
          .proposal-hero h2 {
            max-width: calc(100vw - 32px) !important;
            overflow-wrap: anywhere !important;
          }
          .proposal-hero-grid {
            min-height: auto !important;
          }
          .proposal-signals {
            grid-template-columns: 1fr !important;
          }
          .proposal-hero-panel {
            min-height: auto !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 pointer-events-none opacity-[0.07] bg-grid-tech" />
      <div className="fixed inset-0 pointer-events-none bg-noise-tech" />

      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 md:px-8">
          <a href="/" className="flex items-center gap-4">
            <div className="h-3 w-3 bg-[var(--accent)] animate-glow" />
            <div>
              <div className="font-mono-tech text-[11px] uppercase tracking-[0.34em] text-[var(--muted)]">Neural Hub</div>
              <div className="proposal-header-title text-xl font-semibold tracking-[-0.04em] text-[var(--text)] md:text-2xl">PROPOSTA IA</div>
            </div>
          </a>
          <a
            href="#cadastro"
            className="proposal-header-cta rounded-[4px] border border-[var(--line-strong)] bg-[var(--accent)] px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-black transition hover:brightness-110 active:scale-95 animate-glow sm:px-5 sm:text-[11px] sm:tracking-[0.24em]"
          >
            Solicitar proposta
          </a>
        </div>
      </header>

      <main>
        <section className="proposal-hero relative min-h-[calc(100vh-73px)] overflow-hidden border-b border-[var(--line)]">
          <div className="absolute inset-0">
            <img
              src={HERO_BACKGROUND}
              alt="Profissionais em treinamento corporativo com laptops e apresentação"
              className="h-full w-full object-cover object-center opacity-52 grayscale"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,6,6,.92)_0%,rgba(6,6,6,.72)_48%,rgba(6,6,6,.18)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_22%,rgba(255,106,0,.18),transparent_26%),radial-gradient(circle_at_18%_82%,rgba(255,255,255,.04),transparent_20%)]" />
          </div>

          <div className="proposal-hero-grid relative mx-auto grid min-h-[calc(100vh-73px)] max-w-[1600px] grid-cols-1 lg:grid-cols-12">
            <div className="flex flex-col justify-between border-b border-[var(--line)] px-4 py-10 lg:col-span-7 lg:border-b-0 lg:border-r lg:px-8 lg:py-14">
              <div className="animate-rise">
                <div className="mb-7 flex items-center gap-4 font-mono-tech text-[11px] uppercase tracking-[0.32em] text-[var(--accent)]">
                  <span>// Proposta personalizada para equipes e negócios</span>
                </div>
                <div className="mb-7 h-px w-32 bg-[var(--accent)] animate-pulseLine" />
                <h1 className="max-w-5xl text-[2.2rem] font-semibold uppercase leading-[0.94] tracking-[-0.04em] text-[var(--text)] sm:text-[2.75rem] md:text-[3.6rem] lg:text-[4rem]">
                  Transforme IA em vantagem operacional.
                </h1>
                <p className="mt-7 max-w-3xl border-l-2 border-[var(--accent)] pl-5 font-mono-tech text-sm leading-7 text-zinc-300 md:text-base">
                  Receba uma proposta desenhada para o momento da sua empresa: treinamento, mentoria corporativa, automações, agentes, arquitetura de IA ou uma trilha completa para tirar a equipe do improviso e colocar a tecnologia para gerar resultado.
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#cadastro"
                    className="proposal-button rounded-[4px] bg-[var(--accent)] px-6 py-4 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-black transition hover:brightness-110 active:scale-95 animate-glow sm:px-8 sm:tracking-[0.26em]"
                  >
                    Solicitar proposta
                  </a>
                  <a
                    href="#metodo"
                    className="proposal-button rounded-[4px] border border-[var(--line-strong)] bg-black/30 px-6 py-4 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] active:scale-95 sm:px-8 sm:tracking-[0.26em]"
                  >
                    Ver método
                  </a>
                </div>
              </div>

              <div className="proposal-signals mt-12 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4 animate-rise-delay">
                {SIGNALS.map(([value, label]) => (
                  <div key={label} className="rounded-[6px] border border-[var(--line)] bg-black/25 p-4">
                    <div className="text-[1.65rem] font-semibold uppercase leading-none tracking-[-0.04em] text-[var(--accent)] md:text-3xl">{value}</div>
                    <div className="mt-2 font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative scan-overlay lg:col-span-5">
              <div className="proposal-hero-panel relative flex h-full min-h-[560px] flex-col justify-between p-4 md:p-8">
                <div className="flex items-start justify-between">
                  <div className="border border-[var(--line-strong)] bg-black/60 px-3 py-2 font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--text)]">
                    Diagnóstico // IA aplicada
                  </div>
                  <div className="font-mono-tech text-[11px] uppercase tracking-[0.24em] text-[var(--accent)]">[ativo]</div>
                </div>

                <div className="border border-[var(--line-strong)] bg-[var(--panel)] p-5 animate-glow md:p-7">
                  <div className="border-b border-[var(--line)] pb-4">
                    <div className="font-mono-tech text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">O que a proposta resolve</div>
                    <h2 className="mt-2 text-2xl uppercase leading-none tracking-[-0.04em] text-[var(--text)] md:text-3xl">
                      Um plano claro antes de investir tempo e dinheiro.
                    </h2>
                  </div>
                  <div className="space-y-0 font-mono-tech text-sm">
                    {[
                      ["ESCOPO", "treinamento, mentoria ou projeto"],
                      ["PÚBLICO", "lideranças, times ou área específica"],
                      ["FORMATO", "online, presencial ou híbrido"],
                      ["RESULTADO", "competência aplicada e próximos passos"],
                    ].map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-5 border-b border-[var(--line)] py-4 last:border-b-0">
                        <span className="text-[11px] text-[var(--muted)]">{key}</span>
                        <span className="text-right text-[11px] uppercase text-[var(--text)]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    "Sem proposta genérica",
                    "Sem trilha engessada",
                    "Sem prometer IA mágica",
                  ].map((item) => (
                    <div key={item} className="border border-[var(--line)] bg-black/30 p-4 font-mono-tech text-[11px] uppercase tracking-[0.18em] text-[var(--text)]">
                      <span className="mr-3 text-[var(--accent)]">/</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="metodo" className="border-b border-[var(--line)] bg-[var(--bg-2)]">
          <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
            <div className="grid grid-cols-1 gap-0 border border-[var(--line)] lg:grid-cols-12">
              <div className="border-b border-[var(--line)] bg-[var(--panel)] p-6 lg:col-span-5 lg:border-b-0 lg:border-r md:p-10">
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--accent)]">// Decisão com critério</div>
                <h2 className="mt-4 text-4xl uppercase leading-[0.92] tracking-[-0.05em] text-[var(--text)] md:text-6xl">
                  Antes da proposta, vem o entendimento.
                </h2>
                <p className="mt-6 font-mono-tech text-sm leading-8 text-[var(--muted)]">
                  A Neural Hub não empurra um pacote pronto. A proposta nasce de uma leitura do seu contexto: maturidade em IA, dores de operação, objetivos de negócio, perfil da equipe e nível de profundidade necessário.
                </p>
              </div>
              <div className="lg:col-span-7">
                {JOURNEY.map(([title, text], index) => (
                  <div key={title} className="grid grid-cols-1 border-b border-[var(--line)] last:border-b-0 md:grid-cols-[140px_1fr]">
                    <div className="border-b border-[var(--line)] p-6 font-mono-tech text-[11px] uppercase tracking-[0.24em] text-[var(--accent)] md:border-b-0 md:border-r md:p-8">
                      0{index + 1}
                    </div>
                    <div className="bg-[var(--panel-2)] p-6 md:p-8">
                      <h3 className="text-2xl uppercase tracking-[-0.03em] text-[var(--text)] md:text-3xl">{title}</h3>
                      <p className="mt-3 max-w-3xl font-mono-tech text-sm leading-7 text-[var(--muted)]">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--line)] bg-[var(--bg)]">
          <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-2">
            <div className="min-h-[520px] border-b border-[var(--line)] lg:border-b-0 lg:border-r">
              <img
                src={training05}
                alt="Capacitação corporativa em inteligência artificial"
                className="h-full w-full object-cover grayscale"
                loading="lazy"
              />
            </div>
            <div className="p-6 md:p-10 lg:p-14">
              <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--accent)]">// O que convence de verdade</div>
              <h2 className="mt-4 text-4xl uppercase leading-[0.92] tracking-[-0.05em] text-[var(--text)] md:text-6xl">
                IA não entra na empresa por curiosidade. Entra por prioridade.
              </h2>
              <div className="mt-9 border border-[var(--line)]">
                {PROOF_POINTS.map((point, index) => (
                  <div key={point} className="border-b border-[var(--line)] p-5 last:border-b-0">
                    <div className="flex gap-4">
                      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center bg-[var(--accent)]">
                        <span className="font-mono-tech text-[9px] font-bold text-black">{String(index + 1).padStart(2, "0")}</span>
                      </div>
                      <p className="font-mono-tech text-sm leading-7 text-[var(--muted)]">{point}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="cadastro" className="border-b border-[var(--line)] bg-[var(--bg-2)]">
          <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
            <div className="grid grid-cols-1 gap-0 border border-[var(--line)] lg:grid-cols-12">
              <div className="border-b border-[var(--line)] bg-[var(--panel)] p-6 lg:col-span-5 lg:border-b-0 lg:border-r md:p-10">
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--accent)]">// Cadastro</div>
                <h2 className="mt-4 text-4xl uppercase leading-[0.92] tracking-[-0.05em] text-[var(--text)] md:text-5xl">
                  Conte o contexto. A proposta vem com direção.
                </h2>
                <p className="mt-5 font-mono-tech text-sm leading-8 text-[var(--muted)]">
                  O formulário leva menos de dois minutos. Quanto melhor o contexto, mais objetiva será a conversa de diagnóstico e mais precisa será a proposta.
                </p>
                <div className="mt-8 overflow-hidden border border-[var(--line)]">
                  <img
                    src={training10}
                    alt="Turma em treinamento de IA aplicada"
                    className="aspect-[16/10] w-full object-cover grayscale"
                    loading="lazy"
                  />
                </div>
                <div className="mt-6 border-l-2 border-[var(--accent)] pl-5">
                  <p className="font-mono-tech text-sm leading-7 text-zinc-400">
                    Uma boa proposta não começa em uma tabela de preço. Começa em descobrir qual problema vale resolver primeiro.
                  </p>
                </div>
              </div>

              <div className="bg-[var(--bg)] p-6 lg:col-span-7 md:p-10">
                {!submitted ? (
                  <form onSubmit={submit} noValidate className="space-y-5">
                    <div>
                      <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--accent)]">// Solicitar proposta</div>
                      <h3 className="mt-3 text-2xl uppercase leading-tight tracking-[-0.04em] text-[var(--text)] md:text-3xl">
                        Dados para diagnóstico inicial.
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Field label="Nome" name="name" value={form.name} onChange={update} error={errors.name} placeholder="Seu nome" />
                      <Field label="E-mail" type="email" name="email" value={form.email} onChange={update} error={errors.email} placeholder="seu@email.com" />
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Field label="WhatsApp" type="tel" name="whatsapp" value={form.whatsapp} onChange={update} error={errors.whatsapp} placeholder="(48) 9 9999-9999" />
                      <Field label="Cargo" name="role" value={form.role} onChange={update} error={errors.role} placeholder="CEO, RH, gerente..." />
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Field label="Empresa" name="company" value={form.company} onChange={update} error={errors.company} placeholder="Nome da empresa" />
                      <SelectField label="Porte da empresa" name="companySize" value={form.companySize} onChange={update} error={errors.companySize} options={COMPANY_SIZES} />
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <SelectField label="Objetivo principal" name="objective" value={form.objective} onChange={update} error={errors.objective} options={OBJECTIVES} />
                      <SelectField label="Momento" name="urgency" value={form.urgency} onChange={update} error={errors.urgency} options={URGENCY_LEVELS} />
                    </div>
                    <TextArea
                      label="Contexto"
                      name="context"
                      value={form.context}
                      onChange={update}
                      error={errors.context}
                      placeholder="Ex.: queremos treinar 25 líderes, automatizar atendimento e criar um plano de IA para 2026."
                    />

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-[4px] bg-[var(--accent)] py-4 text-center text-[11px] font-bold uppercase tracking-[0.26em] text-black transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 animate-glow"
                    >
                      {loading ? "Enviando..." : "Enviar e solicitar proposta"}
                    </button>

                    {submitError && (
                      <div className="border border-[rgba(239,68,68,.35)] bg-[var(--error-soft)] p-4 font-mono-tech text-xs leading-6 text-[var(--error)]">
                        {submitError}
                      </div>
                    )}

                    <p className="text-center font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                      Seus dados serão usados apenas para contato comercial da Neural Hub.
                    </p>
                  </form>
                ) : (
                  <div className="flex min-h-[620px] flex-col items-center justify-center text-center">
                    <div className="h-4 w-4 bg-[var(--green)]" />
                    <div className="mt-6 font-mono-tech text-[10px] uppercase tracking-[0.28em] text-[var(--green)]">
                      Solicitação recebida
                    </div>
                    <h3 className="mt-4 max-w-lg text-3xl uppercase leading-[0.94] tracking-[-0.05em] text-[var(--text)] md:text-5xl">
                      Agora vamos transformar contexto em proposta.
                    </h3>
                    <p className="mt-5 max-w-md font-mono-tech text-sm leading-7 text-[var(--muted)]">
                      Recebemos seus dados. Se quiser acelerar o diagnóstico, chame a equipe no WhatsApp e envie qualquer material sobre o desafio.
                    </p>
                    <a
                      href={whatsappMessage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-8 rounded-[4px] bg-[var(--accent)] px-8 py-4 text-center text-[11px] font-bold uppercase tracking-[0.26em] text-black transition hover:brightness-110"
                    >
                      Falar no WhatsApp
                    </a>
                    <a href="/" className="mt-6 font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] underline underline-offset-4 hover:text-[var(--accent)]">
                      Voltar para Neural Hub
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-8">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 bg-[var(--accent)]" />
            <span className="font-mono-tech text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Neural Hub · Propostas IA · 2026</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/privacidade.html" className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--muted)] transition hover:text-[var(--accent)]">
              Política de Privacidade
            </a>
            <a href="/termos.html" className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--muted)] transition hover:text-[var(--accent)]">
              Termos de Uso
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange, error, placeholder }) {
  const fieldId = `proposal-${name}`;
  const errorId = `${fieldId}-error`;
  return (
    <div>
      <label htmlFor={fieldId} className="block font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
        {label}
      </label>
      <input
        id={fieldId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`mt-2 w-full rounded-[4px] border bg-[var(--panel)] px-4 py-3 font-mono-tech text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none transition focus:border-[var(--accent)] ${
          error ? "border-[var(--error)]" : "border-[var(--line-strong)]"
        }`}
      />
      {error && <span id={errorId} className="mt-1 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--error)]">{error}</span>}
    </div>
  );
}

function SelectField({ label, name, value, onChange, error, options }) {
  const fieldId = `proposal-${name}`;
  const errorId = `${fieldId}-error`;
  return (
    <div>
      <label htmlFor={fieldId} className="block font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
        {label}
      </label>
      <div className="relative mt-2">
        <select
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`w-full cursor-pointer appearance-none rounded-[4px] border bg-[var(--panel)] px-4 py-3 font-mono-tech text-sm outline-none transition focus:border-[var(--accent)] ${
            error ? "border-[var(--error)]" : "border-[var(--line-strong)]"
          } ${value ? "text-[var(--text)]" : "text-[var(--muted)]"}`}
        >
          <option value="" disabled className="bg-[var(--panel)] text-[var(--muted)]">Selecionar...</option>
          {options.map((option) => (
            <option key={option} value={option} className="bg-[var(--panel)] text-[var(--text)]">
              {option}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
        </div>
      </div>
      {error && <span id={errorId} className="mt-1 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--error)]">{error}</span>}
    </div>
  );
}

function TextArea({ label, name, value, onChange, error, placeholder }) {
  const fieldId = `proposal-${name}`;
  const errorId = `${fieldId}-error`;
  return (
    <div>
      <label htmlFor={fieldId} className="block font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
        {label}
      </label>
      <textarea
        id={fieldId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={5}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`mt-2 w-full resize-y rounded-[4px] border bg-[var(--panel)] px-4 py-3 font-mono-tech text-sm leading-6 text-[var(--text)] placeholder-[var(--muted)] outline-none transition focus:border-[var(--accent)] ${
          error ? "border-[var(--error)]" : "border-[var(--line-strong)]"
        }`}
      />
      {error && <span id={errorId} className="mt-1 block font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[var(--error)]">{error}</span>}
    </div>
  );
}
