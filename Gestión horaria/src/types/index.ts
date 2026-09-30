export type PuestoTrabajo = 'Responsable' | 'Carretillero' | 'Operario' | 'Administrativo';

export interface Trabajador {
  numeroTrabajador: string; // 5 cifras: ej. "12001"
  nombreCompleto: string; // ej. "Carlos Gómez Martín"
  estado: 'ACTIVO' | 'CESE';
  centroActual: 1 | 2;
  puesto: PuestoTrabajo;
  pinHash: string; // Hash con salt
  pinSalt: string; // Salt único por trabajador
  pinConfigurado: boolean;
  intentosFallidos: number; // 0, 1, 2, 3
  bloqueado: boolean;
  versionImportacion?: string;
  fechaActualizacion?: string;
}

export type TipoFichaje = 'ENTRADA' | 'SALIDA';

export interface Fichaje {
  id: string;
  numeroTrabajador: string;
  nombreCompleto: string;
  centroId: 1 | 2;
  tipo: TipoFichaje;
  timestamp: string; // ISO string de hora fiable
  fechaStr: string; // "2026-09-29"
  horaStr: string; // "05:58:24"
  dispositivoId: string;
  estado: 'VALIDO' | 'CORREGIDO' | 'ANULADO';
  correccion?: {
    fechaCorreccion: string;
    gestorId: string;
    motivo: string;
    numeroPartePapel?: string; // Ej: "FOR-RRHH-001-01 / N.º 042"
  };
}

export type TurnoTipo = 'MAÑANA' | 'TARDE' | 'NOCHE';

export interface TurnoInfo {
  id: TurnoTipo;
  nombre: string;
  horario: string;
  icono: string;
}

export interface PlanTurnoTrabajador {
  numeroTrabajador: string;
  nombreCompleto: string;
  puesto: PuestoTrabajo;
  centro: 1 | 2;
  turnoAsignado: TurnoTipo | 'DESCANSO' | 'VACACIONES' | 'BAJA';
}

export interface EstadoTrabajadorMonitor {
  trabajador: Trabajador;
  turnoPlanificado?: TurnoTipo | 'DESCANSO' | 'VACACIONES' | 'BAJA';
  ultimoFichaje?: Fichaje;
  estadoPresencia: 'PRESENTE' | 'PENDIENTE' | 'EXTRA' | 'AUSENTE_JUSTIFICADO';
  minutosRetraso?: number;
}

export const CENTROS_HABILIS = {
  1: { id: 1 as const, nombre: 'Saica Pack · Velilla', localidad: 'Velilla de San Antonio (Centro 1)' },
  2: { id: 2 as const, nombre: 'Saica Pack · Meco', localidad: 'Meco (Centro 2)' }
};

