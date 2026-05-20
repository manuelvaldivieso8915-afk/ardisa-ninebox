import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ collapsed }) => {
  const { user, theme, toggleTheme } = useAuth();
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className={`app-header ${collapsed ? 'collapsed' : ''}`}>
      <div className="header-left">
        <div className="header-date">{dateStr}</div>
      </div>
      <div className="header-right">
        <button className="header-btn" onClick={toggleTheme} title="Cambiar tema">
          {theme === 'dark'
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
        </button>

        <div className="header-user">
          <div className="header-avatar">{user?.full_name?.[0] || 'U'}</div>
          <div className="header-user-info">
            <div className="header-user-name">{user?.full_name}</div>
            <div className="header-user-role">{user?.role === 'admin' ? 'Administrador' : 'Evaluador'}</div>
          </div>
        </div>
      </div>

      <style>{`
        .app-header {
          position: fixed;
          top: 0; right: 0;
          left: var(--sidebar-w);
          height: var(--header-h);
          background: var(--bg-card);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          z-index: 90;
          transition: left 0.3s;
        }
        .app-header.collapsed { left: 72px; }
        .header-date {
          font-size: 13px;
          color: var(--text-muted);
          text-transform: capitalize;
        }
        .header-right { display: flex; align-items: center; gap: 12px; }
        .header-btn {
          width: 36px; height: 36px;
          border-radius: var(--radius);
          background: var(--bg-app);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .header-btn:hover { background: var(--blue-500); color: white; border-color: var(--blue-500); }
        .header-user { display: flex; align-items: center; gap: 10px; }
        .header-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: var(--blue-500);
          color: white; font-weight: 700; font-size: 14px;
          display: flex; align-items: center; justify-content: center;
        }
        .header-user-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .header-user-role { font-size: 11px; color: var(--text-muted); }
      `}</style>
    </header>
  );
};

export default Header;
