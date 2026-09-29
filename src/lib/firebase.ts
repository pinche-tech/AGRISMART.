import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { PlantSpecimen } from '../types/botany';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };
export type { User };

// Sanitize string length & ID format to match firebase-blueprint.json & firestore.rules
function clampStr(val: string | undefined | null, maxLen: number, fallback = 'N/A'): string {
  const clean = (val || '').trim();
  if (!clean) return fallback.slice(0, maxLen);
  return clean.slice(0, maxLen);
}

function sanitizeDocId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return cleaned || `doc_${Date.now()}`;
}

export interface SavedFieldReportDoc {
  id: string;
  ownerId: string;
  locationName: string;
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  estimatedSoilPh: string;
  rainWindow: string;
  plantingWindow: string;
  advisoryNotes: string;
}

export async function saveSpecimenToFirestore(specimen: PlantSpecimen): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const safeId = sanitizeDocId(`${user.uid}_${specimen.id}`);
  const path = `specimens/${safeId}`;

  const payload = {
    ownerId: user.uid,
    accessionNumber: clampStr(specimen.accessionNumber, 64, 'ACC. 2026.01'),
    commonName: clampStr(specimen.analysis.commonName, 160, 'Crop Specimen'),
    scientificName: clampStr(specimen.analysis.scientificName, 160, 'Species unknown'),
    family: clampStr(specimen.analysis.family, 120, 'Botanical Family'),
    locationInFarm: clampStr(specimen.locationInHome, 160, 'Main Farm Plot'),
    lastWateredDate: clampStr(specimen.lastWateredDate, 32, '2026-09-29'),
    nextWateringDueDays: Math.max(0, Math.min(365, Math.round(specimen.nextWateringDueDays || 7))),
    overallHealth: clampStr(specimen.analysis.diagnosticAssessment.overallHealth, 200, 'Healthy'),
    soilPhRange: clampStr(specimen.analysis.careInstructions.soilAndSubstrate.pHRange, 80, '6.0 - 6.8'),
    wateringInterval: clampStr(specimen.analysis.careInstructions.watering.intervalDays, 160, 'Every 7 days'),
    editorialSummary: clampStr(specimen.analysis.editorialSummary, 2000, 'Botanical specimen record.'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'specimens', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateSpecimenWateringInFirestore(
  specimenId: string,
  lastWateredDate: string,
  nextWateringDueDays: number
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const safeId = sanitizeDocId(`${user.uid}_${specimenId}`);
  const path = `specimens/${safeId}`;

  try {
    await updateDoc(doc(db, 'specimens', safeId), {
      lastWateredDate: clampStr(lastWateredDate, 32, '2026-09-29'),
      nextWateringDueDays: Math.max(0, Math.min(365, Math.round(nextWateringDueDays))),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveFieldReportToFirestore(report: Omit<SavedFieldReportDoc, 'id' | 'ownerId'>): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const safeId = sanitizeDocId(`rep_${user.uid}_${Date.now()}`);
  const path = `fieldReports/${safeId}`;

  const payload = {
    ownerId: user.uid,
    locationName: clampStr(report.locationName, 160, 'GPS Farm Sector'),
    latitude: Math.max(-90, Math.min(90, Number(report.latitude) || 0)),
    longitude: Math.max(-180, Math.min(180, Number(report.longitude) || 0)),
    altitudeMeters: Math.max(-500, Math.min(9000, Math.round(Number(report.altitudeMeters) || 0))),
    estimatedSoilPh: clampStr(report.estimatedSoilPh, 160, '6.0 - 6.8'),
    rainWindow: clampStr(report.rainWindow, 300, 'Seasonal forecast'),
    plantingWindow: clampStr(report.plantingWindow, 500, 'Recommended planting window'),
    advisoryNotes: clampStr(report.advisoryNotes, 4000, 'Agronomic field advisory.'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'fieldReports', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteFieldReportFromFirestore(reportId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  const safeId = sanitizeDocId(reportId);
  const path = `fieldReports/${safeId}`;
  try {
    await deleteDoc(doc(db, 'fieldReports', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToUserFieldReports(
  userId: string,
  onData: (reports: SavedFieldReportDoc[]) => void
): Unsubscribe {
  const path = 'fieldReports';
  const q = query(collection(db, path), where('ownerId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: SavedFieldReportDoc[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ownerId: data.ownerId,
          locationName: data.locationName,
          latitude: data.latitude,
          longitude: data.longitude,
          altitudeMeters: data.altitudeMeters,
          estimatedSoilPh: data.estimatedSoilPh,
          rainWindow: data.rainWindow,
          plantingWindow: data.plantingWindow,
          advisoryNotes: data.advisoryNotes,
        };
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
