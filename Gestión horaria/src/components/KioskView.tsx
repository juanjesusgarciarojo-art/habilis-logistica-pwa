import React, { useState, useEffect } from 'react';
import { Trabajador, Fichaje } from '../types';
import { getTrabajadores, saveTrabajador, registrarFichaje, getUltimoFichajeHoy } from '../services/fichajeStorage';
import { validarPinTrabajador } from '../services/authPin';
import { CheckCircle2, AlertTriangle, Delete, ArrowRight, UserCheck, ShieldAlert, LogIn, LogOut, Lock, X } from 'lucide-react';

interface KioskViewProps {
  onAccesoResponsable?: (responsable: Trabajador) => void;
}

export const KioskView: React.FC<KioskViewProps> = ({ onAccesoResponsable }) => {
  // Pasos: 1 = Código de 5 cifras, 2 = Confirmación & PIN, 3 = Marcaje Entrada/Salida
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [codigoInput, setCodigoInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [trabajadorActual, setTrabajadorActual] = useState<Trabajador | null>(null);
  const [ultimoFichaje, setUltimoFichaje] = useState<Fichaje | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exitoFichaje, setExitoFichaje] = useState<Fichaje | null>(null);
  const [segundosRetorno, setSegundosRetorno] = useState<number>(3);
  const [relojHora, setRelojHora] = useState<string>('');

  // Modal para acceso protegido de Responsable
  const [modalRespOpen, setModalRespOpen] = useState<boolean>(false);
  const [respCodigo, setRespCodigo] = useState<string>('');
  const [respPin, setRespPin] = useState<string>('');
  const [respError, setRespError] = useState<string | null>(null);

  const handleLoginResponsable = async (e: React.FormEvent) => {
    e.preventDefault();
    setRespError(null);
    const trabajadores = await getTrabajadores();
    const encontrado = trabajadores.find(t => t.numeroTrabajador === respCodigo);
    if (!encontrado) {
      setRespError('⚠️ Código de usuario no reconocido.');
      return;
    }
    if (encontrado.puesto !== 'Responsable') {
      setRespError(`🚫 Acceso denegado: ${encontrado.nombreCompleto} tiene categoría de ${encontrado.puesto}. Solo personal con categoría de Responsable puede entrar a la zona de control.`);
      return;
    }
    const { resultado } = await validarPinTrabajador(respPin, encontrado);
    if (!resultado.valido) {
      setRespError(`⚠️ ${resultado.mensaje}`);
      return;
    }
    // Éxito: cerrar modal y notificar al padre
    setModalRespOpen(false);
    setRespCodigo('');
    setRespPin('');
    if (onAccesoResponsable) {
      onAccesoResponsable(encontrado);
    }
  };

  // Reloj de la cabecera
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setRelojHora(d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Temporizador para volver automáticamente a la pantalla de inicio tras fichar
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (exitoFichaje && segundosRetorno > 0) {
      timer = setTimeout(() => {
        setSegundosRetorno(prev => prev - 1);
      }, 1000);
    } else if (exitoFichaje && segundosRetorno === 0) {
      resetearKiosco();
    }
    return () => clearTimeout(timer);
  }, [exitoFichaje, segundosRetorno]);

  const resetearKiosco = () => {
    setPaso(1);
    setCodigoInput('');
    setPinInput('');
    setTrabajadorActual(null);
    setUltimoFichaje(null);
    setErrorMsg(null);
    setExitoFichaje(null);
    setSegundosRetorno(3);
  };

  // Pulsación en el teclado numérico
  const handleKeypadPress = async (digit: string) => {
    setErrorMsg(null);

    if (paso === 1) {
      if (codigoInput.length < 5) {
        const nuevoCodigo = codigoInput + digit;
        setCodigoInput(nuevoCodigo);
        if (nuevoCodigo.length === 5) {
          await verificarCodigo(nuevoCodigo);
        }
      }
    } else if (paso === 2) {
      if (pinInput.length < 4) {
        const nuevoPin = pinInput + digit;
        setPinInput(nuevoPin);
        if (nuevoPin.length === 4) {
          await verificarPin(nuevoPin);
        }
      }
    }
  };

  const handleBorrar = () => {
    setErrorMsg(null);
    if (paso === 1) {
      setCodigoInput(prev => prev.slice(0, -1));
    } else if (paso === 2) {
      setPinInput(prev => prev.slice(0, -1));
    }
  };

  // Paso 1: Validar código de 5 cifras
  const verificarCodigo = async (codigo: string) => {
    const trabajadores = await getTrabajadores();
    const encontrado = trabajadores.find(t => t.numeroTrabajador === codigo);

    if (!encontrado) {
      setErrorMsg('⚠️ Código no reconocido. Consulta con el Responsable de Turno.');
      return;
    }

    if (encontrado.estado !== 'ACTIVO') {
      setErrorMsg('⚠️ Trabajador en estado de cese o inactivo.');
      return;
    }

    if (encontrado.bloqueado) {
      setErrorMsg('🚫 Usuario bloqueado por seguridad (superado límite de intentos). Avisa al Responsable para usar el parte FOR-RRHH-001-01.');
      return;
    }

    // Código válido -> pasamos a confirmar identidad y pedir PIN
    setTrabajadorActual(encontrado);
    setPinInput('');
    setPaso(2);
  };

  // Paso 2: Validar PIN de 4 cifras con Salt
  const verificarPin = async (pin: string) => {
    if (!trabajadorActual) return;

    const { resultado, trabajadorActualizado } = await validarPinTrabajador(pin, trabajadorActual);
    await saveTrabajador(trabajadorActualizado);
    setTrabajadorActual(trabajadorActualizado);

    if (resultado.valido) {
      // PIN correcto -> consultar último fichaje hoy y pasar al paso 3
      const ultimo = await getUltimoFichajeHoy(trabajadorActual.numeroTrabajador);
      setUltimoFichaje(ultimo);
      setPaso(3);
    } else {
      setErrorMsg(resultado.mensaje);
      setPinInput('');
      if (resultado.bloqueado) {
        // Si ha sido bloqueado tras el 3.er fallo, regresa al inicio tras 4s
        setTimeout(() => {
          resetearKiosco();
        }, 4000);
      }
    }
  };

  // Paso 3: Registrar Entrada o Salida
  const handleFichar = async (tipo: 'ENTRADA' | 'SALIDA') => {
    if (!trabajadorActual) return;

    // Validación de coherencia
    if (tipo === 'ENTRADA' && ultimoFichaje?.tipo === 'ENTRADA') {
      setErrorMsg(`⚠️ Ya tienes una Entrada registrada hoy a las ${ultimoFichaje.horaStr}.`);
      return;
    }

    if (tipo === 'SALIDA' && (!ultimoFichaje || ultimoFichaje.tipo === 'SALIDA')) {
      setErrorMsg('⚠️ No consta una Entrada previa abierta. Avisa al Responsable.');
      return;
    }

    const fichaje = await registrarFichaje(trabajadorActual, tipo);
    setExitoFichaje(fichaje);
    setSegundosRetorno(3);
  };

  // Determinar si Entrada o Salida están habilitadas según secuencia
  const puedeEntrar = !ultimoFichaje || ultimoFichaje.tipo === 'SALIDA';
  const puedeSalir = ultimoFichaje?.tipo === 'ENTRADA';

  return (
    <div className="kiosk-tablet-frame">
      {/* Barra superior de estado de la tablet */}
      <div className="kiosk-status-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📍 Saica Pack · Centro 1</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '14px', color: '#38bdf8' }}>
            {relojHora}
          </div>
          <button
            onClick={() => { setRespError(null); setModalRespOpen(true); }}
            title="Acceso Gestión Responsable de Turno"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#e2e8f0',
              borderRadius: '8px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Lock size={12} color="#38bdf8" />
            <span>Zona Control</span>
          </button>
        </div>
      </div>

      <div className="kiosk-body">
        {/* Banner de Error / Alerta */}
        {errorMsg && (
          <div style={{
            background: '#fee2e2',
            border: '1.5px solid #ef4444',
            color: '#991b1b',
            borderRadius: '12px',
            padding: '12px 16px',
            width: '100%',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Logo corporativo en cabecera del kiosco */}
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
          <img src="/logo.png" alt="Habilis" style={{ height: '32px', objectFit: 'contain' }} />
        </div>

        {/* ============================================================== */}
        {/* PASO 1: INTRODUCCIÓN DEL CÓDIGO DE 5 CIFRAS                    */}
        {/* ============================================================== */}
        {paso === 1 && (
          <>
            <div className="code-display-box">
              <div className="code-display-label">N.º de Trabajador (5 Cifras)</div>
              <div className="code-digits">
                {codigoInput ? (
                  codigoInput.split('').map((c, i) => <span key={i} style={{ margin: '0 4px' }}>{c}</span>)
                ) : (
                  <span className="code-placeholder">_ _ _ _ _</span>
                )}
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px', textAlign: 'center' }}>
              Teclea tus 5 dígitos de empresa en la pantalla táctil
            </p>

            <div className="keypad-grid">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button key={num} className="keypad-btn" onClick={() => handleKeypadPress(num)}>
                  {num}
                </button>
              ))}
              <button className="keypad-btn keypad-btn-action keypad-btn-clear" onClick={handleBorrar}>
                <Delete size={22} />
              </button>
              <button className="keypad-btn" onClick={() => handleKeypadPress('0')}>
                0
              </button>
              <button
                className="keypad-btn keypad-btn-action keypad-btn-enter"
                onClick={() => {
                  if (codigoInput.length === 5) {
                    verificarCodigo(codigoInput);
                  } else if (codigoInput.length === 4) {
                    setErrorMsg('⚠️ El código de empleado tiene 5 cifras (ej: 12001). El PIN es de 4 cifras (1234) y se pide en el paso siguiente.');
                  } else {
                    setErrorMsg('Introduce las 5 cifras completas del código de trabajador.');
                  }
                }}
              >
                <ArrowRight size={24} />
              </button>
            </div>

            {/* Accesos rápidos para probar fácilmente */}
            <div style={{ marginTop: '20px', width: '100%', borderTop: '1px dashed #cbd5e1', paddingTop: '14px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>
                👤 PRUEBA RÁPIDA (TOCA PARA AUTOCOMPLETAR):
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setCodigoInput('12001'); verificarCodigo('12001'); }}
                  style={{ background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  12001 · Carlos Gómez (C1)
                </button>
                <button
                  onClick={() => { setCodigoInput('12002'); verificarCodigo('12002'); }}
                  style={{ background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  12002 · David Ruiz (C1)
                </button>
                <button
                  onClick={() => { setCodigoInput('13001'); verificarCodigo('13001'); }}
                  style={{ background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  13001 · Laura Morales (C1)
                </button>
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* PASO 2: CONFIRMACIÓN VISUAL Y PIN SEGURO                       */}
        {/* ============================================================== */}
        {paso === 2 && trabajadorActual && (
          <>
            <div className="worker-card">
              <div className="worker-avatar">
                <UserCheck size={32} />
              </div>
              <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Trabajador Identificado
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {trabajadorActual.nombreCompleto}
              </div>
              <div className="worker-badge-puesto">
                Centro {trabajadorActual.centroActual} · {trabajadorActual.puesto}
              </div>
              <div style={{ marginTop: '12px' }}>
                <button
                  onClick={resetearKiosco}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '12px',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  ¿No eres {trabajadorActual.nombreCompleto.split(' ')[0]}? Toca aquí para corregir
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                Introduce tu PIN personal de 4 cifras
              </div>
              <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                💡 PIN de prueba: <b>1234</b>
              </div>
              <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <ShieldAlert size={14} /> Máximo 3 intentos antes de bloqueo
              </div>

              {/* Puntos enmascarados del PIN */}
              <div className="pin-dots-container">
                {[0, 1, 2, 3].map(idx => (
                  <div key={idx} className={`pin-dot ${idx < pinInput.length ? 'filled' : ''}`} />
                ))}
              </div>
            </div>

            <div className="keypad-grid">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button key={num} className="keypad-btn" onClick={() => handleKeypadPress(num)}>
                  {num}
                </button>
              ))}
              <button className="keypad-btn keypad-btn-action keypad-btn-clear" onClick={handleBorrar}>
                <Delete size={22} />
              </button>
              <button className="keypad-btn" onClick={() => handleKeypadPress('0')}>
                0
              </button>
              <button
                className="keypad-btn keypad-btn-action"
                style={{ background: '#f1f5f9', color: '#64748b' }}
                onClick={resetearKiosco}
              >
                Cancelar
              </button>
            </div>

            {/* Botón rápido para meter 1234 */}
            <div style={{ marginTop: '14px', textAlign: 'center' }}>
              <button
                onClick={() => { setPinInput('1234'); verificarPin('1234'); }}
                style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                🔑 Rellenar PIN 1234 automáticamente
              </button>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* PASO 3: MARCAJE DE JORNADA (ENTRADA / SALIDA)                  */}
        {/* ============================================================== */}
        {paso === 3 && trabajadorActual && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '14px 20px',
              width: '100%',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Operario autenticado:</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {trabajadorActual.nombreCompleto} ({trabajadorActual.numeroTrabajador})
              </div>
              <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>
                {ultimoFichaje
                  ? `Último registro hoy: ${ultimoFichaje.tipo} a las ${ultimoFichaje.horaStr}`
                  : 'Sin registros previos en el día de hoy'}
              </div>
            </div>

            {!exitoFichaje ? (
              <div className="action-buttons-group">
                <button
                  className="btn-clock btn-clock-in"
                  disabled={!puedeEntrar}
                  onClick={() => handleFichar('ENTRADA')}
                >
                  <LogIn size={26} />
                  REGISTRAR ENTRADA
                </button>

                <button
                  className="btn-clock btn-clock-out"
                  disabled={!puedeSalir}
                  onClick={() => handleFichar('SALIDA')}
                >
                  <LogOut size={26} />
                  REGISTRAR SALIDA
                </button>

                <button
                  onClick={resetearKiosco}
                  style={{
                    background: 'transparent',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#64748b',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '10px'
                  }}
                >
                  Cancelar / Salir
                </button>
              </div>
            ) : (
              <div className="success-banner">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '18px', fontWeight: 800 }}>
                  <CheckCircle2 size={24} color="#059669" />
                  {exitoFichaje.tipo} REGISTRADA
                </div>
                <div style={{ fontSize: '14px', marginTop: '6px' }}>
                  Hora fiable: <b>{exitoFichaje.horaStr}</b> · {exitoFichaje.fechaStr}
                </div>
                <div style={{
                  display: 'inline-block',
                  background: '#10b981',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  marginTop: '12px'
                }}>
                  Volviendo a inicio en {segundosRetorno} seg...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Acceso Responsable de Turno */}
      {modalRespOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '420px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
            border: '1px solid #cbd5e1'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00609f', fontWeight: 800, fontSize: '17px' }}>
                <Lock size={20} color="#00609f" />
                Acceso a Zona de Control
              </div>
              <button
                onClick={() => setModalRespOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: '1.4' }}>
              Solo el personal con categoría de <b>Responsable de Turno</b> puede acceder al monitor de presencia en planta y administración.
            </p>

            {respError && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #ef4444',
                color: '#991b1b',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '14px'
              }}>
                {respError}
              </div>
            )}

            <form onSubmit={handleLoginResponsable} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Código de Responsable (5 cifras):
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={respCodigo}
                  onChange={(e) => setRespCodigo(e.target.value)}
                  placeholder="Ej: 11001"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '16px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    letterSpacing: '2px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  PIN Personal (4 cifras):
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={respPin}
                  onChange={(e) => setRespPin(e.target.value)}
                  placeholder="••••"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '18px',
                    letterSpacing: '4px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setRespCodigo('11001');
                    setRespPin('1234');
                  }}
                  style={{
                    background: '#e0f2fe',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#0284c7',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Autocompletar: 11001 (Antonio)
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: '#00609f',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Entrar a Control →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
