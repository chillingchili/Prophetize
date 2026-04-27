import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

type Props = {
  children: React.ReactNode;
  user?: { email?: string; username?: string } | null;
  onLogout?: () => void;
};

export const AdminShell = ({ children, user, onLogout }: Props) => {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Prophetize Admin</h1>
        <p className="sidebar-subtitle">Moderation, conflicts, and operational analytics in one place.</p>
        <p>
          <Badge variant="muted">Operations First</Badge>
        </p>
        <nav className="sidebar-nav">
          <a href="#operations">Markets Queue</a>
          <a href="#resolutions">Due Resolution</a>
          <a href="#conflicts">Conflicts</a>
          <a href="#analytics">Analytics</a>
        </nav>
        {onLogout ? (
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--line, #e5e5e5)' }}>
            {user?.email ? <p style={{ fontSize: 12, color: 'var(--muted, #888)', marginBottom: 8 }}>{user.email}</p> : null}
            <Button variant="ghost" size="sm" onClick={onLogout}>Log out</Button>
          </div>
        ) : null}
      </aside>
      <main className="main">{children}</main>
    </div>
  );
};
