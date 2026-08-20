import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import { loginApi, logoutApi, getMeApi } from '../services/api';

interface AuthContextType extends AuthState {
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string, user: User) => void;
  updateUser: (updatedUser: User) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const savedToken = localStorage.getItem('orcamento_jwt_token');
    const savedUser = localStorage.getItem('orcamento_user');

    if (savedUser) {
      try {
        return {
          token: savedToken,
          user: JSON.parse(savedUser),
          isAuthenticated: true
        };
      } catch (e) {
        localStorage.removeItem('orcamento_jwt_token');
        localStorage.removeItem('orcamento_user');
      }
    }

    return {
      token: savedToken,
      user: null,
      isAuthenticated: !!savedToken
    };
  });

  useEffect(() => {
    // Tenta validar a sessão com o cookie HttpOnly no backend ao inicializar
    getMeApi()
      .then(user => {
        setAuth(prev => ({
          ...prev,
          user,
          isAuthenticated: true
        }));
        localStorage.setItem('orcamento_user', JSON.stringify(user));
      })
      .catch(() => {
        // Se o cookie expirou ou é inválido, limpa o estado
        if (!localStorage.getItem('orcamento_jwt_token')) {
          setAuth({
            token: null,
            user: null,
            isAuthenticated: false
          });
        }
      });
  }, []);

  const setToken = (token: string, user: User) => {
    if (token) {
      localStorage.setItem('orcamento_jwt_token', token);
    }
    localStorage.setItem('orcamento_user', JSON.stringify(user));
    setAuth({
      token,
      user,
      isAuthenticated: true
    });
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('orcamento_user', JSON.stringify(updatedUser));
    setAuth(prev => ({
      ...prev,
      user: updatedUser
    }));
  };

  const login = async (email: string, senha: string) => {
    const response = await loginApi(email, senha);
    setToken(response.token, response.user);
  };

  const logout = () => {
    logoutApi().catch(() => {});
    localStorage.removeItem('orcamento_jwt_token');
    localStorage.removeItem('orcamento_user');
    setAuth({
      token: null,
      user: null,
      isAuthenticated: false
    });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, setToken, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
