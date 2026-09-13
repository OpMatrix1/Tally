import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Shell from './components/Shell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Security from './pages/Security';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="boot-screen">Tally</div>;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
        <Route element={session ? <Shell session={session} /> : <Navigate to="/login" replace />}>
          <Route index element={<Dashboard session={session!} />} />
          <Route path="transactions" element={<Transactions session={session!} />} />
          <Route path="categories" element={<Categories session={session!} />} />
          <Route path="security" element={<Security />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
