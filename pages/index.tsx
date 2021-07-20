import Router from 'next/dist/client/router';
import { FormEvent, useState } from 'react';
import { useAuthentication } from '../context/AuthContext';
import styles from '../styles/Home.module.css';
import { withSSRGuest } from '../utils/withSSRGuest';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { isAuthenticated, signIn } = useAuthentication();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const data = {
      email,
      password,
    };
    await signIn(data);

    if (isAuthenticated) {
      Router.push('/dashboard');
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <input
        type='email'
        placeholder='email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type='password'
        placeholder='senha'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type='submit'>Submit </button>
    </form>
  );
}
//  Hight order Function
export const getServerSideProps = withSSRGuest(async (ctx) => {
  return { props: {} };
});
