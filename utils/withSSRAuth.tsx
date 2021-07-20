import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { destroyCookie, parseCookies } from 'nookies';
import { AuthTokenError } from '../services/errors/AuthTokenError';

export function withSSRAuth<P>(fn: GetServerSideProps<P>) {
  return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
    const cookies = parseCookies(ctx);
    if (!cookies['nextAuth.token']) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    //  capturando erros de autenticação que não seja de refresh token, e deslogando o usuario pelo servidor
    try {
      return await fn(ctx);
    } catch (error) {
      if (error instanceof AuthTokenError) {
        destroyCookie(ctx, 'nextAuth.token');
        destroyCookie(ctx, 'nextAuth.refreshToken');

        return {
          redirect: {
            destination: '/',
            permanent: false,
          },
        };
      }
      throw new Error('Erro inesperado na autenticação');
    }
  };
}
