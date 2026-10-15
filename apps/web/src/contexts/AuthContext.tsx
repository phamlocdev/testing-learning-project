'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loginUser, registerUser } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/auth/decode-jwt';
import type { AuthUser } from '@/types/auth';

const TOKEN_STORAGE_KEY = 'mini-task-manager:token';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function userFromToken(token: string): AuthUser {
  const payload = decodeJwtPayload(token);
  return { id: payload.sub, email: payload.email };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        setToken(stored);
      }
    } catch {
      // localStorage unavailable (e.g. private browsing) — stay logged out
    }
  }, []);

  function persistToken(value: string | null) {
    setToken(value);
    try {
      if (value) {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, value);
      } else {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }

  async function login(email: string, password: string) {
    const { accessToken } = await loginUser({ email, password });
    persistToken(accessToken);
  }

  async function register(email: string, password: string) {
    await registerUser({ email, password });
    await login(email, password);
  }

  function logout() {
    persistToken(null);
  }

  const user = token ? userFromToken(token) : null;

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
