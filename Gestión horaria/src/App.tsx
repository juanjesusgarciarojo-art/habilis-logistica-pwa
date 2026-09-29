import React, { useState } from 'react';
import { KioskView } from './components/KioskView';
import { SupervisorMonitor } from './components/SupervisorMonitor';
import { AdminConfig } from './components/AdminConfig';
import { Smartphone, Users, Settings } from 'lucide-react';

export const App: React.FC = () => {
  const [seccionActiva, setSeccionActiva] = useState<'kiosco' | 'monitor' | 'admin'>('kiosco');

  return (
    <div className="app-container">
      {/* Barra de Navegación Superior */}
      <header className="top-navbar">
        <div className="brand-section">
          <div className="brand-badge">HABILIS</div>
          <div>
            <div className="brand-title">Gestión Horaria y Control de Jornada</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Punto de Control en Planta · Saica Pack</div>
          </div>
        </div>

        {/* Pestañas de Vista */}
        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${seccionActiva === 'kiosco' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('kiosco')}
          >
            <Smartphone size={16} />
            📱 Modo Tablet (Punto de Fichaje)
          </button>

          <button
            className={`nav-tab-btn ${seccionActiva === 'monitor' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('monitor')}
          >
            <Users size={16} />
            📋 Monitor Responsable de Turno
          </button>

          <button
            className={`nav-tab-btn ${seccionActiva === 'admin' ? 'active' : ''}`}
            onClick={() => setSeccionActiva('admin')}
          >
            <Settings size={16} />
            ⚙️ Base de Datos & Registros
          </button>
        </nav>
      </header>

      {/* Contenido Principal */}
      <main className="main-content">
        {seccionActiva === 'kiosco' && <KioskView />}
        {seccionActiva === 'monitor' && <SupervisorMonitor />}
        {seccionActiva === 'admin' && <AdminConfig />}
      </main>
    </div>
  );
};

export default App;
