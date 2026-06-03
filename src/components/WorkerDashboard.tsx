import React, { useState, useEffect } from 'react';
import type { User, Operation, Work, VacationRequest, Procedure, Doubt, Incident, Checklist, ClockIn } from '../types';
import { dbService } from '../services/db';
import { TimeClock } from './TimeClock';
import { AnnualCalendar } from './AnnualCalendar';
import { ChecklistModal } from './ChecklistModal';
import { Play, CheckCircle, Plus, ShieldAlert, Eye, MessageSquare } from 'lucide-react';

interface WorkerDashboardProps {
  user: User;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'calendar' | 'procedures' | 'quality'>('daily');
  const [operations, setOperations] = useState<Operation[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [vacations, setVacations] = useState<VacationRequest[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [clockIns, setClockIns] = useState<ClockIn[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // States for modal checklists
  const [activeOpChecklist, setActiveOpChecklist] = useState<Operation | null>(null);

  // Form states
  const [showVacationModal, setShowVacationModal] = useState<boolean>(false);
  const [vacStart, setVacStart] = useState<string>('');
  const [vacEnd, setVacEnd] = useState<string>('');
  const [vacType, setVacType] = useState<'vacation' | 'permit'>('vacation');

  const [showDoubtModal, setShowDoubtModal] = useState<boolean>(false);
  const [doubtQuery, setDoubtQuery] = useState<string>('');
  const [doubtCat, setDoubtCat] = useState<'procedures' | 'operations' | 'safety' | 'quality'>('operations');

  const [showIncidentModal, setShowIncidentModal] = useState<boolean>(false);
  const [incDesc, setIncDesc] = useState<string>('');
  const [incCat, setIncCat] = useState<'damage' | 'breakage' | 'delay' | 'safety' | 'documentation' | 'other'>('damage');
  const [incOp, setIncOp] = useState<string>('');
  const [incPhoto, setIncPhoto] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, [user.uid, refreshTrigger]);

  const loadDashboardData = async () => {
    const opsData = await dbService.getOperations();
    // show only operations assigned to worker or pending (unassigned)
    const workerOps = opsData.filter(op => op.assignedTo === user.uid || op.status === 'pending');
    setOperations(workerOps);

    const worksData = await dbService.getWorks();
    const workerWorks = worksData.filter(w => w.assignedTo === user.uid);
    setWorks(workerWorks);

    const vacData = await dbService.getVacations(user.uid);
    setVacations(vacData);

    const procData = await dbService.getProcedures();
    setProcedures(procData);

    const doubtsData = await dbService.getDoubts(user.uid);
    setDoubts(doubtsData);

    const incData = await dbService.getIncidents(user.uid);
    setIncidents(incData);

    const clocksData = await dbService.getClockIns(user.uid);
    setClockIns(clocksData);
  };

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  // Operation Actions
  const handleAcceptOp = async (op: Operation) => {
    const updatedOp: Operation = {
      ...op,
      status: 'assigned',
      assignedTo: user.uid,
      assignedToName: user.displayName,
      acceptedTime: new Date().toISOString()
    };
    await dbService.updateOperation(updatedOp);
    await dbService.addAuditLog(
      'aceptar_operacion',
      `operations/${op.id}`,
      JSON.stringify(op),
      JSON.stringify(updatedOp),
      user.uid,
      user.displayName
    );
    triggerRefresh();
  };

  const handleStartOp = async (op: Operation) => {
    const updatedOp: Operation = {
      ...op,
      status: 'in_progress',
      startTime: new Date().toISOString()
    };
    await dbService.updateOperation(updatedOp);
    await dbService.addAuditLog(
      'iniciar_operacion',
      `operations/${op.id}`,
      JSON.stringify(op),
      JSON.stringify(updatedOp),
      user.uid,
      user.displayName
    );
    triggerRefresh();
  };

  const handleCompleteOpChecklist = async (checklist: Checklist) => {
    if (!activeOpChecklist) return;

    const updatedOp: Operation = {
      ...activeOpChecklist,
      status: 'completed',
      endTime: new Date().toISOString(),
      checklist
    };

    await dbService.updateOperation(updatedOp);
    await dbService.addAuditLog(
      'finalizar_operacion',
      `operations/${activeOpChecklist.id}`,
      JSON.stringify(activeOpChecklist),
      JSON.stringify(updatedOp),
      user.uid,
      user.displayName
    );

    setActiveOpChecklist(null);
    triggerRefresh();
  };

  // Work Complete Actions
  const handleCompleteWork = async (work: Work) => {
    const updatedWork: Work = {
      ...work,
      status: 'completed'
    };
    await dbService.updateWork(updatedWork);
    await dbService.addAuditLog(
      'completar_trabajo',
      `works/${work.id}`,
      JSON.stringify(work),
      JSON.stringify(updatedWork),
      user.uid,
      user.displayName
    );
    triggerRefresh();
  };

  // Vacation Request Action
  const handleRequestVacation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacStart || !vacEnd) return;

    const newRequest: VacationRequest = {
      id: `vac-${Date.now()}`,
      userId: user.uid,
      userName: user.displayName,
      startDate: vacStart,
      endDate: vacEnd,
      type: vacType,
      requestDate: new Date().toISOString(),
      resolutionDate: null,
      status: 'pending',
      resolvedBy: null,
      comments: ''
    };

    await dbService.createVacation(newRequest);
    await dbService.addAuditLog(
      'solicitar_vacaciones',
      `vacations/${newRequest.id}`,
      '-',
      JSON.stringify(newRequest),
      user.uid,
      user.displayName
    );

    setVacStart('');
    setVacEnd('');
    setShowVacationModal(false);
    triggerRefresh();
  };

  // Doubt Action
  const handleCreateDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtQuery) return;

    const newDoubt: Doubt = {
      id: `doubt-${Date.now()}`,
      userId: user.uid,
      userName: user.displayName,
      category: doubtCat,
      createdAt: new Date().toISOString(),
      query: doubtQuery,
      reply: null,
      replyBy: null,
      replyByName: null,
      repliedAt: null,
      status: 'pending'
    };

    await dbService.createDoubt(newDoubt);
    await dbService.addAuditLog(
      'crear_duda',
      `doubts/${newDoubt.id}`,
      '-',
      doubtQuery,
      user.uid,
      user.displayName
    );

    setDoubtQuery('');
    setShowDoubtModal(false);
    triggerRefresh();
  };

  // Incident Action
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incDesc) return;

    // Use a default mock thumbnail if they don't upload one
    const pUrl = incPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400';

    const newIncident: Incident = {
      id: `inc-${Date.now()}`,
      userId: user.uid,
      userName: user.displayName,
      createdAt: new Date().toISOString(),
      category: incCat,
      description: incDesc,
      photos: [pUrl],
      relatedOp: incOp || null,
      status: 'pending'
    };

    await dbService.createIncident(newIncident);
    await dbService.addAuditLog(
      'reportar_incidencia',
      `incidents/${newIncident.id}`,
      '-',
      incDesc,
      user.uid,
      user.displayName
    );

    setIncDesc('');
    setIncOp('');
    setIncPhoto('');
    setShowIncidentModal(false);
    triggerRefresh();
  };

  // Mark procedure as read
  const handleReadProcedure = async (proc: Procedure) => {
    if (proc.readBy.includes(user.uid)) return;

    const updatedProc: Procedure = {
      ...proc,
      readBy: [...proc.readBy, user.uid]
    };

    await dbService.updateProcedure(updatedProc);
    await dbService.addAuditLog(
      'lectura_procedimiento',
      `procedures/${proc.id}`,
      JSON.stringify(proc.readBy),
      JSON.stringify(updatedProc.readBy),
      user.uid,
      user.displayName
    );
    triggerRefresh();
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('daily')}
          className={`btn ${activeTab === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          Operativa Diaria
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`btn ${activeTab === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          Calendario y Vacaciones
        </button>
        <button
          onClick={() => setActiveTab('procedures')}
          className={`btn ${activeTab === 'procedures' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          Procedimientos
        </button>
        <button
          onClick={() => setActiveTab('quality')}
          className={`btn ${activeTab === 'quality' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          Calidad e Incidencias
        </button>
      </div>

      {/* View: Daily Operative */}
      {activeTab === 'daily' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem', alignItems: 'start', flexWrap: 'wrap' }} className="mobile-stack-layout">
          {/* Left panel: clock card */}
          <div>
            <TimeClock user={user} onClockStatusChange={triggerRefresh} />
            
            {/* Quick stats on hours worked this month */}
            <div className="card-habilis" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Fichajes de este Mes</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Jornadas Completas:</span>
                  <span className="badge badge-success" style={{ fontWeight: 700 }}>
                    {clockIns.filter(c => c.hoursWorked >= 8 && c.endTime).length} días
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Jornadas Incompletas:</span>
                  <span className="badge badge-danger" style={{ fontWeight: 700 }}>
                    {clockIns.filter(c => c.hoursWorked < 8 && c.endTime).length} días
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Horas Extra Acumuladas:</span>
                  <span className="badge badge-primary" style={{ fontWeight: 700 }}>
                    +{clockIns.reduce((sum, curr) => sum + curr.hoursExtra, 0).toFixed(1)}h
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Jobs and Operations lists */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Section: Operations (Loads / Unloads) */}
            <div className="card-habilis">
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--habilis-blue)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Cargas y Descargas del Día
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {operations.length > 0 ? (
                  operations.map((op) => (
                    <div key={op.id} className="card-habilis" style={{ margin: 0, padding: '1.25rem', borderLeft: '4px solid var(--habilis-blue)', background: 'var(--bg-app)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div>
                          <span className="badge badge-primary" style={{ marginRight: '0.5rem' }}>{op.opNumber}</span>
                          <span className={`badge ${op.type === 'load' ? 'badge-success' : 'badge-warning'}`}>
                            {op.type === 'load' ? 'Carga' : 'Descarga'}
                          </span>
                        </div>
                        <span className={`badge ${
                          op.status === 'pending' ? 'badge-secondary' :
                          op.status === 'assigned' ? 'badge-info' :
                          op.status === 'in_progress' ? 'badge-warning' : 'badge-success'
                        }`}>{op.status.replace('_', ' ')}</span>
                      </div>

                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem' }}>
                        <div><strong>Zona:</strong> {op.zone} ({op.exactLocation})</div>
                        <div><strong>Observaciones:</strong> {op.observations}</div>
                        {op.startTime && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Iniciada: {new Date(op.startTime).toLocaleTimeString()}
                          </div>
                        )}
                      </div>

                      {/* Operation Actions buttons based on status */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {op.status === 'pending' && (
                          <button onClick={() => handleAcceptOp(op)} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', width: '100%' }}>
                            Aceptar Operación
                          </button>
                        )}
                        {op.status === 'assigned' && op.assignedTo === user.uid && (
                          <button onClick={() => handleStartOp(op)} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', width: '100%', background: 'var(--warning)' }}>
                            <Play size={14} fill="white" /> Iniciar Carga/Descarga
                          </button>
                        )}
                        {op.status === 'in_progress' && op.assignedTo === user.uid && (
                          <button onClick={() => setActiveOpChecklist(op)} className="btn btn-accent" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', width: '100%' }}>
                            Completar Checklist y Cerrar
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
                    No hay operaciones de carga o descarga pendientes asignadas para hoy.
                  </div>
                )}
              </div>
            </div>

            {/* Section: Assigned Works (Jobs) */}
            <div className="card-habilis">
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--habilis-blue)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Trabajos Asignados
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {works.filter(w => w.status !== 'completed' && w.status !== 'cancelled').length > 0 ? (
                  works.filter(w => w.status !== 'completed' && w.status !== 'cancelled').map((work) => (
                    <div key={work.id} className="card-habilis" style={{ margin: 0, padding: '1rem', background: 'var(--bg-app)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{work.title}</span>
                        <span className={`badge ${
                          work.priority === 'high' ? 'badge-danger' :
                          work.priority === 'medium' ? 'badge-warning' : 'badge-primary'
                        }`}>{work.priority}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{work.description}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>Límite: <strong>{new Date(work.deadline).toLocaleDateString()}</strong></span>
                        <button onClick={() => handleCompleteWork(work)} className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle size={14} style={{ color: 'var(--success)' }} /> Completar
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
                    No tienes trabajos pendientes asignados actualmente.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* View: Calendar and Vacation Portal */}
      {activeTab === 'calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowVacationModal(true)} className="btn btn-primary" style={{ gap: '0.5rem' }}>
              <Plus size={18} />
              Solicitar Vacaciones / Licencias
            </button>
          </div>

          <AnnualCalendar user={user} refreshTrigger={refreshTrigger} />

          {/* History of requests */}
          <div className="card-habilis">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Historial de Solicitudes</h2>
            <div className="table-container">
              <table className="habilis-table">
                <thead>
                  <tr>
                    <th>Fecha Inicio</th>
                    <th>Fecha Fin</th>
                    <th>Tipo</th>
                    <th>Fecha Solicitud</th>
                    <th>Estado</th>
                    <th>Aprobador / Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  {vacations.length > 0 ? (
                    vacations.map((vac) => (
                      <tr key={vac.id}>
                        <td>{new Date(vac.startDate).toLocaleDateString()}</td>
                        <td>{new Date(vac.endDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${vac.type === 'vacation' ? 'badge-primary' : 'badge-purple'}`}>
                            {vac.type === 'vacation' ? 'Vacaciones' : 'Permiso'}
                          </span>
                        </td>
                        <td>{new Date(vac.requestDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${
                            vac.status === 'approved' ? 'badge-success' :
                            vac.status === 'rejected' ? 'badge-danger' :
                            vac.status === 'pending' ? 'badge-warning' : 'badge-secondary'
                          }`}>{vac.status}</span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {vac.status !== 'pending' ? (
                            <span>Resuelto por <strong>{vac.resolvedBy}</strong>. {vac.comments && `Comentario: ${vac.comments}`}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Esperando revisión del administrador</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                        No se registran solicitudes anteriores.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View: Procedures */}
      {activeTab === 'procedures' && (
        <div className="card-habilis">
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--habilis-blue)' }}>Procedimientos de Operación y Normas</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Consulte y marque como leída la documentación obligatoria. El sistema registra las lecturas realizadas para auditorías de seguridad.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {procedures.map((proc) => {
              const isRead = proc.readBy.includes(user.uid);
              return (
                <div key={proc.id} className="card-habilis" style={{ margin: 0, padding: '1.25rem', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: `4px solid ${isRead ? 'var(--success)' : 'var(--habilis-red)'}` }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="badge badge-info">{proc.category}</span>
                      <span className="badge badge-secondary">{proc.fileType.toUpperCase()}</span>
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{proc.title}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Publicado: {new Date(proc.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`badge ${isRead ? 'badge-success' : 'badge-danger'}`} style={{ gap: '0.25rem' }}>
                      {isRead ? 'Leído ✓' : 'Pendiente lectura'}
                    </span>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(`Abriendo archivo simulado: ${proc.title}`);
                        handleReadProcedure(proc);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', gap: '0.25rem' }}
                    >
                      <Eye size={12} /> Leer
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View: Quality, doubts and incidents */}
      {activeTab === 'quality' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="mobile-stack-layout">
          {/* Incidents portal */}
          <div className="card-habilis">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--habilis-red)' }}>
                <ShieldAlert size={20} /> Incidencias y Roturas
              </h2>
              <button onClick={() => setShowIncidentModal(true)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.25rem' }}>
                <Plus size={14} /> Reportar Incidencia
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {incidents.length > 0 ? (
                incidents.map((inc) => (
                  <div key={inc.id} style={{ padding: '1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="badge badge-danger">{inc.category.replace('_', ' ')}</span>
                      <span className={`badge ${
                        inc.status === 'resolved' ? 'badge-success' : 'badge-warning'
                      }`}>{inc.status}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{inc.description}</p>
                    {inc.relatedOp && <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Operación vinculada: {inc.relatedOp}</div>}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      Fecha: {new Date(inc.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No se registran incidencias recientes reportadas.
                </div>
              )}
            </div>
          </div>

          {/* Doubt channel */}
          <div className="card-habilis">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--habilis-blue)' }}>
                <MessageSquare size={20} /> Canal de Consultas
              </h2>
              <button onClick={() => setShowDoubtModal(true)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', gap: '0.25rem' }}>
                <Plus size={14} /> Crear Consulta
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {doubts.map((d) => (
                <div key={d.id} style={{ padding: '1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="badge badge-info">{d.category}</span>
                    <span className={`badge ${d.status === 'answered' ? 'badge-success' : 'badge-warning'}`}>{d.status}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Q: {d.query}</div>
                  
                  {d.reply ? (
                    <div style={{ padding: '0.5rem', background: 'var(--bg-surface)', borderLeft: '3px solid var(--habilis-blue)', borderRadius: '4px', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      <strong>Respuesta de {d.replyByName}:</strong> {d.reply}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>
                      Esperando respuesta del supervisor...
                    </div>
                  )}
                  
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Enviada: {new Date(d.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Checklist modal logic */}
      {activeOpChecklist && (
        <ChecklistModal
          operation={activeOpChecklist}
          user={user}
          onClose={() => setActiveOpChecklist(null)}
          onComplete={handleCompleteOpChecklist}
        />
      )}

      {/* Vacation Request Modal */}
      {showVacationModal && (
        <div className="modal-overlay" onClick={() => setShowVacationModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--habilis-blue)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Solicitar Vacaciones o Permiso
            </h2>
            <form onSubmit={handleRequestVacation} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="vacType">Tipo de Solicitud</label>
                <select
                  id="vacType"
                  className="form-input"
                  value={vacType}
                  onChange={(e) => setVacType(e.target.value as 'vacation' | 'permit')}
                >
                  <option value="vacation">Vacaciones Anuales</option>
                  <option value="permit">Licencia o Permiso Retribuido</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="startDate">Fecha Inicio</label>
                  <input
                    id="startDate"
                    type="date"
                    className="form-input"
                    value={vacStart}
                    onChange={(e) => setVacStart(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="endDate">Fecha Fin</label>
                  <input
                    id="endDate"
                    type="date"
                    className="form-input"
                    value={vacEnd}
                    onChange={(e) => setVacEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowVacationModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doubt Portal Modal */}
      {showDoubtModal && (
        <div className="modal-overlay" onClick={() => setShowDoubtModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--habilis-blue)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Crear Nueva Consulta al Equipo de Gestión
            </h2>
            <form onSubmit={handleCreateDoubt} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="doubtCat">Categoría de la Consulta</label>
                <select
                  id="doubtCat"
                  className="form-input"
                  value={doubtCat}
                  onChange={(e) => setDoubtCat(e.target.value as any)}
                >
                  <option value="operations">Operaciones Logísticas</option>
                  <option value="safety">Seguridad y EPIs</option>
                  <option value="procedures">Procedimientos Generales</option>
                  <option value="quality">Calidad e Incidencias</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="doubtText">Escriba su consulta o duda</label>
                <textarea
                  id="doubtText"
                  className="form-input"
                  rows={4}
                  placeholder="Detalle de forma clara y precisa su duda..."
                  value={doubtQuery}
                  onChange={(e) => setDoubtQuery(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowDoubtModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Enviar Consulta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Incident Report Modal */}
      {showIncidentModal && (
        <div className="modal-overlay" onClick={() => setShowIncidentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--habilis-red)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Reportar Incidencia o Rotura
            </h2>
            <form onSubmit={handleCreateIncident} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="incCat">Categoría</label>
                  <select
                    id="incCat"
                    className="form-input"
                    value={incCat}
                    onChange={(e) => setIncCat(e.target.value as any)}
                  >
                    <option value="damage">Rotura de Mercancía</option>
                    <option value="breakage">Avería de Maquinaria</option>
                    <option value="delay">Retrasos de Transporte</option>
                    <option value="safety">Incidente de Seguridad</option>
                    <option value="documentation">Problema Documental</option>
                    <option value="other">Otras Incidencias</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="incOp">Operación Relacionada (Opcional)</label>
                  <input
                    id="incOp"
                    type="text"
                    className="form-input"
                    placeholder="Ej. OP-5001"
                    value={incOp}
                    onChange={(e) => setIncOp(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="incText">Descripción Detallada</label>
                <textarea
                  id="incText"
                  className="form-input"
                  rows={3}
                  placeholder="Explique detalladamente qué ha sucedido y qué medidas temporales se han adoptado..."
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="incPhoto">URL de Fotografía de Evidencia (Simulada)</label>
                <input
                  id="incPhoto"
                  type="text"
                  className="form-input"
                  placeholder="https://ejemplo.com/foto.jpg (Dejar vacío para imagen por defecto)"
                  value={incPhoto}
                  onChange={(e) => setIncPhoto(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowIncidentModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--habilis-red)' }}>
                  Registrar Incidencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
