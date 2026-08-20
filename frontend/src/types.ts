export interface Cliente {
  id: string;
  nome: string;
  celular: string;
  email: string;
  apelido: string;
  criadoEm?: string;
}

export interface ItemOrcamento {
  id: string;
  orcamento_id: string;
  servico: string;
  descricao?: string;
  local: string;
  valor: number;
}

export interface Orcamento {
  id: string;
  cliente_id: string;
  data: string;
  dataEntrega?: string;
  status?: 'Pendente' | 'Aprovado' | 'Recusado' | 'Em Andamento';
  observacoes?: string;
  arquivo?: string;
  arquivoNome?: string;
  introducao?: string;
  materiaPrima?: string;
  formaPagamento?: string;
  cliente?: Cliente;
  itens: ItemOrcamento[];
  valorTotal?: number;
  criadoEm?: string;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  endereco?: string;
  telefone?: string;
  cnpj?: string;
  logomarca?: string;
  introducao?: string;
  materiaPrima?: string;
  formaPagamento?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface PasswordResetResponse {
  message: string;
  tokenDemo?: string; // Token generated for demonstration if needed
}
