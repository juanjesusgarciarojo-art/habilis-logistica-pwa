import React, { useState } from 'react';
import type { User, UserRole } from '../types';
import { authService } from '../services/auth';
import { getSettings } from '../services/db';
import { Sun, Moon, LogOut, Laptop, CheckCircle, Menu, X, Settings, ClipboardList } from 'lucide-react';

interface LayoutProps {
  user: User;
  children: React.ReactNode;
  activeMenuItem: string;
  onMenuItemClick: (item: string) => void;
  onThemeToggle: () => void;
  theme: 'light' | 'dark';
}

export const Layout: React.FC<LayoutProps> = ({
  user,
  children,
  activeMenuItem,
  onMenuItemClick,
  onThemeToggle,
  theme
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const settings = getSettings();

  const handleRoleSwitch = (role: UserRole) => {
    authService.switchRole(role);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  return (
    <div className="app-container">
      {/* Sidebar - Desktop Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="logo-container">
          <img src="/logo.png" className="habilis-logo" alt="Habilis Logística" />
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <ul className="sidebar-menu">
            <li>
              <a
                onClick={() => { onMenuItemClick('dashboard'); setMobileMenuOpen(false); }}
                className={`menu-item ${activeMenuItem === 'dashboard' ? 'active' : ''}`}
              >
                <Laptop className="menu-item-icon" />
                <span>Mi Panel</span>
              </a>
            </li>
            
            {/* Conditional side menu options depending on roles */}
            {user.role === 'admin' && (
              <>
                <li>
                  <a
                    onClick={() => { onMenuItemClick('audits'); setMobileMenuOpen(false); }}
                    className={`menu-item ${activeMenuItem === 'audits' ? 'active' : ''}`}
                  >
                    <ClipboardList className="menu-item-icon" />
                    <span>Auditoría</span>
                  </a>
                </li>
              </>
            )}

            <li>
              <a
                onClick={() => { onMenuItemClick('settings'); setMobileMenuOpen(false); }}
                className={`menu-item ${activeMenuItem === 'settings' ? 'active' : ''}`}
              >
                <Settings className="menu-item-icon" />
                <span>Ajustes</span>
              </a>
            </li>
          </ul>

          {/* User profile footer inside sidebar */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
              alt={user.displayName}
              style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--habilis-blue)' }}
            />
            <div style={{ overflow: 'hidden' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.displayName}
              </span>
              <span className={`badge ${
                user.role === 'admin' ? 'badge-danger' :
                user.role === 'manager' ? 'badge-warning' : 'badge-primary'
              }`} style={{ fontSize: '0.65rem', marginTop: '0.15rem' }}>
                {user.role === 'admin' ? 'Administrador' : user.role === 'manager' ? 'Responsable' : 'Trabajador'}
              </span>
            </div>
            
            <button 
              onClick={handleLogout} 
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-wrapper">
        {/* Demo switcher bar at the very top */}
        {settings.isDemoMode && (
          <div className="role-switcher-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} style={{ color: 'var(--success)' }} />
              <span>
                <strong>Modo Demo Activo</strong>. Puedes simular roles instantáneamente:
              </span>
            </div>
            <div className="role-switcher-buttons">
              <button
                onClick={() => handleRoleSwitch('worker')}
                className={`role-btn ${user.role === 'worker' ? 'active' : ''}`}
              >
                Trabajador
              </button>
              <button
                onClick={() => handleRoleSwitch('manager')}
                className={`role-btn ${user.role === 'manager' ? 'active' : ''}`}
              >
                Responsable
              </button>
              <button
                onClick={() => handleRoleSwitch('admin')}
                className={`role-btn ${user.role === 'admin' ? 'active' : ''}`}
              >
                Administrador
              </button>
            </div>
          </div>
        )}

        {/* Top header bar */}
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-secondary"
              style={{ display: 'none', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}
              id="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {activeMenuItem === 'dashboard' ? 'Panel de Control' :
                 activeMenuItem === 'audits' ? 'Auditorías del Sistema' : 'Configuración'}
              </h1>
              {activeMenuItem === 'dashboard' && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Bienvenido a la gestión digital de Habilis, <strong>{user.displayName}</strong>.
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Theme Toggle Button */}
            <button
              onClick={onThemeToggle}
              className="btn btn-secondary"
              style={{ padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px' }}
              title="Cambiar tema"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        {/* Section Contents */}
        <div style={{ flexGrow: 1 }}>{children}</div>
      </main>

      {/* Mobile Navigation Bar */}
      <div className="mobile-nav-bar">
        <button
          onClick={() => onMenuItemClick('dashboard')}
          className={`mobile-nav-item ${activeMenuItem === 'dashboard' ? 'active' : ''}`}
        >
          <Laptop size={20} />
          <span>Inicio</span>
        </button>

        {user.role === 'admin' && (
          <button
            onClick={() => onMenuItemClick('audits')}
            className={`mobile-nav-item ${activeMenuItem === 'audits' ? 'active' : ''}`}
          >
            <ClipboardList size={20} />
            <span>Auditoría</span>
          </button>
        )}

        <button
          onClick={() => onMenuItemClick('settings')}
          className={`mobile-nav-item ${activeMenuItem === 'settings' ? 'active' : ''}`}
        >
          <Settings size={20} />
          <span>Ajustes</span>
        </button>
      </div>

      {/* Inject custom mobile CSS rule for buttons toggle override */}
      <style>{`
        @media (max-width: 1024px) {
          #mobile-menu-toggle {
            display: inline-flex !important;
          }
        }
      `}</style>
    </div>
  );
};
