import { Cliente, Orcamento, User, LoginResponse, PasswordResetResponse } from '../types';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('orcamento_jwt_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export async function loginApi(email: string, senha: string): Promise<LoginResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, senha })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao realizar login.');
  }
  return data;
}

export async function registerApi(userData: {
  nome: string;
  email: string;
  senha: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  telefone?: string;
  endereco?: string;
}): Promise<LoginResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(userData)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao realizar cadastro.');
  }
  return data;
}

export async function getMeApi(): Promise<User> {
  const res = await fetch('/api/auth/me', {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Sessão inválida.');
  }
  return data;
}

export async function logoutApi(): Promise<{ message: string }> {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  return res.json();
}

export async function updateUserProfileApi(userData: Partial<User>): Promise<User> {
  const res = await fetch('/api/user/profile', {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(userData)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao atualizar perfil do usuário.');
  }
  return data;
}

export async function changePasswordApi(oldPassword: string, newPassword: string): Promise<{ message: string }> {
  const res = await fetch('/api/user/change-password', {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword, senha_atual: oldPassword, nova_senha: newPassword })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || (Array.isArray(data.old_password) ? data.old_password[0] : 'Erro ao alterar a senha.'));
  }
  return data;
}

export async function esqueciSenhaApi(email: string): Promise<PasswordResetResponse> {
  const res = await fetch('/api/auth/esqueci-a-senha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao solicitar recuperação de senha.');
  }
  return data;
}

export async function resetPasswordApi(token: string, novaSenha: string): Promise<{ message: string }> {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token, novaSenha })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao redefinir a senha.');
  }
  return data;
}

export async function fetchClientes(): Promise<Cliente[]> {
  const res = await fetch('/api/clientes', {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Falha ao buscar clientes.');
  }
  return res.json();
}

export async function createCliente(clienteData: Partial<Cliente>): Promise<Cliente> {
  const res = await fetch('/api/clientes', {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(clienteData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao cadastrar cliente.');
  }
  return data;
}

export async function updateCliente(id: string, clienteData: Partial<Cliente>): Promise<Cliente> {
  const res = await fetch(`/api/clientes/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(clienteData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao atualizar cliente.');
  }
  return data;
}

export async function deleteCliente(id: string): Promise<{ message: string }> {
  const res = await fetch(`/api/clientes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao remover cliente.');
  }
  return data;
}

export async function fetchOrcamentos(): Promise<Orcamento[]> {
  const res = await fetch('/api/orcamentos', {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Falha ao buscar orçamentos.');
  }
  return res.json();
}

export async function fetchOrcamentoById(id: string): Promise<Orcamento> {
  const res = await fetch(`/api/orcamentos/${id}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Falha ao carregar o orçamento.');
  }
  return res.json();
}

export async function createOrcamento(orcamentoData: any): Promise<Orcamento> {
  const res = await fetch('/api/orcamentos', {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(orcamentoData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao criar orçamento.');
  }
  return data;
}

export async function updateOrcamento(id: string, orcamentoData: any): Promise<Orcamento> {
  const res = await fetch(`/api/orcamentos/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(orcamentoData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao atualizar orçamento.');
  }
  return data;
}

export async function deleteOrcamento(id: string): Promise<{ message: string }> {
  const res = await fetch(`/api/orcamentos/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({})
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao excluir orçamento.');
  }
  return data;
}
