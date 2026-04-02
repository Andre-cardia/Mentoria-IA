import { useState, useRef, useEffect } from "react";
import { supabase } from "./src/lib/supabase.js";

const ESCOLARIDADE = [
  "Ensino Médio Completo",
  "Graduação em andamento",
  "Graduação Completa",
  "Pós-graduação / MBA",
  "Mestrado ou Doutorado",
];

const RAMO = [
  "Tecnologia / TI",
  "Marketing / Comunicação",
  "Vendas / Comercial",
  "Gestão / Administração",
  "Educação",
  "Saúde",
  "Jurídico / Direito",
  "Finanças / Contabilidade",
  "Engenharia",
  "Outro",
];

const BENEFITS = [
  [
    "Preço do 1º lote garantido",
    "Ao se cadastrar, você congela R$ 497,00/mês antes do encerramento das 30 primeiras vagas ou do dia 03/04.",
  ],
  [
    "Grupo exclusivo no WhatsApp",
    "Acesso imediato à comunidade ativa de alunos — tire dúvidas, troque experiências e construa sua rede antes mesmo de começar.",
  ],
  [
    "Acesso direto aos instrutores",
    "André Cardia e Celso Ferreira presentes ao vivo, duas vezes por semana. Nada de suporte automatizado.",
  ],
  [
    "Currículo que evolui com o mercado",
    "O programa se atualiza continuamente com novos modelos, arquiteturas e ferramentas. Você nunca fica defasado.",
  ],
];

function useCountUp(target, duration = 1800, startDelay = 400) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = null;
    let frame;
    const delay = setTimeout(() => {
      const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        setCount(Math.floor(progress * target));
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, startDelay);
    return () => { clearTimeout(delay); cancelAnimationFrame(frame); };
  }, [target, duration, startDelay]);
  return count;
}

export default function LeadCaptureMentoriaIA() {
  const [form, setForm] = useState({
    nome: "", sobrenome: "", email: "", whatsapp: "",
    escolaridade: "", ramo: "", empresa: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const formRef = useRef(null);

  const alunos = useCountUp(140);
  const empresas = useCountUp(40);

  const validate = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = "Obrigatório";
    if (!form.sobrenome.trim()) e.sobrenome = "Obrigatório";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "E-mail inválido";
    if (!form.whatsapp.trim()) e.whatsapp = "Obrigatório";
    if (!form.escolaridade) e.escolaridade = "Selecione uma opção";
    if (!form.ramo) e.ramo = "Selecione uma opção";
    if (!form.empresa.trim()) e.empresa = "Obrigatório";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setSubmitError(null);

    const { error } = await supabase.from("leads").insert([{
      nome: form.nome.trim(),
      sobrenome: form.sobrenome.trim(),
      email: form.email.trim().toLowerCase(),
      whatsapp: form.whatsapp.trim(),
      escolaridade: form.escolaridade,
      ramo: form.ramo,
      empresa: form.empresa.trim(),
      lote: "1",
    }]);

    setLoading(false);

    if (error) {
      console.error("Supabase insert error:", error);
      setSubmitError("Ocorreu um erro ao salvar seu cadastro. Tente novamente ou entre em contato pelo WhatsApp.");
      return;
    }

    setSubmitted(true);
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cssVars = {
    "--bg": "#060606",
    "--bg-2": "#0b0b0b",
    "--panel": "#101010",
    "--panel-2": "#141414",
    "--line": "rgba(255,255,255,.08)",
    "--line-strong": "rgba(255,255,255,.16)",
    "--text": "#f5f2ea",
    "--muted": "#8b867c",
    "--accent": "#ff6a00",
    "--green": "#84cc16",
    fontFamily: '"Space Grotesk", "Arial Narrow", sans-serif',
  };

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--accent)] selection:text-black"
      style={cssVars}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
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
        @keyframes pulseLine {
          0%,100% { opacity: .28; transform: scaleX(.94); }
          50% { opacity: .9; transform: scaleX(1); }
        }
        @keyframes glow {
          0%,100% { box-shadow: 0 0 0 rgba(255,106,0,0); }
          50% { box-shadow: 0 0 28px rgba(255,106,0,.22); }
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes progressFill {
          from { width: 0%; }
          to { width: 73%; }
        }
        .animate-pulseLine { animation: pulseLine 4s ease-in-out infinite; }
        .animate-glow { animation: glow 3.6s ease-in-out infinite; }
        .animate-rise { animation: rise .9s cubic-bezier(.16,1,.3,1) both; }
        .animate-rise-2 { animation: rise .9s cubic-bezier(.16,1,.3,1) .15s both; }
        .animate-rise-3 { animation: rise .9s cubic-bezier(.16,1,.3,1) .3s both; }
        .animate-fade { animation: fadeIn .6s ease both; }
        .scan-overlay::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,.06), transparent);
          animation: scan 6s linear infinite;
          pointer-events: none;
        }
        .progress-bar { animation: progressFill 1.6s cubic-bezier(.16,1,.3,1) .6s both; }
        input[type="text"], input[type="email"], input[type="tel"], select {
          -webkit-appearance: none;
          appearance: none;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #101010 inset !important;
          -webkit-text-fill-color: #f5f2ea !important;
          caret-color: #f5f2ea;
        }
      `}</style>

      <div className="fixed inset-0 pointer-events-none opacity-[0.07] bg-grid-tech" />
      <div className="fixed inset-0 pointer-events-none bg-noise-tech" />

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 md:px-8">
          <a href="/" className="flex items-center gap-4">
            <div className="h-3 w-3 bg-[var(--accent)] animate-glow" />
            <div>
              <div className="text-[11px] uppercase tracking-[0.34em] text-[var(--muted)] font-mono-tech">Neural Hub</div>
              <div className="text-xl font-semibold tracking-[-0.04em] text-[var(--text)] md:text-2xl">ZERO-TO-HERO IA</div>
            </div>
          </a>
          <button
            onClick={scrollToForm}
            className="border border-[var(--line-strong)] bg-[var(--accent)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-black transition hover:brightness-110"
          >
            Garantir vaga
          </button>
        </div>
      </header>

      <main>
        {/* ── HERO ── */}
        <section className="relative min-h-screen overflow-hidden border-b border-[var(--line)]">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1800&q=80"
              alt="Ambiente de aprendizado de IA de alta performance"
              className="h-full w-full object-cover opacity-20 grayscale"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(6,6,6,.96)_0%,rgba(6,6,6,.84)_48%,rgba(6,6,6,.5)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(255,106,0,.2),transparent_24%),radial-gradient(circle_at_18%_82%,rgba(255,255,255,.05),transparent_20%)]" />
          </div>

          <div className="relative mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-12">
            {/* Left */}
            <div className="flex flex-col justify-center border-b border-[var(--line)] px-4 py-16 lg:col-span-7 lg:border-b-0 lg:border-r lg:px-8 lg:py-20">
              <div className="animate-rise">
                <div className="mb-6 flex items-center gap-4 font-mono-tech text-[11px] uppercase tracking-[0.32em] text-[var(--accent)]">
                  <div className="h-1.5 w-1.5 bg-[var(--accent)] animate-glow" />
                  <span>// Turma · Abril 2026 · Vagas limitadas</span>
                </div>
                <div className="mb-6 h-px w-24 bg-[var(--accent)] animate-pulseLine" />
                <h1 className="max-w-4xl text-[3rem] font-semibold uppercase leading-[0.88] tracking-[-0.06em] text-[var(--text)] md:text-[5rem] lg:text-[6.4rem]">
                  O mercado não espera.<br />
                  <span className="text-[var(--accent)]">Você vai construir</span><br />
                  ou vai ficar assistindo?
                </h1>
                <p className="mt-6 max-w-2xl border-l-2 border-[var(--accent)] pl-5 font-mono-tech text-sm leading-7 text-zinc-300 md:text-base">
                  A Mentoria Zero-to-Hero IA começa em <strong className="text-[var(--text)]">14 de abril de 2026</strong>. O 1º lote tem apenas <strong className="text-[var(--text)]">30 vagas</strong> ao preço de <strong className="text-[var(--text)]">R$ 497,00/mês</strong>, válido até 03/04 ou quando esgotarem. Cadastre-se agora e garanta a sua.
                </p>
                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={scrollToForm}
                    className="bg-[var(--accent)] px-8 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.26em] text-black transition hover:brightness-110"
                  >
                    Quero garantir minha vaga
                  </button>
                  <a
                    href="/"
                    className="border border-[var(--line-strong)] bg-black/30 px-8 py-4 text-center text-[11px] uppercase tracking-[0.26em] text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    Ver detalhes do programa
                  </a>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-14 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4 animate-rise-3">
                {[
                  ["30", "vagas · 1º lote"],
                  ["14/04", "início da turma"],
                  [`${alunos}+`, "alunos formados"],
                  [`${empresas}+`, "organizações atendidas"],
                ].map(([v, l]) => (
                  <div key={l} className="border border-[var(--line)] bg-black/20 p-4">
                    <div className="text-2xl font-semibold uppercase tracking-[-0.04em] text-[var(--accent)]">{v}</div>
                    <div className="mt-1 font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — urgency panel */}
            <div className="relative scan-overlay lg:col-span-5">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.02),transparent_35%,rgba(255,106,0,.04)_100%)]" />
              <div className="relative flex h-full min-h-[480px] flex-col justify-center p-6 md:p-10">
                <div className="border border-[var(--line-strong)] bg-[var(--panel)] animate-glow">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
                    <div>
                      <div className="font-mono-tech text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">Status do lote</div>
                      <div className="mt-0.5 text-sm uppercase tracking-[-0.02em] text-[var(--text)]">1º lote — aberto</div>
                    </div>
                    <div className="h-2 w-2 bg-[var(--green)]" />
                  </div>

                  {/* Vagas progress */}
                  <div className="border-b border-[var(--line)] px-6 py-5">
                    <div className="flex items-end justify-between">
                      <div className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">Vagas preenchidas</div>
                      <div className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">22 / 30</div>
                    </div>
                    <div className="mt-3 h-1 w-full bg-[var(--line-strong)]">
                      <div className="progress-bar h-full bg-[var(--accent)]" style={{ width: "0%" }} />
                    </div>
                    <div className="mt-2 font-mono-tech text-[10px] text-[var(--muted)]">8 vagas restantes neste lote</div>
                  </div>

                  {/* Info rows */}
                  <div className="space-y-0 px-6 py-2 font-mono-tech text-sm">
                    {[
                      ["INÍCIO", "14 de abril de 2026"],
                      ["FORMATO", "2 encontros / semana"],
                      ["CARGA", "40h mínimas"],
                      ["PREÇO · 1º LOTE", "R$ 497,00 / mês"],
                      ["VÁLIDO ATÉ", "03/04/2026 ou 30 vagas"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between border-b border-[var(--line)] py-3 last:border-b-0">
                        <span className="text-[var(--muted)] text-[11px]">{k}</span>
                        <span className={`text-[var(--text)] text-right text-[11px] ${k === "PREÇO · 1º LOTE" ? "text-[var(--accent)] font-bold" : ""}`}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="px-6 pb-6 pt-4">
                    <button
                      onClick={scrollToForm}
                      className="w-full bg-[var(--accent)] py-4 text-center text-[11px] font-semibold uppercase tracking-[0.26em] text-black transition hover:brightness-110"
                    >
                      Garantir minha vaga agora
                    </button>
                    <div className="mt-3 text-center font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                      Sem compromisso. Cancelamento com 30 dias de aviso.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FORMULÁRIO ── */}
        <section ref={formRef} className="border-b border-[var(--line)] bg-[var(--bg-2)]">
          <div className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-24">
            <div className="grid grid-cols-1 gap-0 border border-[var(--line)] lg:grid-cols-12">

              {/* Left — persuasion */}
              <div className="border-b border-[var(--line)] bg-[var(--panel)] p-6 lg:col-span-5 lg:border-b-0 lg:border-r md:p-10">
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--accent)]">// Por que se cadastrar agora</div>
                <h2 className="mt-4 text-3xl uppercase leading-[0.92] tracking-[-0.05em] text-[var(--text)] md:text-5xl">
                  Quem entra no 1º lote tem vantagens que não voltam.
                </h2>
                <p className="mt-5 font-mono-tech text-sm leading-7 text-[var(--muted)]">
                  Não é urgência fabricada. O preço, as vagas e o acesso ao grupo são reais e limitados. Quem hesita paga mais caro — ou fica de fora.
                </p>

                <div className="mt-8 space-y-0 border border-[var(--line)]">
                  {BENEFITS.map(([title, desc], i) => (
                    <div key={title} className="border-b border-[var(--line)] p-5 last:border-b-0">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center bg-[var(--accent)]">
                          <span className="font-mono-tech text-[9px] font-bold text-black">{String(i + 1).padStart(2, "0")}</span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold uppercase tracking-[0.06em] text-[var(--text)]">{title}</div>
                          <div className="mt-1 font-mono-tech text-xs leading-5 text-[var(--muted)]">{desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quote */}
                <div className="mt-8 border-l-2 border-[var(--accent)] pl-5">
                  <p className="font-mono-tech text-sm leading-7 text-zinc-400 italic">
                    "O mercado não precisa de mais curiosos em IA. Precisa de gente que sabe construir."
                  </p>
                  <div className="mt-3 font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
                    — André Cardia, instrutor
                  </div>
                </div>
              </div>

              {/* Right — form */}
              <div className="bg-[var(--bg)] p-6 lg:col-span-7 md:p-10">
                {!submitted ? (
                  <>
                    <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--accent)]">// Cadastro · 1º Lote</div>
                    <h3 className="mt-3 text-2xl uppercase leading-tight tracking-[-0.04em] text-[var(--text)] md:text-3xl">
                      Reserve sua vaga.<br />
                      <span className="text-[var(--muted)]">Confirme seu interesse antes que encerre.</span>
                    </h3>
                    <p className="mt-3 font-mono-tech text-xs leading-5 text-[var(--muted)]">
                      Após o cadastro, você receberá o link do grupo exclusivo no WhatsApp e todas as informações para garantir sua inscrição.
                    </p>

                    <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
                      {/* Nome + Sobrenome */}
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <Field label="Nome" name="nome" value={form.nome} onChange={handleChange} error={errors.nome} placeholder="Seu nome" />
                        <Field label="Sobrenome" name="sobrenome" value={form.sobrenome} onChange={handleChange} error={errors.sobrenome} placeholder="Seu sobrenome" />
                      </div>

                      {/* Email + WhatsApp */}
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <Field label="E-mail" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="seu@email.com" />
                        <Field label="WhatsApp" name="whatsapp" type="tel" value={form.whatsapp} onChange={handleChange} error={errors.whatsapp} placeholder="(48) 9 9999-9999" />
                      </div>

                      {/* Escolaridade + Ramo */}
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <SelectField label="Nível de escolaridade" name="escolaridade" value={form.escolaridade} onChange={handleChange} error={errors.escolaridade} options={ESCOLARIDADE} />
                        <SelectField label="Ramo de atuação" name="ramo" value={form.ramo} onChange={handleChange} error={errors.ramo} options={RAMO} />
                      </div>

                      {/* Empresa */}
                      <Field label="Empresa / Organização" name="empresa" value={form.empresa} onChange={handleChange} error={errors.empresa} placeholder="Nome da empresa onde você atua" />

                      {/* Submit */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-[var(--accent)] py-4 text-center text-[11px] font-semibold uppercase tracking-[0.26em] text-black transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <span className="font-mono-tech">Processando...</span>
                          ) : (
                            "Garantir minha vaga no 1º lote"
                          )}
                        </button>
                        {submitError && (
                          <div className="mt-3 border border-red-500/30 bg-red-500/10 p-3 font-mono-tech text-xs leading-5 text-red-400">
                            {submitError}
                          </div>
                        )}
                        <p className="mt-3 text-center font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                          Seus dados são confidenciais. Nada de spam.
                        </p>
                      </div>
                    </form>
                  </>
                ) : (
                  /* ── SUCCESS STATE ── */
                  <div className="flex h-full min-h-[480px] flex-col items-center justify-center text-center animate-fade">
                    <div className="h-4 w-4 bg-[var(--green)]" />
                    <div className="mt-6 font-mono-tech text-[10px] uppercase tracking-[0.28em] text-[var(--green)]">
                      Cadastro confirmado
                    </div>
                    <h3 className="mt-4 max-w-lg text-3xl uppercase leading-[0.92] tracking-[-0.05em] text-[var(--text)] md:text-4xl">
                      Vaga reservada,<br />
                      <span className="text-[var(--accent)]">{form.nome}.</span>
                    </h3>
                    <p className="mt-5 max-w-md font-mono-tech text-sm leading-7 text-[var(--muted)]">
                      Próximo passo: entre no grupo exclusivo do WhatsApp para ter acesso à comunidade, tirar dúvidas com os instrutores e receber todas as informações sobre o início da turma.
                    </p>

                    <a
                      href="https://wa.me/5548988549556?text=Ol%C3%A1!%20Fiz%20meu%20cadastro%20na%20p%C3%A1gina%20e%20gostaria%20de%20entrar%20no%20grupo%20da%20Mentoria%20Zero-to-Hero%20IA"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-8 flex w-full max-w-sm items-center justify-center gap-3 bg-[#25D366] py-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-110"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Entrar no grupo do WhatsApp
                    </a>

                    <div className="mt-4 w-full max-w-sm">
                      <a
                        href="https://pag.ae/81CEushnG"
                        className="block w-full border border-[var(--line-strong)] py-4 text-center text-[11px] uppercase tracking-[0.26em] text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        Confirmar inscrição agora
                      </a>
                    </div>

                    <a href="/" className="mt-6 font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] underline underline-offset-4 hover:text-[var(--accent)]">
                      Ver todos os detalhes do programa
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF STRIP ── */}
        <section className="border-b border-[var(--line)] bg-[var(--panel)]">
          <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-8">
            <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
              <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--muted)]">// Quem já passou por aqui</div>
              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
                {[
                  [`${alunos}+ alunos`, "formados"],
                  [`${empresas}+ organizações`, "treinadas"],
                  ["2 instrutores", "com repertório real"],
                  ["40h mínimas", "de carga horária"],
                ].map(([v, l]) => (
                  <div key={v} className="text-center">
                    <div className="text-lg font-semibold uppercase tracking-[-0.03em] text-[var(--text)]">{v}</div>
                    <div className="mt-0.5 font-mono-tech text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <section className="relative overflow-hidden bg-[var(--accent)] text-black">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.14),transparent_32%,rgba(0,0,0,.08)_100%)]" />
          <div className="relative mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-20">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="font-mono-tech text-[10px] uppercase tracking-[0.28em] text-black/60">// Turma · 14 de abril de 2026</div>
              <h2 className="max-w-4xl text-4xl uppercase leading-[0.9] tracking-[-0.05em] md:text-6xl">
                8 vagas ainda disponíveis<br />
                <span className="text-black/60">no 1º lote.</span>
              </h2>
              <p className="max-w-xl font-mono-tech text-sm leading-7 text-black/70">
                Após encerrar as 30 vagas ou o dia 03/04, o preço sobe e o grupo fecha para novos cadastros deste lote.
              </p>
              <button
                onClick={scrollToForm}
                className="mt-2 border-2 border-black bg-black px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ff6a00] transition hover:bg-transparent hover:text-black"
              >
                Garantir minha vaga agora
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-8">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 bg-[var(--accent)]" />
            <span className="font-mono-tech text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Neural Hub · Zero-to-Hero IA · 2026</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/privacidade.html" className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--muted)] transition hover:text-[var(--accent)]">
              Política de Privacidade
            </a>
            <a href="/termos.html" className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--muted)] transition hover:text-[var(--accent)]">
              Termos de Uso
            </a>
            <a href="/" className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--muted)] transition hover:text-[var(--accent)]">
              Ver página completa do programa
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Componentes de campo ──────────────────────────────────────

function Field({ label, name, type = "text", value, onChange, error, placeholder }) {
  return (
    <div>
      <label className="block font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`mt-2 w-full border bg-[var(--panel)] px-4 py-3 font-mono-tech text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none transition focus:border-[var(--accent)] ${
          error ? "border-red-500" : "border-[var(--line-strong)]"
        }`}
      />
      {error && (
        <div className="mt-1 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-red-400">{error}</div>
      )}
    </div>
  );
}

function SelectField({ label, name, value, onChange, error, options }) {
  return (
    <div>
      <label className="block font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
        {label}
      </label>
      <div className="relative mt-2">
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full border bg-[var(--panel)] px-4 py-3 font-mono-tech text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] appearance-none cursor-pointer ${
            error ? "border-red-500" : "border-[var(--line-strong)]"
          } ${!value ? "text-[var(--muted)]" : ""}`}
        >
          <option value="" disabled className="text-[var(--muted)] bg-[var(--panel)]">Selecionar...</option>
          {options.map(opt => (
            <option key={opt} value={opt} className="bg-[var(--panel)] text-[var(--text)]">{opt}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
          </svg>
        </div>
      </div>
      {error && (
        <div className="mt-1 font-mono-tech text-[10px] uppercase tracking-[0.18em] text-red-400">{error}</div>
      )}
    </div>
  );
}
