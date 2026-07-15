import React, { useState, useEffect } from 'react';
import type { AuditLog } from '../types';
import { dbService } from '../services/db';
import { exportUtils } from '../utils/exportUtils';
import { ClipboardList, Search, Download } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterText, setFilterText] = useState<string>('');
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const auditData = await dbService.getAuditLogs();
    setLogs(auditData);
    setFilteredLogs(auditData);
  };

  useEffect(() => {
    const text = filterText.toLowerCase();
    const filtered = logs.filter(log => 
      log.userName.toLowerCase().includes(text) ||
      log.action.toLowerCase().includes(text) ||
      log.affectedRecord.toLowerCase().includes(text) ||
      log.newValue.toLowerCase().includes(text)
    );
    setFilteredLogs(filtered);
  }, [filterText, logs]);

  const handleExport = (type: 'excel' | 'csv' | 'pdf') => {
    const dataToExport = filteredLogs.map(l => ({
      ID: l.id,
      Usuario: l.userName,
      Accion: l.action.toUpperCase(),
      Registro: l.affectedRecord,
      Fecha: new Date(l.createdAt).toLocaleString('es-ES'),
      'Valor Anterior': l.oldValue,
      'Valor Nuevo': l.newValue
    }));

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `auditoria_habilis_${dateStr}`;

    if (type === 'excel') {
      exportUtils.exportToExcel(dataToExport, fileName, 'Auditoría');
    } else if (type === 'csv') {
      exportUtils.exportToCSV(dataToExport, fileName);
    } else {
      const headers = ['Usuario', 'Acción', 'Registro', 'Fecha', 'Detalle/Nuevo Valor'];
      const rows = filteredLogs.map(l => [
        l.userName,
        l.action.toUpperCase(),
        l.affectedRecord,
        new Date(l.createdAt).toLocaleDateString('es-ES') + ' ' + new Date(l.createdAt).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'}),
        l.newValue.length > 50 ? l.newValue.substring(0, 50) + '...' : l.newValue
      ]);
      exportUtils.exportToPDF('Registro de Auditoría de Sistemas Habilis', headers, rows, fileName);
    }
  };

  return (
    <div className="card-habilis">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ClipboardList size={22} className="text-secondary" />
          <h2 style={{ fontSize: '1.4rem' }}>Trazabilidad e Informes de Auditoría</h2>
        </div>
        
        {/* Export Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => handleExport('excel')} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', gap: '0.25rem' }}>
            <Download size={14} /> Excel
          </button>
          <button onClick={() => handleExport('csv')} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', gap: '0.25rem' }}>
            <Download size={14} /> CSV
          </button>
          <button onClick={() => handleExport('pdf')} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', gap: '0.25rem' }}>
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', position: 'relative', marginBottom: '1.25rem' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="form-input"
          placeholder="Buscar auditorías por operario, acción, o valor..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{ paddingLeft: '2.5rem' }}
        />
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="habilis-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Registro Afectado</th>
              <th>Fecha y Hora</th>
              <th>Detalle del Cambio</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.slice(0, 100).map((log) => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 600 }}>{log.userName}</td>
                  <td>
                    <span className={`badge ${
                      log.action.includes('fichaje') || log.action.includes('jornada') ? 'badge-success' :
                      log.action.includes('incidencia') ? 'badge-danger' :
                      log.action.includes('vacaciones') ? 'badge-primary' : 'badge-info'
                    }`}>
                      {log.action.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {log.affectedRecord}
                  </td>
                  <td>
                    {new Date(log.createdAt).toLocaleDateString('es-ES')} a las {new Date(log.createdAt).toLocaleTimeString('es-ES')}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.newValue}>
                    {log.newValue}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No se encontraron registros de auditoría.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
        Mostrando los últimos {Math.min(100, filteredLogs.length)} registros de trazabilidad
      </div>
    </div>
  );
};
