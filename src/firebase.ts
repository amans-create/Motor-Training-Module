import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { LearningModule, LearnerAttempt, Certificate } from './types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firestore instance (with designated databaseId if provided)
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Collection References
const MODULES_COL = 'modules';
const ATTEMPTS_COL = 'attempts';
const CERTS_COL = 'certificates';
const ROSTER_COL = 'roster';

export async function fetchModulesFromCloud(): Promise<LearningModule[]> {
  try {
    const colRef = collection(db, MODULES_COL);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      return [];
    }
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LearningModule));
  } catch (error) {
    console.warn('Firestore fetch modules fallback', error);
    return [];
  }
}

export async function saveModuleToCloud(module: LearningModule): Promise<void> {
  try {
    const docRef = doc(db, MODULES_COL, module.id);
    await setDoc(docRef, module, { merge: true });
  } catch (error) {
    console.error('Error saving module to Firestore', error);
  }
}

export async function deleteModuleFromCloud(moduleId: string): Promise<void> {
  try {
    const docRef = doc(db, MODULES_COL, moduleId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting module from Firestore', error);
  }
}

export async function fetchAttemptsFromCloud(): Promise<LearnerAttempt[]> {
  try {
    const colRef = collection(db, ATTEMPTS_COL);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      return [];
    }
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LearnerAttempt));
  } catch (error) {
    console.warn('Firestore fetch attempts fallback', error);
    return [];
  }
}

export async function saveAttemptToCloud(attempt: LearnerAttempt): Promise<void> {
  try {
    const docRef = doc(db, ATTEMPTS_COL, attempt.id);
    await setDoc(docRef, attempt, { merge: true });
  } catch (error) {
    console.error('Error saving attempt to Firestore', error);
  }
}

export async function fetchCertificatesFromCloud(): Promise<Certificate[]> {
  try {
    const colRef = collection(db, CERTS_COL);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      return [];
    }
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Certificate));
  } catch (error) {
    console.warn('Firestore fetch certificates fallback', error);
    return [];
  }
}

export async function saveCertificateToCloud(cert: Certificate): Promise<void> {
  try {
    const docRef = doc(db, CERTS_COL, cert.id);
    await setDoc(docRef, cert, { merge: true });
  } catch (error) {
    console.error('Error saving certificate to Firestore', error);
  }
}

export async function batchSaveAttemptsToCloud(attempts: LearnerAttempt[]): Promise<void> {
  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < attempts.length; i += CHUNK_SIZE) {
      const chunk = attempts.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach(a => {
        const docRef = doc(db, ATTEMPTS_COL, a.id);
        batch.set(docRef, a, { merge: true });
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error batch saving attempts to Firestore', error);
  }
}

export async function fetchRosterFromCloud(): Promise<import('./types').RosterAssociate[]> {
  try {
    const colRef = collection(db, ROSTER_COL);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      return [];
    }
    return snap.docs.map(doc => ({ ...doc.data() } as import('./types').RosterAssociate));
  } catch (error) {
    console.warn('Firestore fetch roster fallback', error);
    return [];
  }
}

export async function batchSaveRosterToCloud(roster: import('./types').RosterAssociate[]): Promise<void> {
  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < roster.length; i += CHUNK_SIZE) {
      const chunk = roster.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((item, idx) => {
        const cleanCode = item.employeeCode.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        const docId = cleanCode || `emp-${i + idx}-${Date.now()}`;
        const docRef = doc(db, ROSTER_COL, docId);
        batch.set(docRef, item, { merge: true });
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error saving roster to Firestore', error);
  }
}

