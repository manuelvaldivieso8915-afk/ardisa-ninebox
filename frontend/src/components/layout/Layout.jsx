import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <Header collapsed={collapsed} />
      <main className="page-content" style={{ marginLeft: collapsed ? '72px' : 'var(--sidebar-w)' }}>
        <div className="page-inner animate-fade">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
