import Router from 'next/router';
import { useEffect } from 'react';
import { Can } from '../components/Can';
import { authChannelPostMessage, useAuthentication } from '../context/AuthContext';
import { setupAPIClient } from '../services/api';
import { api } from '../services/apiClient';
import { withSSRAuth } from '../utils/withSSRAuth';

export default function Dashboard() {
  const { isAuthenticated, user, signOut } = useAuthentication();

  useEffect(() => {
    api
      .get('/me')
      .then((response) => console.log(response))
      .catch((error) => {
        console.log(error);
      });
  }, []);

  function handleMetricsPage() {
    Router.push('/metrics');
  }

  function handleSignOut() {
    // enviando messagem de logout ao canal do BroadcastChannel informando que uam pagina foi deslogada
    authChannelPostMessage('signOut');
    signOut();
  }

  return (
    <div>
      <h1>Logged {user?.email}</h1>

      <button onClick={handleSignOut}>Sign Out</button>
      <button onClick={handleMetricsPage}> Go to Metrics Page</button>

      <Can permissions={['metrics.listt']}>
        <div>Metricas</div>
      </Can>
    </div>
  );
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPIClient(ctx);

  const response = await apiClient.get('/me');

  return {
    props: {},
  };
});
