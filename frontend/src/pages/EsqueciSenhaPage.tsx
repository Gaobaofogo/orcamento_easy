import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { esqueciSenhaApi, resetPasswordApi } from '../services/api';
import { Mail, ArrowLeft, Key, CheckCircle, Lock, ShieldAlert, ArrowRight, Copy } from 'lucide-react';

interface EsqueciSenhaPageProps {
  navigate: (path: string) => void;
  addToast: (title: string, type: 'success' | 'error' | 'info', description?: string) => void;
}

export const EsqueciSenhaPage: React.FC<EsqueciSenhaPageProps> = ({ navigate, addToast }) => {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [loading, setLoading] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  // Step 1 Form: Request Token
  const requestForm = useForm<{ email: string }>({
    defaultValues: { email: '' }
  });

  // Step 2 Form: Reset Password
  const resetForm = useForm<{ token: string; novaSenha: string; confirmaSenha: string }>({
    defaultValues: { token: '', novaSenha: '', confirmaSenha: '' }
  });

  const handleRequestToken = async (data: { email: string }) => {
    setLoading(true);
    try {
      const res = await esqueciSenhaApi(data.email);
      addToast('Solicitação processada!', 'success', res.message);
      
      if (res.tokenDemo) {
        setGeneratedToken(res.tokenDemo);
        resetForm.setValue('token', res.tokenDemo);
      }
      
      setStep('reset');
    } catch (err: any) {
      addToast('Erro ao solicitar', 'error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (data: { token: string; novaSenha: string; confirmaSenha: string }) => {
    if (data.novaSenha !== data.confirmaSenha) {
      addToast('Senhas não conferem', 'error', 'As senhas digitadas devem ser idênticas.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordApi(data.token, data.novaSenha);
      addToast('Senha redefinida com sucesso!', 'success', res.message);
      navigate('/login');
    } catch (err: any) {
      addToast('Erro ao redefinir', 'error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Top Back Link */}
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Login
        </button>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Key className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">Recuperação de Senha</h2>
            <p className="text-xs text-slate-400">
              {step === 'request'
                ? 'Informe o e-mail cadastrado para gerar o código de redefinição de senha.'
                : 'Valide seu código de recuperação e cadastre a nova senha.'}
            </p>
          </div>

          {step === 'request' ? (
            /* STEP 1: REQUEST TOKEN */
            <form onSubmit={requestForm.handleSubmit(handleRequestToken)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  E-mail do Usuário
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="admin@orcamaster.com.br"
                    {...requestForm.register('email', {
                      required: 'O e-mail é obrigatório.'
                    })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
                {requestForm.formState.errors.email && (
                  <p className="text-xs text-rose-400">{requestForm.formState.errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
                ) : (
                  <>
                    Gerar Código de Recuperação
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: RESET PASSWORD WITH TOKEN */
            <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
              {/* Token banner display */}
              {generatedToken && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300 uppercase">Código Gerado:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedToken);
                        addToast('Código copiado!', 'info');
                      }}
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copiar
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-slate-300 break-all bg-slate-950 p-2 rounded border border-slate-800 max-h-16 overflow-y-auto">
                    {generatedToken}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Código de Redefinição
                </label>
                <input
                  type="text"
                  placeholder="Cole o código de recuperação aqui..."
                  {...resetForm.register('token', { required: 'O código é obrigatório.' })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
                {resetForm.formState.errors.token && (
                  <p className="text-xs text-rose-400">{resetForm.formState.errors.token.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Nova Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="Nova senha segura"
                    {...resetForm.register('novaSenha', {
                      required: 'A nova senha é obrigatória.',
                      minLength: { value: 4, message: 'Mínimo de 4 caracteres.' }
                    })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                {resetForm.formState.errors.novaSenha && (
                  <p className="text-xs text-rose-400">{resetForm.formState.errors.novaSenha.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="Repita a nova senha"
                    {...resetForm.register('confirmaSenha', {
                      required: 'A confirmação de senha é obrigatória.'
                    })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="w-1/3 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
                  ) : (
                    'Salvar Nova Senha'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
