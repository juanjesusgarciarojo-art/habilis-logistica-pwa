import React, { useState, useEffect } from 'react';
import type { User } from './types';
import { authService } from './services/auth';
import { Layout } from './components/Layout';
import { WorkerDashboard } from './components/WorkerDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuditLogView } from './components/AuditLogView';
import { SettingsPanel } from './components/SettingsPanel';
import { Mail } from 'lucide-react';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeMenuItem, setActiveMenuItem] = useState<string>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  useEffect(() => {
    // Set initial user session
    setUser(authService.getCurrentUser());

    // Listen for instant role-switching events from within layout
    const handleAuthChange = () => {
      setUser(authService.getCurrentUser());
      setActiveMenuItem('dashboard'); // reset to dashboard
    };

    window.addEventListener('habilis_auth_change', handleAuthChange);

    // Set initial theme
    const savedTheme = localStorage.getItem('habilis_theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'light';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);

    return () => {
      window.removeEventListener('habilis_auth_change', handleAuthChange);
    };
  }, []);

  const handleThemeToggle = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('habilis_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const u = await authService.login(loginEmail);
      setUser(u);
    } catch (err: any) {
      setLoginError(err.message || 'Error de autenticación.');
    }
  };

  const handleQuickLogin = async (email: string) => {
    setLoginError('');
    try {
      const u = await authService.login(email);
      setUser(u);
    } catch (err: any) {
      setLoginError(err.message || 'Error de autenticación.');
    }
  };

  // Render Login view if user is not authenticated
  if (!user) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div className="card-habilis" style={{ maxWidth: '420px', width: '100%', padding: '2.5rem', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
          <img src="./logo.png" className="habilis-logo" alt="Habilis Logística" style={{ height: '54px', marginBottom: '1.5rem' }} />
          
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--habilis-blue)' }}>Gestión Logística</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>Acceso seguro para personal Habilis</p>

          {loginError && (
            <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', marginBottom: '1rem', textAlign: 'left' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="loginEmail" style={{ fontSize: '0.85rem' }}>Correo Corporativo</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="loginEmail"
                  type="email"
                  className="form-input"
                  placeholder="ej. operario@habilis.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Entrar al Portal
            </button>
          </form>

          {/* Quick links for Demo review */}
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '2rem', paddingTop: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem' }}>
              ACCESOS DE DEMOSTRACIÓN (1 CLIC)
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                onClick={() => handleQuickLogin('operario@habilis.com')} 
                className="btn btn-secondary" 
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>Carlos Gómez (Operario)</span>
                <span className="badge badge-primary" style={{ fontSize: '0.6rem' }}>Trabajador</span>
              </button>
              <button 
                onClick={() => handleQuickLogin('responsable@habilis.com')} 
                className="btn btn-secondary" 
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>Elena Rodríguez (Supervisor)</span>
                <span className="badge badge-warning" style={{ fontSize: '0.6rem' }}>Responsable</span>
              </button>
              <button 
                onClick={() => handleQuickLogin('admin@habilis.com')} 
                className="btn btn-secondary" 
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>Administrador Habilis</span>
                <span className="badge badge-danger" style={{ fontSize: '0.6rem' }}>Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Dashboard based on active navigation item
  const renderContent = () => {
    switch (activeMenuItem) {
      case 'dashboard':
        if (user.role === 'worker') {
          return <WorkerDashboard user={user} />;
        } else if (user.role === 'manager') {
          return <ManagerDashboard user={user} />;
        } else if (user.role === 'admin') {
          return <AdminDashboard user={user} />;
        }
        return <div>Rol de usuario no autorizado.</div>;
      
      case 'audits':
        return user.role === 'admin' ? <AuditLogView /> : <div>No autorizado.</div>;
      
      case 'settings':
        return <SettingsPanel onSettingsSaved={() => {}} />;
      
      default:
        return <WorkerDashboard user={user} />;
    }
  };

  return (
    <Layout
      user={user}
      activeMenuItem={activeMenuItem}
      onMenuItemClick={setActiveMenuItem}
      onThemeToggle={handleThemeToggle}
      theme={theme}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
