import React, { useState, useEffect } from 'react';
import type { User, Operation, Work, Incident, Doubt, ClockIn } from '../types';
import { dbService } from '../services/db';
import { Plus, Users, Package, ShieldAlert, MessageSquare } from 'lucide-react';

interface ManagerDashboardProps {
  user: User;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'operations' | 'works' | 'incidents' | 'doubts'>('overview');
  
  // DB States
  const [teamClocks, setTeamClocks] = useState<ClockIn[]>([]);
  const [teamUsers, setTeamUsers] = useState<User[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Form toggles & states
  const [showOpModal, setShowOpModal] = useState<boolean>(false);
  const [opNum, setOpNum] = useState<string>('');
  const [opType, setOpType] = useState<'load' | 'unload'>('load');
  const [opZone, setOpZone] = useState<string>('');
  const [opLoc, setOpLoc] = useState<string>('');
  const [opDate, setOpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [opObs, setOpObs] = useState<string>('');

  const [showWorkModal, setShowWorkModal] = useState<boolean>(false);
  const [workTitle, setWorkTitle] = useState<string>('');
  const [workDesc, setWorkDesc] = useState<string>('');
  const [workPriority, setWorkPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [workDeadline, setWorkDeadline] = useState<string>('');
  const [workAssignee, setWorkAssignee] = useState<string>('unassigned');

  // Answers & Resolution overlays
  const [answeringDoubt, setAnsweringDoubt] = useState<Doubt | null>(null);
  const [doubtResponseText, setDoubtResponseText] = useState<string>('');

  useEffect(() => {
    loadManagerData();
  }, [refreshTrigger]);

  const loadManagerData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const clocks = await dbService.getClockIns();
    // active clocks right now
    setTeamClocks(clocks.filter(c => c.date === today && c.endTime === null));

    const usersList = await dbService.getUsers();
    setTeamUsers(usersList);

    const opsList = await dbService.getOperations();
    setOperations(opsList);

    const worksList = await dbService.getWorks();
    setWorks(worksList);

    const incList = await dbService.getIncidents();
    setIncidents(incList);

    const doubtList = await dbService.getDoubts();
    setDoubts(doubtList);
  };

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  // Create Operation
  const handleCreateOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opNum || !opZone || !opLoc) return;

    const newOp: Operation = {
      id: `op-${Date.now()}`,
      opNumber: opNum,
      type: opType,
      zone: opZone,
      exactLocation: opLoc,
      observations: opObs,
      scheduledDate: opDate,
      status: 'pending',
      assignedTo: null,
      assignedToName: null,
      acceptedTime: null,
      startTime: null,
      endTime: null,
      checklist: null
    };

    await dbService.createOperation(newOp);
    await dbService.addAuditLog(
      'crear_operacion',
      `operations/${newOp.id}`,
      '-',
      JSON.stringify(newOp),
      user.uid,
      user.displayName
    );

    // reset forms
    setOpNum('');
    setOpZone('');
    setOpLoc('');
    setOpObs('');
    setShowOpModal(false);
    triggerRefresh();
  };

  // Create Work
  const handleCreateWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workTitle || !workDeadline) return;

    const codeNum = Math.floor(Math.random() * 9000) + 1000;
    const assignedUser = teamUsers.find(u => u.uid === workAssignee);
    const assignedName = assignedUser ? assignedUser.displayName : 'Sin asignar';

    const newWork: Work = {
      id: `work-${Date.now()}`,
      code: `T-${codeNum}`,
      title: workTitle,
      description: workDesc,
      priority: workPriority,
      assignedTo: workAssignee,
      assignedToName: assignedName,
      createdBy: user.uid,
      createdByName: user.displayName,
      createdAt: new Date().toISOString(),
      deadline: workDeadline,
      status: 'pending'
    };

    await dbService.createWork(newWork);
    await dbService.addAuditLog(
      'crear_trabajo',
      `works/${newWork.id}`,
      '-',
      JSON.stringify(newWork),
      user.uid,
      user.displayName
    );

    setWorkTitle('');
    setWorkDesc('');
    setWorkDeadline('');
    setWorkAssignee('unassigned');
    setShowWorkModal(false);
    triggerRefresh();
  };

  // Resolve Incident
  const handleResolveIncident = async (inc: Incident) => {
    const updatedInc: Incident = {
      ...inc,
      status: 'resolved'
    };
    await dbService.updateIncident(updatedInc);
    await dbService.addAuditLog(
      'resolver_incidencia',
      `incidents/${inc.id}`,
      JSON.stringify(inc),
      JSON.stringify(updatedInc),
      user.uid,
      user.displayName
    );
    triggerRefresh();
  };

  // Answer Doubt Query
  const handleAnswerDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answeringDoubt || !doubtResponseText) return;

    const updatedDoubt: Doubt = {
      ...answeringDoubt,
      reply: doubtResponseText,
      replyBy: user.uid,
      replyByName: user.displayName,
      repliedAt: new Date().toISOString(),
      status: 'answered'
    };

    await dbService.updateDoubt(updatedDoubt);
    await dbService.addAuditLog(
      'responder_duda',
      `doubts/${answeringDoubt.id}`,
      JSON.stringify(answeringDoubt),
      JSON.stringify(updatedDoubt),
      user.uid,
      user.displayName
    );

    setAnsweringDoubt(null);
    setDoubtResponseText('');
    triggerRefresh();
  };

  return (
    <div>
      {/* Sub menu tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('overview')} className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          Vista General
        </button>
        <button onClick={() => setActiveTab('operations')} className={`btn ${activeTab === 'operations' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          Cargas y Descargas
        </button>
        <button onClick={() => setActiveTab('works')} className={`btn ${activeTab === 'works' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          Trabajos / Tareas
        </button>
        <button onClick={() => setActiveTab('incidents')} className={`btn ${activeTab === 'incidents' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          Incidencias ({incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed').length})
        </button>
        <button onClick={() => setActiveTab('doubts')} className={`btn ${activeTab === 'doubts' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          Dudas Pendientes ({doubts.filter(d => d.status === 'pending').length})
        </button>
      </div>

      {/* Tab: Overview (Visor del Responsable) */}
      {activeTab === 'overview' && (
        <div>
          {/* Top statistics cards */}
          <div className="dashboard-grid">
            <div className="stat-card" style={{ borderLeft: '4px solid var(--habilis-blue)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Operarios Activos Fichados</span>
                <Users size={18} />
              </div>
              <div className="stat-value">{teamClocks.length}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>En el turno actual</span>
            </div>
            
            <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Operaciones en Curso</span>
                <Package size={18} />
              </div>
              <div className="stat-value">
                {operations.filter(o => o.status === 'in_progress').length}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                De {operations.filter(o => o.scheduledDate === new Date().toISOString().split('T')[0]).length} planificadas hoy
              </span>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid var(--habilis-red)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Incidencias Abiertas</span>
                <ShieldAlert size={18} />
              </div>
              <div className="stat-value" style={{ color: 'var(--habilis-red)' }}>
                {incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed').length}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Requieren atención</span>
            </div>

            <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Dudas Pendientes</span>
                <MessageSquare size={18} />
              </div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                {doubts.filter(d => d.status === 'pending').length}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>En canal de consultas</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="mobile-stack-layout">
            
            {/* Clocked in team list */}
            <div className="card-habilis">
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--habilis-blue)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Operarios Fichados Hoy
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {teamClocks.length > 0 ? (
                  teamClocks.map((clock) => {
                    const u = teamUsers.find(user => user.uid === clock.userId);
                    return (
                      <div key={clock.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img src={u?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'} alt={clock.userName} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{clock.userName}</span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Inicio: {new Date(clock.startTime).toLocaleTimeString()}</div>
                          </div>
                        </div>
                        <span className="badge badge-success">En jornada</span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No hay trabajadores fichados en este momento.
                  </div>
                )}
              </div>
            </div>

            {/* Operations in course list */}
            <div className="card-habilis">
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--habilis-blue)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Cargas y Descargas Activas
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {operations.filter(o => o.status === 'in_progress' || o.status === 'assigned').length > 0 ? (
                  operations.filter(o => o.status === 'in_progress' || o.status === 'assigned').map((op) => (
                    <div key={op.id} style={{ padding: '0.75rem 1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{op.opNumber} - {op.type === 'load' ? 'Carga' : 'Descarga'}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Asignado a: <strong>{op.assignedToName}</strong></div>
                      </div>
                      <span className={`badge ${op.status === 'in_progress' ? 'badge-warning' : 'badge-info'}`}>
                        {op.status === 'in_progress' ? 'En Curso' : 'Asignada'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No hay operaciones activas de carga o descarga.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab: Operations (Create and view operations) */}
      {activeTab === 'operations' && (
        <div className="card-habilis">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Operaciones de Carga y Descarga</h2>
            <button onClick={() => setShowOpModal(true)} className="btn btn-primary" style={{ gap: '0.5rem' }}>
              <Plus size={18} />
              Crear Operación
            </button>
          </div>

          <div className="table-container">
            <table className="habilis-table">
              <thead>
                <tr>
                  <th>Nº Op</th>
                  <th>Tipo</th>
                  <th>Zona de Carga/Descarga</th>
                  <th>Ubicación exacta</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Operario asignado</th>
                  <th>Detalle Checklist</th>
                </tr>
              </thead>
              <tbody>
                {operations.map((op) => (
                  <tr key={op.id}>
                    <td style={{ fontWeight: 700 }}>{op.opNumber}</td>
                    <td>
                      <span className={`badge ${op.type === 'load' ? 'badge-success' : 'badge-warning'}`}>
                        {op.type === 'load' ? 'Carga' : 'Descarga'}
                      </span>
                    </td>
                    <td>{op.zone}</td>
                    <td>{op.exactLocation}</td>
                    <td>{new Date(op.scheduledDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${
                        op.status === 'completed' ? 'badge-success' :
                        op.status === 'in_progress' ? 'badge-warning' :
                        op.status === 'assigned' ? 'badge-info' : 'badge-secondary'
                      }`}>{op.status}</span>
                    </td>
                    <td>{op.assignedToName || <span style={{ color: 'var(--text-muted)' }}>Sin asignar</span>}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {op.checklist ? (
                        <div>
                          <span>Camión: {op.checklist.truckStatus === 'correct' ? '✓' : '✗'}, </span>
                          <span>Carga: {op.checklist.cargoStatus === 'correct' ? '✓' : '✗'} </span>
                          {op.checklist.photos.length > 0 && <span style={{ color: 'var(--habilis-blue)', fontWeight: 600 }}>({op.checklist.photos.length} Fotos)</span>}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>No cerrado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Works (Create and assign tasks) */}
      {activeTab === 'works' && (
        <div className="card-habilis">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Gestión de Trabajos y Tareas</h2>
            <button onClick={() => setShowWorkModal(true)} className="btn btn-primary" style={{ gap: '0.5rem' }}>
              <Plus size={18} />
              Crear y Asignar Trabajo
            </button>
          </div>

          <div className="table-container">
            <table className="habilis-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Título</th>
                  <th>Prioridad</th>
                  <th>Asignado A</th>
                  <th>Fecha Límite</th>
                  <th>Estado</th>
                  <th>Creador</th>
                </tr>
              </thead>
              <tbody>
                {works.map((work) => (
                  <tr key={work.id}>
                    <td style={{ fontWeight: 700 }}>{work.code}</td>
                    <td>
                      <div>
                        <strong>{work.title}</strong>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{work.description}</p>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        work.priority === 'high' ? 'badge-danger' :
                        work.priority === 'medium' ? 'badge-warning' : 'badge-primary'
                      }`}>{work.priority}</span>
                    </td>
                    <td>{work.assignedToName}</td>
                    <td>{new Date(work.deadline).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${
                        work.status === 'completed' ? 'badge-success' :
                        work.status === 'in_progress' ? 'badge-warning' : 'badge-secondary'
                      }`}>{work.status}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{work.createdByName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Incidents (Resolve reports) */}
      {activeTab === 'incidents' && (
        <div className="card-habilis">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Gestión de Incidencias y Roturas</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {incidents.map((inc) => (
              <div key={inc.id} className="card-habilis" style={{ margin: 0, padding: '1.25rem', background: 'var(--bg-app)', borderLeft: `4px solid ${inc.status === 'resolved' ? 'var(--success)' : 'var(--habilis-red)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                  <span className="badge badge-danger">{inc.category.replace('_', ' ')}</span>
                  <span className={`badge ${inc.status === 'resolved' ? 'badge-success' : 'badge-warning'}`}>{inc.status}</span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  {inc.photos.length > 0 && (
                    <img src={inc.photos[0]} alt="Incidencia" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  )}
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reportado por: <strong>{inc.userName}</strong></span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{inc.description}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>{inc.relatedOp ? `Op: ${inc.relatedOp}` : 'No vinculada'}</span>
                  <span>{new Date(inc.createdAt).toLocaleDateString()}</span>
                </div>

                {inc.status !== 'resolved' && (
                  <button onClick={() => handleResolveIncident(inc)} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--success)' }}>
                    Marcar como Resuelta
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Doubts (Answering doubts) */}
      {activeTab === 'doubts' && (
        <div className="card-habilis">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Consultas del Canal de Dudas</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {doubts.map((d) => (
              <div key={d.id} className="card-habilis" style={{ margin: 0, padding: '1.25rem', background: 'var(--bg-app)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="badge badge-info">{d.category}</span>
                  <span className={`badge ${d.status === 'answered' ? 'badge-success' : 'badge-warning'}`}>{d.status}</span>
                </div>

                <div style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                  <strong>{d.userName} pregunta:</strong> "{d.query}"
                </div>

                {d.reply ? (
                  <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderLeft: '3px solid var(--habilis-blue)', borderRadius: '4px', fontSize: '0.85rem' }}>
                    <strong>Respuesta de {d.replyByName}:</strong> {d.reply}
                  </div>
                ) : (
                  <div>
                    <button onClick={() => setAnsweringDoubt(d)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                      Responder Consulta
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals for Create Ops */}
      {showOpModal && (
        <div className="modal-overlay" onClick={() => setShowOpModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--habilis-blue)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Registrar Nueva Operación Logística
            </h2>
            <form onSubmit={handleCreateOperation} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="opNum">Número de Operación (Código)</label>
                  <input
                    id="opNum"
                    type="text"
                    className="form-input"
                    placeholder="Ej. OP-5004"
                    value={opNum}
                    onChange={(e) => setOpNum(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="opType">Tipo de Operación</label>
                  <select
                    id="opType"
                    className="form-input"
                    value={opType}
                    onChange={(e) => setOpType(e.target.value as 'load' | 'unload')}
                  >
                    <option value="load">Carga</option>
                    <option value="unload">Descarga</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="opZone">Zona de Operación</label>
                  <input
                    id="opZone"
                    type="text"
                    className="form-input"
                    placeholder="Ej. Muelle 3 Exterior"
                    value={opZone}
                    onChange={(e) => setOpZone(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="opLoc">Ubicación Exacta de Mercancía</label>
                  <input
                    id="opLoc"
                    type="text"
                    className="form-input"
                    placeholder="Ej. Pasillo D-05"
                    value={opLoc}
                    onChange={(e) => setOpLoc(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="opDate">Fecha Programada</label>
                <input
                  id="opDate"
                  type="date"
                  className="form-input"
                  value={opDate}
                  onChange={(e) => setOpDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="opObs">Observaciones</label>
                <textarea
                  id="opObs"
                  className="form-input"
                  rows={2}
                  placeholder="Detalles sobre el transporte, mercancía especial..."
                  value={opObs}
                  onChange={(e) => setOpObs(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowOpModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Crear Operación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Create Work (Task) */}
      {showWorkModal && (
        <div className="modal-overlay" onClick={() => setShowWorkModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--habilis-blue)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Crear y Asignar Trabajo
            </h2>
            <form onSubmit={handleCreateWork} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="workTitle">Título del Trabajo</label>
                <input
                  id="workTitle"
                  type="text"
                  className="form-input"
                  placeholder="Ej. Limpieza general muelle norte"
                  value={workTitle}
                  onChange={(e) => setWorkTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="workDesc">Descripción</label>
                <textarea
                  id="workDesc"
                  className="form-input"
                  rows={3}
                  placeholder="Escriba los detalles y requerimientos de la tarea..."
                  value={workDesc}
                  onChange={(e) => setWorkDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="workPriority">Prioridad</label>
                  <select
                    id="workPriority"
                    className="form-input"
                    value={workPriority}
                    onChange={(e) => setWorkPriority(e.target.value as any)}
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="workDeadline">Fecha Límite</label>
                  <input
                    id="workDeadline"
                    type="date"
                    className="form-input"
                    value={workDeadline}
                    onChange={(e) => setWorkDeadline(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="workAssignee">Asignar Operario</label>
                <select
                  id="workAssignee"
                  className="form-input"
                  value={workAssignee}
                  onChange={(e) => setWorkAssignee(e.target.value)}
                >
                  <option value="unassigned">Sin Asignar</option>
                  {teamUsers.filter(u => u.role === 'worker').map((u) => (
                    <option key={u.uid} value={u.uid}>{u.displayName} ({u.team || 'Sin turno'})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowWorkModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Crear y Asignar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doubt Answer Modal */}
      {answeringDoubt && (
        <div className="modal-overlay" onClick={() => setAnsweringDoubt(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--habilis-blue)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Responder Consulta del Canal de Dudas
            </h2>
            <div style={{ background: 'var(--bg-app)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              <strong>Pregunta de {answeringDoubt.userName}:</strong> "{answeringDoubt.query}"
            </div>
            <form onSubmit={handleAnswerDoubt} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="replyText">Escriba su respuesta</label>
                <textarea
                  id="replyText"
                  className="form-input"
                  rows={4}
                  placeholder="Escriba la respuesta oficial para resolver la duda del operario..."
                  value={doubtResponseText}
                  onChange={(e) => setDoubtResponseText(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setAnsweringDoubt(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Enviar Respuesta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
