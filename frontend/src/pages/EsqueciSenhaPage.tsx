import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { esqueciSenhaApi, resetPasswordApi, verificarTokenRecuperacaoApi } from '../services/api';
import { Mail, ArrowLeft, Key, CheckCircle, Lock, ShieldAlert, ArrowRight, Copy, EyeOff, Eye } from 'lucide-react';

interface EsqueciSenhaPageProps {
  navigate: (path: string) => void;
  addToast: (title: string, type: 'success' | 'error' | 'info', description?: string) => void;
}

export const EsqueciSenhaPage: React.FC<EsqueciSenhaPageProps> = ({ navigate, addToast }) => {
  const [loading, setLoading] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [isClickedGenerateRecoverCode, setIsClickedGenerateRecoverCode] = useState<boolean>(false);
  const tokenQueryParam = new URLSearchParams(window.location.search).get('token');

  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [validationError, setValidationError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 1 Form: Request Token
  const requestForm = useForm<{ email: string }>({
    defaultValues: { email: '' }
  });

  // Step 2 Form: Reset Password
  const resetForm = useForm<{novaSenha: string; confirmaSenha: string }>({
    defaultValues: { novaSenha: '', confirmaSenha: '' }
  });

  const senhaValue = resetForm.watch('novaSenha');
  const confirmaSenhaValue = resetForm.watch('confirmaSenha');

  useEffect(() => {
    if (!tokenQueryParam) {
      setIsValidating(false);
      setTokenValid(false);
      setValidationError('Token de redefinição não encontrado na URL.');
      return;
    }

    verificarTokenRecuperacaoApi(tokenQueryParam)
      .then(() => {
        setTokenValid(true);
      })
      .catch((err) => {
        navigate("/login");
        setTokenValid(false);
        setValidationError(err.message || 'O link de recuperação é inválido ou expirou.');
      })
      .finally(() => {
        setIsValidating(false);
      });
  }, [tokenQueryParam]);

  const handleRequestToken = async (data: { email: string }) => {
    setIsClickedGenerateRecoverCode(true);
    setLoading(true);
    try {
      const res = await esqueciSenhaApi(data.email);
      addToast('Solicitação processada!', 'success', res.message);
      
      if (res.tokenDemo) {
        setGeneratedToken(res.tokenDemo);
      }
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
      const res = await resetPasswordApi(tokenQueryParam, data.novaSenha);
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
        {isClickedGenerateRecoverCode ? (
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Key className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white">Recuperação de Senha</h2>
              <p className="text-xs text-slate-400">
                Se o e-mail informado estiver cadastrado em nossa base de dados, você receberá em poucos instantes uma mensagem com as instruções e o link para redefinir a sua senha.
                <br/><br/>Dica: Se não encontrar o e-mail na sua caixa de entrada, verifique também a pasta de spam ou lixo eletrônico.
              </p>
            </div>
          </div>
        ) : (
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Key className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">Recuperação de Senha</h2>
            <p className="text-xs text-slate-400">
              {tokenQueryParam 
                ? 'Digite sua nova senha abaixo.'
                : 'Informe o e-mail cadastrado para gerar o código de redefinição de senha.'}
            </p>
          </div>

          {tokenQueryParam ? (
            /* STEP 2: RESET PASSWORD WITH TOKEN */
            <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Nova Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nova senha"
                    {...resetForm.register('novaSenha', {
                      required: 'A nova senha é obrigatória.',
                      minLength: { value: 4, message: 'Mínimo de 4 caracteres.' }
                    })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                <button
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
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repita a nova senha"
                    {...resetForm.register('confirmaSenha', {
                      required: 'A confirmação de senha é obrigatória.'
                    })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

            {/* Password Requeriments Indicators */}
            <div className="p-3 bg-slate-50 rounded-xl bg-slate-950 border border-slate-800/90 mt-5 text-[11px] space-y-1 text-slate-600">
              <p className="font-semibold text-slate-300 text-xs mb-1">Requisitos de Segurança para a Senha:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
                <span className={`flex items-center gap-1 ${senhaValue?.length >= 8 ? 'text-emerald-600 font-semibold' : 'text-slate-300'}`}>
                  {senhaValue?.length >= 8 ? '✓' : '•'} Mínimo de 8 caracteres
                </span>
                <span className={`flex items-center gap-1 ${/[A-Z]/.test(senhaValue || '') ? 'text-emerald-600 font-semibold' : 'text-slate-300'}`}>
                  {/[A-Z]/.test(senhaValue || '') ? '✓' : '•'} Pelo menos 1 letra maiúscula
                </span>
                <span className={`flex items-center gap-1 ${/[a-z]/.test(senhaValue || '') ? 'text-emerald-600 font-semibold' : 'text-slate-300'}`}>
                  {/[a-z]/.test(senhaValue || '') ? '✓' : '•'} Pelo menos 1 letra minúscula
                </span>
                <span className={`flex items-center gap-1 ${/\d/.test(senhaValue || '') ? 'text-emerald-600 font-semibold' : 'text-slate-300'}`}>
                  {/\d/.test(senhaValue || '') ? '✓' : '•'} Pelo menos 1 número
                </span>
                <span className={`flex items-center gap-1 sm:col-span-2 ${/[^A-Za-z0-9]/.test(senhaValue || '') ? 'text-emerald-600 font-semibold' : 'text-slate-300'}`}>
                  {/[^A-Za-z0-9]/.test(senhaValue || '') ? '✓' : '•'} Pelo menos 1 caractere especial (@, #, $, !, etc.)
                </span>
                <span className={`flex items-center gap-1 sm:col-span-2 ${(senhaValue.length > 0 && confirmaSenhaValue.length > 0 && senhaValue == confirmaSenhaValue) ? 'text-emerald-600 font-semibold' : 'text-slate-300'}`}>
                  {(senhaValue.length > 0 && confirmaSenhaValue.length > 0 && senhaValue == confirmaSenhaValue) ? '✓' : '•'} As senhas devem ser iguais
                </span>
              </div>
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
                  className="w-2/3 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-100 hover:text-slate-100 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
                  ) : (
                    'Salvar Nova Senha'
                  )}
                </button>
              </div>
            </form>
          ) : (
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
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-200 hover:text-slate-100 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
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
          )}
        </div>
        )}
      </div>
    </div>
  );
};
