import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loginApi,
  updateUserProfileApi,
  changePasswordApi,
  esqueciSenhaApi,
  resetPasswordApi,
  fetchClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  fetchOrcamentos,
  fetchOrcamentoById,
  createOrcamento,
  updateOrcamento,
  deleteOrcamento,
} from '../services/api';

describe('API Service Unit Tests (Segurança e Comunicação Backend)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('loginApi: realiza requisição POST para /api/auth/login e envia credenciais', async () => {
    const mockResponse = { token: 'jwt.123', user: { id: '1', email: 'test@test.com' } };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await loginApi('test@test.com', 'senha123');

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: 'test@test.com', senha: 'senha123' }),
    });
    expect(result).toEqual(mockResponse);
  });

  it('loginApi: lança erro em caso de credenciais inválidas', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Credenciais inválidas' }),
    } as Response);

    await expect(loginApi('test@test.com', 'errada')).rejects.toThrow('Credenciais inválidas');
  });

  it('updateUserProfileApi: envia token JWT no header Authorization', async () => {
    localStorage.setItem('orcamento_jwt_token', 'my-jwt-token');

    const mockUser = { id: '1', nome: 'Nome Atualizado', email: 'test@test.com' };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    } as Response);

    const result = await updateUserProfileApi({ nome: 'Nome Atualizado' });

    expect(global.fetch).toHaveBeenCalledWith('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer my-jwt-token',
      },
      credentials: 'include',
      body: JSON.stringify({ nome: 'Nome Atualizado' }),
    });
    expect(result).toEqual(mockUser);
  });

  it('changePasswordApi: envia payload compatível com Django DRF (old_password, new_password)', async () => {
    localStorage.setItem('orcamento_jwt_token', 'my-jwt-token');

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Senha alterada com sucesso.' }),
    } as Response);

    const result = await changePasswordApi('antiga123', 'nova123456');

    expect(global.fetch).toHaveBeenCalledWith('/api/user/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer my-jwt-token',
      },
      credentials: 'include',
      body: JSON.stringify({
        old_password: 'antiga123',
        new_password: 'nova123456',
        senha_atual: 'antiga123',
        nova_senha: 'nova123456',
      }),
    });
    expect(result.message).toBe('Senha alterada com sucesso.');
  });

  it('esqueciSenhaApi & resetPasswordApi: realizam requisições de recuperação de senha', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'E-mail de recuperação enviado' }),
    } as Response);

    const res1 = await esqueciSenhaApi('test@test.com');
    expect(res1.message).toBe('E-mail de recuperação enviado');

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Senha redefinida' }),
    } as Response);

    const res2 = await resetPasswordApi('token123', 'novaSenha123');
    expect(res2.message).toBe('Senha redefinida');
  });

  it('fetchClientes e fetchOrcamentos: exigem autorização via token JWT e retornam coleções', async () => {
    localStorage.setItem('orcamento_jwt_token', 'my-jwt-token');

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'CLI-1', nome: 'Cliente 1' }],
    } as Response);

    const clientes = await fetchClientes();
    expect(clientes).toHaveLength(1);

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 'ORC-1', observacoes: 'Orçamento 1' }],
    } as Response);

    const orcamentos = await fetchOrcamentos();
    expect(orcamentos).toHaveLength(1);
  });

  it('createCliente, updateCliente e deleteCliente: gerenciam CRUD de clientes', async () => {
    localStorage.setItem('orcamento_jwt_token', 'my-jwt-token');

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'CLI-1', nome: 'Novo Cliente' }),
    } as Response);

    const created = await createCliente({ nome: 'Novo Cliente' });
    expect(created.id).toBe('CLI-1');

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'CLI-1', nome: 'Cliente Editado' }),
    } as Response);

    const updated = await updateCliente('CLI-1', { nome: 'Cliente Editado' });
    expect(updated.nome).toBe('Cliente Editado');

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Cliente removido' }),
    } as Response);

    const deleted = await deleteCliente('CLI-1');
    expect(deleted.message).toBe('Cliente removido');
  });

  it('createOrcamento, updateOrcamento e deleteOrcamento: gerenciam CRUD de orçamentos', async () => {
    localStorage.setItem('orcamento_jwt_token', 'my-jwt-token');

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'ORC-1', observacoes: 'Novo Orçamento' }),
    } as Response);

    const created = await createOrcamento({ observacoes: 'Novo Orçamento' });
    expect(created.id).toBe('ORC-1');

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'ORC-1', observacoes: 'Orçamento Editado' }),
    } as Response);

    const updated = await updateOrcamento('ORC-1', { observacoes: 'Orçamento Editado' });
    expect(updated.observacoes).toBe('Orçamento Editado');

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Orçamento excluído' }),
    } as Response);

    const deleted = await deleteOrcamento('ORC-1');
    expect(deleted.message).toBe('Orçamento excluído');
  });
});
