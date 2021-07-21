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
  signIn: (credentials: SignCredentias) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
  user: User | undefined;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext({} as AuthContextData);

// canal de transmissão que vai avisar quando o usuario fazer logout
//  assim se o usuario estiver com unimeras abas abertas e sair de alguma todas as outras irão realizar o logout tambem
//  essavarivael foi definida aqui e instanciada no useEffect pois precisa ser executada pelo browser e o next só entende isso quando a mesma é insatnciada dentro do useEffect, fora isso ele irá tentar executar a mesam pelo servidor.
let authChannel: BroadcastChannel;

export function signOut() {
  destroyCookie(undefined, 'nextAuth.token');
  destroyCookie(undefined, 'nextAuth.refreshToken');
  Router.push('/');
}

//  funação responsavel por enviar menssagens ao canal BroadcastChannel
export function authChannelPostMessage(message: string) {
  authChannel.postMessage(message);
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();

  // verificando se o canal de transmissão de logout foi acionado. (caso o usuario realize o logout com mais de uma aba aberta)
  useEffect(() => {
    authChannel = new BroadcastChannel('auth');
    //  quando o BroadcastChannel enviar alguma msg esse useEffect vai escutar o canal do BroadcastChannel e vai receber a msg
    //  saindo assim de todas as outras abas q o usuario estava logado, ou realizando o login automatico em outras abas abertas
    authChannel.onmessage = (message) => {
      switch (message.data) {
        case 'signOut':
          signOut();
          break;
        case 'signIn':
          window.location.reload();
        default:
          break;
      }
    };
  }, []);

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

      authChannelPostMessage('signIn');
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, user, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthentication() {
  const authContextData = useContext(AuthContext);

  return authContextData;
}
