import type { ChannelPlatform, DownloadCategory, DownloadItem, SiteConfig } from '../types/site';

const ALLOWED_CATEGORIES: DownloadCategory[] = ['Aplikasi', 'Template', 'Asset', 'Dokumen'];
const ALLOWED_PLATFORMS: ChannelPlatform[] = ['Telegram', 'WhatsApp Channel', 'Discord', 'Lainnya'];

const utf8Encoder = new TextEncoder();

function utf8ByteLength(value: string): number {
  return utf8Encoder.encode(value).length;
}

function truncateUtf8(value: string, maxBytes: number): string {
  if (utf8ByteLength(value) <= maxBytes) return value;
  let result = '';
  for (const ch of value) {
    const next = result + ch;
    if (utf8ByteLength(next) > maxBytes) break;
    result = next;
  }
  return result;
}

export function normalizeSafeHttpUrl(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || /[\r\n]/.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    const normalized = trimmed.replace(/^https?:\/\//i, (scheme) => scheme.toLowerCase());
    const bytes = utf8ByteLength(normalized);
    if (bytes < 8 || bytes > 2000) {
      return null;
    }
    return normalized;
  } catch {
    return null;
  }
}

export function isSafeHttpUrl(raw: string): boolean {
  return normalizeSafeHttpUrl(raw) !== null;
}

export function splitWordsForReveal(text: string): string[] {
  if (typeof text !== 'string') return [];
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

export function formatUpdatedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Baru saja';
  }
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatFirebaseAuthError(error: unknown, hostname = ''): string {
  const rawCode =
    error && typeof error === 'object' && 'code' in error && typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : '';
  const rawMessage = error instanceof Error ? error.message : String(error ?? '');
  const code = rawCode || (rawMessage.match(/auth\/[a-z0-9-]+/i)?.[0] ?? '');

  if (code === 'auth/unauthorized-domain') {
    const hostLabel = hostname ? ` (${hostname})` : '';
    return `Domain${hostLabel} belum didaftarkan di Firebase Console -> Authentication -> Settings -> Authorized domains.`;
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Jendela login Google ditutup sebelum selesai.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Pop-up login Google diblokir oleh browser. Izinkan pop-up untuk situs ini lalu coba lagi.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Koneksi internet bermasalah saat menghubungi layanan login Google.';
  }
  if (code) {
    return `Gagal masuk dengan akun Google (${code}).`;
  }
  return 'Gagal masuk dengan akun Google. Pastikan pop-up diizinkan dan domain sudah terdaftar di Firebase.';
}

export function formatFirestoreSaveError(
  error: unknown,
  fallbackMessage = 'Gagal menyimpan ke Firebase.'
): string {
  const rawMessage = error instanceof Error ? error.message : String(error ?? '');
  let innerMessage = rawMessage;
  let emailInfo = '';
  let projectInfo = '';
  let verifiedInfo: boolean | null = null;
  let failedChecks: string[] = [];

  if (rawMessage.startsWith('{')) {
    try {
      const parsed = JSON.parse(rawMessage) as {
        error?: unknown;
        projectId?: unknown;
        payloadSummary?: { failedRuleChecks?: unknown };
        authInfo?: { email?: unknown; emailVerified?: unknown; userId?: unknown };
      };
      if (typeof parsed.error === 'string' && parsed.error.trim()) {
        innerMessage = parsed.error.trim();
      }
      if (typeof parsed.projectId === 'string' && parsed.projectId) {
        projectInfo = parsed.projectId;
      }
      if (typeof parsed.authInfo?.email === 'string' && parsed.authInfo.email) {
        emailInfo = parsed.authInfo.email;
      }
      if (typeof parsed.authInfo?.emailVerified === 'boolean') {
        verifiedInfo = parsed.authInfo.emailVerified;
      }
      if (Array.isArray(parsed.payloadSummary?.failedRuleChecks)) {
        failedChecks = parsed.payloadSummary.failedRuleChecks.filter(
          (item): item is string => typeof item === 'string'
        );
      }
    } catch {
      // Ignore JSON parse failure and use raw message
    }
  }

  const lower = innerMessage.toLowerCase();

  if (lower.includes('quota exceeded') || lower.includes('resource-exhausted')) {
    return 'Kuota baca/tulis harian gratis Firebase Firestore sedang habis. Kuota akan direset keesokan hari atau dapat ditingkatkan di Firebase Console.';
  }

  if (lower.includes('missing or insufficient permissions') || lower.includes('permission-denied')) {
    const accountLabel = emailInfo ? ` untuk akun ${emailInfo}` : '';
    const detailParts = [
      projectInfo ? `proyek: ${projectInfo}` : '',
      verifiedInfo === false ? 'email belum terverifikasi' : '',
      failedChecks.length > 0 ? `cek aturan: ${failedChecks.join(', ')}` : '',
    ].filter(Boolean);
    const detailSuffix = detailParts.length > 0 ? ` [${detailParts.join(', ')}]` : '';
    return `Izin tulis ke Firestore ditolak${accountLabel} (permission-denied${detailSuffix}). Pastikan seluruh link diawali http:// atau https://, sesi login masih aktif, lalu coba keluar dan masuk ulang.`;
  }

  if (lower.includes('unauthenticated') || lower.includes('sesi login')) {
    return 'Sesi login Firebase Anda telah berakhir. Silakan klik Keluar lalu masuk kembali dengan Google.';
  }

  if (
    lower.includes('unavailable') ||
    lower.includes('client is offline') ||
    lower.includes('network') ||
    lower.includes('failed to fetch')
  ) {
    return 'Koneksi ke Firebase terputus atau server sedang sibuk. Periksa koneksi internet Anda lalu coba simpan lagi.';
  }

  if (innerMessage) {
    return `${fallbackMessage} Detail: ${innerMessage}`;
  }

  return fallbackMessage;
}

function cleanText(value: unknown, fallback: string, maxLen = 500): string {
  if (typeof value !== 'string') return truncateUtf8(fallback, maxLen);
  const trimmed = value.trim();
  if (!trimmed) return truncateUtf8(fallback, maxLen);
  return truncateUtf8(trimmed, maxLen) || truncateUtf8(fallback, maxLen);
}

export function validateSiteConfigUpdate(
  input: unknown,
  fallback: SiteConfig
): { ok: true; data: SiteConfig } | { ok: false; errors: Record<string, string> } {
  if (!input || typeof input !== 'object') {
    return { ok: false, errors: { general: 'Format konfigurasi tidak valid.' } };
  }

  const candidate = input as Partial<SiteConfig>;
  const errors: Record<string, string> = {};

  const primaryUrl = normalizeSafeHttpUrl(candidate.download?.primaryUrl ?? '');
  if (!primaryUrl) {
    errors['download.primaryUrl'] = 'Link download utama wajib menggunakan URL http:// atau https:// yang valid.';
  }

  const primaryTitle = candidate.download?.primaryTitle?.trim() ?? '';
  if (!primaryTitle) {
    errors['download.primaryTitle'] = 'Judul paket download utama tidak boleh kosong.';
  }

  const sociabuzzUrl = normalizeSafeHttpUrl(candidate.sociabuzz?.url ?? '');
  if (!sociabuzzUrl) {
    errors['sociabuzz.url'] = 'Link Sociabuzz wajib menggunakan URL http:// atau https:// yang valid.';
  }

  const sociabuzzTitle = candidate.sociabuzz?.title?.trim() ?? '';
  if (!sociabuzzTitle) {
    errors['sociabuzz.title'] = 'Judul halaman dukungan Sociabuzz tidak boleh kosong.';
  }

  const channelUrl = normalizeSafeHttpUrl(candidate.channel?.url ?? '');
  if (!channelUrl) {
    errors['channel.url'] = 'Link join saluran wajib menggunakan URL http:// atau https:// yang valid.';
  }

  const channelName = candidate.channel?.name?.trim() ?? '';
  if (!channelName) {
    errors['channel.name'] = 'Nama saluran tidak boleh kosong.';
  }

  if (typeof candidate.maintenanceMessage === 'string' && candidate.maintenanceMessage.trim().length === 0) {
    errors['maintenanceMessage'] = 'Pesan mode offline tidak boleh kosong.';
  }

  const rawItems = Array.isArray(candidate.download?.items)
    ? candidate.download!.items
    : fallback.download.items;

  const validatedItems: DownloadItem[] = [];
  rawItems.slice(0, 20).forEach((item, idx) => {
    const title = typeof item?.title === 'string' ? item.title.trim() : '';
    const normalizedUrl = normalizeSafeHttpUrl(typeof item?.url === 'string' ? item.url : '');
    if (!title) {
      errors[`download.items.${idx}.title`] = `Judul item download #${idx + 1} wajib diisi.`;
    }
    if (!normalizedUrl) {
      errors[`download.items.${idx}.url`] = `URL item download #${idx + 1} wajib diawali http:// atau https://.`;
    }
    const category = ALLOWED_CATEGORIES.includes(item?.category as DownloadCategory)
      ? (item.category as DownloadCategory)
      : 'Aplikasi';
    validatedItems.push({
      id: cleanText(item?.id, `dl-${idx + 1}`, 64),
      title: cleanText(title, `Paket ${idx + 1}`, 120),
      category,
      version: cleanText(item?.version, 'v1.0.0', 32),
      fileSize: cleanText(item?.fileSize, '10 MB', 32),
      format: cleanText(item?.format, 'ZIP', 48),
      description: cleanText(item?.description, 'Paket rilis siap unduh.', 300),
      url: normalizedUrl ?? '',
      clicks:
        typeof item?.clicks === 'number' && Number.isFinite(item.clicks) && item.clicks >= 0
          ? Math.floor(item.clicks)
          : 0,
    });
  });

  if (Object.keys(errors).length > 0 || !primaryUrl || !sociabuzzUrl || !channelUrl) {
    return { ok: false, errors };
  }

  const platform = ALLOWED_PLATFORMS.includes(candidate.channel?.platform as ChannelPlatform)
    ? (candidate.channel!.platform as ChannelPlatform)
    : fallback.channel.platform;

  const tiers =
    Array.isArray(candidate.sociabuzz?.tiers) && candidate.sociabuzz!.tiers.length > 0
      ? candidate.sociabuzz!.tiers.slice(0, 6).map((t, idx) => ({
          id: cleanText(t?.id, `tier-${idx + 1}`, 64),
          amount: cleanText(t?.amount, 'Rp 25.000', 40),
          title: cleanText(t?.title, 'Dukungan Kreator', 80),
          description: cleanText(t?.description, 'Mendukung pembaruan karya dan server distribusi.', 220),
        }))
      : fallback.sociabuzz.tiers;

  const benefits =
    Array.isArray(candidate.channel?.benefits) && candidate.channel!.benefits.length > 0
      ? candidate.channel!.benefits.slice(0, 6).map((b, idx) => ({
          id: cleanText(b?.id, `ben-${idx + 1}`, 64),
          title: cleanText(b?.title, 'Info Rilis Terbaru', 80),
          description: cleanText(b?.description, 'Dapatkan pembaruan rilis secara langsung.', 220),
        }))
      : fallback.channel.benefits;

  const normalized: SiteConfig = {
    brandName: cleanText(candidate.brandName, fallback.brandName, 60),
    creatorName: cleanText(candidate.creatorName, fallback.creatorName, 80),
    isOnline: typeof candidate.isOnline === 'boolean' ? candidate.isOnline : fallback.isOnline,
    maintenanceMessage: cleanText(
      candidate.maintenanceMessage,
      fallback.maintenanceMessage,
      320
    ),
    download: {
      heroTitle: cleanText(candidate.download?.heroTitle, fallback.download.heroTitle, 140),
      heroSubtitle: cleanText(candidate.download?.heroSubtitle, fallback.download.heroSubtitle, 320),
      primaryTitle: cleanText(primaryTitle, fallback.download.primaryTitle, 120),
      primaryVersion: cleanText(candidate.download?.primaryVersion, fallback.download.primaryVersion, 32),
      primarySize: cleanText(candidate.download?.primarySize, fallback.download.primarySize, 32),
      primaryFormat: cleanText(candidate.download?.primaryFormat, fallback.download.primaryFormat, 48),
      primaryDescription: cleanText(
        candidate.download?.primaryDescription,
        fallback.download.primaryDescription,
        320
      ),
      primaryUrl,
      primaryClicks:
        typeof candidate.download?.primaryClicks === 'number' &&
        Number.isFinite(candidate.download.primaryClicks) &&
        candidate.download.primaryClicks >= 0
          ? Math.floor(candidate.download.primaryClicks)
          : fallback.download.primaryClicks,
      items: validatedItems,
    },
    sociabuzz: {
      url: sociabuzzUrl,
      title: cleanText(sociabuzzTitle, fallback.sociabuzz.title, 140),
      subtitle: cleanText(candidate.sociabuzz?.subtitle, fallback.sociabuzz.subtitle, 320),
      creatorNote: cleanText(candidate.sociabuzz?.creatorNote, fallback.sociabuzz.creatorNote, 500),
      ctaLabel: cleanText(candidate.sociabuzz?.ctaLabel, fallback.sociabuzz.ctaLabel, 60),
      tiers,
    },
    channel: {
      url: channelUrl,
      name: cleanText(channelName, fallback.channel.name, 100),
      platform,
      handle: cleanText(candidate.channel?.handle, fallback.channel.handle, 80),
      title: cleanText(candidate.channel?.title, fallback.channel.title, 140),
      subtitle: cleanText(candidate.channel?.subtitle, fallback.channel.subtitle, 320),
      ctaLabel: cleanText(candidate.channel?.ctaLabel, fallback.channel.ctaLabel, 60),
      benefits,
    },
    updatedAt: new Date().toISOString(),
  };

  return { ok: true, data: normalized };
}
