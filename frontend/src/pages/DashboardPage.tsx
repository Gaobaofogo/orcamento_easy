import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClientes, fetchOrcamentos, deleteCliente, deleteOrcamento, updateOrcamento } from '../services/api';
import { Cliente, Orcamento } from '../types';
import { OrcamentoPrintView } from '../components/OrcamentoPrintView';
import { formatDate, formatPhone } from '../utils/formatters';
import {
  Users, FileText, PlusCircle, Search, Filter, Trash2, Edit3, Eye, EyeOff, DollarSign,
  TrendingUp, CheckCircle2, Clock, AlertTriangle, ArrowUpRight, Phone, Mail, Tag,
  RefreshCw, UserPlus, FilePlus, ChevronLeft, ChevronRight
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

interface DashboardPageProps {
  navigate: (path: string) => void;
  setEditingCliente: (cliente: Cliente | null) => void;
  setEditingOrcamento: (orcamento: Orcamento | null) => void;
  addToast: (title: string, type: 'success' | 'error' | 'info', description?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  navigate,
  setEditingCliente,
  setEditingOrcamento,
  addToast
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'orcamentos' | 'clientes'>('orcamentos');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [viewingOrcamento, setViewingOrcamento] = useState<Orcamento | null>(null);
  const [showVolume, setShowVolume] = useState<boolean>(false);
  const [showPendentesVal, setShowPendentesVal] = useState<boolean>(false);

  // Pagination state
  const [orcamentosPage, setOrcamentosPage] = useState<number>(1);
  const [clientesPage, setClientesPage] = useState<number>(1);

  // Reset pagination when searching, filtering or changing tabs
  useEffect(() => {
    setOrcamentosPage(1);
    setClientesPage(1);
  }, [searchQuery, statusFilter, activeTab]);

  // Queries
  const { data: clientes = [], isLoading: loadingClientes, refetch: refetchClientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: fetchClientes
  });

  const { data: orcamentos = [], isLoading: loadingOrcamentos, refetch: refetchOrcamentos } = useQuery({
    queryKey: ['orcamentos'],
    queryFn: fetchOrcamentos
  });

  // Mutations
  const deleteClienteMutation = useMutation({
    mutationFn: deleteCliente,
    onSuccess: () => {
      addToast('Cliente removido', 'success', 'O cliente e seus orçamentos foram excluídos.');
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
    },
    onError: (err: any) => {
      addToast('Erro ao remover', 'error', err.message);
    }
  });

  const deleteOrcamentoMutation = useMutation({
    mutationFn: deleteOrcamento,
    onSuccess: () => {
      addToast('Orçamento excluído', 'success', 'O orçamento foi removido com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
    },
    onError: (err: any) => {
      addToast('Erro ao excluir', 'error', err.message);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) => updateOrcamento(id, { status }),
    onSuccess: (data) => {
      addToast('Status atualizado!', 'success', `Orçamento #${data.id} marcado como ${data.status}.`);
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      if (viewingOrcamento && viewingOrcamento.id === data.id) {
        setViewingOrcamento(data);
      }
    }
  });

  // Currency Formatter
  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // KPI Calculations
  const totalOrcamentosVal = orcamentos.reduce((acc, curr) => acc + (curr.valorTotal || 0), 0);
  const aprovadosCount = orcamentos.filter(o => o.status === 'Aprovado').length;
  const pendentesOrcamentos = orcamentos.filter(o => o.status === 'Pendente');
  const pendentesCount = pendentesOrcamentos.length;
  const pendentesVal = pendentesOrcamentos.reduce((acc, curr) => acc + (curr.valorTotal || 0), 0);

  // Filtered Lists
  const filteredOrcamentos = orcamentos.filter(o => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.cliente?.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.cliente?.apelido.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.observacoes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.itens.some(i =>
        i.servico.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.descricao?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.local.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus = statusFilter === 'Todos' || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredClientes = clientes.filter(c => {
    return (
      c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.apelido.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.celular.includes(searchQuery)
    );
  });

  // Pagination Calculations - Orçamentos
  const totalOrcamentoPages = Math.ceil(filteredOrcamentos.length / ITEMS_PER_PAGE) || 1;
  const currentOrcamentosPage = Math.min(orcamentosPage, totalOrcamentoPages);
  const paginatedOrcamentos = filteredOrcamentos.slice(
    (currentOrcamentosPage - 1) * ITEMS_PER_PAGE,
    currentOrcamentosPage * ITEMS_PER_PAGE
  );

  // Pagination Calculations - Clientes
  const totalClientePages = Math.ceil(filteredClientes.length / ITEMS_PER_PAGE) || 1;
  const currentClientesPage = Math.min(clientesPage, totalClientePages);
  const paginatedClientes = filteredClientes.slice(
    (currentClientesPage - 1) * ITEMS_PER_PAGE,
    currentClientesPage * ITEMS_PER_PAGE
  );

  const handleEditCliente = (c: Cliente) => {
    setEditingCliente(c);
    navigate('/dashboard/criar-cliente');
  };

  const handleEditOrcamento = (o: Orcamento) => {
    console.log("orcamento", o);
    setEditingOrcamento(o);
    navigate('/dashboard/criar-orçamento');
  };

  const handleCreateNewCliente = () => {
    setEditingCliente(null);
    navigate('/dashboard/criar-cliente');
  };

  const handleCreateNewOrcamento = (clienteId?: string) => {
    setEditingOrcamento(null);
    if (clienteId) {
      // Create for specific client
      setEditingOrcamento({ cliente_id: clienteId } as any);
    }
    navigate('/dashboard/criar-orçamento');
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Aprovado':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Aprovado</span>;
      case 'Em Andamento':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200"><Clock className="w-3.5 h-3.5 text-sky-600" /> Em Andamento</span>;
      case 'Recusado':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"><AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Recusado</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3.5 h-3.5 text-amber-600" /> Pendente</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Hero Header */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Painel Gerencial de Orçamentos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie seus clientes, elabore orçamentos detalhados com itens e controle status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCreateNewCliente}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
          >
            <UserPlus className="w-4 h-4 text-slate-600" />
            + Novo Cliente
          </button>
          <button
            onClick={() => handleCreateNewOrcamento()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-400 hover:bg-orange-500 text-slate-200 font-bold rounded-lg text-xs shadow-sm transition-all cursor-pointer"
          >
            <FilePlus className="w-4 h-4" />
            + Criar Orçamento
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total de Clientes</span>
            <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{clientes.length}</div>
          <p className="text-[11px] text-slate-500">Clientes cadastrados na base</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Orçamentos</span>
            <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{orcamentos.length}</div>
          <p className="text-[11px] text-slate-500">{aprovadosCount} aprovados • {pendentesCount} pendentes</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Volume Financeiro</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowVolume(!showVolume)}
                className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded-md hover:bg-slate-100 cursor-pointer"
                title={showVolume ? "Ocultar Volume Financeiro" : "Exibir Volume Financeiro"}
              >
                {showVolume ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-orange-600" />}
              </button>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            {showVolume ? formatCurrency(totalOrcamentosVal) : 'R$ ***,**'}
          </div>
          <p className="text-[11px] text-slate-500">Soma de todos os orçamentos</p>
        </div>

        {/* Novo KPI: Pendentes */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pendentes</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowPendentesVal(!showPendentesVal)}
                className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded-md hover:bg-slate-100 cursor-pointer"
                title={showPendentesVal ? "Ocultar Valor dos Pendentes" : "Exibir Valor dos Pendentes"}
              >
                {showPendentesVal ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-amber-600" />}
              </button>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono">
            {showPendentesVal ? formatCurrency(pendentesVal) : 'R$ ***,**'}
          </div>
          <p className="text-[11px] text-slate-500">
            {pendentesCount} {pendentesCount === 1 ? 'orçamento pendente' : 'orçamentos pendentes'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Taxa de Aprovados</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-sky-700">
            {orcamentos.length > 0 ? `${Math.round((aprovadosCount / orcamentos.length) * 100)}%` : '0%'}
          </div>
          <p className="text-[11px] text-slate-500">Aprovação comercial</p>
        </div>
      </div>

      {/* Navigation Tabs and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('orcamentos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'orcamentos'
                  ? 'bg-orange-400 text-slate-100 font-bold shadow-sm'
                  : 'bg-white text-slate-200 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Orçamentos ({orcamentos.length})
            </button>

            <button
              onClick={() => setActiveTab('clientes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'clientes'
                  ? 'bg-orange-400 text-slate-100 font-bold shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Clientes ({clientes.length})
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] sm:min-w-[260px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'orcamentos' ? 'Buscar orçamento, cliente, item...' : 'Buscar cliente por nome, email...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {activeTab === 'orcamentos' && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="Todos">Todos Status</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Aprovado">Aprovado</option>
                  <option value="Recusado">Recusado</option>
                </select>
              </div>
            )}

            <button
              onClick={() => {
                refetchClientes();
                refetchOrcamentos();
                addToast('Dados atualizados', 'info');
              }}
              title="Recarregar"
              className="p-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* TAB 1: ORÇAMENTOS LIST */}
        {activeTab === 'orcamentos' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {loadingOrcamentos ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-orange-600 border-t-transparent" />
                <p className="text-xs">Carregando orçamentos do sistema...</p>
              </div>
            ) : filteredOrcamentos.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-800">Nenhum orçamento encontrado</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery || statusFilter !== 'Todos'
                    ? 'Tente ajustar os filtros ou termos de busca.'
                    : 'Ainda não há orçamentos cadastrados. Clique no botão abaixo para criar o primeiro.'}
                </p>
                <button
                  onClick={() => handleCreateNewOrcamento()}
                  className="mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 bg-orange-400 hover:bg-orange-500 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Criar Primeiro Orçamento
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3.5">Identificador</th>
                      <th className="py-2.5 px-3.5">Cliente</th>
                      <th className="py-2.5 px-3.5">Datas (Emissão / Entrega)</th>
                      <th className="py-2.5 px-3.5">Itens</th>
                      <th className="py-2.5 px-3.5">Anexo</th>
                      <th className="py-2.5 px-3.5">Valor Total (R$)</th>
                      <th className="py-2.5 px-3.5">Status</th>
                      <th className="py-2.5 px-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedOrcamentos.map(orc => (
                      <tr key={orc.id} className="hover:bg-orange-50/40 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono font-bold text-orange-600">
                          #{orc.id}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="font-semibold text-slate-900">{orc.cliente?.nome || 'Cliente Desconhecido'}</div>
                          <div className="text-[11px] text-slate-500">{orc.cliente?.apelido ? `"${orc.cliente.apelido}"` : ''} • {orc.cliente?.email || ''}</div>
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600 font-medium">
                          <div><span className="text-[10px] text-slate-400 block">Emissão:</span> {formatDate(orc.data)}</div>
                          {orc.dataEntrega && (
                            <div className="text-amber-700 font-semibold"><span className="text-[10px] text-amber-600 font-normal block">Entrega:</span> {formatDate(orc.dataEntrega)}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">
                            {orc.itens?.length || 0} item(ns)
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5">
                          {orc.arquivo ? (
                            <a
                              href={orc.arquivo}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-orange-600 hover:underline font-semibold bg-orange-50 px-2 py-0.5 rounded border border-orange-100"
                            >
                              Anexo
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 font-mono font-bold text-emerald-700 text-xs">
                          {formatCurrency(orc.valorTotal)}
                        </td>
                        <td className="py-2.5 px-3.5">
                          {getStatusBadge(orc.status)}
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingOrcamento(orc)}
                              title="Visualizar Detalhes & Imprimir"
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleEditOrcamento(orc)}
                              title="Editar Orçamento"
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja excluir o orçamento #${orc.id}?`)) {
                                  deleteOrcamentoMutation.mutate(orc.id);
                                }
                              }}
                              title="Excluir Orçamento"
                              className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              {filteredOrcamentos.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
                  <div>
                    Exibindo{' '}
                    <span className="font-bold text-slate-900">
                      {(currentOrcamentosPage - 1) * ITEMS_PER_PAGE + 1}
                    </span>{' '}
                    a{' '}
                    <span className="font-bold text-slate-900">
                      {Math.min(currentOrcamentosPage * ITEMS_PER_PAGE, filteredOrcamentos.length)}
                    </span>{' '}
                    de <span className="font-bold text-slate-900">{filteredOrcamentos.length}</span> orçamentos
                  </div>

                  {totalOrcamentoPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setOrcamentosPage(p => Math.max(1, p - 1))}
                        disabled={currentOrcamentosPage === 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-slate-700 transition-colors cursor-pointer"
                        aria-label="Página Anterior Orçamentos"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Anterior
                      </button>

                      <span className="px-3 py-1.5 font-semibold text-slate-700">
                        Página {currentOrcamentosPage} de {totalOrcamentoPages}
                      </span>

                      <button
                        onClick={() => setOrcamentosPage(p => Math.min(totalOrcamentoPages, p + 1))}
                        disabled={currentOrcamentosPage === totalOrcamentoPages}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-slate-700 transition-colors cursor-pointer"
                        aria-label="Próxima Página Orçamentos"
                      >
                        Próxima
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          </div>
        )}

        {/* TAB 2: CLIENTES LIST */}
        {activeTab === 'clientes' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {loadingClientes ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-orange-600 border-t-transparent" />
                <p className="text-xs">Carregando lista de clientes...</p>
              </div>
            ) : filteredClientes.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <Users className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-800">Nenhum cliente encontrado</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery ? 'Não encontramos nenhum cliente com estes dados.' : 'Comece cadastrando seu primeiro cliente.'}
                </p>
                <button
                  onClick={handleCreateNewCliente}
                  className="mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 bg-orange-400 hover:bg-orange-500 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Cadastrar Cliente
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3.5">Identificador</th>
                      <th className="py-2.5 px-3.5">Nome do Cliente</th>
                      <th className="py-2.5 px-3.5">Apelido</th>
                      <th className="py-2.5 px-3.5">Contatos</th>
                      <th className="py-2.5 px-3.5">Orçamentos Vinculados</th>
                      <th className="py-2.5 px-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedClientes.map(cli => {
                      const clientOrcamentos = orcamentos.filter(o => o.cliente_id === cli.id);
                      return (
                        <tr key={cli.id} className="hover:bg-orange-50/40 transition-colors">
                          <td className="py-2.5 px-3.5 font-mono font-bold text-slate-500">{cli.id}</td>
                          <td className="py-2.5 px-3.5 font-semibold text-slate-900 text-xs">{cli.nome}</td>
                          <td className="py-2.5 px-3.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-orange-700 text-[11px] font-medium border border-slate-200">
                              <Tag className="w-3 h-3 text-orange-500" />
                              {cli.apelido || '-'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 space-y-0.5">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{formatPhone(cli.celular)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{cli.email}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3.5">
                            <span className="font-semibold text-slate-700">
                              {clientOrcamentos.length} orçamento(s)
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleCreateNewOrcamento(cli.id)}
                                title="Criar Orçamento para este Cliente"
                                className="px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors"
                              >
                                <PlusCircle className="w-3 h-3" />
                                Orçamento
                              </button>
                              <button
                                onClick={() => handleEditCliente(cli)}
                                title="Editar Cliente"
                                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Excluir o cliente "${cli.nome}"? Seus orçamentos também serão removidos.`)) {
                                    deleteClienteMutation.mutate(cli.id);
                                  }
                                }}
                                title="Excluir Cliente"
                                className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-md transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              {filteredClientes.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
                  <div>
                    Exibindo{' '}
                    <span className="font-bold text-slate-900">
                      {(currentClientesPage - 1) * ITEMS_PER_PAGE + 1}
                    </span>{' '}
                    a{' '}
                    <span className="font-bold text-slate-900">
                      {Math.min(currentClientesPage * ITEMS_PER_PAGE, filteredClientes.length)}
                    </span>{' '}
                    de <span className="font-bold text-slate-900">{filteredClientes.length}</span> clientes
                  </div>

                  {totalClientePages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setClientesPage(p => Math.max(1, p - 1))}
                        disabled={currentClientesPage === 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-slate-700 transition-colors cursor-pointer"
                        aria-label="Página Anterior Clientes"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Anterior
                      </button>

                      <span className="px-3 py-1.5 font-semibold text-slate-700">
                        Página {currentClientesPage} de {totalClientePages}
                      </span>

                      <button
                        onClick={() => setClientesPage(p => Math.min(totalClientePages, p + 1))}
                        disabled={currentClientesPage === totalClientePages}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-slate-700 transition-colors cursor-pointer"
                        aria-label="Próxima Página Clientes"
                      >
                        Próxima
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          </div>
        )}
      </div>

      {/* Modal View for Budget */}
      {viewingOrcamento && (
        <OrcamentoPrintView
	  isOpen={viewingOrcamento}
          orcamento={viewingOrcamento}
          onClose={() => setViewingOrcamento(null)}
          onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
        />
      )}
    </div>
  );
};
