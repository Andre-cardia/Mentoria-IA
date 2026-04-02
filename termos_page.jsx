import React from "react";

export default function TermosPage() {
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
            <div className="font-mono-tech text-[10px] uppercase tracking-[0.26em] text-[var(--accent)]">// Informações legais</div>
            <h1 className="mt-4 text-4xl font-semibold uppercase leading-[0.92] tracking-[-0.05em] text-[var(--text)] md:text-6xl">
              Termos de <span className="text-[var(--accent)]">Uso</span>
            </h1>
            <p className="mt-6 font-mono-tech text-sm text-[var(--muted)]">Última atualização: 02 de abril de 2026</p>
          </div>

          <div className="text-zinc-300 leading-8">
            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">1. Aceitação dos Termos</h2>
            <p className="mb-4">Ao acessar e utilizar a plataforma <strong>Mentoria Zero-to-Hero IA</strong> ("Serviço") mantida pela <strong>NeuralHub</strong> ("nós", "nosso" ou "Empresa"), você concorda em cumprir estes Termos de Uso ("Termos").</p>
            <p className="mb-4">Se você não concordar com qualquer parte destes Termos, não deverá utilizar nosso Serviço.</p>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">2. Descrição do Serviço</h2>
            <p className="mb-4">A Mentoria Zero-to-Hero IA é uma plataforma educacional que oferece:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li><strong className="text-zinc-300">Cursos e treinamentos</strong> em Inteligência Artificial</li>
              <li><strong className="text-zinc-300">Mentorias</strong> e acompanhamento personalizado</li>
              <li><strong className="text-zinc-300">Materiais didáticos</strong> e recursos de aprendizado</li>
              <li><strong className="text-zinc-300">Acesso a ferramentas</strong> e plataformas de IA</li>
              <li><strong className="text-zinc-300">Comunidade de alunos</strong> e networking</li>
            </ul>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">3. Elegibilidade</h2>
            <p className="mb-4">Para utilizar nosso Serviço, você deve:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Ter pelo menos 18 anos de idade, ou</li>
              <li>Ter autorização legal de um representante adulto</li>
              <li>Fornecer informações verdadeiras e atualizadas</li>
              <li>Ser capaz de celebrar contratos legalmente vinculantes</li>
            </ul>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">4. Conta do Usuário</h2>
            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">4.1. Registro</h3>
            <p className="mb-4">Para acessar certas funcionalidades, você precisará criar uma conta. Você é responsável por:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Manter a confidencialidade de suas credenciais</li>
              <li>Todas as atividades realizadas em sua conta</li>
              <li>Notificar-nos imediatamente sobre uso não autorizado</li>
            </ul>

            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">4.2. Informações Falsas</h3>
            <p className="mb-4">É proibido fornecer informações falsas, enganosas ou imprecisas durante o cadastro.</p>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">5. Planos e Pagamentos</h2>
            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">5.1. Planos Disponíveis</h3>
            <p className="mb-4">Oferecemos diferentes planos de mentoria com funcionalidades e preços variados. Os detalhes de cada plano estão disponíveis em nossa plataforma.</p>
            
            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">5.2. Pagamentos</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Os pagamentos são processados através de gateways de pagamento terceiros</li>
              <li>Os valores são cobrados de acordo com o plano selecionado</li>
              <li>Aceitamos principais cartões de crédito, PIX e outras formas de pagamento indicadas</li>
            </ul>

            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">5.3. Reembolso</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Solicitações de reembolso devem ser feitas em até 7 dias após a compra</li>
              <li>Após esse período, não há garantia de reembolso</li>
              <li>Reembolsos serão processados conforme a legislação brasileira de defesa do consumidor</li>
            </ul>

            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">5.4. Renovação</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Planos recorrentes renovam automaticamente ao final de cada período</li>
              <li>Você pode cancelar a renovação automática a qualquer momento</li>
            </ul>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">6. Uso Aceitável</h2>
            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">6.1. Você pode:</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Acessar o conteúdo exclusivo para assinantes</li>
              <li>Participar de mentorias e aulas ao vivo</li>
              <li>Utilizar materiais para fins educacionais pessoais</li>
              <li>Interagir respeitosamente com outros usuários</li>
            </ul>

            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">6.2. Você não pode:</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Compartilhar suas credenciais de acesso com terceiros</li>
              <li>Reproduzir, distribuir ou revender conteúdo pago</li>
              <li>Usar o Serviço para fins ilegais ou não autorizados</li>
              <li>Realizar engenharia reversa ou tentar acessar código-fonte</li>
              <li>Interferir no funcionamento do Serviço</li>
              <li>Realizar scraping ou extração massiva de dados</li>
              <li>Assediar, abusar ou prejudicar outros usuários</li>
              <li>Carregar vírus, malware ou qualquer código malicioso</li>
            </ul>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">7. Propriedade Intelectual</h2>
            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">7.1. Conteúdo da Empresa</h3>
            <p className="mb-4">Todo conteúdo disponibilizado pela NeuralHub, incluindo:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Textos, vídeos, imagens e gráficos</li>
              <li>Materiais de curso e mentorias</li>
              <li>Design do site e interface</li>
              <li>Logotipos e marcas</li>
            </ul>
            <p className="mb-4">É propriedade exclusiva da NeuralHub e protegido por leis de propriedade intelectual.</p>

            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">7.2. Seus Direitos</h3>
            <p className="mb-4">Você mantém seus direitos sobre:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Conteúdo que você cria e compartilha publicamente</li>
              <li>Suas informações pessoais (conforme nossa Política de Privacidade)</li>
            </ul>

            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">7.3. Licença de Uso</h3>
            <p className="mb-4">Ao utilizar nosso Serviço, você recebe uma licença limitada, não exclusiva e intransferível para acessar e utilizar o conteúdo para fins educacionais pessoais.</p>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">8. Conteúdo Gerado pelo Usuário</h2>
            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">8.1. Responsabilidade</h3>
            <p className="mb-4">Você é exclusivamente responsável pelo conteúdo que cria e compartilha em nossa plataforma.</p>

            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">8.2. Concessão de Direitos</h3>
            <p className="mb-4">Ao compartilhar conteúdo em nossa plataforma, você nos concede o direito de usar, armazenar e exibir tal conteúdo conforme necessário para fornecer o Serviço.</p>

            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">8.3. Moderação</h3>
            <p className="mb-4">Reservamos o direito de remover conteúdo inapropriado, ofensivo ou que viole estes Termos.</p>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">9. Mentorias e Aulas</h2>
            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">9.1. Agendamento</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Mentorias e aulas devem ser agendadas com antecedência</li>
              <li>Cancelamentos devem ser comunicados com no mínimo 24 horas de antecedência</li>
              <li>Não comparecimento pode resultar em perda da sessão</li>
            </ul>

            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">9.2. Gravação</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Sessões de mentoria podem ser gravadas para fins de qualidade</li>
              <li>Você será informado caso a sessão esteja sendo gravada</li>
            </ul>

            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">9.3. Disponibilidade</h3>
            <p className="mb-4">Não garantimos disponibilidade contínua de mentores ou professores específicos.</p>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">10. Isenção de Responsabilidade</h2>
            <p className="mb-4">O Serviço é fornecido "como está" e "conforme disponível". Não garantimos que:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>O Serviço será ininterrupto, seguro ou livre de erros</li>
              <li>Os resultados obtidos serão precisos ou confiáveis</li>
              <li>A qualidade atenderá às suas expectativas</li>
            </ul>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">11. Limitação de Responsabilidade</h2>
            <p className="mb-4">Na máxima extensão permitida por lei, a NeuralHub não será responsável por:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Danos indiretos, incidentais, especiais ou consequenciais</li>
              <li>Perda de dados, lucros ou oportunidades de negócio</li>
              <li>Danos decorrentes do uso de ferramentas de IA de terceiros</li>
            </ul>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">12. Indenização</h2>
            <p className="mb-4">Você concorda em indenizar e isentar a NeuralHub de qualquer reclamação, dano, perda ou despesa (incluindo honorários advocatícios) decorrente de:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Sua violação destes Termos</li>
              <li>Seu uso inadequado do Serviço</li>
              <li>Seu violação de direitos de terceiros</li>
            </ul>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">13. Modificações do Serviço</h2>
            <p className="mb-4">Reservamos o direito de:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Modificar ou descontinuar qualquer parte do Serviço</li>
              <li>Alterar preços e planos com aviso prévio de 30 dias</li>
              <li>Adicionar ou remover funcionalidades</li>
            </ul>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">14. Suspensão e Término</h2>
            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">14.1. Encerramento pelo Usuário</h3>
            <p className="mb-4">Você pode encerrar sua conta a qualquer momento através das configurações da plataforma.</p>

            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">14.2. Suspensão pela Empresa</h3>
            <p className="mb-4">Podemos suspender ou encerrar seu acesso se:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Violar estes Termos de Uso</li>
              <li>Utilizar o Serviço para fins ilegais</li>
              <li>Comportamento prejudicial a outros usuários</li>
              <li>Não realizar pagamentos devidos</li>
            </ul>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">15. Lei Aplicável</h2>
            <p className="mb-4">Estes Termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será resolvida nos tribunais competentes do Brasil.</p>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">16. Resolução de Conflitos</h2>
            <p className="mb-4">Antes de iniciar qualquer processo legal, você concorda em:</p>
            <ol className="list-decimal pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Entrar em contato conosco para tentar resolver a disputa</li>
              <li>Aguardar 30 dias após notificação antes de tomar outras medidas</li>
            </ol>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">17. Alterações destes Termos</h2>
            <p className="mb-4">Podemos atualizar estes Termos periodicamente. Para alterações significativas:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2 font-mono-tech text-sm text-[var(--muted)]">
              <li>Notificaremos por e-mail ou através do Serviço</li>
              <li>A data de "Última atualização" será atualizada</li>
              <li>Seu uso continuado após as alterações constitui aceitação</li>
            </ul>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">18. Informações da Empresa</h2>
            <div className="border border-[var(--line)] bg-[var(--panel)] p-6 my-8 max-w-xl">
              <strong className="block text-xl uppercase tracking-[-0.02em] text-[var(--text)] mb-3">NeuralHub</strong>
              <ul className="space-y-2 font-mono-tech text-sm text-[var(--muted)]">
                <li><span className="text-zinc-400">Site:</span> <a href="https://neuralhub.ia.br" className="text-[var(--accent)] hover:underline">https://neuralhub.ia.br</a></li>
                <li><span className="text-zinc-400">E-mail de contato:</span> <strong className="text-zinc-200">suporte@neuralhub.ia.br</strong></li>
              </ul>
            </div>

            <h2 className="mt-12 mb-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-[var(--text)]">19. Disposições Gerais</h2>
            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">19.1. Divisibilidade</h3>
            <p className="mb-4">Se qualquer disposição destes Termos for considerada inválida, as demais disposições permanecerão em vigor.</p>

            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">19.2. Acordo Completo</h3>
            <p className="mb-4">Estes Termos, juntos com a Política de Privacidade, constituem o acordo completo entre você e a NeuralHub.</p>

            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">19.3. Não Transferência</h3>
            <p className="mb-4">Você não pode transferir seus direitos sob estes Termos sem nossa autorização prévia por escrito.</p>

            <h3 className="mt-8 mb-3 text-xl font-semibold uppercase tracking-[-0.01em] text-[var(--text)]">19.4. Nossas Falhas</h3>
            <p className="mb-4">A falha em fazer valer qualquer direito não constitui renúncia a esse direito.</p>

            <p className="mt-12 text-center text-sm font-mono-tech text-[var(--muted)] border-t border-[var(--line)] pt-8">
              <em>*Ao criar uma conta ou utilizar nosso Serviço, você confirma que leu, compreendeu e concorda com estes Termos de Uso.*</em>
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
            <a href="/privacidade.html" className="font-mono-tech text-[10px] uppercase tracking-[0.22em] text-[var(--muted)] transition hover:text-[var(--accent)]">
              Política de Privacidade
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
