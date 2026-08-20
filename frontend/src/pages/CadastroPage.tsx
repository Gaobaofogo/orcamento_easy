import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { registerApi } from '../services/api';
import { maskPhoneInput, maskCNPJInput } from '../utils/formatters';
import {
  FileText,
  User,
  Mail,
  Lock,
  Building2,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  UserPlus
} from 'lucide-react';

interface CadastroPageProps {
  navigate: (path: string) => void;
  addToast: (title: string, type: 'success' | 'error' | 'info', description?: string) => void;
}

interface CadastroFormInputs {
  nome: string;
  email: string;
  senha: string;
  confirmaSenha: string;
  nomeFantasia?: string;
  razaoSocial?: string;
  cnpj?: string;
  telefone?: string;
  endereco?: string;
}

export const CadastroPage: React.FC<CadastroPageProps> = ({ navigate, addToast }) => {
  const { setToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CadastroFormInputs>({
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      confirmaSenha: '',
      nomeFantasia: '',
      razaoSocial: '',
      cnpj: '',
      telefone: '',
      endereco: ''
    }
  });

  const senhaValue = watch('senha');

  const onSubmit = async (data: CadastroFormInputs) => {
    if (data.senha !== data.confirmaSenha) {
      addToast('Senhas divergentes', 'error', 'A confirmação de senha não confere com a senha digitada.');
      return;
    }

    setLoading(true);
    try {
      const response = await registerApi({
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        nomeFantasia: data.nomeFantasia,
        razaoSocial: data.razaoSocial,
        cnpj: data.cnpj,
        telefone: data.telefone,
        endereco: data.endereco
      });

      setToken(response.token, response.user);
      addToast('Cadastro Realizado!', 'success', 'Sua conta foi criada com sucesso. Bem-vindo ao sistema!');
      navigate('/dashboard');
    } catch (err: any) {
      addToast('Erro no Cadastro', 'error', err.message || 'Ocorreu uma falha ao cadastrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-center items-center px-4 py-12 relative selection:bg-orange-500 selection:text-white">
      <div className="max-w-lg w-full space-y-6 relative z-10">
        {/* Navigation back link */}
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-orange-600" />
          Voltar para o Login
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2.5 rounded-xl bg-orange-600 text-white shadow-sm mb-1">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Criar Nova Conta
          </h1>
          <p className="text-xs text-slate-500">
            Cadastre-se para gerenciar seus orçamentos e emitir propostas profissionais.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Nome Completo */}
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
                  placeholder="Ex: Carlos Eduardo Silva"
                  {...register('nome', { required: 'O nome completo é obrigatório.' })}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
              </div>
              {errors.nome && (
                <p className="text-xs text-rose-600 mt-1">{errors.nome.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                E-mail de Acesso <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="seuemail@empresa.com.br"
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
              {errors.email && (
                <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password and Confirm Password Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Senha <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="Mínimo 8 caracteres e símbolos"
                    {...register('senha', {
                      required: 'A senha é obrigatória.',
                      validate: (val) => {
                        if (val.length < 8) {
                          return 'A senha deve ter no mínimo 8 caracteres.';
                        }
                        if (!/[A-Z]/.test(val)) {
                          return 'A senha deve conter pelo menos 1 letra maiúscula.';
                        }
                        if (!/[a-z]/.test(val)) {
                          return 'A senha deve conter pelo menos 1 letra minúscula.';
                        }
                        if (!/\d/.test(val)) {
                          return 'A senha deve conter pelo menos 1 número.';
                        }
                        if (!/[^A-Za-z0-9]/.test(val)) {
                          return 'A senha deve conter pelo menos 1 caractere especial (ex: @, #, $, !).';
                        }
                        return true;
                      }
                    })}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>
                {errors.senha && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{errors.senha.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Confirmar Senha <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="Repita a senha"
                    {...register('confirmaSenha', {
                      required: 'A confirmação é obrigatória.',
                      validate: val => val === senhaValue || 'As senhas não coincidem.'
                    })}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>
                {errors.confirmaSenha && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{errors.confirmaSenha.message}</p>
                )}
              </div>
            </div>

            {/* Password Requeriments Indicators */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1 text-slate-600">
              <p className="font-semibold text-slate-700 text-xs mb-1">Requisitos de Segurança para a Senha:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
                <span className={`flex items-center gap-1 ${senhaValue?.length >= 8 ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                  {senhaValue?.length >= 8 ? '✓' : '•'} Mínimo de 8 caracteres
                </span>
                <span className={`flex items-center gap-1 ${/[A-Z]/.test(senhaValue || '') ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                  {/[A-Z]/.test(senhaValue || '') ? '✓' : '•'} Pelo menos 1 letra maiúscula
                </span>
                <span className={`flex items-center gap-1 ${/[a-z]/.test(senhaValue || '') ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                  {/[a-z]/.test(senhaValue || '') ? '✓' : '•'} Pelo menos 1 letra minúscula
                </span>
                <span className={`flex items-center gap-1 ${/\d/.test(senhaValue || '') ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                  {/\d/.test(senhaValue || '') ? '✓' : '•'} Pelo menos 1 número
                </span>
                <span className={`flex items-center gap-1 sm:col-span-2 ${/[^A-Za-z0-9]/.test(senhaValue || '') ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                  {/[^A-Za-z0-9]/.test(senhaValue || '') ? '✓' : '•'} Pelo menos 1 caractere especial (@, #, $, !, etc.)
                </span>
              </div>
            </div>

            {/* Optional Business Info Toggle */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowOptionalFields(!showOptionalFields)}
                className="text-xs font-semibold text-orange-600 hover:text-orange-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {showOptionalFields ? '– Ocultar dados empresariais opcionais' : '+ Adicionar dados da empresa (Opcional)'}
              </button>
            </div>

            {showOptionalFields && (
              <div className="space-y-3 pt-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Nome Fantasia
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Marcenaria Silva"
                      {...register('nomeFantasia')}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Razão Social
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Silva Móveis LTDA"
                      {...register('razaoSocial')}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      placeholder="00.000.000/0000-00"
                      {...register('cnpj')}
                      onChange={e => setValue('cnpj', maskCNPJInput(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Telefone / Celular
                    </label>
                    <input
                      type="text"
                      placeholder="(00) 00000-0000"
                      {...register('telefone')}
                      onChange={e => setValue('telefone', maskPhoneInput(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Endereço Comercial
                  </label>
                  <input
                    type="text"
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                    {...register('endereco')}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-orange-400 hover:bg-orange-500 text-slate-950 font-bold rounded-lg text-xs shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
              ) : (
                <>
                  Concluir Cadastro e Acessar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Link Helper */}
          <div className="pt-3 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500 mb-1">Já possui uma conta cadastrada?</p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-xs text-orange-600 hover:text-orange-800 transition-colors font-bold cursor-pointer"
            >
              Faça login no sistema
            </button>
          </div>
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Seus dados estão protegidos com ambiente criptografado</span>
        </div>
      </div>
    </div>
  );
};
