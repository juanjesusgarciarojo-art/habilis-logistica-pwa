import React, { useState } from 'react';
import { KioskView } from './components/KioskView';
import { SupervisorMonitor } from './components/SupervisorMonitor';
import { AdminConfig } from './components/AdminConfig';
import { Smartphone, Users, Settings, Eye, EyeOff, Lock, LogOut } from 'lucide-react';
import { Trabajador } from './types';

export const App: React.FC = () => {
  const [seccionActiva, setSeccionActiva] = useState<'kiosco' | 'monitor' | 'admin'>('kiosco');
  const [responsableActivo, setResponsableActivo] = useState<Trabajador | null>(null);
  const [modoKioscoDefinitivo, setModoKioscoDefinitivo] = useState<boolean>(false);

  // Acceso concedido desde el modal del kiosco (vía B)
  const handleAccesoResponsable = (resp: Trabajador) => {
    setResponsableActivo(resp);
    setSeccionActiva('monitor');
  };

  // Salir de la zona de control y volver al punto de fichaje
  const handleCerrarSesionResponsable = () => {
    setResponsableActivo(null);
    setSeccionActiva('kiosco');
  };

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      
      {/* Barra de Desarrollo / Pruebas (se oculta al simular la versión definitiva) */}
      {!modoKioscoDefinitivo && (
        <header className="top-navbar">
          <div className="brand-section">
            <img src="/logo.png" alt="Habilis" style={{ height: '34px', objectFit: 'contain' }} />
            <div style={{ borderLeft: '1.5px solid #cbd5e1', paddingLeft: '14px', marginLeft: '6px' }}>
              <div className="brand-title">Gestión Horaria y Control de Jornada</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Punto de Control en Planta · Saica Pack</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Pestañas de Vista de Desarrollo */}
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

            {/* Botón temporal para simular la pantalla definitiva (oculta esta barra) */}
            <button
              onClick={() => {
                setSeccionActiva('kiosco');
                setModoKioscoDefinitivo(true);
              }}
              title="Oculta la barra superior para ver cómo lucirá exactamente la tablet en el muelle de carga"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <EyeOff size={14} color="#38bdf8" />
              👁️ Simular Pantalla Definitiva
            </button>
          </div>
        </header>
      )}

      {/* Botón flotante para restaurar la barra de desarrollo cuando está en modo definitivo */}
      {modoKioscoDefinitivo && (
        <button
          onClick={() => setModoKioscoDefinitivo(false)}
          title="Restaurar las pestañas de desarrollo"
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            color: '#38bdf8',
            border: '1px solid #334155',
            padding: '8px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)'
          }}
        >
          <Eye size={14} />
          🛠️ Mostrar barra de desarrollo
        </button>
      )}

      {/* Barra de Responsable Autenticado (cuando está en zona de control) */}
      {responsableActivo && seccionActiva !== 'kiosco' && (
        <div style={{
          background: '#0284c7',
          color: '#ffffff',
          padding: '10px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
            <Lock size={16} />
            <span>Zona de Control activa · <b>{responsableActivo.nombreCompleto}</b> ({responsableActivo.numeroTrabajador} - Centro {responsableActivo.centroActual})</span>
          </div>
          <button
            onClick={handleCerrarSesionResponsable}
            style={{
              background: '#ffffff',
              color: '#0284c7',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={14} />
            🔒 Volver a Punto de Fichaje
          </button>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="main-content" style={{ padding: modoKioscoDefinitivo ? '20px' : '24px' }}>
        {seccionActiva === 'kiosco' && (
          <KioskView onAccesoResponsable={handleAccesoResponsable} />
        )}
        {seccionActiva === 'monitor' && <SupervisorMonitor />}
        {seccionActiva === 'admin' && <AdminConfig />}
      </main>
    </div>
  );
};

export default App;
