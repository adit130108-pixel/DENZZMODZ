import type { ChannelPlatform, DownloadCategory, DownloadItem, SiteConfig } from '../types/site';

const ALLOWED_CATEGORIES: DownloadCategory[] = ['Aplikasi', 'Template', 'Asset', 'Dokumen'];
const ALLOWED_PLATFORMS: ChannelPlatform[] = ['Telegram', 'WhatsApp Channel', 'Discord', 'Lainnya'];

export function isSafeHttpUrl(raw: string): boolean {
  if (typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2000) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
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

function cleanText(value: unknown, fallback: string, maxLen = 500): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLen);
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

  const primaryUrl = candidate.download?.primaryUrl?.trim() ?? '';
  if (!isSafeHttpUrl(primaryUrl)) {
    errors['download.primaryUrl'] = 'Link download utama wajib menggunakan URL http:// atau https:// yang valid.';
  }

  const primaryTitle = candidate.download?.primaryTitle?.trim() ?? '';
  if (!primaryTitle) {
    errors['download.primaryTitle'] = 'Judul paket download utama tidak boleh kosong.';
  }

  const sociabuzzUrl = candidate.sociabuzz?.url?.trim() ?? '';
  if (!isSafeHttpUrl(sociabuzzUrl)) {
    errors['sociabuzz.url'] = 'Link Sociabuzz wajib menggunakan URL http:// atau https:// yang valid.';
  }

  const sociabuzzTitle = candidate.sociabuzz?.title?.trim() ?? '';
  if (!sociabuzzTitle) {
    errors['sociabuzz.title'] = 'Judul halaman dukungan Sociabuzz tidak boleh kosong.';
  }

  const channelUrl = candidate.channel?.url?.trim() ?? '';
  if (!isSafeHttpUrl(channelUrl)) {
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
    const url = typeof item?.url === 'string' ? item.url.trim() : '';
    if (!title) {
      errors[`download.items.${idx}.title`] = `Judul item download #${idx + 1} wajib diisi.`;
    }
    if (!isSafeHttpUrl(url)) {
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
      url,
      clicks:
        typeof item?.clicks === 'number' && Number.isFinite(item.clicks) && item.clicks >= 0
          ? Math.floor(item.clicks)
          : 0,
    });
  });

  if (Object.keys(errors).length > 0) {
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
