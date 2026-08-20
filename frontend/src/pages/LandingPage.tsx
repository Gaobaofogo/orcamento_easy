import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Hammer,
  FileText,
  Users,
  Calculator,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Layers,
  Ruler,
  TrendingUp,
  Clock,
  ChevronRight,
  LogIn,
  UserPlus,
  LayoutDashboard
} from 'lucide-react';

interface LandingPageProps {
  navigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Header / Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-slate-950 shadow-lg shadow-orange-500/20">
              <Hammer className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                OrçaMaster <span className="text-orange-500 text-xs px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 font-bold uppercase">Marcenaria</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium">Gestão Inteligente para Marceneiros</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Olá, {user?.nome?.split(' ')[0] || 'Marceneiro'}! Ir ao Painel</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-orange-500" />
                  <span>Entrar</span>
                </button>

                <button
                  onClick={() => navigate('/cadastro')}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar Marcenaria</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-28 border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Sistema Especializado em Marcenarias & Projetos Sob Medida</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Emita Orçamentos de Marcenaria <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">Profissionais em Minutos</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Anexe seus projetos de corte em PDF para melhorar sua tomada de decisão.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-3 cursor-pointer group"
              >
                <span>Acessar Meu Painel de Orçamentos</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/cadastro')}
                  className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-3 cursor-pointer group"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Cadastre sua Marcenaria Grátis</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-base rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-5 h-5 text-orange-400" />
                  <span>Já é Marceneiro? Fazer Login</span>
                </button>
              </>
            )}
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Sem necessidade de cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Cálculo preciso de chapas de MDF</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Geração de PDF com sua marca</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Recursos Exclusivos</span>
            <h2 className="text-3xl font-black text-white">Tudo que uma Marcenaria Moderna Precisa</h2>
            <p className="text-sm text-slate-400">Desenvolvido sob medida para marcenarias residenciais, comerciais e planejados sob medida.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 hover:border-orange-500/40 transition-all space-y-4">
              <div className="p-3.5 rounded-2xl bg-orange-500/10 text-orange-400 w-fit">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Cálculo Preciso de Materiais</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Adicione chapas de MDF, ferragens (corrediças, dobradiças), fita de borda e insumos com valores automáticos atualizados.
              </p>
            </div>

            <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 hover:border-orange-500/40 transition-all space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 w-fit">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Propostas em PDF Personalizadas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Emita orçamentos elegantes com o logotipo da sua marcenaria, condições de pagamento claras, especificações e prazos de entrega.
              </p>
            </div>

            <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 hover:border-orange-500/40 transition-all space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Gestão Completa de Clientes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mantenha histórico de contatos, endereços de entrega dos móveis planejados e acompanhamento do status de aprovação de cada projeto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-950 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 w-fit mx-auto text-orange-400">
            <Ruler className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Pronto para profissionalizar os orçamentos da sua marcenaria?
          </h2>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Cadastre-se agora em poucos segundos e comece a criar orçamentos incríveis que passam mais segurança para seus clientes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Acessar o Painel Agora</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/cadastro')}
                  className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Cadastrar Minha Marcenaria</span>
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-5 h-5 text-orange-400" />
                  <span>Acessar Minha Conta</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 bg-slate-950 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Hammer className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-slate-300">OrçaMaster Marcenaria</span>
            <span>– Gestão de Orçamentos e Propostas</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="hover:text-slate-300 transition-colors cursor-pointer">Login</button>
            <button onClick={() => navigate('/cadastro')} className="hover:text-slate-300 transition-colors cursor-pointer">Cadastro</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
