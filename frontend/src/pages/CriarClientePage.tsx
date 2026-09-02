import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCliente, updateCliente } from '../services/api';
import { Cliente } from '../types';
import { maskPhoneInput } from '../utils/formatters';
import { User, Phone, Mail, Tag, ArrowLeft, Save, Users, CheckCircle2, MapPinHouse } from 'lucide-react';

interface CriarClientePageProps {
  editingCliente: Cliente | null;
  navigate: (path: string) => void;
  addToast: (title: string, type: 'success' | 'error' | 'info', description?: string) => void;
}

interface ClienteFormInputs {
  nome: string;
  celular: string;
  email: string;
  apelido: string;
  endereco: string;
}

export const CriarClientePage: React.FC<CriarClientePageProps> = ({
  editingCliente,
  navigate,
  addToast
}) => {
  const queryClient = useQueryClient();
  const isEditing = !!editingCliente;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ClienteFormInputs>({
    defaultValues: {
      nome: '',
      celular: '',
      email: '',
      apelido: '',
      endereco: ''
    }
  });

  useEffect(() => {
    if (editingCliente) {
      reset({
        nome: editingCliente.nome,
        celular: editingCliente.celular,
        email: editingCliente.email,
        apelido: editingCliente.apelido,
	endereco: editingCliente.endereco
      });
    } else {
      reset({
        nome: '',
        celular: '',
        email: '',
        apelido: '',
	endereco: ''
      });
    }
  }, [editingCliente, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: ClienteFormInputs) => {
      if (isEditing && editingCliente) {
        return updateCliente(editingCliente.id, data);
      }
      return createCliente(data);
    },
    onSuccess: (savedClient) => {
      addToast(
        isEditing ? 'Cliente atualizado!' : 'Cliente cadastrado!',
        'success',
        `Cliente "${savedClient.nome}" salvo com sucesso.`
      );
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      navigate('/dashboard');
    },
    onError: (err: any) => {
      addToast('Erro ao salvar cliente', 'error', err.message);
    }
  });

  const onSubmit = (data: ClienteFormInputs) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      {/* Back button & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Painel
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl border border-orange-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {isEditing ? `Editar Cliente: ${editingCliente?.nome}` : 'Cadastrar Novo Cliente'}
            </h1>
            <p className="text-xs text-slate-500">
              Preencha as informações do cliente para emissão de orçamentos.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Nome Completo <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Ex: João da Silva Sauro"
                {...register('nome', {
                  required: 'O nome é obrigatório.',
                  minLength: { value: 3, message: 'O nome deve ter ao menos 3 caracteres.' }
                })}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
            </div>
            {errors.nome && <p className="text-xs text-rose-600">{errors.nome.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Celular */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Celular / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  {...register('celular', {
                    required: 'O número de celular é obrigatório.',
                    onChange: (e) => {
                      setValue('celular', maskPhoneInput(e.target.value));
                    }
                  })}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
              </div>
              {errors.celular && <p className="text-xs text-rose-600">{errors.celular.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                E-mail de Contato <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="cliente@email.com"
                  {...register('email', {
                    required: 'O e-mail é obrigatório.',
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: 'Informe um e-mail válido.'
                    }
                  })}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
              </div>
              {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
            </div>
          </div>

          {/* Apelido */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Apelido / Nome Fantasia
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Tag className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Ex: Beto, Studio Design, etc."
                {...register('apelido')}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
		Endereço
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPinHouse className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Rua Conselheiro Crispiniano, 378 – Sé, São Paulo/SP"
                {...register('endereco')}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
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
                  {isEditing ? 'Atualizar Cliente' : 'Salvar Cliente'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
