import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings, initFirebase } from '../services/db';
import { resetMockDatabase } from '../services/mockData';
import { Settings, Save, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import type { AppSettings } from '../types';

interface SettingsPanelProps {
  onSettingsSaved: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onSettingsSaved }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [authDomain, setAuthDomain] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [storageBucket, setStorageBucket] = useState<string>('');
  const [messagingSenderId, setMessagingSenderId] = useState<string>('');
  const [appId, setAppId] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const active = getSettings();
    setSettings(active);
    if (active.firebaseConfig) {
      setApiKey(active.firebaseConfig.apiKey || '');
      setAuthDomain(active.firebaseConfig.authDomain || '');
      setProjectId(active.firebaseConfig.projectId || '');
      setStorageBucket(active.firebaseConfig.storageBucket || '');
      setMessagingSenderId(active.firebaseConfig.messagingSenderId || '');
      setAppId(active.firebaseConfig.appId || '');
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    let config = null;
    if (!settings.isDemoMode) {
      // Validate configuration inputs if turning off demo mode
      if (!apiKey || !projectId || !appId) {
        setFeedback({
          type: 'error',
          message: 'Debe rellenar al menos API Key, Project ID y App ID para conectar a Firebase.'
        });
        return;
      }
      config = { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };
      
      // Attempt Firebase connection
      const success = await initFirebase(config);
      if (!success) {
        setFeedback({
          type: 'error',
          message: 'No se pudo inicializar Firebase con los datos facilitados. Verifique la consola de desarrollo.'
        });
        return;
      }
    }

    const updatedSettings: AppSettings = {
      ...settings,
      firebaseConfig: config
    };

    saveSettings(updatedSettings);
    setFeedback({
      type: 'success',
      message: 'Configuración guardada correctamente. Cambios aplicados.'
    });
    onSettingsSaved();
  };

  const handleResetDb = () => {
    if (window.confirm('¿Está seguro de que desea restablecer la base de datos de demostración? Se perderán todos los cambios locales y se cargarán los registros de ejemplo originales.')) {
      resetMockDatabase();
      setFeedback({
        type: 'success',
        message: 'Base de datos de demostración restablecida con éxito. Recargue para visualizar los cambios.'
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  if (!settings) return <div>Cargando ajustes...</div>;

  return (
    <div className="card-habilis">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Settings size={22} className="text-secondary" />
        <h2 style={{ fontSize: '1.4rem' }}>Configuración del Sistema</h2>
      </div>

      {feedback && (
        <div style={{ padding: '0.75rem', background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: feedback.type === 'success' ? 'var(--success)' : 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Toggle Mode */}
        <div className="form-group" style={{ padding: '1rem', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div>
              <span style={{ fontWeight: 600 }}>Activar Modo Demostración (Demo)</span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '0.25rem' }}>
                Simula servicios de Firebase utilizando el almacenamiento del navegador (localStorage). Ideal para pruebas inmediatas.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.isDemoMode}
              onChange={(e) => setSettings({ ...settings, isDemoMode: e.target.checked })}
              style={{ width: '22px', height: '22px', accentColor: 'var(--habilis-blue)' }}
            />
          </label>
        </div>

        {/* Workday Config */}
        <div className="form-group">
          <label className="form-label" htmlFor="workdayHours">Horas de Jornada de Convenio (Estándar)</label>
          <input
            id="workdayHours"
            type="number"
            className="form-input"
            min={4}
            max={12}
            value={settings.workdayHours}
            onChange={(e) => setSettings({ ...settings, workdayHours: parseInt(e.target.value) || 8 })}
            style={{ maxWidth: '120px' }}
          />
        </div>

        {/* Firebase Config Block */}
        {!settings.isDemoMode && (
          <div style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--habilis-blue)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Credenciales Firebase Web SDK
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="apiKey">API Key</label>
                <input
                  id="apiKey"
                  type="password"
                  className="form-input"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="projectId">Project ID</label>
                <input
                  id="projectId"
                  type="text"
                  className="form-input"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="habilis-logistica-app"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="authDomain">Auth Domain (Opcional)</label>
                <input
                  id="authDomain"
                  type="text"
                  className="form-input"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  placeholder="habilis-logistica-app.firebaseapp.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="storageBucket">Storage Bucket (Opcional)</label>
                <input
                  id="storageBucket"
                  type="text"
                  className="form-input"
                  value={storageBucket}
                  onChange={(e) => setStorageBucket(e.target.value)}
                  placeholder="habilis-logistica-app.appspot.com"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="messagingSenderId">Messaging Sender ID</label>
                <input
                  id="messagingSenderId"
                  type="text"
                  className="form-input"
                  value={messagingSenderId}
                  onChange={(e) => setMessagingSenderId(e.target.value)}
                  placeholder="7482017..."
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="appId">App ID</label>
                <input
                  id="appId"
                  type="text"
                  className="form-input"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1:7482017:web:9ad..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1rem' }}>
          <button type="submit" className="btn btn-primary" style={{ gap: '0.5rem' }}>
            <Save size={18} />
            Guardar Cambios
          </button>

          <button type="button" onClick={handleResetDb} className="btn btn-secondary" style={{ marginLeft: 'auto', gap: '0.5rem', color: 'var(--habilis-red)' }}>
            <RefreshCw size={18} />
            Restablecer Demo DB
          </button>
        </div>
      </form>
    </div>
  );
};
