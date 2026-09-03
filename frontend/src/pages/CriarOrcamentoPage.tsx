import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClientes, createOrcamento, updateOrcamento, getAnexoFile } from '../services/api';
import { Orcamento, ItemOrcamento } from '../types';
import { useAuth } from '../context/AuthContext';
import { RichTextEditor } from '../components/RichTextEditor';
import {
  FileText, User, Calendar, Plus, Trash2, ArrowLeft, Save, MapPin, DollarSign,
  Upload, Paperclip, CheckCircle2, Clock, FilePlus, AlertCircle, FileCode2
} from 'lucide-react';

interface CriarOrcamentoPageProps {
  editingOrcamento: Orcamento | null;
  navigate: (path: string) => void;
  addToast: (title: string, type: 'success' | 'error' | 'info', description?: string) => void;
}

interface ItemInput {
  id?: string;
  servico: string;
  descricao?: string;
  local: string;
  valor: number;
}

interface OrcamentoFormInputs {
  cliente_id: string;
  data: string;
  dataEntrega?: string;
  status: 'Pendente' | 'Aprovado' | 'Recusado' | 'Em Andamento';
  observacoes: string;
  arquivo?: string;
  arquivoId?: string;
  arquivoNome?: string;
  introducao?: string;
  materiaPrima?: string;
  formaPagamento?: string;
  itens: ItemInput[];
}

export const CriarOrcamentoPage: React.FC<CriarOrcamentoPageProps> = ({
  editingOrcamento,
  navigate,
  addToast
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!(editingOrcamento && editingOrcamento.id);

  // Fetch clients for dropdown
  const { data: clientes = [], isLoading: loadingClientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: fetchClientes
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors }
  } = useForm<OrcamentoFormInputs>({
    defaultValues: {
      cliente_id: editingOrcamento?.cliente_id || '',
      data: editingOrcamento?.data || todayStr,
      dataEntrega: editingOrcamento?.dataEntrega || '',
      status: editingOrcamento?.status || 'Pendente',
      observacoes: editingOrcamento?.observacoes || '',
      arquivo: editingOrcamento?.arquivo || '',
      arquivoId: editingOrcamento?.arquivoId || '',
      arquivoNome: editingOrcamento?.arquivoNome || '',
      introducao: editingOrcamento ? (editingOrcamento.introducao || '') : (user?.introducao || ''),
      materiaPrima: editingOrcamento ? (editingOrcamento.materiaPrima || '') : (user?.materiaPrima || ''),
      formaPagamento: editingOrcamento ? (editingOrcamento.formaPagamento || '') : (user?.formaPagamento || ''),
      itens: editingOrcamento?.itens && editingOrcamento.itens.length > 0
        ? editingOrcamento.itens.map(i => ({
            id: i.id,
            servico: i.servico,
            descricao: i.descricao || '',
            local: i.local,
            valor: i.valor
          }))
        : [
            {
              servico: '',
              descricao: '',
              local: '',
              valor: 0
            }
          ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'itens'
  });
let teste = watch('arquivoId');
console.log(editingOrcamento);

  useEffect(() => {
    if (editingOrcamento) {
      reset({
        cliente_id: editingOrcamento.cliente_id || '',
        data: editingOrcamento.data || todayStr,
        dataEntrega: editingOrcamento.dataEntrega || '',
        status: editingOrcamento.status || 'Pendente',
        observacoes: editingOrcamento.observacoes || '',
        arquivo: editingOrcamento.arquivo || '',
        arquivoId: editingOrcamento.arquivoId || '',
        arquivoNome: editingOrcamento.arquivoNome || '',
        introducao: editingOrcamento.introducao ?? (user?.introducao || ''),
        materiaPrima: editingOrcamento.materiaPrima ?? (user?.materiaPrima || ''),
        formaPagamento: editingOrcamento.formaPagamento ?? (user?.formaPagamento || ''),
        itens: editingOrcamento.itens && editingOrcamento.itens.length > 0
          ? editingOrcamento.itens.map(i => ({
              id: i.id,
              servico: i.servico,
              descricao: i.descricao || '',
              local: i.local,
              valor: i.valor
            }))
          : [
              {
                servico: '',
                descricao: '',
                local: '',
                valor: 0
              }
            ]
      });
    } else if (user) {
      // Set user profile defaults for new budgets if form values aren't dirty
      if (!watch('introducao') && user.introducao) setValue('introducao', user.introducao);
      if (!watch('materiaPrima') && user.materiaPrima) setValue('materiaPrima', user.materiaPrima);
      if (!watch('formaPagamento') && user.formaPagamento) setValue('formaPagamento', user.formaPagamento);
    }
  }, [editingOrcamento, user, reset]);

  // Dynamic Total Calculation
  const watchedItens = watch('itens');
  const totalCalculado = (watchedItens || []).reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

  const currentOrcamentoArquivo = watch('arquivo');
  const currentOrcamentoArquivoNome = watch('arquivoNome');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // Mutation to save
  const saveMutation = useMutation({
    mutationFn: (data: OrcamentoFormInputs) => {
      if (isEditing && editingOrcamento?.id) {
        return updateOrcamento(editingOrcamento.id, data);
      }
      return createOrcamento(data);
    },
    onSuccess: (res) => {
      addToast(
        isEditing ? 'Orçamento atualizado!' : 'Orçamento criado!',
        'success',
        `Orçamento #${res.id} registrado com sucesso.`
      );
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      navigate('/dashboard');
    },
    onError: (err: any) => {
      addToast('Erro ao salvar', 'error', err.message);
    }
  });

  const handleOrcamentoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue('arquivo', reader.result as string);
        setValue('arquivoNome', file.name);
        addToast('Arquivo do orçamento anexado', 'info', file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveOrcamentoFile = () => {
    setValue('arquivo', '');
    setValue('arquivoNome', '');
  };

  const onSubmit = (data: OrcamentoFormInputs) => {
    if (data.itens.length === 0) {
      addToast('Atenção', 'error', 'Adicione pelo menos um item ao orçamento.');
      return;
    }
    saveMutation.mutate(data);
  };

  const handleGetAnexoFile = async (file_id: string) => {
    //const temp_file = await getAnexoFile(file_id + '.' + editingOrcamento.arquivoNome.split('.').pop());
    const temp_file = await getAnexoFile(file_id);
    console.log(file_id);

    const url = URL.createObjectURL(temp_file);
    const a = document.createElement('a');
    a.href = url;
    a.download = editingOrcamento.arquivoNome;
    document.body.appendChild(a);
    a.click();

    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      {/* Top back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Painel
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl border border-orange-100">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                {isEditing ? `Editar Orçamento #${editingOrcamento.id}` : 'Elaborar Novo Orçamento'}
              </h1>
              <p className="text-xs text-slate-500">
                Selecione o cliente, as datas, os serviços com descrição e anexe os arquivos do orçamento.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-right">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Valor Total Estimado</span>
            <span className="text-lg font-bold text-emerald-700 font-mono">
              {formatCurrency(totalCalculado)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" enctype="multipart/form-data">
          {/* Main Info Fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Cliente */}
            <div className="space-y-1 md:col-span-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Cliente <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  {...register('cliente_id', { required: 'Selecione um cliente para o orçamento.' })}
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none cursor-pointer"
                >
                  <option value="">Selecione o Cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.apelido ? `(${c.apelido})` : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
              </div>
              {errors.cliente_id && <p className="text-xs text-rose-600">{errors.cliente_id.message}</p>}
            </div>

            {/* Data do Orçamento */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Data do Orçamento <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  {...register('data', { required: 'A data do orçamento é obrigatória.' })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              {errors.data && <p className="text-xs text-rose-600">{errors.data.message}</p>}
            </div>

            {/* Data de Entrega */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Data de Entrega
              </label>
              <div className="relative">
                <input
                  type="date"
                  {...register('dataEntrega')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Status Inicial
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="Pendente">Pendente</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Recusado">Recusado</option>
              </select>
            </div>
          </div>

          {/* Anexo do Orçamento */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-orange-600" />
              Anexo Geral do Orçamento (Documento / Planta / Projeto)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                {currentOrcamentoArquivoNome ? (
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-orange-700 bg-orange-50 px-2.5 py-1 rounded border border-orange-200 text-xs flex items-center gap-1.5 ${isEditing ? 'underline cursor-pointer' : ''}`} onClick={ isEditing ? () => handleGetAnexoFile(editingOrcamento.arquivoId) : () => {}}>
                      <Paperclip className="w-3.5 h-3.5" />
                      {currentOrcamentoArquivoNome}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveOrcamentoFile}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium underline"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">Nenhum arquivo anexado ao orçamento</span>
                )}
              </div>

              <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm">
                <Upload className="w-3.5 h-3.5 text-orange-600" />
                {currentOrcamentoArquivoNome ? 'Alterar Arquivo do Orçamento' : 'Anexar Arquivo ao Orçamento'}
                <input
                  type="file"
                  onChange={handleOrcamentoFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Observações / Termos Específicos
            </label>
            <textarea
              rows={2}
              placeholder="Descreva detalhes adicionais do serviço, prazos de execução ou condições comerciais..."
              {...register('observacoes')}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* RICH TEXT FIELDS SECTION FOR THIS BUDGET */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FileCode2 className="w-4 h-4 text-orange-600" />
                Textos Específicos do Orçamento (Editor Rich Text)
              </h3>
              <p className="text-xs text-slate-500">
                Estes campos vêm pré-preenchidos com os padrões do seu perfil e podem ser editados exclusivamente para este orçamento.
              </p>
            </div>

            <div className="space-y-4">
              {/* Introdução */}
              <RichTextEditor
                id="orcamento-field-introducao"
                label="Introdução do Orçamento"
                value={watch('introducao') || ''}
                onChange={(val) => setValue('introducao', val)}
                placeholder="Insira a introdução deste orçamento..."
              />

              {/* Matéria Prima */}
              <RichTextEditor
                id="orcamento-field-materia-prima"
                label="Matéria Prima e Especificações Técnicas"
                value={watch('materiaPrima') || ''}
                onChange={(val) => setValue('materiaPrima', val)}
                placeholder="Insira as especificações de matéria-prima para este orçamento..."
              />

              {/* Formas de Pagamento */}
              <RichTextEditor
                id="orcamento-field-forma-pagamento"
                label="Formas de Pagamento e Condições"
                value={watch('formaPagamento') || ''}
                onChange={(val) => setValue('formaPagamento', val)}
                placeholder="Insira as formas de pagamento para este orçamento..."
              />
            </div>
          </div>

          {/* ITENS DO ORÇAMENTO SECTION */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-orange-600" />
                  Itens do Orçamento
                </h3>
                <p className="text-xs text-slate-500">
                  Adicione um ou mais serviços, descrições detalhadas, locais de aplicação e valores correspondentes.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  append({
                    servico: '',
                    descricao: '',
                    local: '',
                    valor: 0
                  })
                }
                className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Item
              </button>
            </div>

            {/* List of Item Cards */}
            <div className="space-y-3">
              {fields.map((field, index) => {
                return (
                  <div
                    key={field.id}
                    className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3 relative"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-[11px] font-bold text-orange-700 font-mono uppercase">
                        Item #{index + 1}
                      </span>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200"
                        >
                          <Trash2 className="w-3 h-3" /> Remover
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      {/* Serviço */}
                      <div className="md:col-span-5 space-y-1">
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase">
                          Serviço <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Instalação Elétrica Trifásica"
                          {...register(`itens.${index}.servico` as const, {
                            required: 'O nome do serviço é obrigatório.'
                          })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        {errors.itens?.[index]?.servico && (
                          <p className="text-[10px] text-rose-600">{errors.itens[index]?.servico?.message}</p>
                        )}
                      </div>

                      {/* Local */}
                      <div className="md:col-span-4 space-y-1">
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase">
                          Local / Endereço <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Ex: Sala de Reuniões 02"
                            {...register(`itens.${index}.local` as const, {
                              required: 'O local é obrigatório.'
                            })}
                            className="w-full pl-7 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                        </div>
                        {errors.itens?.[index]?.local && (
                          <p className="text-[10px] text-rose-600">{errors.itens[index]?.local?.message}</p>
                        )}
                      </div>

                      {/* Valor */}
                      <div className="md:col-span-3 space-y-1">
                        <label className="block text-[10px] font-semibold text-slate-600 uppercase">
                          Valor (R$) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...register(`itens.${index}.valor` as const, {
                            valueAsNumber: true,
                            required: 'Valor é obrigatório.'
                          })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono font-bold text-emerald-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    {/* Descrição do Item (Texto livre) */}
                    <div className="space-y-1 pt-1">
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase">
                        Descrição do Item
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Insira detalhes sobre o que deverá ser feito neste item do serviço..."
                        {...register(`itens.${index}.descricao` as const)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Total de {fields.length} item(ns) cadastrado(s)
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="px-5 py-2 bg-orange-400 hover:bg-orange-500 text-slate-950 font-bold rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {saveMutation.isPending ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditing ? 'Salvar Alterações' : 'Finalizar Orçamento'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
