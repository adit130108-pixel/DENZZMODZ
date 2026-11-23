export type DownloadCategory = 'Aplikasi' | 'Template' | 'Asset' | 'Dokumen';

export type ChannelPlatform = 'Telegram' | 'WhatsApp Channel' | 'Discord' | 'Lainnya';

export type AppRoute = 'download' | 'dukungan' | 'saluran' | 'admin';

export interface DownloadItem {
  id: string;
  title: string;
  category: DownloadCategory;
  version: string;
  fileSize: string;
  format: string;
  description: string;
  url: string;
  clicks: number;
}

export interface SupportTier {
  id: string;
  amount: string;
  title: string;
  description: string;
}

export interface ChannelBenefit {
  id: string;
  title: string;
  description: string;
}

export interface SiteConfig {
  brandName: string;
  creatorName: string;
  isOnline: boolean;
  maintenanceMessage: string;
  download: {
    heroTitle: string;
    heroSubtitle: string;
    primaryTitle: string;
    primaryVersion: string;
    primarySize: string;
    primaryFormat: string;
    primaryDescription: string;
    primaryUrl: string;
    primaryClicks: number;
    items: DownloadItem[];
  };
  sociabuzz: {
    url: string;
    title: string;
    subtitle: string;
    creatorNote: string;
    ctaLabel: string;
    tiers: SupportTier[];
  };
  channel: {
    url: string;
    name: string;
    platform: ChannelPlatform;
    handle: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    benefits: ChannelBenefit[];
  };
  updatedAt: string;
}
