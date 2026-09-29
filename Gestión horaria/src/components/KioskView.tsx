import React, { useState, useEffect } from 'react';
import { Trabajador, Fichaje } from '../types';
import { getTrabajadores, saveTrabajador, registrarFichaje, getUltimoFichajeHoy } from '../services/fichajeStorage';
import { validarPinTrabajador } from '../services/authPin';
import { CheckCircle2, AlertTriangle, Delete, ArrowRight, UserCheck, ShieldAlert, LogIn, LogOut } from 'lucide-react';

export const KioskView: React.FC = () => {
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
        <div style={{ fontFamily: 'monospace', fontSize: '14px', color: '#38bdf8' }}>
          {relojHora}
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
                  if (codigoInput.length === 5) verificarCodigo(codigoInput);
                  else setErrorMsg('Introduce las 5 cifras completas.');
                }}
              >
                <ArrowRight size={24} />
              </button>
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
    </div>
  );
};
