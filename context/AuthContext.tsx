import { createContext, ReactNode, useContext, useState } from 'react';
import { api } from '../services/api';

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

const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();

  const isAuthenticated = !!user;

  async function signIn({ email, password }: SignCredentias) {
    try {
      const response = await api.post('sessions', {
        email,
        password,
      });

      const { permissions, roles, token, refreshToken } = response.data;

      setUser({
        email,
        permissions,
        roles,
      });
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
