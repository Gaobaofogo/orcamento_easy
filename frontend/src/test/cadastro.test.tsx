import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { CadastroPage } from '../pages/CadastroPage';
import { LoginPage } from '../pages/LoginPage';
import * as api from '../services/api';

describe('CADASTRO DE USUÁRIO - TESTES UNITÁRIOS E DE INTEGRAÇÃO', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. HAPPY PATH (Caminho Feliz)', () => {
    it('1.1 Deve cadastrar novo usuário com sucesso e redirecionar para o dashboard', async () => {
      const mockNavigate = vi.fn();
      const mockAddToast = vi.fn();

      vi.spyOn(api, 'registerApi').mockResolvedValueOnce({
        token: 'token.novo.usuario.123',
        user: {
          id: 'USR-999',
          nome: 'Novo Usuario Teste',
          email: 'novousuario@orcamaster.com.br',
        }
      });

      render(
        <AuthProvider>
          <CadastroPage navigate={mockNavigate} addToast={mockAddToast} />
        </AuthProvider>
      );

      const nomeInput = screen.getByPlaceholderText('Ex: Carlos Eduardo Silva');
      const emailInput = screen.getByPlaceholderText('seuemail@empresa.com.br');
      const senhaInput = screen.getByPlaceholderText('Mínimo 8 caracteres e símbolos');
      const confirmaInput = screen.getByPlaceholderText('Repita a senha');
      const submitBtn = screen.getByRole('button', { name: /Concluir Cadastro e Acessar/i });

      fireEvent.change(nomeInput, { target: { value: 'Novo Usuario Teste' } });
      fireEvent.change(emailInput, { target: { value: 'novousuario@orcamaster.com.br' } });
      fireEvent.change(senhaInput, { target: { value: 'SenhaSecura@123' } });
      fireEvent.change(confirmaInput, { target: { value: 'SenhaSecura@123' } });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(api.registerApi).toHaveBeenCalledWith({
          nome: 'Novo Usuario Teste',
          email: 'novousuario@orcamaster.com.br',
          senha: 'SenhaSecura@123',
          nomeFantasia: '',
          razaoSocial: '',
          cnpj: '',
          telefone: '',
          endereco: ''
        });
        expect(localStorage.getItem('orcamento_jwt_token')).toBe('token.novo.usuario.123');
        expect(mockAddToast).toHaveBeenCalledWith('Cadastro Realizado!', 'success', expect.any(String));
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('1.2 Botão de cadastro na LoginPage deve navegar para a rota /cadastro', () => {
      const mockNavigate = vi.fn();
      const mockAddToast = vi.fn();

      render(
        <AuthProvider>
          <LoginPage navigate={mockNavigate} addToast={mockAddToast} />
        </AuthProvider>
      );

      const cadastroBtn = screen.getByRole('button', { name: /Criar Nova Conta \/ Cadastrar-se/i });
      fireEvent.click(cadastroBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/cadastro');
    });
  });

  describe('2. EDGE CASES (Casos de Borda e Validações)', () => {
    it('2.1 Exibe erro se a confirmação de senha não coincidir com a senha', async () => {
      const mockNavigate = vi.fn();
      const mockAddToast = vi.fn();

      render(
        <AuthProvider>
          <CadastroPage navigate={mockNavigate} addToast={mockAddToast} />
        </AuthProvider>
      );

      const nomeInput = screen.getByPlaceholderText('Ex: Carlos Eduardo Silva');
      const emailInput = screen.getByPlaceholderText('seuemail@empresa.com.br');
      const senhaInput = screen.getByPlaceholderText('Mínimo 8 caracteres e símbolos');
      const confirmaInput = screen.getByPlaceholderText('Repita a senha');
      const submitBtn = screen.getByRole('button', { name: /Concluir Cadastro e Acessar/i });

      fireEvent.change(nomeInput, { target: { value: 'Novo Usuario' } });
      fireEvent.change(emailInput, { target: { value: 'teste@orcamaster.com.br' } });
      fireEvent.change(senhaInput, { target: { value: 'SenhaSecura@123' } });
      fireEvent.change(confirmaInput, { target: { value: 'OutraSenha@123' } });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument();
      });
    });

    it('2.2 Exibe erro caso a senha não cumpra os requisitos de complexidade (mínimo 8 chars, maiúscula, minúscula, número e especial)', async () => {
      const mockNavigate = vi.fn();
      const mockAddToast = vi.fn();

      render(
        <AuthProvider>
          <CadastroPage navigate={mockNavigate} addToast={mockAddToast} />
        </AuthProvider>
      );

      const senhaInput = screen.getByPlaceholderText('Mínimo 8 caracteres e símbolos');
      const submitBtn = screen.getByRole('button', { name: /Concluir Cadastro e Acessar/i });

      // Teste com senha fraca (sem maiúscula e sem símbolo)
      fireEvent.change(senhaInput, { target: { value: 'senha123' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('A senha deve conter pelo menos 1 letra maiúscula.')).toBeInTheDocument();
      });
    });

    it('2.3 Exibe erro caso o e-mail já esteja cadastrado no backend', async () => {
      const mockNavigate = vi.fn();
      const mockAddToast = vi.fn();

      vi.spyOn(api, 'registerApi').mockRejectedValueOnce(
        new Error('Este e-mail já está cadastrado no sistema.')
      );

      render(
        <AuthProvider>
          <CadastroPage navigate={mockNavigate} addToast={mockAddToast} />
        </AuthProvider>
      );

      const nomeInput = screen.getByPlaceholderText('Ex: Carlos Eduardo Silva');
      const emailInput = screen.getByPlaceholderText('seuemail@empresa.com.br');
      const senhaInput = screen.getByPlaceholderText('Mínimo 8 caracteres e símbolos');
      const confirmaInput = screen.getByPlaceholderText('Repita a senha');
      const submitBtn = screen.getByRole('button', { name: /Concluir Cadastro e Acessar/i });

      fireEvent.change(nomeInput, { target: { value: 'Usuario Repetido' } });
      fireEvent.change(emailInput, { target: { value: 'admin@orcamaster.com.br' } });
      fireEvent.change(senhaInput, { target: { value: 'SenhaValida@123' } });
      fireEvent.change(confirmaInput, { target: { value: 'SenhaValida@123' } });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith(
          'Erro no Cadastro',
          'error',
          'Este e-mail já está cadastrado no sistema.'
        );
      });
    });
  });

  describe('3. SECURITY VULNERABILITIES (Segurança / Interface)', () => {
    it('3.1 Não deve exibir o termo técnico JWT na página de login, cadastro ou logout', () => {
      const mockNavigate = vi.fn();
      const mockAddToast = vi.fn();

      render(
        <AuthProvider>
          <LoginPage navigate={mockNavigate} addToast={mockAddToast} />
        </AuthProvider>
      );

      expect(screen.queryByText(/JWT/i)).toBeNull();
      expect(screen.queryByText(/JSON Web Tokens/i)).toBeNull();
    });
  });
});
