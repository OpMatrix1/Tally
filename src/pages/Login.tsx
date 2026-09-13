import { FormEvent, useState } from 'react';
import { supabase } from '../lib/supabase';

const authRedirectUrl = import.meta.env.PROD ? 'https://opmatrix1.github.io/Tally/#/' : window.location.origin + import.meta.env.BASE_URL + '#/';

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const result =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: authRedirectUrl }
          });
    setBusy(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    if (mode === 'signup') setMessage('Check your inbox to confirm your account.');
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <img src="/tally-logo.svg" alt="Tally" className="auth-logo" />
        <div>
          <h1>Know where it went</h1>
          <p>Track spending, budgets, and income with a private Supabase-backed account.</p>
        </div>
        <form onSubmit={submit} className="stack">
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>
          <button className="primary-button" disabled={busy}>
            {busy ? 'Working' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        {message && <p className="notice">{message}</p>}
        <button className="text-button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
          {mode === 'signin' ? 'Create a new account' : 'Use an existing account'}
        </button>
      </section>
    </main>
  );
}
