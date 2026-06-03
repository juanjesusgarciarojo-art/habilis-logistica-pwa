import React, { useState } from 'react';
import type { Checklist, ChecklistPhoto, Operation, User } from '../types';
import { Camera, AlertCircle, Check, X } from 'lucide-react';

interface ChecklistModalProps {
  operation: Operation;
  user: User;
  onClose: () => void;
  onComplete: (checklist: Checklist) => void;
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({
  operation,
  user,
  onClose,
  onComplete
}) => {
  const [truckStatus, setTruckStatus] = useState<'correct' | 'defective'>('correct');
  const [cargoStatus, setCargoStatus] = useState<'correct' | 'damaged'>('correct');
  const [observations, setObservations] = useState<string>('');
  const [photos, setPhotos] = useState<ChecklistPhoto[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setErrorMsg('');

    // Process uploaded images into Base64 URLs for persistent local storage mock
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result as string;
        const newPhoto: ChecklistPhoto = {
          url: base64Url,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user.displayName,
          evidenceType: 'cargo_condition'
        };
        setPhotos(prev => [...prev, newPhoto]);
        setUploading(false);
      };
      reader.onerror = () => {
        setErrorMsg('Error al procesar la imagen.');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // EXPLICIT REQUIREMENT: Fotos obligatorias. El sistema no debe permitir cerrar la operación sin fotos.
    if (photos.length === 0) {
      setErrorMsg('ATENCIÓN: Debe adjuntar al menos una fotografía de evidencia para poder finalizar la operación.');
      return;
    }

    const checklistData: Checklist = {
      truckStatus,
      cargoStatus,
      observations,
      photos,
      completedAt: new Date().toISOString(),
      completedBy: user.displayName
    };

    onComplete(checklistData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--habilis-blue)' }}>Checklist de Operación</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Operación: <strong>{operation.opNumber}</strong> ({operation.type === 'load' ? 'Carga' : 'Descarga'})</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {errorMsg && (
            <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Estado del Camión */}
          <div className="form-group">
            <label className="form-label">1. Estado del Camión</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem 1.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', flex: 1, background: truckStatus === 'correct' ? 'rgba(16, 185, 129, 0.08)' : 'transparent', borderColor: truckStatus === 'correct' ? 'var(--success)' : 'var(--border-color)' }}>
                <input
                  type="radio"
                  name="truckStatus"
                  checked={truckStatus === 'correct'}
                  onChange={() => setTruckStatus('correct')}
                  style={{ accentColor: 'var(--success)' }}
                />
                <span>Correcto</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem 1.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', flex: 1, background: truckStatus === 'defective' ? 'rgba(239, 68, 68, 0.08)' : 'transparent', borderColor: truckStatus === 'defective' ? 'var(--danger)' : 'var(--border-color)' }}>
                <input
                  type="radio"
                  name="truckStatus"
                  checked={truckStatus === 'defective'}
                  onChange={() => setTruckStatus('defective')}
                  style={{ accentColor: 'var(--danger)' }}
                />
                <span style={{ color: truckStatus === 'defective' ? 'var(--danger)' : 'inherit' }}>Con Defectos</span>
              </label>
            </div>
          </div>

          {/* Estado de la Mercancía */}
          <div className="form-group">
            <label className="form-label">2. Estado de la Mercancía</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem 1.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', flex: 1, background: cargoStatus === 'correct' ? 'rgba(16, 185, 129, 0.08)' : 'transparent', borderColor: cargoStatus === 'correct' ? 'var(--success)' : 'var(--border-color)' }}>
                <input
                  type="radio"
                  name="cargoStatus"
                  checked={cargoStatus === 'correct'}
                  onChange={() => setCargoStatus('correct')}
                  style={{ accentColor: 'var(--success)' }}
                />
                <span>Correcta</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem 1.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', flex: 1, background: cargoStatus === 'damaged' ? 'rgba(239, 68, 68, 0.08)' : 'transparent', borderColor: cargoStatus === 'damaged' ? 'var(--danger)' : 'var(--border-color)' }}>
                <input
                  type="radio"
                  name="cargoStatus"
                  checked={cargoStatus === 'damaged'}
                  onChange={() => setCargoStatus('damaged')}
                  style={{ accentColor: 'var(--danger)' }}
                />
                <span style={{ color: cargoStatus === 'damaged' ? 'var(--danger)' : 'inherit' }}>Dañada</span>
              </label>
            </div>
          </div>

          {/* Observaciones */}
          <div className="form-group">
            <label className="form-label" htmlFor="observations">3. Observaciones (Opcional)</label>
            <textarea
              id="observations"
              className="form-input"
              rows={3}
              placeholder="Detalle el estado, incidencias leves o información relevante sobre la carga..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Fotografías (Obligatorias) */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>4. Evidencias Fotográficas <span style={{ color: 'var(--habilis-red)' }}>*</span></span>
              <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Obligatorio</span>
            </label>

            <div style={{ marginTop: '0.5rem' }}>
              <label className="file-upload-zone">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                <Camera size={28} style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Cargar Fotos del Proceso</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Captura directa con móvil o sube archivos</span>
              </label>

              {photos.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Fotos adjuntadas ({photos.length}):</span>
                  <div className="photos-preview-grid">
                    {photos.map((photo, idx) => (
                      <div key={idx} className="photo-preview-item">
                        <img src={photo.url} className="photo-preview-image" alt={`Evidencia ${idx + 1}`} />
                        <button
                          type="button"
                          className="photo-preview-remove"
                          onClick={() => handleRemovePhoto(idx)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, gap: '0.5rem' }} disabled={uploading}>
              <Check size={18} />
              {uploading ? 'Procesando...' : 'Finalizar Operación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
