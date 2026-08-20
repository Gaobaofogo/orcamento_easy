import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ToastContainer, ToastMessage } from './components/Toast';
import { LoginPage } from './pages/LoginPage';
import { CadastroPage } from './pages/CadastroPage';
import { EsqueciSenhaPage } from './pages/EsqueciSenhaPage';
import { LogoutPage } from './pages/LogoutPage';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { CriarClientePage } from './pages/CriarClientePage';
import { CriarOrcamentoPage } from './pages/CriarOrcamentoPage';
import { MeuPerfilPage } from './pages/MeuPerfilPage';
import { Cliente, Orcamento } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  
  // Custom router state synchronized with window.location.pathname
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [editingOrcamento, setEditingOrcamento] = useState<Orcamento | null>(null);

  const addToast = (title: string, type: 'success' | 'error' | 'info', description?: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts(prev => [...prev, { id, title, type, description }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Route Protection & Auto Redirects
  useEffect(() => {
    const isPublicRoute =
      currentPath === '/' ||
      currentPath === '/login' ||
      currentPath === '/cadastro' ||
      currentPath === '/esqueci-a-senha' ||
      currentPath === '/logout';

    if (!isAuthenticated && !isPublicRoute) {
      // Force unauthenticated users to login
      navigate('/login');
    } else if (isAuthenticated && (currentPath === '/login' || currentPath === '/cadastro' || currentPath === '/esqueci-a-senha')) {
      // Redirect authenticated users away from login/cadastro/esqueci-a-senha to dashboard
      navigate('/dashboard');
    }
  }, [isAuthenticated, currentPath]);

  // Render correct page
  const renderPage = () => {
    // Public Landing Page
    if (currentPath === '/' || currentPath === '') {
      return <LandingPage navigate={navigate} />;
    }

    // Unauthenticated Routes
    if (currentPath === '/login') {
      return <LoginPage navigate={navigate} addToast={addToast} />;
    }

    if (currentPath === '/cadastro') {
      return <CadastroPage navigate={navigate} addToast={addToast} />;
    }

    if (currentPath === '/esqueci-a-senha') {
      return <EsqueciSenhaPage navigate={navigate} addToast={addToast} />;
    }

    if (currentPath === '/logout') {
      return <LogoutPage navigate={navigate} addToast={addToast} />;
    }

    // Protected Routes (Requires Auth)
    if (!isAuthenticated) {
      return <LoginPage navigate={navigate} addToast={addToast} />;
    }

    if (currentPath === '/dashboard/criar-cliente') {
      return (
        <CriarClientePage
          editingCliente={editingCliente}
          navigate={navigate}
          addToast={addToast}
        />
      );
    }

    if (currentPath === '/dashboard/criar-orçamento' || currentPath === '/dashboard/criar-orcamento') {
      return (
        <CriarOrcamentoPage
          editingOrcamento={editingOrcamento}
          navigate={navigate}
          addToast={addToast}
        />
      );
    }

    if (currentPath === '/dashboard/meu-perfil') {
      return (
        <MeuPerfilPage
          navigate={navigate}
          addToast={addToast}
        />
      );
    }

    // Default protected route: /dashboard
    return (
      <DashboardPage
        navigate={navigate}
        setEditingCliente={setEditingCliente}
        setEditingOrcamento={setEditingOrcamento}
        addToast={addToast}
      />
    );
  };

  const showNavbar = isAuthenticated && currentPath !== '/' && currentPath !== '/login' && currentPath !== '/cadastro' && currentPath !== '/esqueci-a-senha' && currentPath !== '/logout';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {showNavbar && <Navbar currentPath={currentPath} navigate={navigate} />}

      <main className={showNavbar ? 'flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5' : 'flex-1'}>
        {renderPage()}
      </main>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </QueryClientProvider>
  );
}
