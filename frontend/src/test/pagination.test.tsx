import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '../pages/DashboardPage';
import * as api from '../services/api';
import { Cliente, Orcamento } from '../types';

// Helper mock generators
const generateMockClientes = (count: number): Cliente[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `CLI-${String(i + 1).padStart(3, '0')}`,
    nome: `Cliente Teste ${i + 1}`,
    celular: `(11) 99999-${String(i + 1).padStart(4, '0')}`,
    email: `cliente${i + 1}@teste.com`,
    apelido: `Apelido ${i + 1}`,
  }));
};

const generateMockOrcamentos = (count: number, clientes: Cliente[]): Orcamento[] => {
  return Array.from({ length: count }, (_, i) => {
    const cli = clientes[i % clientes.length] || {
      id: 'CLI-001',
      nome: 'Cliente Padrão',
      email: 'padrao@teste.com',
      celular: '11999990000',
      apelido: 'Padrao',
    };
    return {
      id: `ORC-${String(i + 1).padStart(3, '0')}`,
      cliente_id: cli.id,
      cliente: cli,
      data: '2026-07-29',
      status: 'Pendente',
      observacoes: `Observação Orçamento ${i + 1}`,
      valorTotal: 100 * (i + 1),
      itens: [
        {
          id: `ITEM-${i + 1}`,
          orcamento_id: `ORC-${String(i + 1).padStart(3, '0')}`,
          servico: `Serviço ${i + 1}`,
          local: `Local ${i + 1}`,
          valor: 100 * (i + 1),
        },
      ],
    };
  });
};

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

const matchFullText = (textToMatch: string) => {
  return (_: string, element: Element | null) => {
    if (!element) return false;
    const hasText = (node: Element) => node.textContent?.replace(/\s+/g, ' ').trim() === textToMatch;
    const elementHasText = hasText(element);
    const childrenDoNotHaveText = Array.from(element.children).every(child => !hasText(child));
    return elementHasText && childrenDoNotHaveText;
  };
};

describe('Testes de Paginação do Dashboard (Orçamentos e Clientes)', () => {
  const mockNavigate = vi.fn();
  const mockSetEditingCliente = vi.fn();
  const mockSetEditingOrcamento = vi.fn();
  const mockAddToast = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. HAPPY PATH (Caminho Feliz)', () => {
    it('1.1 Pagina a tabela de Orçamentos de 10 em 10 itens com navegação Anterior/Próxima', async () => {
      const mockClientes = generateMockClientes(5);
      const mockOrcamentos = generateMockOrcamentos(25, mockClientes);

      vi.spyOn(api, 'fetchClientes').mockResolvedValue(mockClientes);
      vi.spyOn(api, 'fetchOrcamentos').mockResolvedValue(mockOrcamentos);

      renderWithQueryClient(
        <DashboardPage
          navigate={mockNavigate}
          setEditingCliente={mockSetEditingCliente}
          setEditingOrcamento={mockSetEditingOrcamento}
          addToast={mockAddToast}
        />
      );

      // Espera carregar a primeira página
      await waitFor(() => {
        expect(screen.getByText('#ORC-001')).toBeTruthy();
      });

      // Página 1 deve conter #ORC-001 até #ORC-010, mas NÃO #ORC-011
      expect(screen.getByText('#ORC-001')).toBeTruthy();
      expect(screen.getByText('#ORC-010')).toBeTruthy();
      expect(screen.queryByText('#ORC-011')).toBeNull();
      expect(screen.getByText(matchFullText('Exibindo 1 a 10 de 25 orçamentos'))).toBeTruthy();
      expect(screen.getByText('Página 1 de 3')).toBeTruthy();

      // Clique em Próxima
      const nextBtn = screen.getByRole('button', { name: 'Próxima Página Orçamentos' });
      fireEvent.click(nextBtn);

      // Página 2 deve conter #ORC-011 até #ORC-020
      expect(screen.getByText('#ORC-011')).toBeTruthy();
      expect(screen.getByText('#ORC-020')).toBeTruthy();
      expect(screen.queryByText('#ORC-001')).toBeNull();
      expect(screen.getByText(matchFullText('Exibindo 11 a 20 de 25 orçamentos'))).toBeTruthy();
      expect(screen.getByText('Página 2 de 3')).toBeTruthy();

      // Clique em Próxima novamente -> Página 3 (21 a 25)
      fireEvent.click(nextBtn);

      expect(screen.getByText('#ORC-021')).toBeTruthy();
      expect(screen.getByText('#ORC-025')).toBeTruthy();
      expect(screen.getByText(matchFullText('Exibindo 21 a 25 de 25 orçamentos'))).toBeTruthy();
      expect(screen.getByText('Página 3 de 3')).toBeTruthy();

      // Clique em Anterior -> Retorna para Página 2
      const prevBtn = screen.getByRole('button', { name: 'Página Anterior Orçamentos' });
      fireEvent.click(prevBtn);

      expect(screen.getByText('Página 2 de 3')).toBeTruthy();
      expect(screen.getByText('#ORC-011')).toBeTruthy();
    });

    it('1.2 Pagina a tabela de Clientes de 10 em 10 itens com navegação Anterior/Próxima', async () => {
      const mockClientes = generateMockClientes(15);
      const mockOrcamentos = generateMockOrcamentos(5, mockClientes);

      vi.spyOn(api, 'fetchClientes').mockResolvedValue(mockClientes);
      vi.spyOn(api, 'fetchOrcamentos').mockResolvedValue(mockOrcamentos);

      renderWithQueryClient(
        <DashboardPage
          navigate={mockNavigate}
          setEditingCliente={mockSetEditingCliente}
          setEditingOrcamento={mockSetEditingOrcamento}
          addToast={mockAddToast}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#ORC-001')).toBeTruthy();
      });

      // Muda para a aba de Clientes
      const tabClientes = screen.getByRole('button', { name: /Clientes/i });
      fireEvent.click(tabClientes);

      // Página 1 de clientes (Cliente Teste 1 até Cliente Teste 10)
      expect(screen.getByText('Cliente Teste 1')).toBeTruthy();
      expect(screen.getByText('Cliente Teste 10')).toBeTruthy();
      expect(screen.queryByText('Cliente Teste 11')).toBeNull();
      expect(screen.getByText(matchFullText('Exibindo 1 a 10 de 15 clientes'))).toBeTruthy();

      // Clique em Próxima
      const nextBtn = screen.getByRole('button', { name: 'Próxima Página Clientes' });
      fireEvent.click(nextBtn);

      // Página 2 (Cliente Teste 11 até Cliente Teste 15)
      expect(screen.getByText('Cliente Teste 11')).toBeTruthy();
      expect(screen.getByText('Cliente Teste 15')).toBeTruthy();
      expect(screen.queryByText('Cliente Teste 1')).toBeNull();
      expect(screen.getByText(matchFullText('Exibindo 11 a 15 de 15 clientes'))).toBeTruthy();
    });
  });

  describe('2. EDGE CASES (Casos de Borda e Erros)', () => {
    it('2.1 Desabilita os botões Anterior na primeira página e Próxima na última página', async () => {
      const mockClientes = generateMockClientes(2);
      const mockOrcamentos = generateMockOrcamentos(12, mockClientes);

      vi.spyOn(api, 'fetchClientes').mockResolvedValue(mockClientes);
      vi.spyOn(api, 'fetchOrcamentos').mockResolvedValue(mockOrcamentos);

      renderWithQueryClient(
        <DashboardPage
          navigate={mockNavigate}
          setEditingCliente={mockSetEditingCliente}
          setEditingOrcamento={mockSetEditingOrcamento}
          addToast={mockAddToast}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#ORC-001')).toBeTruthy();
      });

      const prevBtn = screen.getByRole('button', { name: 'Página Anterior Orçamentos' }) as HTMLButtonElement;
      const nextBtn = screen.getByRole('button', { name: 'Próxima Página Orçamentos' }) as HTMLButtonElement;

      // Na página 1: Anterior desabilitado, Próxima habilitado
      expect(prevBtn.disabled).toBe(true);
      expect(nextBtn.disabled).toBe(false);

      // Navega para a última página (página 2)
      fireEvent.click(nextBtn);

      // Na página 2 (última): Anterior habilitado, Próxima desabilitado
      expect(prevBtn.disabled).toBe(false);
      expect(nextBtn.disabled).toBe(true);
    });

    it('2.2 Oculta botões de navegação quando há 10 ou menos itens', async () => {
      const mockClientes = generateMockClientes(5);
      const mockOrcamentos = generateMockOrcamentos(8, mockClientes);

      vi.spyOn(api, 'fetchClientes').mockResolvedValue(mockClientes);
      vi.spyOn(api, 'fetchOrcamentos').mockResolvedValue(mockOrcamentos);

      renderWithQueryClient(
        <DashboardPage
          navigate={mockNavigate}
          setEditingCliente={mockSetEditingCliente}
          setEditingOrcamento={mockSetEditingOrcamento}
          addToast={mockAddToast}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#ORC-001')).toBeTruthy();
      });

      // Exibe total de 8 orçamentos, mas sem botões de navegação de página
      expect(screen.getByText(matchFullText('Exibindo 1 a 8 de 8 orçamentos'))).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Próxima Página Orçamentos' })).toBeNull();
    });

    it('2.3 Reseta a paginação para a primeira página ao filtrar/buscar', async () => {
      const mockClientes = generateMockClientes(3);
      const mockOrcamentos = generateMockOrcamentos(25, mockClientes);

      vi.spyOn(api, 'fetchClientes').mockResolvedValue(mockClientes);
      vi.spyOn(api, 'fetchOrcamentos').mockResolvedValue(mockOrcamentos);

      renderWithQueryClient(
        <DashboardPage
          navigate={mockNavigate}
          setEditingCliente={mockSetEditingCliente}
          setEditingOrcamento={mockSetEditingOrcamento}
          addToast={mockAddToast}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#ORC-001')).toBeTruthy();
      });

      // Avança para a página 2
      const nextBtn = screen.getByRole('button', { name: 'Próxima Página Orçamentos' });
      fireEvent.click(nextBtn);
      expect(screen.getByText('Página 2 de 3')).toBeTruthy();

      // Digita termo de busca específico do item 2
      const searchInput = screen.getByPlaceholderText(/Buscar orçamento, cliente, item.../i);
      fireEvent.change(searchInput, { target: { value: 'Observação Orçamento 2' } });

      // Garante que o item correspondente é exibido e que a frase de resumo atualizou para a lista filtrada
      expect(screen.getByText(matchFullText('Exibindo 1 a 7 de 7 orçamentos'))).toBeTruthy();
      expect(screen.getByText('#ORC-002')).toBeTruthy();
    });
  });

  describe('3. SECURITY VULNERABILITIES (Segurança/Autenticação)', () => {
    it('3.1 Sanitiza entradas no campo de busca e renderiza caracteres especiais com segurança contra XSS', async () => {
      const mockClientes: Cliente[] = [
        {
          id: 'CLI-XSS',
          nome: '<script>alert("xss")</script>',
          email: 'xss@test.com',
          celular: '11999999999',
          apelido: '<img src=x onerror=alert(1)>',
        },
      ];
      const mockOrcamentos = generateMockOrcamentos(1, mockClientes);

      vi.spyOn(api, 'fetchClientes').mockResolvedValue(mockClientes);
      vi.spyOn(api, 'fetchOrcamentos').mockResolvedValue(mockOrcamentos);

      renderWithQueryClient(
        <DashboardPage
          navigate={mockNavigate}
          setEditingCliente={mockSetEditingCliente}
          setEditingOrcamento={mockSetEditingOrcamento}
          addToast={mockAddToast}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#ORC-001')).toBeTruthy();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar orçamento, cliente, item.../i) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: '<script>' } });

      // Garante que o input contém o texto injetado como string pura sem interpretação HTML
      expect(searchInput.value).toBe('<script>');

      // Alterna para clientes para verificar renderização sanitizada
      const tabClientes = screen.getByRole('button', { name: /Clientes/i });
      fireEvent.click(tabClientes);

      // O elemento é renderizado como texto do React, evitando XSS refletido ou armazenado
      expect(screen.getByText('<script>alert("xss")</script>')).toBeTruthy();
    });
  });
});
