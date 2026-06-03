import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import type { ClockIn, VacationRequest, User } from '../types';
import { Calendar, Briefcase, Award, AlertTriangle, Moon } from 'lucide-react';

interface AnnualCalendarProps {
  user: User;
  refreshTrigger: number;
}

// 2026 Spanish National Holidays
const HOLIDAYS_2026 = [
  '2026-01-01', // Año Nuevo
  '2026-01-06', // Epifanía del Señor
  '2026-04-02', // Jueves Santo
  '2026-04-03', // Viernes Santo
  '2026-05-01', // Fiesta del Trabajo
  '2026-08-15', // Asunción de la Virgen
  '2026-10-12', // Fiesta Nacional de España
  '2026-11-01', // Todos los Santos
  '2026-12-06', // Día de la Constitución
  '2026-12-08', // Inmaculada Concepción
  '2026-12-25'  // Natividad del Señor
];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

export const AnnualCalendar: React.FC<AnnualCalendarProps> = ({ user, refreshTrigger }) => {
  const [clockIns, setClockIns] = useState<ClockIn[]>([]);
  const [vacations, setVacations] = useState<VacationRequest[]>([]);
  const [year, setYear] = useState<number>(2026);
  const [selectedDayInfo, setSelectedDayInfo] = useState<any | null>(null);

  useEffect(() => {
    loadCalendarData();
  }, [user.uid, refreshTrigger, year]);

  const loadCalendarData = async () => {
    const clocks = await dbService.getClockIns(user.uid);
    const vacs = await dbService.getVacations(user.uid);
    setClockIns(clocks.filter(c => new Date(c.date).getFullYear() === year));
    setVacations(vacs.filter(v => v.status === 'approved' && (
      new Date(v.startDate).getFullYear() === year || new Date(v.endDate).getFullYear() === year
    )));
  };

  // Helper to determine the style and data of a specific day
  const getDayStatus = (dateStr: string) => {
    const isHoliday = HOLIDAYS_2026.includes(dateStr);
    
    // Check vacation/permit
    const approvedVac = vacations.find(v => {
      const start = new Date(v.startDate + 'T00:00:00');
      const end = new Date(v.endDate + 'T00:00:00');
      const curr = new Date(dateStr + 'T00:00:00');
      return curr >= start && curr <= end;
    });

    // Check clock in
    const clock = clockIns.find(c => c.date === dateStr);

    if (clock) {
      if (clock.endTime === null) {
        return {
          class: 'day-incomplete',
          text: 'Fichado (En curso)',
          hours: clock.hoursWorked,
          extra: 0,
          pending: 0,
          clock
        };
      }
      const isComplete = clock.hoursWorked >= 8;
      return {
        class: isComplete ? 'day-full' : 'day-incomplete',
        text: isComplete ? 'Jornada Completa' : 'Jornada Incompleta',
        hours: clock.hoursWorked,
        extra: clock.hoursExtra,
        pending: clock.hoursPending,
        clock
      };
    }

    if (approvedVac) {
      if (approvedVac.type === 'vacation') {
        return { class: 'day-vacation', text: 'Vacaciones', hours: 0, extra: 0, pending: 0, vacation: approvedVac };
      } else {
        return { class: 'day-permit', text: 'Permiso/Licencia', hours: 0, extra: 0, pending: 0, vacation: approvedVac };
      }
    }

    if (isHoliday) {
      return { class: 'day-holiday', text: 'Festivo', hours: 0, extra: 0, pending: 0 };
    }

    // Default weekday or weekend
    const d = new Date(dateStr);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return {
      class: isWeekend ? 'day-weekend' : 'day-empty',
      text: isWeekend ? 'Fin de semana' : 'DíaLaborable',
      hours: 0,
      extra: 0,
      pending: 0
    };
  };

  // Generate days grid for a specific month
  const renderMonthDays = (monthIdx: number) => {
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    // Day of the week of the first day (0 = Sunday, 1 = Monday, etc.)
    // We adjust to Monday-indexed: Monday = 0, Sunday = 6
    let firstDayIdx = new Date(year, monthIdx, 1).getDay();
    firstDayIdx = firstDayIdx === 0 ? 6 : firstDayIdx - 1;

    const cells: React.ReactNode[] = [];

    // Fill preceding empty spaces
    for (let i = 0; i < firstDayIdx; i++) {
      cells.push(<div key={`empty-prev-${i}`} className="calendar-cell day-empty"></div>);
    }

    // Render month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const status = getDayStatus(dateStr);
      
      cells.push(
        <div
          key={`day-${day}`}
          className={`calendar-cell ${status.class}`}
          onClick={() => setSelectedDayInfo({ date: dateStr, ...status })}
        >
          <span>{day}</span>
          {status.extra > 0 && (
            <span className="hour-indicator" style={{ color: 'var(--success)' }}>+{status.extra}</span>
          )}
          {status.pending > 0 && (
            <span className="hour-indicator" style={{ color: 'var(--danger)' }}>-{status.pending}</span>
          )}
        </div>
      );
    }

    return cells;
  };

  // Compute accumulated totals for the entire year
  const totals = clockIns.reduce((acc, curr) => {
    acc.hoursWorked += curr.hoursWorked;
    acc.hoursExtra += curr.hoursExtra;
    acc.hoursPending += curr.hoursPending;
    acc.daysWorked += curr.endTime ? 1 : 0;
    return acc;
  }, { hoursWorked: 0, hoursExtra: 0, hoursPending: 0, daysWorked: 0 });

  // Calculate vacation and permit days
  const vacationDaysCount = vacations.filter(v => v.type === 'vacation').reduce((acc, curr) => {
    const start = new Date(curr.startDate);
    const end = new Date(curr.endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return acc + diff;
  }, 0);

  const permitDaysCount = vacations.filter(v => v.type === 'permit').reduce((acc, curr) => {
    const start = new Date(curr.startDate);
    const end = new Date(curr.endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return acc + diff;
  }, 0);

  return (
    <div className="card-habilis">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={22} className="text-secondary" />
          <h2 style={{ fontSize: '1.4rem' }}>Calendario Anual ({year})</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setYear(year - 1)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
            Año Anterior
          </button>
          <button onClick={() => setYear(year + 1)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
            Año Siguiente
          </button>
        </div>
      </div>

      {/* Corporate Color Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '0.75rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.8rem', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(16, 185, 129, 0.2)', border: '1.5px solid #10b981' }}></div>
          <span>Jornada Completa</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(239, 68, 68, 0.2)', border: '1.5px solid #ef4444' }}></div>
          <span>Incompleta / En curso</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(0, 96, 159, 0.2)', border: '1.5px solid var(--habilis-blue)' }}></div>
          <span>Vacaciones</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(139, 92, 246, 0.2)', border: '1.5px solid #8b5cf6' }}></div>
          <span>Licencias / Permisos</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(245, 158, 11, 0.2)', border: '1.5px solid #f59e0b' }}></div>
          <span>Festivo</span>
        </div>
      </div>

      {/* Annual Summary Indicators */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Horas Acumuladas</span>
            <Briefcase size={16} />
          </div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{totals.hoursWorked.toFixed(1)}h</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>En {totals.daysWorked} días trabajados</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--habilis-blue)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Horas Extra (+h)</span>
            <Award size={16} />
          </div>
          <div className="stat-value" style={{ color: 'var(--habilis-blue)' }}>+{totals.hoursExtra.toFixed(1)}h</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Registradas en el año</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--habilis-red)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Horas Pendientes (-h)</span>
            <AlertTriangle size={16} />
          </div>
          <div className="stat-value" style={{ color: 'var(--habilis-red)' }}>-{totals.hoursPending.toFixed(1)}h</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Diferencia respecto a convenio</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Vacaciones / Permisos</span>
            <Moon size={16} />
          </div>
          <div className="stat-value" style={{ color: '#8b5cf6' }}>{vacationDaysCount + permitDaysCount}d</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {vacationDaysCount} Vac. / {permitDaysCount} Perm.
          </span>
        </div>
      </div>

      {/* 12-Month Calendar Grid */}
      <div className="calendar-year-grid">
        {MONTH_NAMES.map((monthName, idx) => (
          <div key={idx} className="calendar-month-box">
            <h3 className="calendar-month-title">{monthName}</h3>
            <div className="calendar-days-header">
              {DAY_NAMES_SHORT.map((dayName, dIdx) => (
                <div key={dIdx}>{dayName}</div>
              ))}
            </div>
            <div className="calendar-grid-cells">
              {renderMonthDays(idx)}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Day Info Modal */}
      {selectedDayInfo && (
        <div className="modal-overlay" onClick={() => setSelectedDayInfo(null)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', color: 'var(--habilis-blue)' }}>
              <span>Detalles del Día</span>
              <span>{new Date(selectedDayInfo.date).toLocaleDateString('es-ES')}</span>
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div><strong>Estado:</strong> <span className={`badge badge-${
                selectedDayInfo.class === 'day-full' ? 'success' :
                selectedDayInfo.class === 'day-incomplete' ? 'danger' :
                selectedDayInfo.class === 'day-vacation' ? 'primary' :
                selectedDayInfo.class === 'day-permit' ? 'purple' :
                selectedDayInfo.class === 'day-holiday' ? 'warning' : 'secondary'
              }`}>{selectedDayInfo.text}</span></div>

              {selectedDayInfo.clock && (
                <>
                  <div><strong>Entrada:</strong> {new Date(selectedDayInfo.clock.startTime).toLocaleTimeString('es-ES')}</div>
                  <div>
                    <strong>Salida:</strong>{' '}
                    {selectedDayInfo.clock.endTime 
                      ? new Date(selectedDayInfo.clock.endTime).toLocaleTimeString('es-ES') 
                      : 'Jornada activa'}
                  </div>
                  <div><strong>Horas Trabajadas:</strong> {selectedDayInfo.clock.hoursWorked}h</div>
                  <div><strong>Dispositivo:</strong> {selectedDayInfo.clock.device}</div>
                  {selectedDayInfo.clock.location && (
                    <div>
                      <strong>Ubicación GPS:</strong> {selectedDayInfo.clock.location.latitude.toFixed(5)}, {selectedDayInfo.clock.location.longitude.toFixed(5)}
                    </div>
                  )}
                  {selectedDayInfo.extra > 0 && (
                    <div style={{ color: 'var(--success)' }}><strong>Horas Extra:</strong> +{selectedDayInfo.extra}h</div>
                  )}
                  {selectedDayInfo.pending > 0 && (
                    <div style={{ color: 'var(--danger)' }}><strong>Horas Pendientes:</strong> -{selectedDayInfo.pending}h</div>
                  )}
                </>
              )}

              {selectedDayInfo.vacation && (
                <>
                  <div><strong>Tipo:</strong> {selectedDayInfo.vacation.type === 'vacation' ? 'Vacaciones' : 'Permiso'}</div>
                  <div><strong>Comentarios del Aprobador:</strong> {selectedDayInfo.vacation.comments || 'Ninguno'}</div>
                </>
              )}

              {!selectedDayInfo.clock && !selectedDayInfo.vacation && !HOLIDAYS_2026.includes(selectedDayInfo.date) && (
                <div>No se registra actividad o fichajes para este día.</div>
              )}
            </div>

            <button onClick={() => setSelectedDayInfo(null)} className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
