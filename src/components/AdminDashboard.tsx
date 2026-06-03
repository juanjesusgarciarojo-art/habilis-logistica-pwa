import React, { useState, useEffect } from 'react';
import type { User, VacationRequest, Procedure, ClockIn, Operation, Incident } from '../types';
import { dbService } from '../services/db';
import { AuditLogView } from './AuditLogView';
import { exportUtils } from '../utils/exportUtils';
import { Shield, Users, Calendar, Download, UserPlus, FileUp, AlertTriangle, Plus } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'vacations' | 'documents' | 'exports' | 'audits'>('overview');
  
  // DB States
  const [users, setUsers] = useState<User[]>([]);
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [clockIns, setClockIns] = useState<ClockIn[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Resolution overlays
  const [resolvingVacation, setResolvingVacation] = useState<VacationRequest | null>(null);
  const [vacationComment, setVacationComment] = useState<string>('');

  // Create document states
  const [showDocModal, setShowDocModal] = useState<boolean>(false);
  const [docTitle, setDocTitle] = useState<string>('');
  const [docCategory, setDocCategory] = useState<'loads' | 'unloads' | 'safety' | 'quality' | 'machinery' | 'general'>('general');
  const [docType, setDocType] = useState<'pdf' | 'image' | 'video'>('pdf');

  // Create user states
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<'worker' | 'manager' | 'admin'>('worker');
  const [newUserTeam, setNewUserTeam] = useState<string>('');

  useEffect(() => {
    loadAdminData();
  }, [refreshTrigger]);

  const loadAdminData = async () => {
    const usersList = await dbService.getUsers();
    setUsers(usersList);

    const vacList = await dbService.getVacations();
    setVacationRequests(vacList);

    const procList = await dbService.getProcedures();
    setProcedures(procList);

    const clocksList = await dbService.getClockIns();
    setClockIns(clocksList);

    const opsList = await dbService.getOperations();
    setOperations(opsList);

    const incList = await dbService.getIncidents();
    setIncidents(incList);
  };

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  // User Actions
  const handleToggleUserStatus = async (u: User) => {
    const updatedUser: User = {
      ...u,
      active: !u.active
    };
    await dbService.updateUser(updatedUser);
    await dbService.addAuditLog(
      'modificar_usuario',
      `users/${u.uid}`,
      JSON.stringify(u),
      JSON.stringify(updatedUser),
      user.uid,
      user.displayName
    );
    triggerRefresh();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserName) return;

    // Direct addition to mock DB users for demo persistence
    const newUser: User = {
      uid: `user-${Date.now()}`,
      email: newUserEmail,
      displayName: newUserName,
      role: newUserRole,
      team: newUserTeam || undefined,
      active: true,
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random()*1000000)}?w=150`
    };

    const db = (await import('../services/mockData')).getMockDatabase();
    db.users.push(newUser);
    (await import('../services/mockData')).saveMockDatabase(db);

    await dbService.addAuditLog(
      'crear_usuario',
      `users/${newUser.uid}`,
      '-',
      JSON.stringify(newUser),
      user.uid,
      user.displayName
    );

    setNewUserEmail('');
    setNewUserName('');
    setNewUserTeam('');
    setShowUserModal(false);
    triggerRefresh();
  };

  // Vacation Approvals
  const handleResolveVacation = async (status: 'approved' | 'rejected') => {
    if (!resolvingVacation) return;

    const updatedVac: VacationRequest = {
      ...resolvingVacation,
      status,
      resolutionDate: new Date().toISOString(),
      resolvedBy: user.displayName,
      comments: vacationComment
    };

    await dbService.updateVacation(updatedVac);
    await dbService.addAuditLog(
      status === 'approved' ? 'aprobar_vacaciones' : 'rechazar_vacaciones',
      `vacations/${resolvingVacation.id}`,
      JSON.stringify(resolvingVacation),
      JSON.stringify(updatedVac),
      user.uid,
      user.displayName
    );

    setResolvingVacation(null);
    setVacationComment('');
    triggerRefresh();
  };

  // Document management
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle) return;

    const newProc: Procedure = {
      id: `proc-${Date.now()}`,
      title: docTitle,
      category: docCategory,
      fileType: docType,
      fileUrl: `/procedures/${docTitle.toLowerCase().replace(/ /g, '-')}.${docType === 'pdf' ? 'pdf' : docType === 'image' ? 'jpg' : 'mp4'}`,
      createdAt: new Date().toISOString(),
      readBy: []
    };

    await dbService.createProcedure(newProc);
    await dbService.addAuditLog(
      'crear_procedimiento',
      `procedures/${newProc.id}`,
      '-',
      JSON.stringify(newProc),
      user.uid,
      user.displayName
    );

    setDocTitle('');
    setShowDocModal(false);
    triggerRefresh();
  };

  // Informes Export Handlers
  const handleExportData = (module: 'hours' | 'vacations' | 'operations' | 'incidents' | 'productivity', format: 'excel' | 'csv' | 'pdf') => {
    let dataToExport: any[] = [];
    let headers: string[] = [];
    let rows: any[][] = [];
    let title = '';
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `${module}_habilis_${dateStr}`;

    switch (module) {
      case 'hours':
        title = 'Control Horario y Horas Extra';
        dataToExport = clockIns.map(c => ({
          Fecha: c.date,
          Empleado: c.userName,
          Entrada: new Date(c.startTime).toLocaleTimeString('es-ES'),
          Salida: c.endTime ? new Date(c.endTime).toLocaleTimeString('es-ES') : 'En curso',
          'Total Horas': c.hoursWorked,
          'Horas Ordinarias': c.hoursOrdinary,
          'Horas Extra': c.hoursExtra,
          'Horas Pendientes': c.hoursPending,
          Dispositivo: c.device
        }));
        headers = ['Fecha', 'Empleado', 'Entrada', 'Salida', 'Horas', 'Extra', 'Pendientes'];
        rows = clockIns.map(c => [
          c.date,
          c.userName,
          new Date(c.startTime).toLocaleTimeString('es-ES'),
          c.endTime ? new Date(c.endTime).toLocaleTimeString('es-ES') : 'Activa',
          c.hoursWorked.toFixed(1) + 'h',
          c.hoursExtra > 0 ? '+' + c.hoursExtra.toFixed(1) + 'h' : '0',
          c.hoursPending > 0 ? '-' + c.hoursPending.toFixed(1) + 'h' : '0'
        ]);
        break;

      case 'vacations':
        title = 'Registro de Vacaciones y Permisos';
        dataToExport = vacationRequests.map(v => ({
          Empleado: v.userName,
          'Fecha Inicio': v.startDate,
          'Fecha Fin': v.endDate,
          Tipo: v.type.toUpperCase(),
          Estado: v.status.toUpperCase(),
          Solicitado: new Date(v.requestDate).toLocaleDateString('es-ES'),
          Aprobador: v.resolvedBy || '-'
        }));
        headers = ['Empleado', 'Fecha Inicio', 'Fecha Fin', 'Tipo', 'Estado', 'Aprobador'];
        rows = vacationRequests.map(v => [
          v.userName,
          v.startDate,
          v.endDate,
          v.type.toUpperCase(),
          v.status.toUpperCase(),
          v.resolvedBy || '-'
        ]);
        break;

      case 'operations':
        title = 'Registro de Cargas y Descargas';
        dataToExport = operations.map(o => ({
          Operación: o.opNumber,
          Tipo: o.type.toUpperCase(),
          Zona: o.zone,
          Ubicación: o.exactLocation,
          Fecha: o.scheduledDate,
          Estado: o.status.toUpperCase(),
          Asignado: o.assignedToName || '-',
          Cierre: o.endTime ? new Date(o.endTime).toLocaleTimeString('es-ES') : '-'
        }));
        headers = ['Nº Op', 'Tipo', 'Zona', 'Ubicación', 'Fecha', 'Estado', 'Asignado'];
        rows = operations.map(o => [
          o.opNumber,
          o.type.toUpperCase(),
          o.zone,
          o.exactLocation,
          o.scheduledDate,
          o.status.toUpperCase(),
          o.assignedToName || '-'
        ]);
        break;

      case 'incidents':
        title = 'Registro de Incidencias de Calidad';
        dataToExport = incidents.map(i => ({
          Empleado: i.userName,
          Fecha: new Date(i.createdAt).toLocaleDateString('es-ES'),
          Categoría: i.category.toUpperCase(),
          Descripción: i.description,
          Vinculada: i.relatedOp || '-',
          Estado: i.status.toUpperCase()
        }));
        headers = ['Empleado', 'Fecha', 'Categoría', 'Descripción', 'Op', 'Estado'];
        rows = incidents.map(i => [
          i.userName,
          new Date(i.createdAt).toLocaleDateString('es-ES'),
          i.category.toUpperCase(),
          i.description.substring(0, 45) + (i.description.length > 45 ? '...' : ''),
          i.relatedOp || '-',
          i.status.toUpperCase()
        ]);
        break;

      case 'productivity':
        title = 'Informe de Productividad General';
        // Mock aggregate counts per worker
        const workerStats = users.filter(u => u.role === 'worker').map(w => {
          const workerClocks = clockIns.filter(c => c.userId === w.uid);
          const totalHours = workerClocks.reduce((sum, curr) => sum + curr.hoursWorked, 0);
          const totalOps = operations.filter(o => o.assignedTo === w.uid && o.status === 'completed').length;
          const totalIncs = incidents.filter(i => i.userId === w.uid).length;
          
          return {
            Empleado: w.displayName,
            Equipo: w.team || 'Sin asignar',
            'Jornadas Fichadas': workerClocks.length,
            'Total Horas Trabajadas': parseFloat(totalHours.toFixed(1)),
            'Cargas/Descargas Cerradas': totalOps,
            'Incidencias Registradas': totalIncs,
            'Rendimiento (Op/Hora)': totalHours > 0 ? parseFloat((totalOps / totalHours).toFixed(2)) : 0
          };
        });

        dataToExport = workerStats;
        headers = ['Empleado', 'Equipo', 'Jornadas', 'Horas', 'Op. Cerradas', 'Incidencias', 'Op/Hora'];
        rows = workerStats.map(s => [
          s.Empleado,
          s.Equipo,
          s['Jornadas Fichadas'],
          s['Total Horas Trabajadas'] + 'h',
          s['Cargas/Descargas Cerradas'],
          s['Incidencias Registradas'],
          s['Rendimiento (Op/Hora)']
        ]);
        break;
    }

    if (format === 'excel') {
      exportUtils.exportToExcel(dataToExport, fileName, title.substring(0, 30));
    } else if (format === 'csv') {
      exportUtils.exportToCSV(dataToExport, fileName);
    } else {
      exportUtils.exportToPDF(title, headers, rows, fileName);
    }
  };

  return (
    <div>
      {/* Sub menu tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('overview')} className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          Consola General
        </button>
        <button onClick={() => setActiveTab('users')} className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          Gestión Usuarios
        </button>
        <button onClick={() => setActiveTab('vacations')} className={`btn ${activeTab === 'vacations' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          Vacaciones Pendientes ({vacationRequests.filter(v => v.status === 'pending').length})
        </button>
        <button onClick={() => setActiveTab('documents')} className={`btn ${activeTab === 'documents' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          Procedimientos
        </button>
        <button onClick={() => setActiveTab('exports')} className={`btn ${activeTab === 'exports' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          Exportar Informes
        </button>
        <button onClick={() => setActiveTab('audits')} className={`btn ${activeTab === 'audits' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          Registro de Auditoría
        </button>
      </div>

      {/* Tab: Overview (Consola General del Administrador) */}
      {activeTab === 'overview' && (
        <div>
          <div className="dashboard-grid">
            <div className="stat-card" style={{ borderLeft: '4px solid var(--habilis-blue)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Trabajadores Registrados</span>
                <Users size={18} />
              </div>
              <div className="stat-value">{users.length}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{users.filter(u => u.active).length} activos</span>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Operaciones del Día</span>
                <Shield size={18} />
              </div>
              <div className="stat-value">
                {operations.filter(o => o.status === 'completed').length} / {operations.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cerradas / Planificadas</span>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Solicitudes Pendientes</span>
                <Calendar size={18} />
              </div>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>
                {vacationRequests.filter(v => v.status === 'pending').length}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Vacaciones por revisar</span>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid var(--habilis-red)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Incidencias Abiertas</span>
                <AlertTriangle size={18} />
              </div>
              <div className="stat-value" style={{ color: 'var(--habilis-red)' }}>
                {incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed').length}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Faltan resolver</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }} className="mobile-stack-layout">
            
            {/* Active shifts view */}
            <div className="card-habilis">
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--habilis-blue)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Fichajes y Control Horario del Día
              </h2>
              <div className="table-container">
                <table className="habilis-table">
                  <thead>
                    <tr>
                      <th>Empleado</th>
                      <th>Entrada</th>
                      <th>Salida</th>
                      <th>Total Horas</th>
                      <th>Dispositivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clockIns.slice(0, 10).map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.userName}</td>
                        <td>{new Date(c.startTime).toLocaleTimeString()}</td>
                        <td>{c.endTime ? new Date(c.endTime).toLocaleTimeString() : <span className="badge badge-success">Activa</span>}</td>
                        <td>{c.hoursWorked > 0 ? `${c.hoursWorked}h` : '-'}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.device}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick action shortcuts */}
            <div className="card-habilis">
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--habilis-blue)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Acciones Administrativas
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button onClick={() => setShowUserModal(true)} className="btn btn-primary" style={{ width: '100%', gap: '0.5rem' }}>
                  <UserPlus size={16} /> Crear Nuevo Usuario
                </button>
                <button onClick={() => setShowDocModal(true)} className="btn btn-secondary" style={{ width: '100%', gap: '0.5rem' }}>
                  <FileUp size={16} /> Subir Procedimiento
                </button>
                <button onClick={() => setActiveTab('exports')} className="btn btn-secondary" style={{ width: '100%', gap: '0.5rem' }}>
                  <Download size={16} /> Descargar Informes
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab: Users Management */}
      {activeTab === 'users' && (
        <div className="card-habilis">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Gestión de Usuarios y Permisos</h2>
            <button onClick={() => setShowUserModal(true)} className="btn btn-primary" style={{ gap: '0.5rem' }}>
              <UserPlus size={18} />
              Crear Usuario
            </button>
          </div>

          <div className="table-container">
            <table className="habilis-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol / Permisos</th>
                  <th>Equipo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.uid}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src={u.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'} alt={u.displayName} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span style={{ fontWeight: 600 }}>{u.displayName}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${
                        u.role === 'admin' ? 'badge-danger' :
                        u.role === 'manager' ? 'badge-warning' : 'badge-primary'
                      }`}>{u.role}</span>
                    </td>
                    <td>{u.team || <span style={{ color: 'var(--text-muted)' }}>Sin asignar</span>}</td>
                    <td>
                      <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>
                        {u.active ? 'Activo' : 'Baja'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleToggleUserStatus(u)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                        {u.active ? 'Dar de Baja' : 'Reactivar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Vacations Approvals */}
      {activeTab === 'vacations' && (
        <div className="card-habilis">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Aprobación de Solicitudes de Vacaciones y Licencias</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {vacationRequests.filter(v => v.status === 'pending').length > 0 ? (
              vacationRequests.filter(v => v.status === 'pending').map((vac) => (
                <div key={vac.id} className="card-habilis" style={{ margin: 0, padding: '1.25rem', background: 'var(--bg-app)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{vac.userName}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', gap: '1rem' }}>
                      <span>Inicio: <strong>{new Date(vac.startDate).toLocaleDateString()}</strong></span>
                      <span>Fin: <strong>{new Date(vac.endDate).toLocaleDateString()}</strong></span>
                      <span>Tipo: <strong style={{ color: 'var(--habilis-blue)' }}>{vac.type.toUpperCase()}</strong></span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>Solicitado el {new Date(vac.requestDate).toLocaleDateString()}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setResolvingVacation(vac)} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: 'var(--success)' }}>
                      Resolver Solicitud
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                No hay solicitudes de vacaciones o permisos pendientes de revisión.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Documents (Procedures Upload) */}
      {activeTab === 'documents' && (
        <div className="card-habilis">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Gestión de Procedimientos y Normativa</h2>
            <button onClick={() => setShowDocModal(true)} className="btn btn-primary" style={{ gap: '0.5rem' }}>
              <Plus size={18} />
              Publicar Documento
            </button>
          </div>

          <div className="table-container">
            <table className="habilis-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Categoría</th>
                  <th>Tipo Archivo</th>
                  <th>Fecha Publicación</th>
                  <th>Lecturas registradas</th>
                </tr>
              </thead>
              <tbody>
                {procedures.map((proc) => (
                  <tr key={proc.id}>
                    <td style={{ fontWeight: 600 }}>{proc.title}</td>
                    <td>
                      <span className="badge badge-info">{proc.category}</span>
                    </td>
                    <td>
                      <span className="badge badge-secondary">{proc.fileType.toUpperCase()}</span>
                    </td>
                    <td>{new Date(proc.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className="badge badge-success">
                        {proc.readBy.length} Lecturas
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Exports (Generación de Informes Excel/CSV/PDF) */}
      {activeTab === 'exports' && (
        <div className="card-habilis">
          <h2 style={{ fontSize: '1.4rem', color: 'var(--habilis-blue)', marginBottom: '0.5rem' }}>Centro de Informes y Descarga de Datos</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Filtre y exporte los datos de rendimiento e histórico de la empresa en formatos oficiales (Excel, CSV o PDF).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Inform 1 */}
            <div className="card-habilis" style={{ margin: 0, padding: '1.25rem', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>Control Horario e Histórico</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Fichajes de entrada y salida, horas ordinarias y extras calculadas de toda la plantilla.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button onClick={() => handleExportData('hours', 'excel')} className="btn btn-secondary" style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}>Excel</button>
                <button onClick={() => handleExportData('hours', 'csv')} className="btn btn-secondary" style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}>CSV</button>
                <button onClick={() => handleExportData('hours', 'pdf')} className="btn btn-primary" style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}>PDF</button>
              </div>
            </div>

            {/* Inform 2 */}
            <div className="card-habilis" style={{ margin: 0, padding: '1.25rem', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>Vacaciones y Licencias</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Registro de solicitudes, estados (Aprobado/Rechazado) y comentarios del personal.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button onClick={() => handleExportData('vacations', 'excel')} className="btn btn-secondary" style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}>Excel</button>
                <button onClick={() => handleExportData('vacations', 'csv')} className="btn btn-secondary" style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}>CSV</button>
                <button onClick={() => handleExportData('vacations', 'pdf')} className="btn btn-primary" style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}>PDF</button>
              </div>
            </div>

            {/* Inform 3 */}
            <div className="card-habilis" style={{ margin: 0, padding: '1.25rem', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>Cargas y Descargas</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Registro de operaciones finalizadas, tiempos de proceso y checklists completados.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button onClick={() => handleExportData('operations', 'excel')} className="btn btn-secondary" style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}>Excel</button>
                <button onClick={() => handleExportData('operations', 'csv')} className="btn btn-secondary" style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}>CSV</button>
                <button onClick={() => handleExportData('operations', 'pdf')} className="btn btn-primary" style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}>PDF</button>
              </div>
            </div>

            {/* Inform 4 */}
            <div className="card-habilis" style={{ margin: 0, padding: '1.25rem', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>Incidencias de Almacén</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Auditoría de roturas, daños, averías e incidencias reportadas por los operarios.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button onClick={() => handleExportData('incidents', 'excel')} className="btn btn-secondary" style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}>Excel</button>
                <button onClick={() => handleExportData('incidents', 'csv')} className="btn btn-secondary" style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}>CSV</button>
                <button onClick={() => handleExportData('incidents', 'pdf')} className="btn btn-primary" style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}>PDF</button>
              </div>
            </div>

            {/* Inform 5 */}
            <div className="card-habilis" style={{ margin: 0, padding: '1.25rem', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>Productividad y Operarios</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Estadísticas de cargas completadas por hora trabajada por cada miembro del equipo.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button onClick={() => handleExportData('productivity', 'excel')} className="btn btn-secondary" style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}>Excel</button>
                <button onClick={() => handleExportData('productivity', 'csv')} className="btn btn-secondary" style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}>CSV</button>
                <button onClick={() => handleExportData('productivity', 'pdf')} className="btn btn-primary" style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}>PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Audits (System inmutable audit log viewer) */}
      {activeTab === 'audits' && (
        <AuditLogView />
      )}

      {/* Resolving Vacation Comment Modal */}
      {resolvingVacation && (
        <div className="modal-overlay" onClick={() => setResolvingVacation(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--habilis-blue)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Resolución de Solicitud de Vacaciones
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Operario: <strong>{resolvingVacation.userName}</strong>. Período: {new Date(resolvingVacation.startDate).toLocaleDateString()} al {new Date(resolvingVacation.endDate).toLocaleDateString()}.
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="vacComment">Comentarios o Justificación</label>
              <textarea
                id="vacComment"
                className="form-input"
                rows={3}
                placeholder="Facilite comentarios al operario sobre su resolución..."
                value={vacationComment}
                onChange={(e) => setVacationComment(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={() => handleResolveVacation('rejected')} className="btn btn-accent" style={{ flex: 1 }}>
                Rechazar
              </button>
              <button onClick={() => handleResolveVacation('approved')} className="btn btn-primary" style={{ flex: 1, background: 'var(--success)' }}>
                Aprobar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document publish modal */}
      {showDocModal && (
        <div className="modal-overlay" onClick={() => setShowDocModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--habilis-blue)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Publicar Nuevo Procedimiento en la Plataforma
            </h2>
            <form onSubmit={handleCreateDocument} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="docTitle">Título del Documento</label>
                <input
                  id="docTitle"
                  type="text"
                  className="form-input"
                  placeholder="Ej. Guía de uso de carretilla elevadora C2"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="docCat">Categoría</label>
                  <select
                    id="docCat"
                    className="form-input"
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as any)}
                  >
                    <option value="loads">Cargas</option>
                    <option value="unloads">Descargas</option>
                    <option value="safety">Seguridad</option>
                    <option value="quality">Calidad</option>
                    <option value="machinery">Maquinaria</option>
                    <option value="general">Operaciones generales</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="docType">Tipo de Archivo</label>
                  <select
                    id="docType"
                    className="form-input"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                  >
                    <option value="pdf">Documento PDF</option>
                    <option value="image">Imagen / Infografía</option>
                    <option value="video">Vídeo Informativo</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowDocModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Publicar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Create Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--habilis-blue)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Crear Nuevo Usuario Habilis
            </h2>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="newUserName">Nombre Completo</label>
                <input
                  id="newUserName"
                  type="text"
                  className="form-input"
                  placeholder="Ej. Pedro Martínez"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newUserEmail">Correo Electrónico</label>
                <input
                  id="newUserEmail"
                  type="email"
                  className="form-input"
                  placeholder="pedro.martinez@habilis.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="newUserRole">Rol / Permisos</label>
                  <select
                    id="newUserRole"
                    className="form-input"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                  >
                    <option value="worker">Trabajador (Operario)</option>
                    <option value="manager">Responsable (Supervisor)</option>
                    <option value="admin">Administrador (Control Total)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="newUserTeam">Turno / Equipo (Opcional)</label>
                  <input
                    id="newUserTeam"
                    type="text"
                    className="form-input"
                    placeholder="Ej. Turno Tarde"
                    value={newUserTeam}
                    onChange={(e) => setNewUserTeam(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowUserModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
