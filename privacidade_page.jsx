import React from "react";

export default function PrivacidadePage() {
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
      `}</style>

      <div className="fixed inset-0 pointer-events-none opacity-[0.05] bg-grid-tech" />

      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <div className="h-3 w-3 bg-[var(--accent)]" />
            <div>
              <div className="text-[11px] uppercase tracking-[0.34em] text-[var(--muted)] font-mono-tech">Neural Hub</div>
              <div className="text-xl font-semibold tracking-[-0.04em] text-[var(--text)] md:text-2xl">ZERO-TO-HERO IA</div>
            </div>
          </div>
          <a
            href="/"
            className="border border-[var(--line-strong)] bg-black/30 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] active:scale-95"
          >
            Voltar ao site
          </a>
        </div>
      </header>

      <main className="relative mx-auto max-w-4xl px-4 py-16 md:py-24">
        <div className="space-y-12">
          {/* Header Policy */}
          <div className="border-b border-[var(--line)] pb-8">
            <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--accent)]">// Termos e condições</div>
            <h1 className="mt-4 text-4xl font-semibold uppercase leading-[0.92] tracking-[-0.05em] text-[var(--text)] md:text-6xl">
              Política de <span className="text-[var(--accent)]">Privacidade</span>
            </h1>
            <p className="mt-6 font-mono-tech text-sm text-[var(--muted)]">Última atualização: 02 de abril de 2026</p>
          </div>

          <div className="text-zinc-300 leading-8">
            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">1. Introdução</h2>
            <p className="mb-4">
              A NeuralHub ("nós", "nosso" ou "empresa") está comprometida com a proteção da sua privacidade. Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações pessoais quando você utiliza nossa plataforma de mentoria em Inteligência Artificial, acessível em <a href="https://mentoria.neuralhub.ia.br" className="text-[var(--accent)] hover:underline">https://mentoria.neuralhub.ia.br</a> ("Serviço").
            </p>
            <p className="mb-4">
              Ao acessar ou utilizar nosso Serviço, você concorda com a coleta e uso de informações de acordo com esta política.
            </p>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">2. Informações que Coletamos</h2>
            
            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">2.1. Informações Pessoais</h3>
            <p className="mb-4">Podemos coletar os seguintes tipos de informações pessoais:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li><strong className="text-zinc-300">Dados de identificação</strong>: nome, endereço de e-mail, número de telefone</li>
              <li><strong className="text-zinc-300">Dados profissionais</strong>: empresa, cargo, área de atuação</li>
              <li><strong className="text-zinc-300">Dados de pagamento</strong>: informações de cartão de crédito/débito processadas por gateways de pagamento terceiros</li>
              <li><strong className="text-zinc-300">Conteúdo gerado pelo usuário</strong>: mensagens, dúvidas e materiais compartilhados na plataforma</li>
            </ul>

            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">2.2. Informações de Uso</h3>
            <p className="mb-4">Coletamos automaticamente informações sobre sua interação com o Serviço, incluindo:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Endereço IP e tipo de navegador</li>
              <li>Páginas acessadas e tempo gasto</li>
              <li>Dispositivo utilizado</li>
              <li>Preferências de navegação</li>
            </ul>

            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">2.3. Cookies e Tecnologias Similares</h3>
            <p className="mb-4">Utilizamos cookies para:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Manter sua sessão ativa</li>
              <li>Lembrar suas preferências</li>
              <li>Analisar o tráfego do site</li>
              <li>Melhorar a experiência do usuário</li>
            </ul>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">3. Como Usamos suas Informações</h2>
            <p className="mb-4">Utilizamos suas informações para:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Fornecer e manter nosso Serviço</li>
              <li>Processar pagamentos e emitir confirmações</li>
              <li>Comunicar informações sobre sua mentoria</li>
              <li>Enviar materiais educacionais e atualizações</li>
              <li>Personalizar sua experiência de aprendizado</li>
              <li>Resolver problemas técnicos</li>
              <li>Cumprir obrigações legais</li>
            </ul>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">4. Compartilhamento de Dados</h2>
            
            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">4.1. Compartilhamento com Terceiros</h3>
            <p className="mb-4">Seus dados podem ser compartilhados com:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li><strong className="text-zinc-300">Processadores de pagamento</strong>: para processamento de transações</li>
              <li><strong className="text-zinc-300">Plataformas de comunicação</strong>: para envio de e-mails e notificações</li>
              <li><strong className="text-zinc-300">Ferramentas analíticas</strong>: para análise de uso do Serviço</li>
            </ul>
            <p className="mb-4">Não vendemos, alugamos ou comercializamos suas informações pessoais.</p>

            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">4.2. Exceções</h3>
            <p className="mb-4">Podemos divulgar informações quando:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Obrigado por lei ou ordem judicial</li>
              <li>Necessário para proteger direitos da empresa</li>
              <li>Em caso de fusão ou aquisição da empresa</li>
            </ul>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">5. Retenção de Dados</h2>
            <p className="mb-4">Mantemos suas informações pelo tempo necessário para:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Fornecer o Serviço contratado</li>
              <li>Cumprir obrigações legais</li>
              <li>Resolver disputas</li>
              <li>Aplicar nossos termos</li>
            </ul>
            <p className="mb-4">Dados de pagamento são retidos pelo período exigido pela legislação fiscal brasileira.</p>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">6. Seus Direitos (LGPD)</h2>
            <p className="mb-4">Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li><strong className="text-zinc-300">Acessar</strong> seus dados pessoais</li>
              <li><strong className="text-zinc-300">Corrigir</strong> dados incompletos ou desatualizados</li>
              <li><strong className="text-zinc-300">Solicitar a exclusão</strong> de seus dados</li>
              <li><strong className="text-zinc-300">Revogar o consentimento</strong> a qualquer momento</li>
              <li><strong className="text-zinc-300">Solicitar a portabilidade</strong> dos seus dados</li>
              <li><strong className="text-zinc-300">Opor-se ao tratamento</strong> em determinadas circunstâncias</li>
            </ul>
            <p className="mb-4">
              Para exercer seus direitos, entre em contato pelo e-mail: <strong className="text-[var(--text)]">suporte@neuralhub.ia.br</strong>
            </p>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">7. Segurança dos Dados</h2>
            <p className="mb-4">Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição, incluindo:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Criptografia de dados em trânsito (SSL/TLS)</li>
              <li>Acesso restrito a informações pessoais</li>
              <li>Monitoramento contínuo de vulnerabilidades</li>
            </ul>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">8. Crianças e Adolescentes</h2>
            <p className="mb-4">Nosso Serviço não é direcionado a menores de 18 anos. Não coletamos intencionalmente informações de crianças. Se descobrirmos que coletamos dados de menores, tomaremos medidas para excluí-los imediatamente.</p>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">9. Links para Sites de Terceiros</h2>
            <p className="mb-4">Nosso Serviço pode conter links para sites de terceiros. Não somos responsáveis pelas práticas de privacidade desses sites. Recomendamos que você revise as políticas de privacidade de qualquer site que visitar.</p>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">10. Alterações nesta Política</h2>
            <p className="mb-4">Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre mudanças publicando a nova política nesta página e atualizando a data de "Última atualização".</p>
            <p className="mb-4">Para mudanças significativas, enviaremos notificação por e-mail ou através do Serviço.</p>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">11. Contato</h2>
            <p className="mb-4">Para questões sobre esta Política de Privacidade ou para exercer seus direitos, entre em contato:</p>
            
            <div className="border border-[var(--line)] bg-[var(--panel)] p-6 my-8 max-w-xl">
              <strong className="block text-xl uppercase tracking-[-0.02em] text-[var(--text)] mb-3">NeuralHub</strong>
              <ul className="space-y-2 font-mono-tech text-sm text-[var(--muted)]">
                <li><span className="text-zinc-400">E-mail:</span> <strong className="text-zinc-200">suporte@neuralhub.ia.br</strong></li>
                <li><span className="text-zinc-400">Site:</span> <a href="https://mentoria.neuralhub.ia.br" className="text-[var(--accent)] hover:underline">https://mentoria.neuralhub.ia.br</a></li>
              </ul>
            </div>
            
            <p className="mt-12 text-center text-sm font-mono-tech text-[var(--muted)] border-t border-[var(--line)] pt-8">
              <em>*Ao utilizar nosso Serviço, você confirma que leu e compreendeu esta Política de Privacidade e concorda com seus termos.*</em>
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--line)] bg-[var(--bg)] mt-auto">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-8">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 bg-[var(--accent)]" />
            <span className="font-mono-tech text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Neural Hub · Zero-to-Hero IA · 2026</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
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
