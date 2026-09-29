import { Trabajador } from '../types';

/**
 * Genera una semilla aleatoria (Salt) para un trabajador
 */
export function generarSalt(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  const randomValues = new Uint32Array(16);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < 16; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * Calcula el hash SHA-256 de un PIN combinado con su Salt
 */
export async function calcularHashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${pin}:${salt}:HABILIS_SECURE_CLOCK`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface ResultadoValidacionPin {
  valido: boolean;
  bloqueado: boolean;
  intentosRestantes: number;
  mensaje: string;
}

/**
 * Valida el PIN de 4 dígitos contra el hash y gestiona los 3 intentos
 */
export async function validarPinTrabajador(
  pinIntroducido: string,
  trabajador: Trabajador
): Promise<{ resultado: ResultadoValidacionPin; trabajadorActualizado: Trabajador }> {
  // 1. Si ya está bloqueado
  if (trabajador.bloqueado) {
    return {
      resultado: {
        valido: false,
        bloqueado: true,
        intentosRestantes: 0,
        mensaje: 'Usuario bloqueado. Requiere autorización del Responsable y formulario FOR-RRHH-001-01.'
      },
      trabajadorActualizado: trabajador
    };
  }

  // 2. Comprobar hash
  const hashCalculado = await calcularHashPin(pinIntroducido, trabajador.pinSalt);
  const esCorrecto = hashCalculado === trabajador.pinHash;

  if (esCorrecto) {
    // Éxito: reiniciamos el contador de intentos fallidos
    const actualizado: Trabajador = {
      ...trabajador,
      intentosFallidos: 0,
      bloqueado: false
    };
    return {
      resultado: {
        valido: true,
        bloqueado: false,
        intentosRestantes: 3,
        mensaje: 'PIN verificado correctamente.'
      },
      trabajadorActualizado: actualizado
    };
  } else {
    // Fallo: incrementamos contador
    const nuevosIntentos = (trabajador.intentosFallidos || 0) + 1;
    const ahoraBloqueado = nuevosIntentos >= 3;

    const actualizado: Trabajador = {
      ...trabajador,
      intentosFallidos: nuevosIntentos,
      bloqueado: ahoraBloqueado
    };

    if (ahoraBloqueado) {
      return {
        resultado: {
          valido: false,
          bloqueado: true,
          intentosRestantes: 0,
          mensaje: 'Límite de 3 intentos superado. Usuario bloqueado por seguridad. Avisa al Responsable para registrar la jornada en papel (FOR-RRHH-001-01).'
        },
        trabajadorActualizado: actualizado
      };
    } else {
      const restantes = 3 - nuevosIntentos;
      return {
        resultado: {
          valido: false,
          bloqueado: false,
          intentosRestantes: restantes,
          mensaje: `PIN incorrecto. Te quedan ${restantes} intento${restantes === 1 ? '' : 's'}.`
        },
        trabajadorActualizado: actualizado
      };
    }
  }
}
