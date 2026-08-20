import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../context/AuthContext';
import { MeuPerfilPage } from '../pages/MeuPerfilPage';
import { CriarOrcamentoPage } from '../pages/CriarOrcamentoPage';
import { OrcamentoPrintView } from '../components/OrcamentoPrintView';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import { User, Orcamento, Cliente } from '../types';

// Mock API functions
vi.mock('../services/api', () => ({
  updateUserProfileApi: vi.fn((data) => Promise.resolve({
    id: 'USR-001',
    nome: 'Gerente Administrador',
    email: 'admin@orcamaster.com.br',
    ...data
  })),
  fetchClientes: vi.fn(() => Promise.resolve([
    { id: 'CLI-001', nome: 'Cliente Teste', celular: '11999999999', email: 'cli@test.com', apelido: 'Test' }
  ])),
  createOrcamento: vi.fn((data) => Promise.resolve({
    id: 'ORC-2026-999',
    ...data,
    cliente: { id: 'CLI-001', nome: 'Cliente Teste', celular: '11999999999', email: 'cli@test.com', apelido: 'Test' },
    valorTotal: 1000
  })),
  updateOrcamento: vi.fn((id, data) => Promise.resolve({ id, ...data }))
}));

const mockUserWithDefaults: User = {
  id: 'USR-001',
  nome: 'Engenheiro Responsável',
  email: 'engenheiro@construtora.com.br',
  razaoSocial: 'Construtora Teste Ltda',
  nomeFantasia: 'Construtora Teste',
  introducao: '<p><b>Apresentação Padrão:</b> Orçamento para projeto residencial.</p>',
  materiaPrima: '<ul><li><b>MDF:</b> 18mm Naval Guararapes</li><li><b>Ferragens:</b> Blum com amortecedor</li></ul>',
  formaPagamento: '<p><b>Pagamento:</b> 50% entrada e 50% na entrega.</p>'
};

const createTestQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
});

describe('=== SUÍTE DE TESTES: Novos Campos (Introdução, Matéria Prima, Formas de Pagamento) ===', () => {

  // ==========================================
  // CATEGORIA 1: HAPPY PATH (CAMINHO FELIZ)
  // ==========================================
  describe('1. Happy Path (Caminho Feliz)', () => {

    it('1.1 Deve permitir salvar novos valores padrão de rich text no Perfil do Usuário', async () => {
      const mockUpdateUser = vi.fn();
      const mockAddToast = vi.fn();
      const mockNavigate = vi.fn();

      render(
        <AuthContext.Provider value={{ user: mockUserWithDefaults, token: 'fake-jwt', isAuthenticated: true, login: vi.fn(), logout: vi.fn(), updateUser: mockUpdateUser, setToken: vi.fn() }}>
          <MeuPerfilPage navigate={mockNavigate} addToast={mockAddToast} />
        </AuthContext.Provider>
      );

      // Verify page titles and fields render
      expect(screen.getByText('Valores Padrão para Novos Orçamentos')).toBeInTheDocument();
      expect(screen.getByText('1. Introdução Padrão do Orçamento')).toBeInTheDocument();
      expect(screen.getByText('2. Matéria Prima / Especificações Padrão')).toBeInTheDocument();
      expect(screen.getByText('3. Formas de Pagamento Padrão')).toBeInTheDocument();

      // Submit form
      const saveBtn = screen.getByText('Salvar Alterações');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalled();
        expect(mockAddToast).toHaveBeenCalledWith(
          'Perfil Atualizado!',
          'success',
          expect.any(String)
        );
      });
    });

    it('1.2 Deve pré-carregar os valores padrão do perfil ao criar um Novo Orçamento', async () => {
      const queryClient = createTestQueryClient();

      render(
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={{ user: mockUserWithDefaults, token: 'fake-jwt', isAuthenticated: true, login: vi.fn(), logout: vi.fn(), updateUser: vi.fn(), setToken: vi.fn() }}>
            <CriarOrcamentoPage editingOrcamento={null} navigate={vi.fn()} addToast={vi.fn()} />
          </AuthContext.Provider>
        </QueryClientProvider>
      );

      expect(screen.getByText('Textos Específicos do Orçamento (Editor Rich Text)')).toBeInTheDocument();

      // Verify that values from user profile exist in the HTML container
      const introContainer = document.getElementById('orcamento-field-introducao');
      expect(introContainer).not.toBeNull();
      expect(introContainer?.innerHTML).toContain('Apresentação Padrão:');
    });

    it('1.3 Deve exibir o conteúdo formatado em Rich Text no PDF / Impressão do Orçamento', () => {
      const testOrcamento: Orcamento = {
        id: 'ORC-2026-100',
        cliente_id: 'CLI-001',
        data: '2026-07-29',
        status: 'Aprovado',
        introducao: '<p><b>Introdução Especial</b> do Orçamento #100</p>',
        materiaPrima: '<h3>Especificação MDF 25mm</h3>',
        formaPagamento: '<p>Parcelado em 12x Sem Juros</p>',
        cliente: { id: 'CLI-001', nome: 'João Silva', celular: '11988887777', email: 'joao@email.com', apelido: 'João' },
        itens: [{ id: 'ITM-1', orcamento_id: 'ORC-2026-100', servico: 'Cozinha', local: 'Casa', valor: 5000 }]
      };

      render(
        <AuthContext.Provider value={{ user: mockUserWithDefaults, token: 'fake-jwt', isAuthenticated: true, login: vi.fn(), logout: vi.fn(), updateUser: vi.fn(), setToken: vi.fn() }}>
          <OrcamentoPrintView orcamento={testOrcamento} onClose={vi.fn()} />
        </AuthContext.Provider>
      );

      expect(screen.getByText('Introdução Especial')).toBeInTheDocument();
      expect(screen.getByText('Especificação MDF 25mm')).toBeInTheDocument();
      expect(screen.getByText('Parcelado em 12x Sem Juros')).toBeInTheDocument();
    });
  });

  // ==========================================
  // CATEGORIA 2: EDGE CASES (CASOS DE BORDA)
  // ==========================================
  describe('2. Edge Cases (Casos de Borda)', () => {

    it('2.1 Deve usar os fallbacks padrões quando os campos rich text no Orçamento estiverem vazios ou indefinidos', () => {
      const emptyOrcamento: Orcamento = {
        id: 'ORC-2026-101',
        cliente_id: 'CLI-001',
        data: '2026-07-29',
        introducao: undefined,
        materiaPrima: undefined,
        formaPagamento: undefined,
        cliente: { id: 'CLI-001', nome: 'Maria Santos', celular: '11977776666', email: 'maria@email.com', apelido: 'Maria' },
        itens: []
      };

      render(
        <AuthContext.Provider value={{ user: mockUserWithDefaults, token: 'fake-jwt', isAuthenticated: true, login: vi.fn(), logout: vi.fn(), updateUser: vi.fn(), setToken: vi.fn() }}>
          <OrcamentoPrintView orcamento={emptyOrcamento} onClose={vi.fn()} />
        </AuthContext.Provider>
      );

      // Falls back to user defaults if budget fields are undefined
      expect(screen.getByText('Apresentação Padrão:')).toBeInTheDocument();
    });

    it('2.2 Alterar o padrão no perfil NÃO deve alterar orçamentos antigos já salvos com textos específicos', () => {
      const existingOrcamento: Orcamento = {
        id: 'ORC-2026-050',
        cliente_id: 'CLI-001',
        data: '2026-01-01',
        introducao: '<p>Introdução antiga gravada no orçamento em Janeiro</p>',
        materiaPrima: '<p>MDF antigo 15mm</p>',
        formaPagamento: '<p>Apenas em dinheiro</p>',
        itens: []
      };

      render(
        <AuthContext.Provider value={{ user: mockUserWithDefaults, token: 'fake-jwt', isAuthenticated: true, login: vi.fn(), logout: vi.fn(), updateUser: vi.fn(), setToken: vi.fn() }}>
          <OrcamentoPrintView orcamento={existingOrcamento} onClose={vi.fn()} />
        </AuthContext.Provider>
      );

      // Verify that specific saved text in budget is rendered, not the new profile default
      expect(screen.getByText('Introdução antiga gravada no orçamento em Janeiro')).toBeInTheDocument();
      expect(screen.getByText('MDF antigo 15mm')).toBeInTheDocument();
      expect(screen.getByText('Apenas em dinheiro')).toBeInTheDocument();
      expect(screen.queryByText('Apresentação Padrão:')).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // CATEGORIA 3: SECURITY VULNERABILITIES (XSS & SANITIZAÇÃO)
  // ==========================================
  describe('3. Security Vulnerabilities (Segurança & Sanitização XSS)', () => {

    it('3.1 Deve sanitizar e remover scripts maliciosos (<script>) injetados no Editor Rich Text', () => {
      const maliciousHtml = '<div>Texto Seguro<script>alert("XSS ATTAACK")</script></div>';
      const sanitized = sanitizeHtml(maliciousHtml);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert(');
      expect(sanitized).toContain('Texto Seguro');
    });

    it('3.2 Deve remover atributos de eventos maliciosos (onload, onerror, onclick) e URIs javascript:', () => {
      const xssVector = '<img src="x" onerror="alert(document.cookie)" /><a href="javascript:alert(1)">Clique Aqui</a>';
      const sanitized = sanitizeHtml(xssVector);

      expect(sanitized).not.toContain('onerror=');
      expect(sanitized).not.toContain('javascript:');
    });

    it('3.3 Deve renderizar com segurança no PDF sem executar código malicioso injetado', () => {
      const xssOrcamento: Orcamento = {
        id: 'ORC-XSS-999',
        cliente_id: 'CLI-001',
        data: '2026-07-29',
        introducao: '<p>Texto Válido<script>window.hack="XSS"</script></p>',
        materiaPrima: '<b onclick="alert(1)">MDF Protegido</b>',
        formaPagamento: '<a href="javascript:void(0)">Forma de Pagamento</a>',
        itens: []
      };

      render(
        <AuthContext.Provider value={{ user: mockUserWithDefaults, token: 'fake-jwt', isAuthenticated: true, login: vi.fn(), logout: vi.fn(), updateUser: vi.fn(), setToken: vi.fn() }}>
          <OrcamentoPrintView orcamento={xssOrcamento} onClose={vi.fn()} />
        </AuthContext.Provider>
      );

      expect(screen.getByText('Texto Válido')).toBeInTheDocument();
      expect(screen.getByText('MDF Protegido')).toBeInTheDocument();
      expect(screen.queryByText('hack')).not.toBeInTheDocument();
    });
  });

});
