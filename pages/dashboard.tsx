import { useEffect } from 'react';
import { useAuthentication } from '../context/AuthContext';
import { api } from '../services/api';

export default function Dashboard() {
  const { isAuthenticated, user } = useAuthentication();

  useEffect(() => {
    api
      .get('/me')
      .then((response) => console.log(response))
      .catch((error) => {
        console.log(error);
      });
  }, []);

  return (
    <div>
      <h1>Logged {user?.email}</h1>
    </div>
  );
}
