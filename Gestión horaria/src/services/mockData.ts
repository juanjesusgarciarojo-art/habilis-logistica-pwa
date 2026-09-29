import { Trabajador, PlanTurnoTrabajador } from '../types';

// Hash SHA-256 exacto de "1234:SALT_DEFAULT_1234:HABILIS_SECURE_CLOCK"
const PIN_TEST_HASH = '53fcbbd84735418102647416c05cf988922c0add5d5117df565def252622d62a';
const PIN_TEST_SALT = 'SALT_DEFAULT_1234';

export const TRABAJADORES_INICIALES: Trabajador[] = [
  {
    numeroTrabajador: '11001',
    nombreCompleto: 'Antonio Ramírez Ramos',
    estado: 'ACTIVO',
    centroActual: 1,
    puesto: 'Responsable',
    pinHash: PIN_TEST_HASH,
    pinSalt: PIN_TEST_SALT,
    pinConfigurado: true,
    intentosFallidos: 0,
    bloqueado: false
  },
  {
    numeroTrabajador: '12001',
    nombreCompleto: 'Carlos Gómez Martín',
    estado: 'ACTIVO',
    centroActual: 1,
    puesto: 'Carretillero',
    pinHash: PIN_TEST_HASH,
    pinSalt: PIN_TEST_SALT,
    pinConfigurado: true,
    intentosFallidos: 0,
    bloqueado: false
  },
  {
    numeroTrabajador: '12002',
    nombreCompleto: 'David Ruiz Fernández',
    estado: 'ACTIVO',
    centroActual: 1,
    puesto: 'Carretillero',
    pinHash: PIN_TEST_HASH,
    pinSalt: PIN_TEST_SALT,
    pinConfigurado: true,
    intentosFallidos: 0,
    bloqueado: false
  },
  {
    numeroTrabajador: '13001',
    nombreCompleto: 'Laura Morales Nieto',
    estado: 'ACTIVO',
    centroActual: 1,
    puesto: 'Operario',
    pinHash: PIN_TEST_HASH,
    pinSalt: PIN_TEST_SALT,
    pinConfigurado: true,
    intentosFallidos: 0,
    bloqueado: false
  },
  {
    numeroTrabajador: '21001',
    nombreCompleto: 'Javier Sánchez Mora',
    estado: 'ACTIVO',
    centroActual: 2,
    puesto: 'Responsable',
    pinHash: PIN_TEST_HASH,
    pinSalt: PIN_TEST_SALT,
    pinConfigurado: true,
    intentosFallidos: 0,
    bloqueado: false
  },
  {
    numeroTrabajador: '22001',
    nombreCompleto: 'Elena Castro Gil',
    estado: 'ACTIVO',
    centroActual: 2,
    puesto: 'Carretillero',
    pinHash: PIN_TEST_HASH,
    pinSalt: PIN_TEST_SALT,
    pinConfigurado: true,
    intentosFallidos: 0,
    bloqueado: false
  },
  {
    numeroTrabajador: '23001',
    nombreCompleto: 'Raúl Romero Ortiz',
    estado: 'ACTIVO',
    centroActual: 2,
    puesto: 'Operario',
    pinHash: PIN_TEST_HASH,
    pinSalt: PIN_TEST_SALT,
    pinConfigurado: true,
    intentosFallidos: 0,
    bloqueado: false
  }
];

export const CUADRANTE_INICIAL: PlanTurnoTrabajador[] = [
  { numeroTrabajador: '11001', nombreCompleto: 'Antonio Ramírez Ramos', puesto: 'Responsable', centro: 1, turnoAsignado: 'MAÑANA' },
  { numeroTrabajador: '12001', nombreCompleto: 'Carlos Gómez Martín', puesto: 'Carretillero', centro: 1, turnoAsignado: 'MAÑANA' },
  { numeroTrabajador: '12002', nombreCompleto: 'David Ruiz Fernández', puesto: 'Carretillero', centro: 1, turnoAsignado: 'TARDE' },
  { numeroTrabajador: '13001', nombreCompleto: 'Laura Morales Nieto', puesto: 'Operario', centro: 1, turnoAsignado: 'MAÑANA' },
  { numeroTrabajador: '21001', nombreCompleto: 'Javier Sánchez Mora', puesto: 'Responsable', centro: 2, turnoAsignado: 'MAÑANA' },
  { numeroTrabajador: '22001', nombreCompleto: 'Elena Castro Gil', puesto: 'Carretillero', centro: 2, turnoAsignado: 'TARDE' },
  { numeroTrabajador: '23001', nombreCompleto: 'Raúl Romero Ortiz', puesto: 'Operario', centro: 2, turnoAsignado: 'MAÑANA' }
];
