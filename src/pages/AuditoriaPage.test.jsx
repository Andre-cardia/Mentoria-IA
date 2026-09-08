import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import AuditoriaPage from "./AuditoriaPage.jsx";

// Mock Supabase
vi.mock("../lib/supabase.js", () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

function createLocalStorageMock(initial = {}) {
  let store = { ...initial };
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, val) => {
      store[key] = String(val);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
}

function renderWithProviders(ui) {
  return render(<HelmetProvider>{ui}</HelmetProvider>);
}

describe("AuditoriaPage & Subpages", () => {
  let storageMock;

  beforeEach(() => {
    storageMock = createLocalStorageMock();
    vi.stubGlobal("localStorage", storageMock);
    window.print = vi.fn();
    vi.restoreAllMocks();
  });

  it("renderiza a Landing Page com hero section, incidentes, visão das 7 dimensões e formulário de cadastro", () => {
    renderWithProviders(<AuditoriaPage initialRoute="/auditoria" />);

    expect(
      screen.getByRole("heading", {
        name: /Diagnóstico de Segurança para Aplicações Vibe Code & No-Code/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByText(/CVE-2025-48757/i)).toBeInTheDocument();
    expect(screen.getByText(/Desligamento Repentino \(Caso Manus\)/i)).toBeInTheDocument();
    expect(screen.getByText(/As 7 Dimensões Críticas de Segurança para Aplicações Vibe Code/i)).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Liberar checklist e Skill de segurança/i }).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
  });

  it("renderiza a página do checklist com formulário de cadastro inicialmente bloqueado", () => {
    renderWithProviders(<AuditoriaPage initialRoute="/auditoria/checklist" />);

    expect(
      screen.getByRole("heading", {
        name: /Checklist Interativo de Cibersegurança/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail Corporativo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/WhatsApp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome da Empresa/i)).toBeInTheDocument();
  });

  it("exibe erros de validação quando o formulário do checklist é submetido em branco", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuditoriaPage initialRoute="/auditoria/checklist" />);

    const submitBtn = screen.getByRole("button", {
      name: /Liberar checklist e Skill de segurança/i,
    });
    await user.click(submitBtn);

    expect(screen.getByText(/Informe seu nome completo/i)).toBeInTheDocument();
    expect(screen.getByText(/Informe um e-mail válido/i)).toBeInTheDocument();
    expect(screen.getByText(/Informe seu WhatsApp com DDD/i)).toBeInTheDocument();
    expect(screen.getByText(/Informe o nome da sua empresa/i)).toBeInTheDocument();
  });

  it("desbloqueia o checklist interativo após preenchimento válido do formulário", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuditoriaPage initialRoute="/auditoria/checklist" />);

    await user.type(screen.getByLabelText(/Nome Completo/i), "João Silva");
    await user.type(screen.getByLabelText(/E-mail Corporativo/i), "joao@empresa.com");
    await user.type(screen.getByLabelText(/WhatsApp/i), "11999998888");
    await user.type(screen.getByLabelText(/Nome da Empresa/i), "TechCorp");

    const submitBtn = screen.getByRole("button", {
      name: /Liberar checklist e Skill de segurança/i,
    });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Checklist de Auditoria Vibe Code/i)).toBeInTheDocument();
      expect(screen.getAllByText(/TechCorp/i).length).toBeGreaterThan(0);
    });

    expect(
      screen.getByText(/Banco de dados \(a falha nº 1, disparado\)/i)
    ).toBeInTheDocument();
  });

  it("atualiza o progresso e percentual ao marcar itens do checklist", async () => {
    const user = userEvent.setup();
    storageMock = createLocalStorageMock({
      nh_auditoria_lead_v1: JSON.stringify({
        name: "Maria Souza",
        email: "maria@empresa.com",
        whatsapp: "11988887777",
        company: "Inovação Ltda",
      }),
    });
    vi.stubGlobal("localStorage", storageMock);

    renderWithProviders(<AuditoriaPage initialRoute="/auditoria/checklist" />);

    expect(screen.getByText(/0 de 30 concluídos/i)).toBeInTheDocument();

    const checkbox = screen.getByLabelText(
      /RLS ligado em TODAS as tabelas do schema public/i
    );
    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(screen.getByText(/1 de 30 concluídos/i)).toBeInTheDocument();
  });

  it("não exibe botão de download de PDF e disponibiliza a aba de instalação da Skill para Codex", async () => {
    const user = userEvent.setup();
    storageMock = createLocalStorageMock({
      nh_auditoria_lead_v1: JSON.stringify({
        name: "Carlos Teste",
        email: "carlos@teste.com",
        whatsapp: "11977776666",
        company: "Alpha Corp",
      }),
    });
    vi.stubGlobal("localStorage", storageMock);

    renderWithProviders(<AuditoriaPage initialRoute="/auditoria/checklist" />);

    // Verifica que botão de download em PDF não existe
    expect(screen.queryByRole("button", { name: /baixar.*pdf/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Baixar Checklist em PDF/i)).not.toBeInTheDocument();

    // Verifica que a aba Codex está presente e não existe Windsurf
    expect(screen.getByRole("button", { name: /Codex/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Windsurf/i })).not.toBeInTheDocument();

    // Clica na aba Codex e verifica o comando de instalação
    await user.click(screen.getByRole("button", { name: /Codex/i }));
    expect(screen.getByText(/\.codex\/skills\/vibe-security-audit\/SKILL\.md/i)).toBeInTheDocument();
  });

  it("permite navegar para o checklist interativo a partir da landing page quando já cadastrado", async () => {
    const user = userEvent.setup();
    storageMock = createLocalStorageMock({
      nh_auditoria_lead_v1: JSON.stringify({
        name: "Carlos Teste",
        email: "carlos@teste.com",
        whatsapp: "11977776666",
        company: "Alpha Corp",
      }),
    });
    vi.stubGlobal("localStorage", storageMock);

    renderWithProviders(<AuditoriaPage initialRoute="/auditoria" />);

    expect(screen.getByText(/Seu diagnóstico corporativo para a empresa/i)).toBeInTheDocument();

    const openChecklistBtn = screen.getByRole("link", {
      name: /Abrir Meu Checklist de Auditoria/i,
    });
    await user.click(openChecklistBtn);

    expect(screen.getByText(/Checklist de Auditoria Vibe Code/i)).toBeInTheDocument();
  });
});
