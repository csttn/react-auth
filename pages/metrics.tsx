import Router from 'next/router';
import { signOut } from '../context/AuthContext';
import { setupAPIClient } from '../services/api';
import { withSSRAuth } from '../utils/withSSRAuth';

export default function Metrics() {
  function handleDashboardPage() {
    Router.push('/dashboard');
  }
  return (
    <div>
      <button onClick={signOut}>Logout</button>
      <button onClick={handleDashboardPage}>Dashboard</button>

      <div>Metrics</div>
    </div>
  );
}

export const getServerSideProps = withSSRAuth(
  async (ctx) => {
    const apiClient = setupAPIClient(ctx);

    const response = await apiClient.get('/me');

    return {
      props: {},
    };
  },
  {
    permissions: ['metrics.list'],
    roles: ['administrator'],
  },
);
