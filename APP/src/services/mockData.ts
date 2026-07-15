import type { User, ClockIn, VacationRequest, Work, Operation, Procedure, Doubt, Incident, AuditLog } from '../types';

// Initial Users
export const MOCK_USERS: User[] = [
  {
    uid: 'user-worker-1',
    email: 'operario@habilis.com',
    displayName: 'Carlos Gómez',
    role: 'worker',
    team: 'Turno Mañana',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    active: true
  },
  {
    uid: 'user-manager-1',
    email: 'responsable@habilis.com',
    displayName: 'Elena Rodríguez',
    role: 'manager',
    team: 'Coordinación Muelle',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    active: true
  },
  {
    uid: 'user-admin-1',
    email: 'admin@habilis.com',
    displayName: 'Admin Habilis',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    active: true
  }
];

// Generate dynamic historical clock ins for Carlos Gómez (Worker)
// Standard workday is 8h.
// Let's create calendar data for 2026 (Jan to June)
const generateMockClockIns = (): ClockIn[] => {
  const list: ClockIn[] = [];
  const start = new Date('2026-05-01');
  const end = new Date('2026-06-02');
  
  let idCounter = 1;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    // Exclude weekends
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const dateStr = current.toISOString().split('T')[0];
      
      // Some special days (holidays, incomplete, extra hours)
      let startTime = `${dateStr}T08:00:00`;
      let endTime = `${dateStr}T16:00:00`;
      let hoursWorked = 8;
      let hoursOrdinary = 8;
      let hoursExtra = 0;
      let hoursPending = 0;
      
      const rand = Math.random();
      
      if (rand < 0.05) {
        // Incomplete day (Red)
        endTime = `${dateStr}T13:30:00`;
        hoursWorked = 5.5;
        hoursOrdinary = 5.5;
        hoursExtra = 0;
        hoursPending = 2.5;
      } else if (rand < 0.15) {
        // Extra hours (Green + extra indicator)
        endTime = `${dateStr}T18:30:00`;
        hoursWorked = 10.5;
        hoursOrdinary = 8;
        hoursExtra = 2.5;
        hoursPending = 0;
      } else if (rand < 0.18) {
        // Skip this day (might be a vacation or leave - handled in vacation calendar render)
        current.setDate(current.getDate() + 1);
        continue;
      }
      
      list.push({
        id: `clock-${idCounter++}`,
        userId: 'user-worker-1',
        userName: 'Carlos Gómez',
        date: dateStr,
        startTime,
        endTime,
        device: 'Android Mobile (Chrome)',
        location: {
          latitude: 40.416775,
          longitude: -3.703790,
          accuracy: 12
        },
        hoursWorked,
        hoursOrdinary,
        hoursExtra,
        hoursPending
      });
    }
    current.setDate(current.getDate() + 1);
  }
  
  return list;
};

// Initial Vacation requests
export const MOCK_VACATIONS: VacationRequest[] = [
  {
    id: 'vac-1',
    userId: 'user-worker-1',
    userName: 'Carlos Gómez',
    startDate: '2026-05-18',
    endDate: '2026-05-22',
    type: 'vacation',
    requestDate: '2026-05-01T10:15:00Z',
    resolutionDate: '2026-05-03T09:00:00Z',
    status: 'approved',
    resolvedBy: 'Admin Habilis',
    comments: 'Disfruta de las vacaciones'
  },
  {
    id: 'vac-2',
    userId: 'user-worker-1',
    userName: 'Carlos Gómez',
    startDate: '2026-06-15',
    endDate: '2026-06-19',
    type: 'vacation',
    requestDate: '2026-05-25T11:45:00Z',
    resolutionDate: null,
    status: 'pending',
    resolvedBy: null,
    comments: ''
  },
  {
    id: 'vac-3',
    userId: 'user-worker-1',
    userName: 'Carlos Gómez',
    startDate: '2026-04-09',
    endDate: '2026-04-09',
    type: 'permit',
    requestDate: '2026-04-07T08:00:00Z',
    resolutionDate: '2026-04-08T15:30:00Z',
    status: 'approved',
    resolvedBy: 'Admin Habilis',
    comments: 'Cita médica justificada.'
  }
];

// Initial Works (Trabajos)
export const MOCK_WORKS: Work[] = [
  {
    id: 'work-1',
    code: 'T-1001',
    title: 'Reorganización Pasillo A5',
    description: 'Reubicar palets de ferretería pesada a las estanterías bajas por seguridad vial interna.',
    priority: 'high',
    assignedTo: 'user-worker-1',
    assignedToName: 'Carlos Gómez',
    createdBy: 'user-manager-1',
    createdByName: 'Elena Rodríguez',
    createdAt: '2026-06-01T08:30:00Z',
    deadline: '2026-06-04',
    status: 'in_progress'
  },
  {
    id: 'work-2',
    code: 'T-1002',
    title: 'Inventario Rotativo de Pinturas',
    description: 'Realizar recuento físico sistemático del sector químico (líneas 12 a 15) y reportar descuadres.',
    priority: 'medium',
    assignedTo: 'unassigned',
    assignedToName: 'Sin asignar',
    createdBy: 'user-manager-1',
    createdByName: 'Elena Rodríguez',
    createdAt: '2026-06-02T10:00:00Z',
    deadline: '2026-06-06',
    status: 'pending'
  },
  {
    id: 'work-3',
    code: 'T-1003',
    title: 'Mantenimiento preventivo transpaleta T-04',
    description: 'Revisión de ruedas y rellenado de líquido hidráulico según procedimiento de seguridad.',
    priority: 'low',
    assignedTo: 'user-worker-1',
    assignedToName: 'Carlos Gómez',
    createdBy: 'user-admin-1',
    createdByName: 'Admin Habilis',
    createdAt: '2026-05-28T07:15:00Z',
    deadline: '2026-05-30',
    status: 'completed'
  }
];

// Initial Operations (Cargas y descargas)
export const MOCK_OPERATIONS: Operation[] = [
  {
    id: 'op-1',
    opNumber: 'OP-5001',
    type: 'load',
    zone: 'Muelle Exterior A',
    exactLocation: 'Muelle 2 - Fila 4',
    observations: 'Carga urgente de materiales de construcción para cliente principal. Cuidado con las esquinas.',
    scheduledDate: '2026-06-03',
    status: 'in_progress',
    assignedTo: 'user-worker-1',
    assignedToName: 'Carlos Gómez',
    acceptedTime: '2026-06-03T08:35:00Z',
    startTime: '2026-06-03T08:45:00Z',
    endTime: null,
    checklist: null
  },
  {
    id: 'op-2',
    opNumber: 'OP-5002',
    type: 'unload',
    zone: 'Muelle Central B',
    exactLocation: 'Almacén 1 - Sección C12',
    observations: 'Descarga de mercancía paletizada del proveedor industrial. Comprobar albarán de entrega.',
    scheduledDate: '2026-06-03',
    status: 'pending',
    assignedTo: null,
    assignedToName: null,
    acceptedTime: null,
    startTime: null,
    endTime: null,
    checklist: null
  },
  {
    id: 'op-3',
    opNumber: 'OP-5003',
    type: 'unload',
    zone: 'Muelle Norte C',
    exactLocation: 'Sección Maquinaria',
    observations: 'Descarga completada de repuestos mecánicos sin incidencias.',
    scheduledDate: '2026-06-02',
    status: 'completed',
    assignedTo: 'user-worker-1',
    assignedToName: 'Carlos Gómez',
    acceptedTime: '2026-06-02T09:10:00Z',
    startTime: '2026-06-02T09:15:00Z',
    endTime: '2026-06-02T11:20:00Z',
    checklist: {
      truckStatus: 'correct',
      cargoStatus: 'correct',
      observations: 'Todo el material se descargó correctamente. Palets estables.',
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400',
          uploadedAt: '2026-06-02T11:15:00Z',
          uploadedBy: 'Carlos Gómez',
          evidenceType: 'cargo_condition'
        }
      ],
      completedAt: '2026-06-02T11:20:00Z',
      completedBy: 'Carlos Gómez'
    }
  }
];

// Initial Procedures
export const MOCK_PROCEDURES: Procedure[] = [
  {
    id: 'proc-1',
    title: 'Manual de Carga Segura en Muelles Habilis',
    category: 'loads',
    fileType: 'pdf',
    fileUrl: '/procedures/manual-carga-segura.pdf',
    createdAt: '2026-01-15T09:00:00Z',
    readBy: ['user-worker-1']
  },
  {
    id: 'proc-2',
    title: 'Checklist de Seguridad en Uso de Transpaletas Eléctricas',
    category: 'safety',
    fileType: 'image',
    fileUrl: '/procedures/transpaleta-check.jpg',
    createdAt: '2026-02-10T08:00:00Z',
    readBy: []
  },
  {
    id: 'proc-3',
    title: 'Vídeo: Protocolo de Descarga de Mercancías Peligrosas',
    category: 'unloads',
    fileType: 'video',
    fileUrl: '/procedures/descarga-peligrosas.mp4',
    createdAt: '2026-03-05T12:00:00Z',
    readBy: []
  },
  {
    id: 'proc-4',
    title: 'Normativa Habilis de Control de Calidad y Roturas',
    category: 'quality',
    fileType: 'pdf',
    fileUrl: '/procedures/normativa-calidad.pdf',
    createdAt: '2026-04-01T10:00:00Z',
    readBy: ['user-worker-1']
  }
];

// Initial Doubt channel (Canal de dudas)
export const MOCK_DOUBTS: Doubt[] = [
  {
    id: 'doubt-1',
    userId: 'user-worker-1',
    userName: 'Carlos Gómez',
    category: 'safety',
    createdAt: '2026-06-01T14:30:00Z',
    query: '¿Cuándo se renovará el calzado de seguridad del personal del turno de mañana?',
    reply: 'La entrega del nuevo calzado de seguridad homologado está planificada para el lunes de la próxima semana a primera hora.',
    replyBy: 'user-manager-1',
    replyByName: 'Elena Rodríguez',
    repliedAt: '2026-06-02T08:30:00Z',
    status: 'answered'
  },
  {
    id: 'doubt-2',
    userId: 'user-worker-1',
    userName: 'Carlos Gómez',
    category: 'operations',
    createdAt: '2026-06-03T11:00:00Z',
    query: '¿La operación OP-5002 requiere estanterías de frío o de seco?',
    reply: null,
    replyBy: null,
    replyByName: null,
    repliedAt: null,
    status: 'pending'
  }
];

// Initial Incidents
export const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'inc-1',
    userId: 'user-worker-1',
    userName: 'Carlos Gómez',
    createdAt: '2026-06-02T10:30:00Z',
    category: 'breakage',
    description: 'Rotura de palet de escayolas en el muelle exterior A debido a flejado defectuoso de origen. Se procedió a reubicar las piezas intactas.',
    photos: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400'],
    relatedOp: 'OP-5003',
    status: 'resolved'
  }
];

// Initial Audit Logs
export const MOCK_AUDIT: AuditLog[] = [
  {
    id: 'audit-1',
    userId: 'user-worker-1',
    userName: 'Carlos Gómez',
    action: 'inicio_jornada',
    createdAt: '2026-06-03T08:00:15Z',
    affectedRecord: 'clock_ins/current',
    oldValue: '-',
    newValue: 'Entrada registrada a las 08:00:15 en dispositivo móvil.'
  },
  {
    id: 'audit-2',
    userId: 'user-manager-1',
    userName: 'Elena Rodríguez',
    action: 'crear_trabajo',
    createdAt: '2026-06-01T08:30:00Z',
    affectedRecord: 'works/work-1',
    oldValue: '-',
    newValue: 'Trabajo T-1001 "Reorganización Pasillo A5" creado y asignado a Carlos Gómez.'
  }
];

// LocalStorage helpers to simulate database operations in Demo mode
const getLocalData = <T>(key: string, initialData: T): T => {
  const local = localStorage.getItem(`habilis_db_${key}`);
  if (!local) {
    localStorage.setItem(`habilis_db_${key}`, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(local);
};

const setLocalData = <T>(key: string, data: T): void => {
  localStorage.setItem(`habilis_db_${key}`, JSON.stringify(data));
};

// IndexedDB / LocalStorage state manager
export const getMockDatabase = () => {
  return {
    users: getLocalData('users', MOCK_USERS),
    clockIns: getLocalData('clock_ins', generateMockClockIns()),
    vacations: getLocalData('vacations', MOCK_VACATIONS),
    works: getLocalData('works', MOCK_WORKS),
    operations: getLocalData('operations', MOCK_OPERATIONS),
    procedures: getLocalData('procedures', MOCK_PROCEDURES),
    doubts: getLocalData('doubts', MOCK_DOUBTS),
    incidents: getLocalData('incidents', MOCK_INCIDENTS),
    auditLogs: getLocalData('audit_logs', MOCK_AUDIT)
  };
};

export const saveMockDatabase = (db: ReturnType<typeof getMockDatabase>) => {
  Object.entries(db).forEach(([key, val]) => {
    // map key from camelCase to snake_case to match storage
    const storageKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    setLocalData(storageKey, val);
  });
};

export const resetMockDatabase = () => {
  localStorage.removeItem('habilis_db_users');
  localStorage.removeItem('habilis_db_clock_ins');
  localStorage.removeItem('habilis_db_vacations');
  localStorage.removeItem('habilis_db_works');
  localStorage.removeItem('habilis_db_operations');
  localStorage.removeItem('habilis_db_procedures');
  localStorage.removeItem('habilis_db_doubts');
  localStorage.removeItem('habilis_db_incidents');
  localStorage.removeItem('habilis_db_audit_logs');
  return getMockDatabase();
};
