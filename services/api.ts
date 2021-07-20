import axios, { AxiosError } from 'axios';
import Router from 'next/router';
import { destroyCookie, parseCookies, setCookie } from 'nookies';

let cookies = parseCookies();
let isRefreshing = false;

export function signOut() {
  destroyCookie(undefined, 'nextAuth.token');
  destroyCookie(undefined, 'nextAuth.refreshToken');
  Router.push('/');
}
//  fila onde ser armazenado as requisiçoes que deram erro
let failedRequestQueue: {
  onSuccess: (token: string) => void;
  onFailure: (error: AxiosError<any>) => void;
}[] = [];

export const api = axios.create({
  baseURL: 'http://localhost:3333',
  headers: {
    Authorization: `Bearer ${cookies['nextAuth.token']}`,
  },
});

api.interceptors.response.use(
  (response) => {
    // interceptando a resposta caso não de erro
    return response;
  },
  (responseError: AxiosError) => {
    // interceptando a resposta caso de erro
    if (responseError.response?.status === 401) {
      //  se o error for do tipo refresh token
      if (responseError.response.data?.code === 'token.expired') {
        //  renovar o token

        //  buscando informações dos cookies
        cookies = parseCookies();

        const { 'nextAuth.refreshToken': refreshToken } = cookies;

        // buscando configurações do axios
        const originalConfig = responseError.config;

        //  informando que esta sendo feito o refresh
        if (!isRefreshing) {
          //  fazendo refreshing
          isRefreshing = true;
          api
            .post('/refresh', {
              refreshToken,
            })
            .then((response) => {
              // novo token
              const { token, refreshToken } = response.data;

              //  salvando informações do novo token
              setCookie(undefined, 'nextAuth.token', token, {
                maxAge: 40 * 60 * 24 * 30, // 30 days
                path: '/',
              });

              //  salvando informações do novo refreshToken
              setCookie(undefined, 'nextAuth.refreshToken', refreshToken, {
                maxAge: 40 * 60 * 24 * 30, // 30 days
                path: '/',
              });

              // adicionando o novo token aos headers do axio
              api.defaults.headers['Authorization'] = `Bearer ${token}`;

              // chamando metodo de sucesso passando o token como parametro
              failedRequestQueue.forEach((request) => request.onSuccess(token));
              failedRequestQueue = [];
            })
            .catch((error) => {
              //  caso ocorra algum erro de outras requisições
              // mostrando requisições com erros do refresh
              failedRequestQueue.forEach((request) => request.onFailure(error));
              failedRequestQueue = [];
            })
            .finally(() => {
              isRefreshing = false;
            });
        }

        //  definindo promisse para o axios aguardar
        return new Promise((resolve, reject) => {
          // passando função de sucesso no primeiro parametro
          //  caso o refresh retorne sem erro o token sera armazenado nos cokkies
          failedRequestQueue.push({
            onSuccess: (token: string) => {
              originalConfig.headers['Authorization'] = `Bearer ${token}`;
              //  o axios ira aguardar esse resolve ser executado para assim prosseguir com as outras requisições
              //  onde todas as outras ja estarão com o token atualizado
              resolve(api(originalConfig));
            },

            //  passando função erro no segundo parametro
            onFailure: (error: AxiosError) => {
              reject(error);
            },
          });
        });
      } else {
        //  deslogar o usuario
        signOut();
      }
    }

    //  retornando erros que não são de autorização
    return Promise.reject(responseError);
  },
);

//  resumo -> todas as requisições que deram erro apos ser lançado um erro de refresh token serão colocadas em uma fila e serão processadoas novamente asssim
//  que o token for renovado correntamente.
