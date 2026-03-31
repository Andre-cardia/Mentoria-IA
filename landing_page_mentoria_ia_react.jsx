import { useEffect, useRef, useState } from "react";

// ── Assets locais ──────────────────────────────────────────────
import training01 from "./src/assets/training-01.jpg";
import training02 from "./src/assets/training-02.jpg";
import training03 from "./src/assets/training-03.jpg";
import training04 from "./src/assets/training-04.jpg";
import training05 from "./src/assets/training-05.jpg";
import training06 from "./src/assets/training-06.jpg";
import training07 from "./src/assets/training-07.jpg";
import training08 from "./src/assets/training-08.jpg";
import training09 from "./src/assets/training-09.jpg";
import training10 from "./src/assets/training-10.jpg";
// ── Logos de clientes ────────────────────────────────────────
import logoBeiramar       from "./src/assets/logo clientes/Beiramar.png";
import logoAemflo         from "./src/assets/logo clientes/aemflo.png";
import logoBaesa          from "./src/assets/logo clientes/baesa.png";
import logoCdl            from "./src/assets/logo clientes/cdl.png";
import logoEnercan        from "./src/assets/logo clientes/enercan.png";
import logoFordDimas      from "./src/assets/logo clientes/ford-dimas.webp";
import logoLive           from "./src/assets/logo clientes/live.png";
import logoCdlPalhoca     from "./src/assets/logo clientes/logo-cdlpalhoca.webp";
import logoCidasc         from "./src/assets/logo clientes/logo-cidasc.webp";
import logoCredcrea       from "./src/assets/logo clientes/logo-credcrea.webp";
import logoLumis          from "./src/assets/logo clientes/logo-lumis.webp";
import logoSeagroSc       from "./src/assets/logo clientes/logo-seagrosc.webp";
import logoBreitkopf      from "./src/assets/logo clientes/logo_grupo-breitkopf_4foiPq.png";
import logoPrecicast      from "./src/assets/logo clientes/precicast.png";
import logoSescoop        from "./src/assets/logo clientes/seescoop.png";
import testimonialVideo1  from "./src/assets/testimonial-video-1.mp4";
import testimonialVideo2  from "./src/assets/testimonial-video-2.mp4";
import instructorAndre from "./src/assets/instructor-andre.jpg";
import instructorCelso from "./src/assets/instructor-celso.jpg";

const phases = [
  {
    tag: "FASE 01",
    title: "Fundamentos, ML e visão estratégica",
    text: "Entenda IA sem hype: transformação digital, Machine Learning, Deep Learning, data centers, GPUs e os players que definem o mercado.",
  },
  {
    tag: "FASE 02",
    title: "LLMs, contexto e engenharia de prompt",
    text: "Domine GPT, Claude, Gemini, tokens, embeddings, janela de contexto, bancos vetoriais e prompting profissional para uso real.",
  },
  {
    tag: "FASE 03",
    title: "Agentes, RAG, MCP e skills",
    text: "Construa agentes com memória, tools, RAG, APIs e skills com Open Claw e Claude Cowork para aplicações de alto nível.",
  },
  {
    tag: "FASE 04",
    title: "Arquitetura e Sistemas com IA",
    text: "Do Vibe code à Engenharia de sistemas assistidos por Inteligência Artificial. Estruture aplicações usando técnicas de Engenharia de Software, PRD, System Design e pensamento de engenharia.",
  },
  {
    tag: "FASE 05",
    title: "Segurança, riscos e futuro",
    text: "Prompt injection, jailbreak, privacidade, LGPD, Physical AI, robótica e tendências que vão redefinir o jogo.",
  },
  {
    tag: "FASE 06",
    title: "Projetos reais e aplicação no mercado",
    text: "Saia com agentes, automações e soluções funcionando — não com teoria esquecível, mas com capacidade aplicada.",
  },
];

const pillars = [
  ["AGENTES", "Da arquitetura ao deploy: memória, RAG, tools, APIs e decisões autônomas."],
  ["AUTOMAÇÕES", "n8n, integrações, workflows e execução prática conectada ao mundo real."],
  ["SISTEMAS", "PRD, design system, system design e engenharia para soluções escaláveis com IA."],
  ["ATUALIZAÇÃO", "Currículo vivo: o programa evolui conforme novas tecnologias entram em cena."],
];

const proof = [
  { text: "2 encontros por semana" },
  { text: "Carga horária mínima de 40 horas" },
  { text: "2 modalidades de acesso", note: "Mensal ou Anual" },
  { text: "Currículo vivo em atualização contínua" },
];

function useTypeSequence(words, speed = 70) {
  const [text, setText] = useState("");
  const wordsRef = useRef(words);

  useEffect(() => {
    const sequence = wordsRef.current;
    let mounted = true;
    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timer;

    const tick = () => {
      if (!mounted) return;
      const current = sequence[wordIndex];

      if (!deleting) {
        charIndex += 1;
        setText(current.slice(0, charIndex));
        if (charIndex === current.length) {
          timer = setTimeout(() => {
            deleting = true;
            tick();
          }, 1400);
          return;
        }
      } else {
        charIndex -= 1;
        setText(current.slice(0, charIndex));
        if (charIndex === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % sequence.length;
        }
      }

      timer = setTimeout(tick, deleting ? 28 : speed);
    };

    timer = setTimeout(tick, 500);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return text;
}

export default function LandingPageMentoriaIA() {
  const terminalText = useTypeSequence([
    "CONTINUOUS LEARNING IN AI",
    "AGENTES DE IA",
    "AUTOMAÇÕES REAIS",
    "ARQUITETURA COM IA",
    "CURRÍCULO VIVO",
  ]);

  const [buyingPlan, setBuyingPlan] = useState(null);

  const handleBuy = async (planId) => {
    if (buyingPlan) return;
    setBuyingPlan(planId);
    try {
      const response = await fetch("/api/pagbank/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.payLink) {
        throw new Error(data?.message || `Erro ${response.status} ao criar pagamento`);
      }
      window.location.href = data.payLink;
    } catch (err) {
      console.error("[PagBank]", err);
      alert("Não foi possível iniciar o pagamento. Tente novamente.");
    } finally {
      setBuyingPlan(null);
    }
  };

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--accent)] selection:text-black"
      style={{
        ["--bg"]: "#060606",
        ["--bg-2"]: "#0b0b0b",
        ["--panel"]: "#101010",
        ["--panel-2"]: "#141414",
        ["--line"]: "rgba(255,255,255,.08)",
        ["--line-strong"]: "rgba(255,255,255,.16)",
        ["--text"]: "#f5f2ea",
        ["--muted"]: "#8b867c",
        ["--accent"]: "#ff6a00",
        ["--accent-soft"]: "rgba(255,106,0,.14)",
        ["--green"]: "#84cc16",
        fontFamily: '"Space Grotesk", "Arial Narrow", sans-serif',
      }}
    >
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
          background-image: radial-gradient(circle at 20% 20%, rgba(255,106,0,.1), transparent 20%),
            radial-gradient(circle at 80% 10%, rgba(255,255,255,.05), transparent 18%),
            radial-gradient(circle at 50% 100%, rgba(255,106,0,.08), transparent 28%);
        }
        @keyframes pulseLine {
          0%,100% { opacity: .28; transform: scaleX(.94); }
          50% { opacity: .9; transform: scaleX(1); }
        }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes glow {
          0%,100% { box-shadow: 0 0 0 rgba(255,106,0,0); }
          50% { box-shadow: 0 0 28px rgba(255,106,0,.22); }
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%,49% { opacity: 1; }
          50%,100% { opacity: 0; }
        }
        .animate-pulseLine { animation: pulseLine 4s ease-in-out infinite; }
        .animate-glow { animation: glow 3.6s ease-in-out infinite; }
        .animate-rise { animation: rise .9s cubic-bezier(.16,1,.3,1) both; }
        .terminal-caret::after {
          content: "_";
          margin-left: 4px;
          color: var(--accent);
          animation: blink .9s step-end infinite;
        }
        .scan-overlay::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,.08), transparent);
          animation: scan 5.5s linear infinite;
          pointer-events: none;
        }
      `}</style>

      <div className="fixed inset-0 pointer-events-none opacity-[0.07] bg-grid-tech" />
      <div className="fixed inset-0 pointer-events-none bg-noise-tech" />

      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <div className="h-3 w-3 bg-[var(--accent)] animate-glow" />
            <div>
              <div className="text-[11px] uppercase tracking-[0.34em] text-[var(--muted)] font-mono-tech">Neural Hub</div>
              <div className="text-xl font-semibold tracking-[-0.04em] text-[var(--text)] md:text-2xl">ZERO-TO-HERO IA</div>
            </div>
          </div>
          <a
            href="#planos"
            className="border border-[var(--line-strong)] bg-[var(--accent)] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.24em] text-black transition hover:brightness-110 active:scale-95 animate-glow"
          >
            Ver planos
          </a>
        </div>
      </header>

      <main>
        <section className="relative min-h-screen overflow-hidden border-b border-[var(--line)]">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1800&q=80"
              alt="Profissionais em ambiente de alta performance aprendendo inteligência artificial"
              className="h-full w-full object-cover opacity-25 grayscale"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(6,6,6,.94)_0%,rgba(6,6,6,.82)_45%,rgba(6,6,6,.45)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(255,106,0,.18),transparent_22%),radial-gradient(circle_at_20%_80%,rgba(255,255,255,.06),transparent_20%)]" />
          </div>

          <div className="relative mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-12">
            <div className="border-b border-[var(--line)] px-4 py-8 lg:col-span-7 lg:border-b-0 lg:border-r lg:px-8 lg:py-10">
              <div className="flex h-full flex-col justify-between">
                <div className="animate-rise">
                  <div className="mb-8 flex items-center gap-4 font-mono-tech text-[11px] uppercase tracking-[0.32em] text-[var(--accent)]">
                    <span>// Mentoria avançada em inteligência artificial</span>
                  </div>
                  <div className="mb-8 h-px w-32 bg-[var(--accent)] animate-pulseLine" />
                  <h1 className="max-w-5xl text-[3.4rem] font-semibold uppercase leading-[0.88] tracking-[-0.06em] text-[var(--text)] md:text-[5.7rem] lg:text-[7.5rem]">
                    Pare de estudar <span className="text-[var(--accent)]">IA</span> como espectador.
                  </h1>
                  <h2 className="mt-4 max-w-4xl text-[1.3rem] uppercase leading-[1.02] tracking-[-0.04em] text-[var(--muted)] md:text-[2.3rem] lg:text-[3rem]">
                    Entre para construir com profundidade, repertório e execução.
                  </h2>
                  <div className="mt-8 max-w-2xl border-l-2 border-[var(--accent)] pl-5 font-mono-tech text-sm leading-7 text-zinc-300 md:text-base">
                    A mentoria que transforma profissionais em gente capaz de criar <span className="text-[var(--text)]">agentes</span>, <span className="text-[var(--text)]">automações</span> e <span className="text-[var(--text)]">soluções reais com IA</span> — acompanhando o mercado em tempo real com um currículo vivo.
                  </div>
                  <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                    <a
                      href="#planos"
                      className="bg-[var(--accent)] px-7 py-4 text-center text-[11px] font-bold uppercase tracking-[0.26em] text-black transition hover:brightness-110 active:scale-95 animate-glow"
                    >
                      Quero entrar na mentoria
                    </a>
                    <a
                      href="#arquitetura"
                      className="border border-[var(--line-strong)] bg-black/30 px-7 py-4 text-center text-[11px] font-bold uppercase tracking-[0.26em] text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] active:scale-95"
                    >
                      Conhecer o currículo
                    </a>
                  </div>
                </div>

                <div className="mt-12 grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-3">
                  {[
                    ["STATUS", "CURRÍCULO VIVO"],
                    ["MODELO", "MENTORIA RECORRENTE"],
                    ["MISSÃO", "FORMAR CONSTRUTORES DE IA"],
                  ].map(([k, v]) => (
                    <div key={k} className="border border-[var(--line)] bg-black/20 p-4">
                      <div className="font-mono-tech text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">{k}</div>
                      <div className="mt-2 text-sm uppercase tracking-[0.08em] text-[var(--text)]">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative lg:col-span-5">
              <div className="scan-overlay absolute inset-0" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.02),transparent_35%,rgba(255,106,0,.03)_100%)]" />
              <div className="relative flex h-full min-h-[560px] flex-col justify-between p-4 md:p-8">
                <div className="flex items-start justify-between">
                  <div className="border border-[var(--line-strong)] bg-black/60 px-3 py-2 font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--text)]">
                    Camada ativa // mercado real
                  </div>
                  <div className="text-[var(--accent)] font-mono-tech text-[11px] uppercase tracking-[0.24em]">[live]</div>
                </div>

                <div className="border border-[var(--line-strong)] bg-[var(--panel)] p-5 md:p-7 animate-glow">
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                    <div>
                      <div className="font-mono-tech text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">Núcleo da mentoria</div>
                      <div className="mt-1 text-lg uppercase tracking-[-0.03em] text-[var(--text)]">Execução orientada</div>
                    </div>
                    <div className="h-2 w-2 bg-[var(--green)]" />
                  </div>

                  <div className="mt-5 space-y-4 font-mono-tech text-sm text-zinc-300">
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                      <span>FOCO</span>
                      <span className="text-[var(--text)]">APLICAÇÃO REAL</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                      <span>FORMATO</span>
                      <span className="text-[var(--text)]">2 ENCONTROS / SEMANA</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                      <span>TRILHA BASE</span>
                      <span className="text-[var(--text)]">40H MÍNIMAS</span>
                    </div>
                    <div className="flex items-center justify-between pb-1">
                      <span>OBJETIVO</span>
                      <span className="text-[var(--accent)] terminal-caret">{terminalText || "_"}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["GPT + Claude + Gemini", "modelos"],
                    ["RAG + MCP + APIs", "arquitetura"],
                    ["n8n + WhatsApp + e-mail", "automações"],
                    ["Open Claw + Skills", "execução"],
                  ].map(([a, b]) => (
                    <div key={a} className="border border-[var(--line)] bg-black/30 p-4">
                      <div className="text-[10px] font-mono-tech uppercase tracking-[0.22em] text-[var(--muted)]">{b}</div>
                      <div className="mt-2 text-sm uppercase leading-6 text-[var(--text)]">{a}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--line)] bg-[var(--bg)]">
          <div className="mx-auto grid max-w-[1600px] grid-cols-1 md:grid-cols-4">
            {pillars.map(([title, desc], index) => (
              <div key={title} className="min-h-[280px] border-b border-[var(--line)] p-6 md:border-b-0 md:border-r md:p-8">
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <div className="font-mono-tech text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">FIG. 0{index + 1}</div>
                    <h3 className="mt-5 text-2xl uppercase leading-none tracking-[-0.04em] text-[var(--text)] md:text-3xl">{title}</h3>
                    <p className="mt-4 max-w-sm font-mono-tech text-sm leading-7 text-[var(--muted)]">{desc}</p>
                  </div>
                  <div className="mt-8 h-px w-full bg-[var(--line-strong)]" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="arquitetura" className="border-b border-[var(--line)] bg-[var(--bg-2)]">
          <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
            <div className="flex flex-col gap-6 border-b border-[var(--line)] pb-10 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--accent)]">// Arquitetura do programa</div>
                <h3 className="mt-4 max-w-5xl text-4xl uppercase leading-[0.92] tracking-[-0.05em] text-[var(--text)] md:text-6xl">
                  Não é um curso. É uma máquina de evolução profissional em IA.
                </h3>
              </div>
              <p className="max-w-xl font-mono-tech text-sm leading-7 text-[var(--muted)] md:text-right">
                O conteúdo nasce da ementa avançada do programa e cobre LLMs, agentes, skills, n8n, arquitetura, segurança e projetos aplicados ao mercado.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 border border-[var(--line)]">
              <div className="lg:col-span-3 border-b border-[var(--line)] bg-black/30 p-6 lg:border-b-0 lg:border-r md:p-8">
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">Pipeline ativo</div>
                <h4 className="mt-6 text-3xl uppercase leading-none tracking-[-0.04em] text-[var(--text)] md:text-4xl">
                  Do zero ao construtor de soluções.
                </h4>
                <p className="mt-5 font-mono-tech text-sm leading-7 text-[var(--muted)]">
                  Cada fase foi desenhada para tirar o aluno do consumo passivo e levá-lo para a construção de soluções práticas com IA, em uma trilha que continua sendo atualizada.
                </p>
              </div>

              <div className="lg:col-span-9 bg-[var(--panel)]">
                {phases.map((item, index) => (
                  <div key={item.tag} className={`grid grid-cols-1 border-b border-[var(--line)] md:grid-cols-[160px_1fr] ${index === phases.length - 1 ? 'border-b-0' : ''}`}>
                    <div className="border-b border-[var(--line)] p-6 font-mono-tech text-[11px] uppercase tracking-[0.24em] text-[var(--accent)] md:border-b-0 md:border-r md:p-8">
                      {item.tag}
                    </div>
                    <div className="p-6 md:p-8">
                      <h5 className="text-2xl uppercase tracking-[-0.03em] text-[var(--text)] md:text-3xl">{item.title}</h5>
                      <p className="mt-3 max-w-4xl font-mono-tech text-sm leading-7 text-[var(--muted)] md:text-[15px]">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--line)] bg-[var(--bg)]">
          <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
            <div className="grid grid-cols-1 gap-0 border border-[var(--line)] lg:grid-cols-12">
              <div className="border-b border-[var(--line)] bg-[var(--panel)] p-6 lg:col-span-8 lg:border-b-0 lg:border-r md:p-10">
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--accent)]">// Mecanismo único</div>
                <h3 className="mt-4 text-4xl uppercase leading-[0.92] tracking-[-0.05em] text-[var(--text)] md:text-6xl">
                  Currículo vivo.
                  <span className="block text-zinc-600">Mercado em movimento. Você também.</span>
                </h3>
                <p className="mt-6 max-w-3xl font-mono-tech text-sm leading-8 text-[var(--muted)] md:text-[15px]">
                  Enquanto cursos tradicionais envelhecem, a mentoria acompanha novas ferramentas, novos modelos, novas arquiteturas e novas aplicações práticas. Você não compra um pacote fechado. Você entra em um ambiente que se atualiza junto com o mercado.
                </p>
              </div>
              <div className="bg-black/40 p-6 lg:col-span-4 md:p-10">
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">Sinais de operação</div>
                <div className="mt-6 space-y-5">
                  {[
                    ["Novos modelos", "GPTs, Claude, Gemini e o que realmente importa usar"],
                    ["Novas práticas", "Arquiteturas, automações, skills e frameworks atuais"],
                    ["Novos casos", "Aplicação real em negócio, atendimento, marketing e operação"],
                  ].map(([title, desc]) => (
                    <div key={title} className="border border-[var(--line)] bg-[var(--panel-2)] p-4">
                      <div className="text-sm uppercase tracking-[0.12em] text-[var(--text)]">{title}</div>
                      <div className="mt-2 font-mono-tech text-xs leading-6 text-[var(--muted)]">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="planos" className="border-b border-[var(--line)] bg-[var(--bg-2)]">
          <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
            <div className="flex flex-col gap-6 border-b border-[var(--line)] pb-10 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--accent)]">// Planos de acesso</div>
                <h3 className="mt-4 max-w-4xl text-4xl uppercase leading-[0.92] tracking-[-0.05em] text-[var(--text)] md:text-6xl">
                  Escolha o formato que faz sentido para você.
                </h3>
              </div>
              <p className="max-w-xl font-mono-tech text-sm leading-7 text-[var(--muted)]">
                Evolução de verdade não acontece em fim de semana de workshop. Ela acontece em rotina, repertório e construção orientada — com a flexibilidade do plano que você escolher.
              </p>
            </div>

            {/* Stats gerais */}
            <div className="mt-10 grid grid-cols-1 gap-0 border border-[var(--line)] md:grid-cols-2 lg:grid-cols-4">
              {proof.map((item, index) => (
                <div key={item.text} className="min-h-[220px] border-b border-[var(--line)] bg-black/30 p-6 md:p-8 lg:border-b-0 lg:border-r last:lg:border-r-0">
                  <div className="font-mono-tech text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">0{index + 1}</div>
                  <div className="mt-6 text-3xl uppercase leading-[1.02] tracking-[-0.04em] text-[var(--text)]">{item.text}</div>
                  {item.note && (
                    <div className="mt-3 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">{item.note}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Cards de planos */}
            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">

              {/* Plano Mensal */}
              <div className="relative border border-[var(--line)] bg-[var(--panel)] p-8 flex flex-col gap-6">
                <div>
                  <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--muted)]">// Plano 01</div>
                  <div className="mt-3 text-3xl uppercase font-semibold tracking-[-0.04em] text-[var(--text)]">Mensal</div>
                  <div className="mt-1 font-mono-tech text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Flexibilidade máxima</div>
                </div>

                <div className="border border-[var(--line)] bg-black/30 p-5">
                  <div className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">Investimento</div>
                  <div className="mt-2 text-5xl font-bold uppercase tracking-[-0.05em] text-[var(--text)]">
                    R$ 497<span className="text-xl font-normal text-[var(--muted)]">,00/mês</span>
                  </div>
                  <div className="mt-2 font-mono-tech text-xs text-[var(--muted)]">1º lote · 30 vagas · válido até 03/04/2026</div>
                </div>

                <div className="space-y-3">
                  {[
                    ["Acesso", "Recorrente mensal — cancele quando quiser"],
                    ["Cancelamento", "Com 30 dias de antecedência"],
                    ["Encontros", "2 sessões ao vivo por semana"],
                    ["Currículo", "Sempre atualizado conforme o mercado"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-3">
                      <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] shrink-0">{k}</span>
                      <span className="font-mono-tech text-[11px] text-right text-[var(--text)]">{v}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleBuy("mensal")}
                  disabled={!!buyingPlan}
                  className="mt-auto border border-[var(--line-strong)] bg-black/40 px-6 py-4 text-center text-[11px] font-bold uppercase tracking-[0.26em] text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {buyingPlan === "mensal" ? "Aguarde..." : "Assinar plano mensal"}
                </button>
              </div>

              {/* Plano Anual */}
              <div className="relative border border-[var(--accent)] bg-[var(--panel)] p-8 flex flex-col gap-6">
                {/* Badge destaque */}
                <div className="absolute -top-3 left-8">
                  <div className="bg-[var(--accent)] px-3 py-1 font-mono-tech text-[10px] uppercase tracking-[0.24em] text-black font-bold">
                    Melhor custo-benefício
                  </div>
                </div>

                <div>
                  <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--accent)]">// Plano 02</div>
                  <div className="mt-3 text-3xl uppercase font-bold tracking-[-0.04em] text-[var(--text)]">Anual</div>
                  <div className="mt-1 font-mono-tech text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Compromisso com resultado</div>
                </div>

                <div className="border border-[var(--accent)]/40 bg-[var(--accent-soft)] p-5">
                  <div className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">Investimento</div>
                  <div className="mt-2 text-5xl font-bold uppercase tracking-[-0.05em] text-[var(--text)]">
                    R$ 316<span className="text-xl font-normal text-[var(--muted)]">,11/mês</span>
                  </div>
                  <div className="mt-2 font-mono-tech text-xs text-[var(--accent)]">12x de R$ 316,11 — ou R$ 3.561,40 à vista</div>
                  <div className="mt-1 font-mono-tech text-[10px] text-[var(--muted)]">Economia de ~36% em relação ao mensal</div>
                </div>

                <div className="space-y-3">
                  {[
                    ["Acesso", "12 meses de mentoria completa"],
                    ["Cancelamento", "Apenas nos primeiros 7 dias após a contratação"],
                    ["Encontros", "2 sessões ao vivo por semana"],
                    ["Currículo", "Sempre atualizado conforme o mercado"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-3">
                      <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] shrink-0">{k}</span>
                      <span className="font-mono-tech text-[11px] text-right text-[var(--text)]">{v}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleBuy("anual")}
                  disabled={!!buyingPlan}
                  className="mt-auto border border-[var(--accent)] bg-[var(--accent)] px-6 py-4 text-center text-[11px] font-bold uppercase tracking-[0.26em] text-black transition hover:brightness-110 animate-glow active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {buyingPlan === "anual" ? "Aguarde..." : "Assinar plano anual"}
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* ── INSTRUTORES ── */}
        <section id="instrutores" className="border-b border-[var(--line)] bg-[var(--bg)]">
          <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
            <div className="flex flex-col gap-6 border-b border-[var(--line)] pb-10 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--accent)]">// Quem está na linha de frente</div>
                <h3 className="mt-4 max-w-4xl text-4xl uppercase leading-[0.92] tracking-[-0.05em] text-[var(--text)] md:text-6xl">
                  Instrutores com repertório real.
                </h3>
              </div>
              <p className="max-w-xl font-mono-tech text-sm leading-7 text-[var(--muted)]">
                Profissionais que atuam no mercado, constroem soluções e passam o que funciona de verdade — não teoria de sala de aula.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-0 border border-[var(--line)] lg:grid-cols-2">
              {/* André Cardia */}
              <div className="border-b border-[var(--line)] bg-[var(--panel)] p-6 lg:border-b-0 lg:border-r md:p-10">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <div className="relative flex-shrink-0">
                    <div className="h-[120px] w-[120px] overflow-hidden border border-[var(--line-strong)]">
                      <img
                        src={instructorAndre}
                        alt="André Cardia — Especialista em Ciência de Dados e Inteligência Artificial"
                        className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                        onError={(e) => { e.target.style.display='none'; e.target.parentElement.style.background='#1a1a1a'; }}
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-[var(--accent)]" />
                  </div>
                  <div className="flex-1">
                    <div className="font-mono-tech text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">Instrutor 01</div>
                    <h4 className="mt-2 text-2xl uppercase tracking-[-0.03em] text-[var(--text)] md:text-3xl">André Cardia</h4>
                    <div className="mt-1 font-mono-tech text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      Especialista em Ciência de Dados & IA
                    </div>
                  </div>
                </div>

                <p className="mt-6 font-mono-tech text-sm leading-7 text-[var(--muted)]">
                  Pós-graduado em Ciência de Dados e Inteligência Artificial. Certificado pela <span className="text-[var(--text)]">NVIDIA</span> em Deep Learning e Redes Neurais Profundas, e pela <span className="text-[var(--text)]">CISCO</span> como CCNA — combinando expertise em IA de ponta com sólida base em infraestrutura tecnológica.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ["Letramento em IA", "Abstrato Ventures, FreedomAI e Inovation Center"],
                    ["Instrutor de IA", "CDL Florianópolis, AEMFLO São José e ACIC Criciúma"],
                    ["Docência", "Professor de pós-graduação em Informática para Gestão Pública"],
                    ["12+ anos", "Professor de Informática para Concursos Públicos"],
                  ].map(([tag, desc]) => (
                    <div key={tag} className="border border-[var(--line)] bg-black/30 p-4">
                      <div className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">{tag}</div>
                      <div className="mt-2 font-mono-tech text-xs leading-5 text-[var(--muted)]">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Celso Ferreira */}
              <div className="bg-[var(--panel-2)] p-6 md:p-10">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <div className="relative flex-shrink-0">
                    <div className="h-[120px] w-[120px] overflow-hidden border border-[var(--line-strong)]">
                      <img
                        src={instructorCelso}
                        alt="Celso Ferreira — CTO e Especialista em IA e Desenvolvimento de Plataformas"
                        className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                        onError={(e) => { e.target.style.display='none'; e.target.parentElement.style.background='#1a1a1a'; }}
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-[var(--accent)]" />
                  </div>
                  <div className="flex-1">
                    <div className="font-mono-tech text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">Instrutor 02</div>
                    <h4 className="mt-2 text-2xl uppercase tracking-[-0.03em] text-[var(--text)] md:text-3xl">Celso Ferreira</h4>
                    <div className="mt-1 font-mono-tech text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      CTO & Especialista em IA e Desenvolvimento de Plataformas
                    </div>
                  </div>
                </div>

                <p className="mt-6 font-mono-tech text-sm leading-7 text-[var(--muted)]">
                  Idealizador e desenvolvedor da <span className="text-[var(--text)]">Pulsemind</span>, plataforma de IA generativa que integra texto, imagem, áudio e vídeo em fluxos inteligentes para empresas e equipes de marketing. Como <span className="text-[var(--text)]">CTO da C4 Marketing</span>, lidera iniciativas de inovação tecnológica, arquitetura de sistemas e implementação de soluções avançadas com LLMs e agentes autônomos.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ["CTO", "C4 Marketing — arquitetura, automações corporativas e LLMs"],
                    ["Pulsemind", "Plataforma de IA generativa: texto, imagem, áudio e vídeo"],
                    ["15+ anos", "Desenvolvimento de produtos digitais e soluções SaaS em nuvem"],
                    ["Consultor & Instrutor", "IA aplicada a negócios, APIs, UX e agentes autônomos"],
                  ].map(([tag, desc]) => (
                    <div key={tag} className="border border-[var(--line)] bg-black/30 p-4">
                      <div className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">{tag}</div>
                      <div className="mt-2 font-mono-tech text-xs leading-5 text-[var(--muted)]">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOTOS DOS TREINAMENTOS ── */}
        <section id="treinamentos" className="border-b border-[var(--line)] bg-[var(--panel)]">
          <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
            <div className="flex flex-col gap-6 border-b border-[var(--line)] pb-10 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--accent)]">// Acontece de verdade</div>
                <h3 className="mt-4 max-w-4xl text-4xl uppercase leading-[0.92] tracking-[-0.05em] text-[var(--text)] md:text-6xl">
                  Salas cheias. Redes reais.
                </h3>
              </div>
              <p className="max-w-sm font-mono-tech text-sm leading-7 text-[var(--muted)]">
                Treinamentos realizados presencialmente em empresas, associações e centros de inovação em todo o Brasil.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {[
                { src: training01, alt: "Turma de treinamento em IA" },
                { src: training02, alt: "Treinamento corporativo AMCHAM" },
                { src: training03, alt: "IA para líderes — Sistema OCESC" },
                { src: training04, alt: "Seminário Vender — Técnicas de Vendas com IA" },
                { src: training05, alt: "Treinamento corporativo BAESA" },
                { src: training06, alt: "Capacitação em Inteligência Artificial" },
                { src: training07, alt: "Workshop de IA aplicada" },
                { src: training08, alt: "Treinamento corporativo em IA" },
                { src: training09, alt: "Programa de formação em IA" },
                { src: training10, alt: "Evento de capacitação empresarial" },
              ].map((img, i) => (
                <div
                  key={i}
                  className={`group relative overflow-hidden border border-[var(--line)] ${
                    i === 0 ? "col-span-2 row-span-2" : ""
                  }`}
                  style={{ aspectRatio: i === 0 ? "auto" : "4/3" }}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-white/90">{img.alt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── EMPRESAS ATENDIDAS ── */}
        <section id="empresas" className="border-b border-[var(--line)] bg-[var(--bg)]">
          <style>{`
            @keyframes marquee {
              0%   { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .marquee-track {
              display: flex;
              width: max-content;
              animation: marquee 28s linear infinite;
            }
            .marquee-track:hover { animation-play-state: paused; }
            @keyframes logoFadeIn {
              from { opacity: 0; transform: translateY(16px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            .logo-card {
              animation: logoFadeIn 0.5s cubic-bezier(.16,1,.3,1) both;
            }
          `}</style>

          <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
            {/* Cabeçalho da seção */}
            <div className="flex flex-col gap-6 border-b border-[var(--line)] pb-10 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--accent)]">// Quem já passou por aqui</div>
                <h3 className="mt-4 max-w-4xl text-4xl uppercase leading-[0.92] tracking-[-0.05em] text-[var(--text)] md:text-6xl">
                  +40 organizações treinadas.
                </h3>
              </div>
              <p className="max-w-sm font-mono-tech text-sm leading-7 text-[var(--muted)]">
                De startups a empresas do Sistema S, do agronegócio ao setor público — a metodologia funciona em qualquer contexto.
              </p>
            </div>

            {/* Grid estático com logos individuais */}
            <div className="mt-10 border border-[var(--line)] bg-[var(--panel)]">

              {/* Header do painel */}
              <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-3">
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--muted)]">Parceiros & organizações</div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
                  <span className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">15 registros</span>
                </div>
              </div>

              {/* Grid de logos — grayscale → colorido no hover */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {[
                  { src: logoBeiramar,   alt: "Beiramar Shopping" },
                  { src: logoAemflo,     alt: "AEMFLO" },
                  { src: logoBaesa,      alt: "BAESA" },
                  { src: logoCdl,        alt: "CDL" },
                  { src: logoEnercan,    alt: "Enercan" },
                  { src: logoFordDimas,  alt: "Ford Dimas" },
                  { src: logoLive,       alt: "LIVE!" },
                  { src: logoCdlPalhoca, alt: "CDL Palhoça" },
                  { src: logoCidasc,     alt: "CIDASC" },
                  { src: logoCredcrea,   alt: "CREDCREA" },
                  { src: logoLumis,      alt: "Lumis" },
                  { src: logoSeagroSc,   alt: "SEAGRO-SC" },
                  { src: logoBreitkopf,  alt: "Grupo Breitkopf" },
                  { src: logoPrecicast,  alt: "PRECICAST" },
                  { src: logoSescoop,    alt: "SESCOOP/SC" },
                ].map(({ src, alt }, i) => (
                  <div
                    key={alt}
                    className="logo-card group relative flex items-center justify-center border-b border-r border-[var(--line)] bg-black/10 p-6 transition-all duration-300 hover:bg-[var(--panel-2)] hover:border-[var(--accent)]/40 cursor-default"
                    style={{ animationDelay: `${i * 55}ms` }}
                    title={alt}
                  >
                    {/* Scan line no hover */}
                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,106,0,0.04)_50%,transparent_100%)]" />

                    <img
                      src={src}
                      alt={alt}
                      loading="lazy"
                      className="h-20 w-auto max-w-[192px] object-contain grayscale brightness-150 contrast-75
                                 transition-all duration-500 ease-out
                                 group-hover:grayscale-0 group-hover:brightness-100 group-hover:contrast-100
                                 group-hover:scale-110"
                    />

                    {/* Tooltip nome */}
                    <div className="absolute -bottom-px left-0 right-0 h-px scale-x-0 bg-[var(--accent)] transition-transform duration-300 origin-left group-hover:scale-x-100" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap font-mono-tech text-[9px] uppercase tracking-[0.2em] text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-black/90 px-2 py-1 border border-[var(--accent)]/30">
                      {alt}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Marquee animado — faixa de logos em loop */}
            <div className="mt-6 border border-[var(--line)] bg-[var(--panel-2)] overflow-hidden">
              <div className="flex items-center border-b border-[var(--line)] px-6 py-3">
                <div className="mr-3 h-1.5 w-1.5 bg-[var(--accent)] animate-glow" />
                <span className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--muted)]">// stream de parceiros — ao vivo</span>
              </div>
              <div className="relative py-5 overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
                <div className="marquee-track gap-10 items-center px-6">
                  {/* Duplicado para loop contínuo */}
                  {[
                    { src: logoBeiramar, alt: "Beiramar" },
                    { src: logoAemflo,   alt: "AEMFLO" },
                    { src: logoBaesa,    alt: "BAESA" },
                    { src: logoCdl,      alt: "CDL" },
                    { src: logoEnercan,  alt: "Enercan" },
                    { src: logoFordDimas,alt: "Ford Dimas" },
                    { src: logoLive,     alt: "LIVE!" },
                    { src: logoCidasc,   alt: "CIDASC" },
                    { src: logoCredcrea, alt: "CREDCREA" },
                    { src: logoLumis,    alt: "Lumis" },
                    { src: logoSeagroSc, alt: "SEAGRO-SC" },
                    { src: logoBreitkopf,alt: "Breitkopf" },
                    { src: logoPrecicast,alt: "PRECICAST" },
                    { src: logoSescoop,  alt: "SESCOOP" },
                    { src: logoCdlPalhoca,alt: "CDL Palhoça" },
                    // — cópia para seamless loop
                    { src: logoBeiramar, alt: "Beiramar-2" },
                    { src: logoAemflo,   alt: "AEMFLO-2" },
                    { src: logoBaesa,    alt: "BAESA-2" },
                    { src: logoCdl,      alt: "CDL-2" },
                    { src: logoEnercan,  alt: "Enercan-2" },
                    { src: logoFordDimas,alt: "Ford Dimas-2" },
                    { src: logoLive,     alt: "LIVE!-2" },
                    { src: logoCidasc,   alt: "CIDASC-2" },
                    { src: logoCredcrea, alt: "CREDCREA-2" },
                    { src: logoLumis,    alt: "Lumis-2" },
                    { src: logoSeagroSc, alt: "SEAGRO-SC-2" },
                    { src: logoBreitkopf,alt: "Breitkopf-2" },
                    { src: logoPrecicast,alt: "PRECICAST-2" },
                    { src: logoSescoop,  alt: "SESCOOP-2" },
                    { src: logoCdlPalhoca,alt: "CDL Palhoça-2" },
                  ].map(({ src, alt }) => (
                    <div key={alt} className="group shrink-0 flex items-center justify-center w-48">
                      <img
                        src={src}
                        alt={alt.replace(/-2$/, "")}
                        loading="lazy"
                        className="h-16 w-auto max-w-[192px] object-contain grayscale brightness-150 contrast-75 opacity-70
                                   transition-all duration-400 group-hover:grayscale-0 group-hover:brightness-100 group-hover:contrast-100 group-hover:opacity-100 group-hover:scale-110"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── DEPOIMENTOS ── */}
        <section id="depoimentos" className="border-b border-[var(--line)] bg-[var(--panel)]">
          <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
            <div className="flex flex-col gap-6 border-b border-[var(--line)] pb-10 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--accent)]">// A voz de quem passou pelo processo</div>
                <h3 className="mt-4 max-w-4xl text-4xl uppercase leading-[0.92] tracking-[-0.05em] text-[var(--text)] md:text-6xl">
                  O que nossos alunos dizem.
                </h3>
              </div>
              <p className="max-w-sm font-mono-tech text-sm leading-7 text-[var(--muted)]">
                Sem roteiro ensaiado. Quem aprendeu fala por si.
              </p>
            </div>
            {/* vídeo 1: vertical (9/16) | vídeo 2: horizontal (16/9) */}
            <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-start">
              {/* ── vídeo vertical ── */}
              <div className="border border-[var(--line)] bg-black lg:w-[320px] shrink-0">
                <div className="border-b border-[var(--line)] px-4 py-2 flex items-center gap-3">
                  <div className="h-2 w-2 bg-[var(--accent)]" />
                  <span className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">Depoimento 01</span>
                </div>
                <video
                  src={testimonialVideo1}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full aspect-[9/16] object-cover"
                />
              </div>

              {/* ── vídeo horizontal ── */}
              <div className="border border-[var(--line)] bg-black flex-1">
                <div className="border-b border-[var(--line)] px-4 py-2 flex items-center gap-3">
                  <div className="h-2 w-2 bg-[var(--accent)]" />
                  <span className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">Depoimento 02</span>
                </div>
                <video
                  src={testimonialVideo2}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full aspect-video object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="acesso" className="relative overflow-hidden bg-[var(--accent)] text-black">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.14),transparent_32%,rgba(0,0,0,.08)_100%)]" />
          <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
            <div className="grid grid-cols-1 gap-0 border border-black/20 bg-black/5 lg:grid-cols-12">
              <div className="border-b border-black/15 p-6 lg:col-span-8 lg:border-b-0 lg:border-r md:p-10">
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-black/70">// Chamada final</div>
                <h3 className="mt-4 max-w-5xl text-4xl uppercase leading-[0.92] tracking-[-0.05em] md:text-7xl">
                  O mercado não precisa de mais curiosos em IA.
                  <span className="block text-black/60">Precisa de gente que sabe construir.</span>
                </h3>
                <p className="mt-6 max-w-3xl font-mono-tech text-sm leading-8 text-black/75 md:text-[15px]">
                  Entre na Mentoria Zero-to-Hero IA e comece a desenvolver a competência que separa quem apenas testa ferramentas de quem cria agentes, automações e soluções que geram valor de verdade.
                </p>
              </div>
              <div className="p-6 md:p-10 lg:col-span-4">
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.24em] text-black/70">// Próxima turma</div>
                <div className="mt-2 text-2xl font-bold uppercase leading-tight tracking-[-0.03em]">14 de abril de 2026</div>

                {/* Plano Mensal */}
                <div className="mt-5 border border-black/25 bg-black/10 p-4">
                  <div className="font-mono-tech text-[10px] uppercase tracking-[0.24em] text-black/60">Plano Mensal · 1º lote</div>
                  <div className="mt-1 text-3xl font-bold uppercase tracking-[-0.03em]">R$ 497,00<span className="text-base font-normal">/mês</span></div>
                  <div className="mt-2 font-mono-tech text-xs leading-5 text-black/70">
                    Válido até <strong>03/04/2026</strong> ou ao encerrar as primeiras <strong>30 vagas</strong>.
                    Cancelamento com 30 dias de antecedência.
                  </div>
                </div>

                <button
                  onClick={() => handleBuy("mensal")}
                  disabled={!!buyingPlan}
                  className="mt-3 block w-full border border-black bg-black px-6 py-4 text-center text-[11px] font-bold uppercase tracking-[0.26em] text-[var(--text)] transition hover:bg-transparent hover:text-black active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {buyingPlan === "mensal" ? "Aguarde..." : "Assinar mensal"}
                </button>

                {/* Plano Anual */}
                <div className="mt-5 border-2 border-black/50 bg-black/20 p-4 relative">
                  <div className="absolute -top-3 right-4 bg-black px-2 py-0.5 font-mono-tech text-[9px] uppercase tracking-[0.2em] text-[var(--accent)] font-bold">Mais econômico</div>
                  <div className="font-mono-tech text-[10px] uppercase tracking-[0.24em] text-black/60">Plano Anual · 12 meses</div>
                  <div className="mt-1 text-3xl font-bold uppercase tracking-[-0.03em]">R$ 316,11<span className="text-base font-normal">/mês</span></div>
                  <div className="mt-1 font-mono-tech text-xs font-bold text-black/80">ou R$ 3.561,40 à vista</div>
                  <div className="mt-2 font-mono-tech text-xs leading-5 text-black/70">
                    Cancela em até <strong>7 dias</strong> após a contratação.
                  </div>
                </div>

                <button
                  onClick={() => handleBuy("anual")}
                  disabled={!!buyingPlan}
                  className="mt-3 block w-full border-2 border-black bg-transparent px-6 py-4 text-center text-[11px] font-bold uppercase tracking-[0.26em] text-black transition hover:bg-black/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {buyingPlan === "anual" ? "Aguarde..." : "Assinar anual"}
                </button>

                <a
                  href="https://wa.me/5548988549556?text=Quero%20mais%20informa%C3%A7%C3%B5es%20sobre%20a%20mentoria%20cont%C3%ADnua%20de%20IA"
                  className="mt-3 block border border-black/30 px-6 py-4 text-center text-[11px] font-bold uppercase tracking-[0.26em] text-black transition hover:border-black hover:bg-black/5 active:scale-95"
                >
                  Falar com a equipe
                </a>

                <div className="mt-6 font-mono-tech text-xs leading-6 text-black/70">
                  Neural Hub<br />
                  Mentoria recorrente em grupo<br />
                  Parque São Jorge, Florianópolis + online<br />
                  Apoio: Innovation Center
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

