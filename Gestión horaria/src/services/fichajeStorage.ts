import { Trabajador, Fichaje, TipoFichaje } from '../types';
import { TRABAJADORES_INICIALES } from './mockData';
import { db, isFirebaseConfigured } from './firebase';
import { collection, doc, getDocs, setDoc, addDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

const LOCAL_STORAGE_WORKERS = 'habilis_gh_trabajadores';
const LOCAL_STORAGE_FICHAJES = 'habilis_gh_fichajes';

/**
 * Obtiene la lista de trabajadores activos
 */
export async function getTrabajadores(): Promise<Trabajador[]> {
  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, 'trabajadores');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as Trabajador);
      }
    } catch (e) {
      console.warn('Error leyendo de Firebase, usando fallback local:', e);
    }
  }

  // Fallback LocalStorage
  const saved = localStorage.getItem(LOCAL_STORAGE_WORKERS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }

  // Si no hay nada, guardar los iniciales
  localStorage.setItem(LOCAL_STORAGE_WORKERS, JSON.stringify(TRABAJADORES_INICIALES));
  return TRABAJADORES_INICIALES;
}

/**
 * Guarda o actualiza un trabajador (ej. cuando se bloquea o cambian intentos)
 */
export async function saveTrabajador(trabajador: Trabajador): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'trabajadores', trabajador.numeroTrabajador);
      await setDoc(docRef, trabajador, { merge: true });
    } catch (e) {
      console.warn('Error guardando en Firebase:', e);
    }
  }

  const trabajadores = await getTrabajadores();
  const index = trabajadores.findIndex(t => t.numeroTrabajador === trabajador.numeroTrabajador);
  if (index >= 0) {
    trabajadores[index] = trabajador;
  } else {
    trabajadores.push(trabajador);
  }
  localStorage.setItem(LOCAL_STORAGE_WORKERS, JSON.stringify(trabajadores));
}

/**
 * Obtiene los fichajes del día actual
 */
export async function getFichajesHoy(): Promise<Fichaje[]> {
  const hoyStr = new Date().toISOString().split('T')[0];

  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, 'fichajes');
      const q = query(colRef, where('fechaStr', '==', hoyStr), orderBy('timestamp', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Fichaje));
    } catch (e) {
      console.warn('Error leyendo fichajes de Firebase:', e);
    }
  }

  const saved = localStorage.getItem(LOCAL_STORAGE_FICHAJES);
  if (saved) {
    try {
      const todos: Fichaje[] = JSON.parse(saved);
      return todos.filter(f => f.fechaStr === hoyStr);
    } catch (e) {
      console.error(e);
    }
  }
  return [];
}

/**
 * Comprueba el estado de jornada actual de un trabajador hoy:
 * Devuelve el último fichaje realizado hoy, o null si aún no fichó.
 */
export async function getUltimoFichajeHoy(numeroTrabajador: string): Promise<Fichaje | null> {
  const fichajesHoy = await getFichajesHoy();
  const delTrabajador = fichajesHoy.filter(f => f.numeroTrabajador === numeroTrabajador);
  if (delTrabajador.length === 0) return null;
  return delTrabajador[delTrabajador.length - 1];
}

/**
 * Registra un nuevo fichaje (Entrada o Salida)
 */
export async function registrarFichaje(
  trabajador: Trabajador,
  tipo: TipoFichaje,
  dispositivoId: string = 'TABLET-PLANTA-01'
): Promise<Fichaje> {
  const ahora = new Date();
  const fechaStr = ahora.toISOString().split('T')[0];
  const horaStr = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  const nuevoFichaje: Fichaje = {
    id: `FICH_${Date.now()}_${trabajador.numeroTrabajador}`,
    numeroTrabajador: trabajador.numeroTrabajador,
    nombreCompleto: trabajador.nombreCompleto,
    centroId: trabajador.centroActual,
    tipo,
    timestamp: ahora.toISOString(),
    fechaStr,
    horaStr,
    dispositivoId,
    estado: 'VALIDO'
  };

  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, 'fichajes');
      await addDoc(colRef, {
        ...nuevoFichaje,
        serverTimestamp: serverTimestamp()
      });
    } catch (e) {
      console.warn('Error grabando fichaje en Firebase:', e);
    }
  }

  // Guardar en LocalStorage
  const saved = localStorage.getItem(LOCAL_STORAGE_FICHAJES);
  const fichajes: Fichaje[] = saved ? JSON.parse(saved) : [];
  fichajes.push(nuevoFichaje);
  localStorage.setItem(LOCAL_STORAGE_FICHAJES, JSON.stringify(fichajes));

  return nuevoFichaje;
}
