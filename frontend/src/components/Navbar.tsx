import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Users, PlusCircle, LogOut, FilePlus, LayoutDashboard, User } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    navigate('/logout');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="p-1.5 rounded-lg bg-orange-500 text-white font-bold shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block leading-none">
                OrçaMaster
              </span>
              <span className="text-[10px] text-orange-400 font-medium tracking-wider uppercase">
                Gestão de Orçamentos
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentPath === '/dashboard'
                  ? 'bg-orange-600/20 text-orange-300 border border-orange-500/30 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Painel
            </button>

            <button
              onClick={() => navigate('/dashboard/criar-cliente')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentPath === '/dashboard/criar-cliente'
                  ? 'bg-orange-600/20 text-orange-300 border border-orange-500/30 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Novo Cliente
            </button>

            <button
              onClick={() => navigate('/dashboard/criar-orçamento')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentPath === '/dashboard/criar-orçamento' || currentPath === '/dashboard/criar-orcamento'
                  ? 'bg-orange-400 text-slate-950 font-bold shadow-sm hover:bg-orange-500'
                  : 'bg-orange-400/20 text-orange-300 border border-orange-400/30 hover:bg-orange-400/30'
              }`}
            >
              <FilePlus className="w-3.5 h-3.5" />
              Novo Orçamento
            </button>

            <button
              onClick={() => navigate('/dashboard/meu-perfil')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentPath === '/dashboard/meu-perfil'
                  ? 'bg-orange-600/20 text-orange-300 border border-orange-500/30 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Meu Perfil
            </button>
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard/meu-perfil')}
              className="hidden sm:flex flex-col text-right hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="text-xs font-semibold text-slate-200">{user?.nome || 'Usuário'}</span>
              <span className="text-[11px] text-slate-400">{user?.email}</span>
            </button>

            <button
              onClick={handleLogout}
              title="Sair do sistema"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Submenu Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800 bg-slate-950/80 py-1.5 px-2 text-xs">
        <button
          onClick={() => navigate('/dashboard')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium ${
            currentPath === '/dashboard' ? 'bg-orange-600/30 text-orange-300 font-bold' : 'text-slate-300'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Painel
        </button>
        <button
          onClick={() => navigate('/dashboard/criar-cliente')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium ${
            currentPath === '/dashboard/criar-cliente' ? 'bg-orange-600/30 text-orange-300 font-bold' : 'text-slate-300'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          + Cliente
        </button>
        <button
          onClick={() => navigate('/dashboard/criar-orçamento')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium ${
            currentPath.includes('criar-or') ? 'bg-orange-400 text-slate-950 font-bold' : 'text-orange-400'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          + Orçamento
        </button>
        <button
          onClick={() => navigate('/dashboard/meu-perfil')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium ${
            currentPath === '/dashboard/meu-perfil' ? 'bg-orange-600/30 text-orange-300 font-bold' : 'text-slate-300'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Perfil
        </button>
      </div>
    </header>
  );
};
