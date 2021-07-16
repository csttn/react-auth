import { useAuthentication } from '../context/AuthContext';

export default function Dashboard() {
  const { isAuthenticated, user } = useAuthentication();

  return (
    <div>
      <h1>Logged {user?.email}</h1>
    </div>
  );
}
