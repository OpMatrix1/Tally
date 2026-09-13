import type { Session } from '@supabase/supabase-js';
import { BarChart3, FolderKanban, LockKeyhole, LogOut, ReceiptText } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Props = { session: Session };

const nav = [
  { to: '/', label: 'Dashboard', icon: BarChart3 },
  { to: '/transactions', label: 'Transactions', icon: ReceiptText },
  { to: '/categories', label: 'Categories', icon: FolderKanban },
  { to: '/security', label: 'Security', icon: LockKeyhole }
];

export default function Shell({ session }: Props) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <img src="/tally-logo.svg" className="brand" alt="Tally" />
        <nav className="nav-list">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="account-card">
          <span>{session.user.email}</span>
          <button className="icon-button" aria-label="Sign out" onClick={() => void supabase.auth.signOut()}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className="main-panel">
        <Outlet />
      </main>
    </div>
  );
}
