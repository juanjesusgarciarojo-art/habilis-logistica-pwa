import React, { useState, useEffect } from 'react';
import { Trabajador, Fichaje, TurnoTipo, PlanTurnoTrabajador } from '../types';
import { getTrabajadores, getFichajesHoy, saveTrabajador } from '../services/fichajeStorage';
import { CUADRANTE_INICIAL } from '../services/mockData';
import { Sun, Sunset, Moon, Users, CheckCircle, Clock, AlertCircle, Unlock, RefreshCw } from 'lucide-react';

export const SupervisorMonitor: React.FC = () => {
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<TurnoTipo>('MAÑANA');
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [fichajesHoy, setFichajesHoy] = useState<Fichaje[]>([]);
  const [cuadrante] = useState<PlanTurnoTrabajador[]>(CUADRANTE_INICIAL);
  const [filtroCentro, setFiltroCentro] = useState<1 | 2>(1);
  const [cargando, setCargando] = useState<boolean>(false);
  const [ultimaHoraRefresco, setUltimaHoraRefresco] = useState<string>('');

  const cargarDatos = async (manual: boolean = false) => {
    if (manual) setCargando(true);
    const t = await getTrabajadores();
    const f = await getFichajesHoy();
    setTrabajadores(t);
    setFichajesHoy(f);
    const ahora = new Date();
    setUltimaHoraRefresco(ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    if (manual) {
      setTimeout(() => {
        setCargando(false);
      }, 500);
    }
  };

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(() => cargarDatos(false), 5000); // Refresco en segundo plano cada 5s
    return () => clearInterval(interval);
  }, []);

  // Desbloquear PIN de un trabajador
  const handleDesbloquear = async (trabajador: Trabajador) => {
    if (confirm(`¿Desbloquear al trabajador ${trabajador.nombreCompleto} (${trabajador.numeroTrabajador}) y restablecer a 0 los intentos fallidos?`)) {
      const actualizado: Trabajador = {
        ...trabajador,
        bloqueado: false,
        intentosFallidos: 0
      };
      await saveTrabajador(actualizado);
      await cargarDatos();
    }
  };

  // Clasificación de operarios en el turno
  // 1. Trabajadores del cuadrante en este turno y centro
  const asignadosTurno = cuadrante.filter(c => c.turnoAsignado === turnoSeleccionado && c.centro === filtroCentro);

  // Fichajes del centro
  const fichajesCentro = fichajesHoy.filter(f => f.centroId === filtroCentro);

  // Presentes: último fichaje es 'ENTRADA'
  const presentes = trabajadores.filter(t => {
    if (t.centroActual !== filtroCentro) return false;
    const fList = fichajesCentro.filter(f => f.numeroTrabajador === t.numeroTrabajador);
    if (fList.length === 0) return false;
    return fList[fList.length - 1].tipo === 'ENTRADA';
  });

  // Pendientes: en cuadrante de este turno pero aún no ficharon Entrada
  const pendientes = asignadosTurno.filter(plan => {
    const estaPresente = presentes.some(p => p.numeroTrabajador === plan.numeroTrabajador);
    return !estaPresente;
  });

  // Refuerzos: presentes en planta que NO estaban en el cuadrante de este turno
  const refuerzos = presentes.filter(p => {
    return !asignadosTurno.some(plan => plan.numeroTrabajador === p.numeroTrabajador);
  });

  return (
    <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Controles de Cabecera: Selector de Turno y Centro */}
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        padding: '18px 24px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
            📋 Monitor de Turno en Planta (Pase de Lista)
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Control en tiempo real de presencia de carretilleros y operarios
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Selector de Centro */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => setFiltroCentro(1)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: filtroCentro === 1 ? '#00609f' : 'transparent',
                color: filtroCentro === 1 ? 'white' : '#64748b',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Saica Pack · Velilla (C1)
            </button>
            <button
              onClick={() => setFiltroCentro(2)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: filtroCentro === 2 ? '#00609f' : 'transparent',
                color: filtroCentro === 2 ? 'white' : '#64748b',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Saica Pack · Meco (C2)
            </button>
          </div>

          {/* Selector de Turno */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setTurnoSeleccionado('MAÑANA')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1.5px solid',
                borderColor: turnoSeleccionado === 'MAÑANA' ? '#f59e0b' : '#e2e8f0',
                background: turnoSeleccionado === 'MAÑANA' ? '#fef3c7' : '#ffffff',
                color: turnoSeleccionado === 'MAÑANA' ? '#b45309' : '#64748b',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <Sun size={16} /> Mañana (06:00 - 14:00)
            </button>

            <button
              onClick={() => setTurnoSeleccionado('TARDE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1.5px solid',
                borderColor: turnoSeleccionado === 'TARDE' ? '#f97316' : '#e2e8f0',
                background: turnoSeleccionado === 'TARDE' ? '#ffedd5' : '#ffffff',
                color: turnoSeleccionado === 'TARDE' ? '#c2410c' : '#64748b',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <Sunset size={16} /> Tarde (14:00 - 22:00)
            </button>

            <button
              onClick={() => setTurnoSeleccionado('NOCHE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1.5px solid',
                borderColor: turnoSeleccionado === 'NOCHE' ? '#6366f1' : '#e2e8f0',
                background: turnoSeleccionado === 'NOCHE' ? '#e0e7ff' : '#ffffff',
                color: turnoSeleccionado === 'NOCHE' ? '#4338ca' : '#64748b',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <Moon size={16} /> Noche
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {ultimaHoraRefresco && (
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Actualizado: <b>{ultimaHoraRefresco}</b>
              </span>
            )}
            <button
              onClick={() => cargarDatos(true)}
              disabled={cargando}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#00609f',
                cursor: cargando ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
              title="Refrescar datos en tiempo real"
            >
              <RefreshCw
                size={15}
                style={{
                  animation: cargando ? 'spin 0.6s linear infinite' : 'none'
                }}
              />
              <span>{cargando ? 'Actualizando...' : 'Refrescar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Semáforo de 3 Columnas: Presentes, Pendientes, Refuerzos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

        {/* COLUMNA 1: 🟢 PRESENTES / EN PLANTA */}
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #10b981', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', fontWeight: 800, fontSize: '15px' }}>
              <CheckCircle size={20} color="#10b981" />
              🟢 Presentes en Planta ({presentes.length})
            </div>
            <span style={{ background: '#d1fae5', color: '#065f46', fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
              Fichado OK
            </span>
          </div>

          {presentes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '13px' }}>
              Aún no hay operarios fichados en este centro.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {presentes.map(t => {
                const ult = fichajesCentro.filter(f => f.numeroTrabajador === t.numeroTrabajador).pop();
                return (
                  <div key={t.numeroTrabajador} style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{t.nombreCompleto}</div>
                      <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                        {t.numeroTrabajador} · {t.puesto}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Entrada:</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#065f46' }}>{ult?.horaStr}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUMNA 2: 🔴 PENDIENTES DE FICHAR */}
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ef4444', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b', fontWeight: 800, fontSize: '15px' }}>
              <Clock size={20} color="#ef4444" />
              🔴 Pendientes del Turno ({pendientes.length})
            </div>
            <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
              Sin Fichar
            </span>
          </div>

          {pendientes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#10b981', fontSize: '13px', fontWeight: 600 }}>
              🎉 ¡Turno completo! Todos los operarios previstos han fichado.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pendientes.map(plan => {
                const trab = trabajadores.find(t => t.numeroTrabajador === plan.numeroTrabajador);
                return (
                  <div key={plan.numeroTrabajador} style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{plan.nombreCompleto}</div>
                      <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                        {plan.numeroTrabajador} · {plan.puesto}
                      </div>
                    </div>
                    {trab?.bloqueado && (
                      <span style={{ background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 800, padding: '3px 6px', borderRadius: '6px' }}>
                        PIN BLOQUEADO
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUMNA 3: 🔵 REFUERZOS O EXTRAS */}
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #3b82f6', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', fontWeight: 800, fontSize: '15px' }}>
              <Users size={20} color="#3b82f6" />
              🔵 Refuerzos / Extras ({refuerzos.length})
            </div>
            <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
              Fuera de Cuadrante
            </span>
          </div>

          {refuerzos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '13px' }}>
              No hay operarios de refuerzo en este turno.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {refuerzos.map(t => (
                <div key={t.numeroTrabajador} style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '12px',
                  padding: '12px'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{t.nombreCompleto}</div>
                  <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>
                    {t.numeroTrabajador} · {t.puesto}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Panel de Gestión Rápida de PINs / Desbloqueo */}
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        marginTop: '10px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} color="#00609f" />
          Atención a Incidencias de PIN en Planta
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
          Si un trabajador supera los 3 intentos fallidos, el Responsable puede desbloquearlo tras verificar su identidad y cumplimentar el parte auxiliar en papel <b>FOR-RRHH-001-01</b>.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {trabajadores.filter(t => t.centroActual === filtroCentro).map(t => (
            <div key={t.numeroTrabajador} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              background: t.bloqueado ? '#fee2e2' : '#f8fafc',
              border: '1px solid',
              borderColor: t.bloqueado ? '#ef4444' : '#e2e8f0',
              padding: '8px 14px',
              borderRadius: '10px',
              minWidth: '280px'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{t.nombreCompleto}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Cód: <b>{t.numeroTrabajador}</b> · Fallos: {t.intentosFallidos || 0}/3
                </div>
              </div>

              {t.bloqueado ? (
                <button
                  onClick={() => handleDesbloquear(t)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Unlock size={14} /> Desbloquear
                </button>
              ) : (
                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>Activo</span>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
