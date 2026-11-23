import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import {
  Timestamp,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { SiteConfig } from '../types/site';
import { createDefaultSiteConfig } from '../utils/siteDefaults';
import { validateSiteConfigUpdate } from '../utils/validation';

export const BOOTSTRAP_ADMIN_EMAIL = 'dezzzzzz2007@gmail.com';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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

export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();

export function mapFirestoreDocToSiteConfig(raw: Record<string, unknown>): SiteConfig {
  const defaults = createDefaultSiteConfig();
  const updatedAtRaw = raw.updatedAt;
  let updatedAtIso = defaults.updatedAt;
  if (updatedAtRaw instanceof Timestamp) {
    updatedAtIso = updatedAtRaw.toDate().toISOString();
  } else if (typeof updatedAtRaw === 'string') {
    updatedAtIso = updatedAtRaw;
  }

  const parsed = validateSiteConfigUpdate(raw, defaults);
  if (!parsed.ok) {
    return defaults;
  }
  const migratedHeroTitle =
    parsed.data.download.heroTitle === 'Unduh Rilis Resmi DENZZMODZ Terbaru'
      ? defaults.download.heroTitle
      : parsed.data.download.heroTitle;

  return {
    ...parsed.data,
    download: {
      ...parsed.data.download,
      heroTitle: migratedHeroTitle,
    },
    updatedAt: updatedAtIso,
  };
}

export async function fetchSiteConfigFromFirestore(): Promise<SiteConfig> {
  const path = 'settings/site';
  try {
    const snap = await getDoc(doc(db, 'settings', 'site'));
    if (!snap.exists()) {
      return createDefaultSiteConfig();
    }
    return mapFirestoreDocToSiteConfig(snap.data() as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveSiteConfigToFirestore(
  config: SiteConfig,
  uid: string
): Promise<SiteConfig> {
  const path = 'settings/site';
  const payload = {
    brandName: config.brandName,
    creatorName: config.creatorName,
    isOnline: config.isOnline,
    maintenanceMessage: config.maintenanceMessage,
    download: config.download,
    sociabuzz: config.sociabuzz,
    channel: config.channel,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  };

  try {
    await setDoc(doc(db, 'settings', 'site'), payload);
    return {
      ...config,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function checkIsUserAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email === BOOTSTRAP_ADMIN_EMAIL) return true;

  const path = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists() && snap.data()?.role === 'admin';
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

getRedirectResult(auth).catch(() => null);

export async function signInAdminWithGoogle(): Promise<User | null> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error && typeof (error as { code?: unknown }).code === 'string'
        ? (error as { code: string }).code
        : '';
    const isTopLevelWindow = typeof window !== 'undefined' && window.self === window.top;
    if (code === 'auth/popup-blocked' && isTopLevelWindow) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}
