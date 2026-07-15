export type UserRole = 'worker' | 'manager' | 'admin';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  team?: string;
  avatarUrl?: string;
  active: boolean;
}

export interface ClockIn {
  id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO String (or HH:mm)
  endTime: string | null; // ISO String (or HH:mm)
  device: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;
  hoursWorked: number; // calculated
  hoursOrdinary: number;
  hoursExtra: number;
  hoursPending: number;
}

export type VacationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type VacationType = 'vacation' | 'permit' | 'holiday';

export interface VacationRequest {
  id: string;
  userId: string;
  userName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  type: VacationType;
  requestDate: string; // ISO String
  resolutionDate: string | null; // ISO String
  status: VacationStatus;
  resolvedBy: string | null; // User Name
  comments: string;
}

export type WorkStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type WorkPriority = 'low' | 'medium' | 'high';

export interface Work {
  id: string;
  code: string; // T-XXXX
  title: string;
  description: string;
  priority: WorkPriority;
  assignedTo: string; // userId or 'unassigned'
  assignedToName: string;
  createdBy: string; // manager/admin userId
  createdByName: string;
  createdAt: string; // ISO String
  deadline: string; // YYYY-MM-DD
  status: WorkStatus;
}

export type OperationType = 'load' | 'unload';
export type OperationStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'incident';

export interface ChecklistPhoto {
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  evidenceType: string; // e.g. 'truck_condition' | 'cargo_condition' | 'incident'
}

export interface Checklist {
  truckStatus: 'correct' | 'defective';
  cargoStatus: 'correct' | 'damaged';
  observations: string;
  photos: ChecklistPhoto[];
  completedAt: string;
  completedBy: string;
}

export interface Operation {
  id: string;
  opNumber: string; // OP-XXXX
  type: OperationType;
  zone: string;
  exactLocation: string;
  observations: string;
  scheduledDate: string; // YYYY-MM-DD
  status: OperationStatus;
  assignedTo: string | null; // userId
  assignedToName: string | null;
  acceptedTime: string | null; // ISO String
  startTime: string | null; // ISO String
  endTime: string | null; // ISO String
  checklist: Checklist | null;
}

export type ProcedureCategory = 'loads' | 'unloads' | 'safety' | 'quality' | 'machinery' | 'general';
export type ProcedureFileType = 'pdf' | 'image' | 'video';

export interface Procedure {
  id: string;
  title: string;
  category: ProcedureCategory;
  fileType: ProcedureFileType;
  fileUrl: string;
  createdAt: string;
  readBy: string[]; // array of userIds
}

export type DoubtStatus = 'pending' | 'answered' | 'closed';
export type DoubtCategory = 'procedures' | 'operations' | 'safety' | 'quality';

export interface Doubt {
  id: string;
  userId: string;
  userName: string;
  category: DoubtCategory;
  createdAt: string; // ISO String
  query: string;
  reply: string | null;
  replyBy: string | null;
  replyByName: string | null;
  repliedAt: string | null; // ISO String
  status: DoubtStatus;
}

export type IncidentCategory = 'damage' | 'breakage' | 'delay' | 'safety' | 'documentation' | 'other';
export type IncidentStatus = 'pending' | 'review' | 'resolved' | 'closed';

export interface Incident {
  id: string;
  userId: string;
  userName: string;
  createdAt: string; // ISO String
  category: IncidentCategory;
  description: string;
  photos: string[]; // urls
  relatedOp: string | null; // OP-XXXX or ID
  status: IncidentStatus;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  createdAt: string; // ISO String
  affectedRecord: string;
  oldValue: string;
  newValue: string;
}

export interface AppSettings {
  isDemoMode: boolean;
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  } | null;
  workdayHours: number; // default 8
}
