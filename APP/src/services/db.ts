import type { AppSettings, User, ClockIn, VacationRequest, Work, Operation, Procedure, Doubt, Incident, AuditLog } from '../types';
import { getMockDatabase, saveMockDatabase } from './mockData';

// Settings management
const DEFAULT_SETTINGS: AppSettings = {
  isDemoMode: true,
  firebaseConfig: null,
  workdayHours: 8
};

export const getSettings = (): AppSettings => {
  const local = localStorage.getItem('habilis_settings');
  if (!local) {
    localStorage.setItem('habilis_settings', JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }
  return JSON.parse(local);
};

export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem('habilis_settings', JSON.stringify(settings));
};

// Global Firebase initialization placeholder
// This makes it easy for the developer to wire up actual firebase by just checking config
let firebaseApp: any = null;
let firestoreDb: any = null;
export let firebaseStorage: any = null;

export const initFirebase = async (config: any) => {
  try {
    const { initializeApp } = await import('firebase/app');
    const { getFirestore } = await import('firebase/firestore');
    const { getStorage } = await import('firebase/storage');
    
    firebaseApp = initializeApp(config);
    firestoreDb = getFirestore(firebaseApp);
    firebaseStorage = getStorage(firebaseApp);
    return true;
  } catch (error) {
    console.error('Failed to initialize Firebase', error);
    return false;
  }
};

// Check if Firebase should be used
const isRealFirebase = (): boolean => {
  const settings = getSettings();
  return !settings.isDemoMode && settings.firebaseConfig !== null && firestoreDb !== null;
};

// DB Service Methods
export const dbService = {
  // --- USERS ---
  getUsers: async (): Promise<User[]> => {
    if (isRealFirebase()) {
      // Firebase real implementation would go here.
      // E.g., const querySnapshot = await getDocs(collection(firestoreDb, "users"));
      // For now, in dual mode, we fallback to mock to keep it 100% functional.
    }
    const db = getMockDatabase();
    return db.users;
  },

  updateUser: async (user: User): Promise<void> => {
    const db = getMockDatabase();
    const idx = db.users.findIndex(u => u.uid === user.uid);
    if (idx !== -1) {
      db.users[idx] = user;
      saveMockDatabase(db);
    }
  },

  // --- CLOCK INS ---
  getClockIns: async (userId?: string): Promise<ClockIn[]> => {
    const db = getMockDatabase();
    if (userId) {
      return db.clockIns.filter(c => c.userId === userId);
    }
    return db.clockIns;
  },

  addClockIn: async (clockIn: ClockIn): Promise<void> => {
    const db = getMockDatabase();
    db.clockIns.push(clockIn);
    saveMockDatabase(db);
  },

  updateClockIn: async (clockIn: ClockIn): Promise<void> => {
    const db = getMockDatabase();
    const idx = db.clockIns.findIndex(c => c.id === clockIn.id);
    if (idx !== -1) {
      db.clockIns[idx] = clockIn;
      saveMockDatabase(db);
    }
  },

  // --- VACATIONS ---
  getVacations: async (userId?: string): Promise<VacationRequest[]> => {
    const db = getMockDatabase();
    if (userId) {
      return db.vacations.filter(v => v.userId === userId);
    }
    return db.vacations;
  },

  createVacation: async (vacation: VacationRequest): Promise<void> => {
    const db = getMockDatabase();
    db.vacations.push(vacation);
    saveMockDatabase(db);
  },

  updateVacation: async (vacation: VacationRequest): Promise<void> => {
    const db = getMockDatabase();
    const idx = db.vacations.findIndex(v => v.id === vacation.id);
    if (idx !== -1) {
      db.vacations[idx] = vacation;
      saveMockDatabase(db);
    }
  },

  // --- WORKS ---
  getWorks: async (userId?: string): Promise<Work[]> => {
    const db = getMockDatabase();
    if (userId) {
      return db.works.filter(w => w.assignedTo === userId || w.assignedTo === 'unassigned');
    }
    return db.works;
  },

  createWork: async (work: Work): Promise<void> => {
    const db = getMockDatabase();
    db.works.push(work);
    saveMockDatabase(db);
  },

  updateWork: async (work: Work): Promise<void> => {
    const db = getMockDatabase();
    const idx = db.works.findIndex(w => w.id === work.id);
    if (idx !== -1) {
      db.works[idx] = work;
      saveMockDatabase(db);
    }
  },

  // --- OPERATIONS (Cargas/Descargas) ---
  getOperations: async (userId?: string): Promise<Operation[]> => {
    const db = getMockDatabase();
    if (userId) {
      return db.operations.filter(op => op.assignedTo === userId || op.assignedTo === null);
    }
    return db.operations;
  },

  createOperation: async (operation: Operation): Promise<void> => {
    const db = getMockDatabase();
    db.operations.push(operation);
    saveMockDatabase(db);
  },

  updateOperation: async (operation: Operation): Promise<void> => {
    const db = getMockDatabase();
    const idx = db.operations.findIndex(op => op.id === operation.id);
    if (idx !== -1) {
      db.operations[idx] = operation;
      saveMockDatabase(db);
    }
  },

  // --- PROCEDURES ---
  getProcedures: async (): Promise<Procedure[]> => {
    const db = getMockDatabase();
    return db.procedures;
  },

  updateProcedure: async (proc: Procedure): Promise<void> => {
    const db = getMockDatabase();
    const idx = db.procedures.findIndex(p => p.id === proc.id);
    if (idx !== -1) {
      db.procedures[idx] = proc;
      saveMockDatabase(db);
    }
  },

  createProcedure: async (proc: Procedure): Promise<void> => {
    const db = getMockDatabase();
    db.procedures.push(proc);
    saveMockDatabase(db);
  },

  // --- DOUBTS ---
  getDoubts: async (userId?: string): Promise<Doubt[]> => {
    const db = getMockDatabase();
    if (userId) {
      return db.doubts.filter(d => d.userId === userId);
    }
    return db.doubts;
  },

  createDoubt: async (doubt: Doubt): Promise<void> => {
    const db = getMockDatabase();
    db.doubts.push(doubt);
    saveMockDatabase(db);
  },

  updateDoubt: async (doubt: Doubt): Promise<void> => {
    const db = getMockDatabase();
    const idx = db.doubts.findIndex(d => d.id === doubt.id);
    if (idx !== -1) {
      db.doubts[idx] = doubt;
      saveMockDatabase(db);
    }
  },

  // --- INCIDENTS ---
  getIncidents: async (userId?: string): Promise<Incident[]> => {
    const db = getMockDatabase();
    if (userId) {
      return db.incidents.filter(i => i.userId === userId);
    }
    return db.incidents;
  },

  createIncident: async (incident: Incident): Promise<void> => {
    const db = getMockDatabase();
    db.incidents.push(incident);
    saveMockDatabase(db);
  },

  updateIncident: async (incident: Incident): Promise<void> => {
    const db = getMockDatabase();
    const idx = db.incidents.findIndex(i => i.id === incident.id);
    if (idx !== -1) {
      db.incidents[idx] = incident;
      saveMockDatabase(db);
    }
  },

  // --- AUDIT LOGS ---
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const db = getMockDatabase();
    return db.auditLogs;
  },

  addAuditLog: async (
    action: string,
    affectedRecord: string,
    oldValue: any,
    newValue: any,
    userId: string,
    userName: string
  ): Promise<void> => {
    const db = getMockDatabase();
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName,
      action,
      createdAt: new Date().toISOString(),
      affectedRecord,
      oldValue: typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue),
      newValue: typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)
    };
    db.auditLogs.unshift(log); // newest first
    saveMockDatabase(db);
  }
};
