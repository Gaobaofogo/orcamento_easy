import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { FileText, Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck, UserPlus } from 'lucide-react';

interface LoginPageProps {
  navigate: (path: string) => void;
  addToast: (title: string, type: 'success' | 'error' | 'info', description?: string) => void;
}

interface LoginFormInputs {
  email: string;
  senha: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate, addToast }) => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LoginFormInputs>({
    defaultValues: {
      email: '',
      senha: ''
    }
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setLoading(true);
    try {
      await login(data.email, data.senha);
      addToast('Autenticado com sucesso!', 'success', 'Bem-vindo ao sistema de orçamentos.');
      navigate('/dashboard');
    } catch (err: any) {
      addToast('Falha no Login', 'error', err.message || 'Verifique suas credenciais e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-orange-500 selection:text-white">
      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2.5 rounded-xl bg-orange-600 text-white shadow-sm mb-1">
            <FileText className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sistema de Orçamentos
          </h1>
          <p className="text-xs text-slate-500">
            Acesse seu painel gerencial com facilidade e segurança
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                E-mail de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="exemplo@orcamaster.com.br"
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

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/esqueci-a-senha')}
                  className="text-xs text-orange-600 hover:text-orange-800 transition-colors font-medium cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register('senha', {
                    required: 'A senha é obrigatória.',
                    minLength: {
                      value: 4,
                      message: 'A senha deve ter pelo menos 4 caracteres.'
                    }
                  })}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.senha && (
                <p className="text-xs text-rose-600 mt-1">{errors.senha.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-orange-400 hover:bg-orange-500 text-slate-200 font-bold rounded-lg text-xs shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Section */}
          <div className="pt-3 border-t border-slate-200 text-center space-y-2">
            <p className="text-xs text-slate-500">Ainda não possui uma conta?</p>
            <button
              type="button"
              onClick={() => navigate('/cadastro')}
              className="w-full py-2 px-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Criar Nova Conta / Cadastrar-se
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Autenticação segura protegida por criptografia</span>
        </div>
      </div>
    </div>
  );
};
