import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { MeuPerfilPage } from '../pages/MeuPerfilPage';
import App from '../App';
import * as api from '../services/api';

const TestAuthConsumer = () => {
  const { user, token, logout } = useAuth();
  return (
    <div>
      <span data-testid="user-email">{user?.email || 'no-user'}</span>
      <span data-testid="token-status">{token ? 'authenticated' : 'unauthenticated'}</span>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

describe('1. HAPPY PATH (Caminho Feliz)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('1.1 Realiza o login com sucesso e armazena o token JWT no localStorage', async () => {
    const mockNavigate = vi.fn();
    const mockAddToast = vi.fn();

    vi.spyOn(api, 'loginApi').mockResolvedValueOnce({
      token: 'jwt.mock.token.123',
      user: {
        id: 'USR-001',
        nome: 'Gerente Administrador',
        email: 'admin@orcamaster.com.br',
      },
    });

    render(
      <AuthProvider>
        <LoginPage navigate={mockNavigate} addToast={mockAddToast} />
        <TestAuthConsumer />
      </AuthProvider>
    );

    const emailInput = screen.getByPlaceholderText('exemplo@orcamaster.com.br');
    const senhaInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /Entrar no Sistema/i });

    fireEvent.change(emailInput, { target: { value: 'admin@orcamaster.com.br' } });
    fireEvent.change(senhaInput, { target: { value: 'senha123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.loginApi).toHaveBeenCalledWith('admin@orcamaster.com.br', 'senha123');
      expect(localStorage.getItem('orcamento_jwt_token')).toBe('jwt.mock.token.123');
      expect(mockAddToast).toHaveBeenCalledWith('Autenticado com sucesso!', 'success', expect.any(String));
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('1.2 Atualiza as informações do perfil do usuário com sucesso', async () => {
    const mockNavigate = vi.fn();
    const mockAddToast = vi.fn();

    localStorage.setItem('orcamento_jwt_token', 'valid.token');
    localStorage.setItem(
      'orcamento_user',
      JSON.stringify({
        id: 'USR-001',
        nome: 'Gerente Administrador',
        email: 'admin@orcamaster.com.br',
      })
    );

    vi.spyOn(api, 'updateUserProfileApi').mockResolvedValueOnce({
      id: 'USR-001',
      nome: 'Gerente Editado',
      email: 'admin@orcamaster.com.br',
      razaoSocial: 'Empresa Teste LTDA',
      cnpj: '12.345.678/0001-95',
      telefone: '(11) 98765-4321',
    });

    render(
      <AuthProvider>
        <MeuPerfilPage navigate={mockNavigate} addToast={mockAddToast} />
      </AuthProvider>
    );

    const nomeInput = screen.getByPlaceholderText('Ex: João Silva');
    fireEvent.change(nomeInput, { target: { value: 'Gerente Editado' } });

    const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.updateUserProfileApi).toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith('Perfil Atualizado!', 'success', expect.any(String));
    });
  });

  it('1.3 Troca a senha do usuário com sucesso (Fluxo compatível Django DRF)', async () => {
    const mockNavigate = vi.fn();
    const mockAddToast = vi.fn();

    localStorage.setItem('orcamento_jwt_token', 'valid.token');
    localStorage.setItem(
      'orcamento_user',
      JSON.stringify({
        id: 'USR-001',
        nome: 'Gerente Administrador',
        email: 'admin@orcamaster.com.br',
      })
    );

    vi.spyOn(api, 'changePasswordApi').mockResolvedValueOnce({
      message: 'Senha alterada com sucesso!',
    });

    render(
      <AuthProvider>
        <MeuPerfilPage navigate={mockNavigate} addToast={mockAddToast} />
      </AuthProvider>
    );

    const openModalBtn = screen.getByRole('button', { name: /Alterar Senha/i });
    fireEvent.click(openModalBtn);

    const oldPasswordInput = screen.getByPlaceholderText('Sua senha atual');
    const newPasswordInput = screen.getByPlaceholderText('Mínimo de 6 caracteres');
    const confirmPasswordInput = screen.getByPlaceholderText('Repita a nova senha');

    fireEvent.change(oldPasswordInput, { target: { value: 'senha123' } });
    fireEvent.change(newPasswordInput, { target: { value: 'novaSenha456' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'novaSenha456' } });

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Alteração/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(api.changePasswordApi).toHaveBeenCalledWith('senha123', 'novaSenha456');
      expect(mockAddToast).toHaveBeenCalledWith('Senha Alterada!', 'success', expect.any(String));
    });
  });
});

describe('2. EDGE CASES (Casos de Borda e Erros)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('2.1 Exibe erro quando o login falha por credenciais inválidas', async () => {
    const mockNavigate = vi.fn();
    const mockAddToast = vi.fn();

    vi.spyOn(api, 'loginApi').mockRejectedValueOnce(new Error('E-mail ou senha incorretos.'));

    render(
      <AuthProvider>
        <LoginPage navigate={mockNavigate} addToast={mockAddToast} />
      </AuthProvider>
    );

    const emailInput = screen.getByPlaceholderText('exemplo@orcamaster.com.br');
    const senhaInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /Entrar no Sistema/i });

    fireEvent.change(emailInput, { target: { value: 'errado@orcamaster.com.br' } });
    fireEvent.change(senhaInput, { target: { value: 'errada' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('Falha no Login', 'error', 'E-mail ou senha incorretos.');
      expect(localStorage.getItem('orcamento_jwt_token')).toBeNull();
    });
  });

  it('2.2 Impede alteração de senha se a confirmação de senha não coincidir', async () => {
    const mockNavigate = vi.fn();
    const mockAddToast = vi.fn();
    const spyChangePassword = vi.spyOn(api, 'changePasswordApi');

    localStorage.setItem('orcamento_jwt_token', 'valid.token');
    localStorage.setItem('orcamento_user', JSON.stringify({ id: '1', nome: 'User', email: 'test@test.com' }));

    render(
      <AuthProvider>
        <MeuPerfilPage navigate={mockNavigate} addToast={mockAddToast} />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Alterar Senha/i }));

    const oldInput = screen.getByPlaceholderText('Sua senha atual');
    const newInput = screen.getByPlaceholderText('Mínimo de 6 caracteres');
    const confirmInput = screen.getByPlaceholderText('Repita a nova senha');

    fireEvent.change(oldInput, { target: { value: 'senha123' } });
    fireEvent.change(newInput, { target: { value: 'novaSenha123' } });
    fireEvent.change(confirmInput, { target: { value: 'diferente123' } });

    const modalForm = oldInput.closest('form')!;
    fireEvent.submit(modalForm);

    expect(mockAddToast).toHaveBeenCalledWith('Senhas não conferem', 'error', expect.any(String));
    expect(spyChangePassword).not.toHaveBeenCalled();
  });

  it('2.3 Impede alteração de senha quando a nova senha é menor que 6 caracteres', async () => {
    const mockNavigate = vi.fn();
    const mockAddToast = vi.fn();
    const spyChangePassword = vi.spyOn(api, 'changePasswordApi');

    localStorage.setItem('orcamento_jwt_token', 'valid.token');
    localStorage.setItem('orcamento_user', JSON.stringify({ id: '1', nome: 'User', email: 'test@test.com' }));

    render(
      <AuthProvider>
        <MeuPerfilPage navigate={mockNavigate} addToast={mockAddToast} />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Alterar Senha/i }));

    const oldInput = screen.getByPlaceholderText('Sua senha atual');
    const newInput = screen.getByPlaceholderText('Mínimo de 6 caracteres');
    const confirmInput = screen.getByPlaceholderText('Repita a nova senha');

    fireEvent.change(oldInput, { target: { value: 'senha123' } });
    fireEvent.change(newInput, { target: { value: '123' } });
    fireEvent.change(confirmInput, { target: { value: '123' } });

    const modalForm = oldInput.closest('form')!;
    fireEvent.submit(modalForm);

    expect(mockAddToast).toHaveBeenCalledWith('Nova senha inválida', 'error', expect.any(String));
    expect(spyChangePassword).not.toHaveBeenCalled();
  });
});

describe('3. SECURITY VULNERABILITIES (Segurança e Autenticação)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('3.1 Executa logout limpando tokens do localStorage e revogando a sessão', async () => {
    localStorage.setItem('orcamento_jwt_token', 'jwt.secret.token');
    localStorage.setItem('orcamento_user', JSON.stringify({ id: 'USR-001', nome: 'Admin' }));

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('token-status').textContent).toBe('authenticated');

    fireEvent.click(screen.getByTestId('logout-btn'));

    await waitFor(() => {
      expect(localStorage.getItem('orcamento_jwt_token')).toBeNull();
      expect(localStorage.getItem('orcamento_user')).toBeNull();
      expect(screen.getByTestId('token-status').textContent).toBe('unauthenticated');
    });
  });

  it('3.2 Previne contaminação de estado ao carregar com localStorage corrompido ou sem token', () => {
    localStorage.setItem('orcamento_user', 'invalid-json{{{');
    localStorage.setItem('orcamento_jwt_token', '');

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('token-status').textContent).toBe('unauthenticated');
    expect(screen.getByTestId('user-email').textContent).toBe('no-user');
  });

  it('3.3 Redireciona usuário não autenticado que tenta acessar rota protegida para a tela de Login', async () => {
    window.history.pushState({}, '', '/dashboard');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Sistema de Orçamentos')).toBeDefined();
      expect(screen.getByRole('button', { name: /Entrar no Sistema/i })).toBeDefined();
    });
  });

  it('3.4 Permite acesso às rotas protegidas quando o token JWT válido está presente', async () => {
    localStorage.setItem('orcamento_jwt_token', 'token.valido.jwt');
    localStorage.setItem(
      'orcamento_user',
      JSON.stringify({
        id: 'USR-001',
        nome: 'Administrador Sistema',
        email: 'admin@orcamaster.com.br',
      })
    );

    window.history.pushState({}, '', '/dashboard/meu-perfil');

    vi.spyOn(api, 'fetchClientes').mockResolvedValue([]);
    vi.spyOn(api, 'fetchOrcamentos').mockResolvedValue([]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Dados do Usuário e da Empresa')).toBeDefined();
    });
  });
});
