import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, ArrowRight, ShieldCheck } from 'lucide-react';

interface LogoutPageProps {
  navigate: (path: string) => void;
  addToast: (title: string, type: 'success' | 'error' | 'info', description?: string) => void;
}

export const LogoutPage: React.FC<LogoutPageProps> = ({ navigate, addToast }) => {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
    addToast('Sessão encerrada', 'info', 'Você foi desconectado com segurança.');
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="max-w-md w-full text-center space-y-6 relative z-10 bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="inline-flex items-center justify-center p-4 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
          <LogOut className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Sessão Encerrada</h2>
          <p className="text-sm text-slate-400">
            Você saiu do Sistema Gerencial de Orçamentos com sucesso.
          </p>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Sua sessão foi encerrada e limpa do navegador com segurança.</span>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
        >
          Voltar para a tela de Login
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
