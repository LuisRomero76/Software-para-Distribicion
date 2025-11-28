import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { AuthService } from '../services/authService';
import type { AuthResponse, IAuthService, LoginInput } from '../services/authService';
import { useTokenExpiration } from '../hooks/useTokenExpiration';

type AuthState = AuthResponse | null;

interface AuthContextShape {
  auth: AuthState;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

const STORAGE_KEY = 'gv_auth';

function loadAuth(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthResponse;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => loadAuth());
  const service: IAuthService = useMemo(() => new AuthService(), []);

  const logout = useCallback(() => {
    setAuth(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Validar expiración del token y cerrar sesión automáticamente
  useTokenExpiration(auth?.token, logout);

  const login = async (input: LoginInput) => {
    const res = await service.login({
      email: input.email.trim(),
      password: input.password.trim(),
    });
    setAuth(res);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
  };

  const value: AuthContextShape = {
    auth,
    isAuthenticated: Boolean(auth?.token),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
