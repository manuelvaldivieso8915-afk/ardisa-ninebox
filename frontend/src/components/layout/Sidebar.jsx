import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { path: '/',                label: 'Dashboard',      icon: '⬡' },
  { path: '/colaboradores',   label: 'Colaboradores',  icon: '◉' },
  { path: '/evaluaciones',    label: 'Evaluaciones',   icon: '◈' },
  { path: '/nine-box',        label: 'Matriz Nine Box', icon: '⊞' },
  { path: '/reportes',        label: 'Reportes',        icon: '◎' },
];
const ADMIN_ITEMS = [
  { path: '/usuarios',  label: 'Usuarios',  icon: '◑' },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="#1E4DB7"/>
            <path d="M8 26L18 10L28 26H8Z" fill="white" fillOpacity=".9"/>
            <circle cx="18" cy="17" r="5" fill="white" fillOpacity=".15"/>
          </svg>
        </div>
        {!collapsed && (
          <div className="logo-text">
            <div className="logo-name">Grupo Ardisa</div>
            <div className="logo-sub">Nine Box Platform</div>
          </div>
        )}
        <button className="sidebar-toggle" onClick={onToggle}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {!collapsed && <div className="nav-section-label">PRINCIPAL</div>}
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
            {!collapsed && <span className="nav-indicator" />}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            {!collapsed && <div className="nav-section-label" style={{marginTop:'16px'}}>ADMINISTRACIÓN</div>}
            {ADMIN_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
                {!collapsed && <span className="nav-indicator" />}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="sidebar-user">
        {!collapsed ? (
          <>
            <div className="user-avatar">{user?.full_name?.[0] || 'A'}</div>
            <div className="user-info">
              <div className="user-name">{user?.full_name}</div>
              <div className="user-role">{user?.role === 'admin' ? 'Administrador' : 'Evaluador'}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </>
        ) : (
          <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión" style={{width:'100%', justifyContent:'center'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        )}
      </div>

      <style>{`
        .sidebar {
          position: fixed;
          left: 0; top: 0; bottom: 0;
          width: var(--sidebar-w);
          background: var(--bg-sidebar);
          display: flex;
          flex-direction: column;
          z-index: 100;
          transition: width 0.3s ease;
          border-right: 1px solid rgba(255,255,255,.06);
        }
        .sidebar.collapsed { width: 72px; }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 16px 16px;
          border-bottom: 1px solid rgba(255,255,255,.06);
          min-height: 72px;
        }
        .logo-icon { flex-shrink: 0; }
        .logo-name {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 800;
          color: white; letter-spacing: -0.01em;
          white-space: nowrap;
        }
        .logo-sub { font-size: 11px; color: rgba(255,255,255,.4); }
        .sidebar-toggle {
          margin-left: auto; background: rgba(255,255,255,.08);
          border: none; color: rgba(255,255,255,.6);
          width: 24px; height: 24px;
          border-radius: 6px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
          transition: background 0.2s;
        }
        .sidebar-toggle:hover { background: rgba(255,255,255,.15); }

        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 16px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .nav-section-label {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,.3);
          padding: 4px 8px 8px;
        }
        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius);
          color: rgba(255,255,255,.55);
          text-decoration: none;
          font-size: 14px; font-weight: 500;
          transition: all 0.2s;
          position: relative;
          white-space: nowrap;
        }
        .nav-item:hover { background: rgba(255,255,255,.08); color: white; }
        .nav-item.active {
          background: rgba(37,99,235,.25);
          color: white;
        }
        .nav-item.active .nav-indicator {
          position: absolute; right: 8px;
          width: 4px; height: 4px;
          border-radius: 50%;
          background: var(--blue-400);
        }
        .nav-icon { font-size: 16px; flex-shrink: 0; min-width: 20px; text-align: center; }
        .nav-label { flex: 1; }

        .sidebar-user {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px;
          border-top: 1px solid rgba(255,255,255,.06);
        }
        .user-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--blue-500);
          color: white; font-weight: 700; font-size: 14px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .user-name {
          font-size: 13px; font-weight: 600;
          color: white; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
          max-width: 130px;
        }
        .user-role { font-size: 11px; color: rgba(255,255,255,.4); }
        .logout-btn {
          margin-left: auto; background: rgba(255,255,255,.08);
          border: none; color: rgba(255,255,255,.5);
          width: 32px; height: 32px;
          border-radius: 8px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; flex-shrink: 0;
        }
        .logout-btn:hover { background: rgba(239,68,68,.2); color: #FCA5A5; }
      `}</style>
    </aside>
  );
};

export default Sidebar;
