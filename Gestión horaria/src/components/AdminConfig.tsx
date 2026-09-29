import React, { useState, useEffect } from 'react';
import { isFirebaseConfigured } from '../services/firebase';
import { getTrabajadores, getFichajesHoy } from '../services/fichajeStorage';
import { TRABAJADORES_INICIALES } from '../services/mockData';
import { Database, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Trabajador, Fichaje } from '../types';

export const AdminConfig: React.FC = () => {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [fichajes, setFichajes] = useState<Fichaje[]>([]);
  const [msgReset, setMsgReset] = useState<string | null>(null);

  const cargar = async () => {
    const t = await getTrabajadores();
    const f = await getFichajesHoy();
    setTrabajadores(t);
    setFichajes(f);
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleRestablecerDemo = () => {
    if (confirm('¿Restablecer los trabajadores y fichajes a los valores iniciales de prueba?')) {
      localStorage.setItem('habilis_gh_trabajadores', JSON.stringify(TRABAJADORES_INICIALES));
      localStorage.removeItem('habilis_gh_fichajes');
      cargar();
      setMsgReset('✅ Datos de prueba restablecidos correctamente (PIN por defecto: 1234).');
      setTimeout(() => setMsgReset(null), 4000);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Estado de la Base de Datos */}
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{
            background: isFirebaseConfigured ? '#d1fae5' : '#e0f2fe',
            color: isFirebaseConfigured ? '#059669' : '#0284c7',
            padding: '10px',
            borderRadius: '12px'
          }}>
            <Database size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              Estado de la Base de Datos
            </h2>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              {isFirebaseConfigured
                ? '🟢 Conectado a Firebase Firestore (Producción)'
                : '🟡 Modo Local Autónomo (Persistencia en navegador para prototipado)'}
            </div>
          </div>
        </div>

        {!isFirebaseConfigured ? (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '13px',
            lineHeight: '1.6',
            color: '#334155'
          }}>
            <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              ℹ️ Preparado para la nueva base de datos de Firebase:
            </p>
            <p>
              Tal como acordamos, la aplicación funcionará de forma 100% interactiva en local mientras se crea la nueva base de datos.
              Cuando esté creada en Firebase Console, solo habrá que copiar las credenciales al archivo <code>.env</code> en la carpeta <code>Gestión horaria/</code> y la app comenzará a grabar en Firestore automáticamente sin cambiar una sola línea de código.
            </p>
          </div>
        ) : (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '14px', borderRadius: '12px', color: '#065f46', fontSize: '13px' }}>
            <CheckCircle2 size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
            Conexión activa con Firebase. Todos los fichajes se graban con hora inmutable <code>serverTimestamp()</code>.
          </div>
        )}

        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleRestablecerDemo}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#334155',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <RefreshCw size={16} /> Restablecer operarios de prueba (PIN: 1234)
          </button>
          {msgReset && <span style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>{msgReset}</span>}
        </div>
      </div>

      {/* Tabla de Fichajes Registrados Hoy */}
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        padding: '24px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              Fichajes Realizados Hoy ({fichajes.length})
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              Trazabilidad inmutable de entradas y salidas
            </p>
          </div>
          <button
            onClick={cargar}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {fichajes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
            No se ha realizado ningún fichaje hoy. Prueba a fichar desde el <b>Modo Tablet / Kiosco</b>.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '10px 14px' }}>Hora</th>
                  <th style={{ padding: '10px 14px' }}>Trabajador</th>
                  <th style={{ padding: '10px 14px' }}>Centro</th>
                  <th style={{ padding: '10px 14px' }}>Tipo</th>
                  <th style={{ padding: '10px 14px' }}>Terminal</th>
                </tr>
              </thead>
              <tbody>
                {fichajes.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700 }}>{f.horaStr}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{f.nombreCompleto} ({f.numeroTrabajador})</td>
                    <td style={{ padding: '10px 14px' }}>Centro {f.centroId}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        background: f.tipo === 'ENTRADA' ? '#d1fae5' : '#fee2e2',
                        color: f.tipo === 'ENTRADA' ? '#065f46' : '#991b1b',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '11px'
                      }}>
                        {f.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '11px' }}>{f.dispositivoId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resumen de Plantilla Autorizada */}
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        padding: '24px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
          Plantilla Cargada en la Aplicación ({trabajadores.length} operarios)
        </h3>
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
          Códigos de 5 cifras sincronizables con la hoja <code>Exportación fichaje</code> de <code>01_Gestion_Plantilla_HABILIS_v2_1.xlsx</code>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
          {trabajadores.map(t => (
            <div key={t.numeroTrabajador} style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '10px 14px'
            }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{t.nombreCompleto}</div>
              <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>
                {t.numeroTrabajador} · C{t.centroActual} · {t.puesto}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                PIN Demo: <code>1234</code>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
