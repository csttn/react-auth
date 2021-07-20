import Router from 'next/router';
import { destroyCookie, parseCookies, setCookie } from 'nookies';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { api } from '../services/apiClient';

type User = {
  email: string;
  permissions: string[];
  roles: string[];
};

type SignCredentias = {
  email: string;
  password: string;
};

type AuthContextData = {
  signIn(credentials: SignCredentias): Promise<void>;
  isAuthenticated: boolean;
  user: User | undefined;
};

type AuthProviderProps = {
  children: ReactNode;
};

export function signOut() {
  destroyCookie(undefined, 'nextAuth.token');
  destroyCookie(undefined, 'nextAuth.refreshToken');
  Router.push('/');
}

const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();

  useEffect(() => {
    const { 'nextAuth.token': token } = parseCookies();

    if (token) {
      api
        .get('/me')
        .then((response) => {
          const { email, permissions, roles } = response.data;
          setUser({
            email,
            permissions,
            roles,
          });
        })
        .catch(() => {
          signOut();
        });
    }
  }, []);

  const isAuthenticated = !!user;

  async function signIn({ email, password }: SignCredentias) {
    try {
      const response = await api.post('sessions', {
        email,
        password,
      });

      const { permissions, roles, token, refreshToken } = response.data;

      setCookie(undefined, 'nextAuth.token', token, {
        maxAge: 40 * 60 * 24 * 30, // 30 days
        path: '/',
      });
      setCookie(undefined, 'nextAuth.refreshToken', refreshToken, {
        maxAge: 40 * 60 * 24 * 30, // 30 days
        path: '/',
      });

      setUser({
        email,
        permissions,
        roles,
      });

      api.defaults.headers['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthentication() {
  const authContextData = useContext(AuthContext);

  return authContextData;
}
