import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { LandingPage } from '../pages/LandingPage';

describe('LANDING PAGE DE MARCENARIA - TESTES UNITÁRIOS', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. HAPPY PATH (Caminho Feliz)', () => {
    it('1.1 Renderiza os títulos da landing page de gestão de orçamentos para marcenaria', () => {
      const mockNavigate = vi.fn();

      render(
        <AuthProvider>
          <LandingPage navigate={mockNavigate} />
        </AuthProvider>
      );

      expect(screen.getByText(/Emita Orçamentos de Marcenaria/i)).toBeInTheDocument();
      expect(screen.getByText(/Tudo que uma Marcenaria Moderna Precisa/i)).toBeInTheDocument();
    });

    it('1.2 Botão de Entrar redireciona para a página de login /login', () => {
      const mockNavigate = vi.fn();

      render(
        <AuthProvider>
          <LandingPage navigate={mockNavigate} />
        </AuthProvider>
      );

      const loginButtons = screen.getAllByRole('button', { name: /Entrar|Fazer Login|Acessar Minha Conta/i });
      fireEvent.click(loginButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('1.3 Botão de Cadastro redireciona para a rota /cadastro', () => {
      const mockNavigate = vi.fn();

      render(
        <AuthProvider>
          <LandingPage navigate={mockNavigate} />
        </AuthProvider>
      );

      const cadastroButtons = screen.getAllByRole('button', { name: /Cadastrar Marcenaria|Cadastre sua Marcenaria Grátis/i });
      fireEvent.click(cadastroButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/cadastro');
    });
  });

  describe('2. EDGE CASES', () => {
    it('2.1 Exibe botões com chamada para o painel quando o marceneiro já está autenticado', () => {
      localStorage.setItem('orcamento_jwt_token', 'token.valido.123');
      localStorage.setItem('orcamento_user', JSON.stringify({
        id: 'USR-1',
        nome: 'Marcenaria Silva',
        email: 'contato@silva.com.br'
      }));

      const mockNavigate = vi.fn();

      render(
        <AuthProvider>
          <LandingPage navigate={mockNavigate} />
        </AuthProvider>
      );

      expect(screen.getByText(/Olá, Marcenaria! Ir ao Painel/i)).toBeInTheDocument();
      const dashboardBtn = screen.getByRole('button', { name: /Olá, Marcenaria! Ir ao Painel/i });
      fireEvent.click(dashboardBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('3. SECURITY VULNERABILITIES', () => {
    it('3.1 Não exibe jargões de tokens JWT na landing page pública', () => {
      const mockNavigate = vi.fn();

      render(
        <AuthProvider>
          <LandingPage navigate={mockNavigate} />
        </AuthProvider>
      );

      expect(screen.queryByText(/JWT/i)).toBeNull();
    });
  });
});
