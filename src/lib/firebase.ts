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
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

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
  projectId?: string;
  databaseId?: string;
  payloadSummary?: {
    itemsCount: number;
    tiersCount: number;
    benefitsCount: number;
    primaryClicksIsInt: boolean;
    heroTitleBytes: number;
    heroSubtitleBytes: number;
    primaryUrlPrefix: string;
    sociabuzzUrlPrefix: string;
    channelUrlPrefix: string;
    item0UrlPrefix?: string;
    tokenEmailMatch?: boolean;
    tokenEmailVerified?: boolean;
    signInProvider?: string | null;
    tokenRefreshError?: string;
    adminDocProbe?: string;
    failedRuleChecks?: string[];
  };
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
  path: string | null,
  payloadSummary?: FirestoreErrorInfo['payloadSummary']
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
    ...(payloadSummary ? { payloadSummary } : {}),
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
  const currentUser = auth.currentUser;
  const activeUid = currentUser?.uid ?? uid;
  if (!currentUser || !activeUid) {
    handleFirestoreError(new Error('unauthenticated: Sesi login tidak ditemukan.'), OperationType.WRITE, path);
  }
  let tokenEmailMatch: boolean | undefined;
  let tokenEmailVerified: boolean | undefined;
  let signInProvider: string | null = null;
  let tokenRefreshError: string | undefined;
  try {
    const tokenResult = await currentUser.getIdTokenResult(true);
    tokenEmailMatch = tokenResult.claims.email === BOOTSTRAP_ADMIN_EMAIL;
    tokenEmailVerified = tokenResult.claims.email_verified === true;
    signInProvider = tokenResult.signInProvider;
  } catch (tokenErr) {
    tokenRefreshError = tokenErr instanceof Error ? tokenErr.message : String(tokenErr);
  }
  const payload = {
    brandName: config.brandName,
    creatorName: config.creatorName,
    isOnline: config.isOnline,
    maintenanceMessage: config.maintenanceMessage,
    download: config.download,
    sociabuzz: config.sociabuzz,
    channel: config.channel,
    updatedAt: serverTimestamp(),
    updatedBy: activeUid,
  };

  try {
    await setDoc(doc(db, 'settings', 'site'), payload);
    return {
      ...config,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    const encoder = new TextEncoder();
    const byteLen = (s: unknown) => (typeof s === 'string' ? encoder.encode(s).length : -1);
    const hasExactKeys = (obj: unknown, expected: string[]) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
      const keys = Object.keys(obj);
      return keys.length === expected.length && expected.every((k) => keys.includes(k));
    };
    const urlOk = (s: unknown) =>
      typeof s === 'string' && byteLen(s) >= 8 && byteLen(s) <= 2000 && /^https?:\/\/.+/.test(s);
    const failedRuleChecks: string[] = [];

    if (currentUser.emailVerified !== true) failedRuleChecks.push('auth.emailVerified');
    if (currentUser.email !== BOOTSTRAP_ADMIN_EMAIL) failedRuleChecks.push('auth.emailMatch');
    if (activeUid !== currentUser.uid) failedRuleChecks.push('updatedBy');
    if (byteLen(config.brandName) < 1 || byteLen(config.brandName) > 60) failedRuleChecks.push('brandName');
    if (byteLen(config.creatorName) < 1 || byteLen(config.creatorName) > 80) failedRuleChecks.push('creatorName');
    if (typeof config.isOnline !== 'boolean') failedRuleChecks.push('isOnline');
    if (byteLen(config.maintenanceMessage) < 1 || byteLen(config.maintenanceMessage) > 320) {
      failedRuleChecks.push('maintenanceMessage');
    }

    const dl = config.download;
    if (
      !hasExactKeys(dl, [
        'heroTitle',
        'heroSubtitle',
        'primaryTitle',
        'primaryVersion',
        'primarySize',
        'primaryFormat',
        'primaryDescription',
        'primaryUrl',
        'primaryClicks',
        'items',
      ])
    ) {
      failedRuleChecks.push('download.keys');
    }
    if (byteLen(dl.heroTitle) < 1 || byteLen(dl.heroTitle) > 140) failedRuleChecks.push('download.heroTitle');
    if (byteLen(dl.heroSubtitle) < 1 || byteLen(dl.heroSubtitle) > 320) {
      failedRuleChecks.push('download.heroSubtitle');
    }
    if (byteLen(dl.primaryTitle) < 1 || byteLen(dl.primaryTitle) > 120) {
      failedRuleChecks.push('download.primaryTitle');
    }
    if (byteLen(dl.primaryVersion) < 1 || byteLen(dl.primaryVersion) > 32) {
      failedRuleChecks.push('download.primaryVersion');
    }
    if (byteLen(dl.primarySize) < 1 || byteLen(dl.primarySize) > 32) {
      failedRuleChecks.push('download.primarySize');
    }
    if (byteLen(dl.primaryFormat) < 1 || byteLen(dl.primaryFormat) > 48) {
      failedRuleChecks.push('download.primaryFormat');
    }
    if (byteLen(dl.primaryDescription) < 1 || byteLen(dl.primaryDescription) > 320) {
      failedRuleChecks.push('download.primaryDescription');
    }
    if (!urlOk(dl.primaryUrl)) failedRuleChecks.push('download.primaryUrl');
    if (!Number.isInteger(dl.primaryClicks) || dl.primaryClicks < 0) {
      failedRuleChecks.push('download.primaryClicks');
    }
    if (!Array.isArray(dl.items) || dl.items.length > 20) failedRuleChecks.push('download.items.size');
    if (dl.items[0]) {
      const i0 = dl.items[0];
      if (
        !hasExactKeys(i0, [
          'id',
          'title',
          'category',
          'version',
          'fileSize',
          'format',
          'description',
          'url',
          'clicks',
        ])
      ) {
        failedRuleChecks.push('items[0].keys');
      }
      if (byteLen(i0.title) < 1 || byteLen(i0.title) > 120) failedRuleChecks.push('items[0].title');
      if (!urlOk(i0.url)) failedRuleChecks.push('items[0].url');
    }

    const sb = config.sociabuzz;
    if (!hasExactKeys(sb, ['url', 'title', 'subtitle', 'creatorNote', 'ctaLabel', 'tiers'])) {
      failedRuleChecks.push('sociabuzz.keys');
    }
    if (!urlOk(sb.url)) failedRuleChecks.push('sociabuzz.url');
    if (byteLen(sb.title) < 1 || byteLen(sb.title) > 140) failedRuleChecks.push('sociabuzz.title');
    if (byteLen(sb.subtitle) < 1 || byteLen(sb.subtitle) > 320) failedRuleChecks.push('sociabuzz.subtitle');
    if (byteLen(sb.creatorNote) < 1 || byteLen(sb.creatorNote) > 500) {
      failedRuleChecks.push('sociabuzz.creatorNote');
    }
    if (byteLen(sb.ctaLabel) < 1 || byteLen(sb.ctaLabel) > 60) failedRuleChecks.push('sociabuzz.ctaLabel');
    if (!Array.isArray(sb.tiers) || sb.tiers.length < 1 || sb.tiers.length > 6) {
      failedRuleChecks.push('sociabuzz.tiers.size');
    }
    if (sb.tiers[0]) {
      if (!hasExactKeys(sb.tiers[0], ['id', 'amount', 'title', 'description'])) {
        failedRuleChecks.push('sociabuzz.tiers[0].keys');
      }
      if (byteLen(sb.tiers[0].title) < 1 || byteLen(sb.tiers[0].title) > 80) {
        failedRuleChecks.push('sociabuzz.tiers[0].title');
      }
    }

    const ch = config.channel;
    if (
      !hasExactKeys(ch, ['url', 'name', 'platform', 'handle', 'title', 'subtitle', 'ctaLabel', 'benefits'])
    ) {
      failedRuleChecks.push('channel.keys');
    }
    if (!urlOk(ch.url)) failedRuleChecks.push('channel.url');
    if (byteLen(ch.name) < 1 || byteLen(ch.name) > 100) failedRuleChecks.push('channel.name');
    if (!['Telegram', 'WhatsApp Channel', 'Discord', 'Lainnya'].includes(ch.platform)) {
      failedRuleChecks.push('channel.platform');
    }
    if (byteLen(ch.handle) < 1 || byteLen(ch.handle) > 80) failedRuleChecks.push('channel.handle');
    if (byteLen(ch.title) < 1 || byteLen(ch.title) > 140) failedRuleChecks.push('channel.title');
    if (byteLen(ch.subtitle) < 1 || byteLen(ch.subtitle) > 320) failedRuleChecks.push('channel.subtitle');
    if (byteLen(ch.ctaLabel) < 1 || byteLen(ch.ctaLabel) > 60) failedRuleChecks.push('channel.ctaLabel');
    if (!Array.isArray(ch.benefits) || ch.benefits.length < 1 || ch.benefits.length > 6) {
      failedRuleChecks.push('channel.benefits.size');
    }
    if (ch.benefits[0]) {
      if (!hasExactKeys(ch.benefits[0], ['id', 'title', 'description'])) {
        failedRuleChecks.push('channel.benefits[0].keys');
      }
      if (byteLen(ch.benefits[0].title) < 1 || byteLen(ch.benefits[0].title) > 80) {
        failedRuleChecks.push('channel.benefits[0].title');
      }
    }

    if (tokenEmailVerified === false) failedRuleChecks.push('jwt.email_verified');
    if (tokenEmailMatch === false) failedRuleChecks.push('jwt.email');

    let adminDocProbe = 'not-run';
    try {
      const adminSnap = await getDocFromServer(doc(db, 'admins', activeUid));
      adminDocProbe = adminSnap.exists() ? 'exists:true' : 'exists:false';
    } catch (probeErr) {
      adminDocProbe = `err:${probeErr instanceof Error ? probeErr.message : String(probeErr)}`;
    }

    handleFirestoreError(error, OperationType.WRITE, path, {
      itemsCount: config.download.items.length,
      tiersCount: config.sociabuzz.tiers.length,
      benefitsCount: config.channel.benefits.length,
      primaryClicksIsInt: Number.isInteger(config.download.primaryClicks),
      heroTitleBytes: byteLen(config.download.heroTitle),
      heroSubtitleBytes: byteLen(config.download.heroSubtitle),
      primaryUrlPrefix: config.download.primaryUrl.slice(0, 12),
      sociabuzzUrlPrefix: config.sociabuzz.url.slice(0, 12),
      channelUrlPrefix: config.channel.url.slice(0, 12),
      ...(config.download.items[0]
        ? { item0UrlPrefix: config.download.items[0].url.slice(0, 12) }
        : {}),
      ...(tokenEmailMatch !== undefined ? { tokenEmailMatch } : {}),
      ...(tokenEmailVerified !== undefined ? { tokenEmailVerified } : {}),
      signInProvider,
      ...(tokenRefreshError ? { tokenRefreshError } : {}),
      adminDocProbe,
      failedRuleChecks,
    });
  }
}

export async function checkIsUserAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL) return true;

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
