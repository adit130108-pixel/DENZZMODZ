import type { SiteConfig } from '../types/site';

export function createDefaultSiteConfig(): SiteConfig {
  return {
    brandName: 'DENZZMODZ',
    creatorName: 'DENZZMODZ',
    isOnline: true,
    maintenanceMessage:
      'Website DENZZMODZ sedang dalam pemeliharaan sementara. Silakan kembali beberapa saat lagi atau pantau saluran resmi untuk informasi terbaru.',
    download: {
      heroTitle: 'SELAMAT DATANG DI WEBSITE DENZZMODZ',
      heroSubtitle:
        'Akses seluruh file instalasi, mod pack, preset konfigurasi, dan aset pendukung resmi DENZZMODZ dalam satu portal cepat yang selalu diperbarui.',
      primaryTitle: 'DENZZMODZ Pack Utama',
      primaryVersion: 'v2.4.1',
      primarySize: '48.2 MB',
      primaryFormat: 'ZIP · Rilis Resmi',
      primaryDescription:
        'Paket rilis utama DENZZMODZ lengkap dengan modul inti, panduan instalasi cepat, dan pembaruan stabil terbaru.',
      primaryUrl: 'https://github.com/denzzmodz/releases/latest',
      primaryClicks: 1420,
      items: [
        {
          id: 'dl-1',
          title: 'DENZZMODZ Installer Lengkap',
          category: 'Aplikasi',
          version: 'v2.4.1',
          fileSize: '64.5 MB',
          format: 'APK / ZIP',
          description:
            'File instalasi utama siap pakai dengan optimasi performa dan konfigurasi bawaan yang stabil.',
          url: 'https://github.com/denzzmodz/installer/releases',
          clicks: 842,
        },
        {
          id: 'dl-2',
          title: 'Preset Konfigurasi Pro',
          category: 'Template',
          version: 'v1.8.0',
          fileSize: '18.4 MB',
          format: 'CFG / JSON',
          description:
            'Koleksi preset siap impor untuk pengaturan visual, kontrol responsif, dan profil hemat daya.',
          url: 'https://releases.denzzmodz.id/preset-pro.zip',
          clicks: 615,
        },
        {
          id: 'dl-3',
          title: 'Paket Aset & Tekstur HD',
          category: 'Asset',
          version: 'v3.1.0',
          fileSize: '124.0 MB',
          format: 'ZIP · Paket Tekstur',
          description:
            'Kumpulan tekstur bersih beresolusi tinggi dengan ukuran ringan dan kompatibel di berbagai perangkat.',
          url: 'https://releases.denzzmodz.id/asset-hd-v3.zip',
          clicks: 493,
        },
        {
          id: 'dl-4',
          title: 'Panduan Pemasangan & FAQ',
          category: 'Dokumen',
          version: 'v2.0',
          fileSize: '4.6 MB',
          format: 'PDF · Panduan Resmi',
          description:
            'Langkah pemasangan berurutan, daftar kompatibilitas perangkat, dan solusi kendala umum.',
          url: 'https://releases.denzzmodz.id/panduan-denzzmodz.pdf',
          clicks: 318,
        },
      ],
    },
    sociabuzz: {
      url: 'https://sociabuzz.com/denzzmodz/tribe',
      title: 'Dukung Karya DENZZMODZ Lewat Sociabuzz',
      subtitle:
        'Setiap dukungan membantu biaya server link download berkecepatan tinggi, riset pembaruan rutin, dan rilis gratis tanpa iklan mengganggu.',
      creatorNote:
        'Terima kasih sudah mengunduh dan mempercayai rilis DENZZMODZ. Dukungan sukarela melalui Sociabuzz menjaga seluruh link tetap aktif, cepat, dan terus mendapatkan update berkala.',
      ctaLabel: 'Dukung via Sociabuzz',
      tiers: [
        {
          id: 'tier-1',
          amount: 'Rp 15.000',
          title: 'Traktir Kopi Kreator',
          description:
            'Apresiasi ringan untuk mendukung jam pengujian rilis baru dan pemeliharaan dokumentasi.',
        },
        {
          id: 'tier-2',
          amount: 'Rp 50.000',
          title: 'Pendukung Rilis Rutin',
          description:
            'Membantu biaya hosting file unduhan cepat dan pembaruan kompatibilitas setiap bulan.',
        },
        {
          id: 'tier-3',
          amount: 'Rp 150.000',
          title: 'Sponsor Prioritas Update',
          description:
            'Mendukung pengembangan fitur baru, request paket kustom, dan pemeliharaan arsip lengkap.',
        },
      ],
    },
    channel: {
      url: 'https://t.me/denzzmodz_official',
      name: 'Saluran Resmi DENZZMODZ',
      platform: 'Telegram',
      handle: '@denzzmodz_official',
      title: 'Gabung Saluran Update dan Komunitas DENZZMODZ',
      subtitle:
        'Dapatkan notifikasi langsung saat link download baru terbit, catatan pembaruan lengkap, serta info perbaikan versi secara real-time.',
      ctaLabel: 'Gabung Saluran Sekarang',
      benefits: [
        {
          id: 'ben-1',
          title: 'Notifikasi Link Rilis Terbaru',
          description:
            'Pemberitahuan instan setiap kali versi baru atau mirror download diperbarui.',
        },
        {
          id: 'ben-2',
          title: 'Changelog & Catatan Versi',
          description:
            'Ringkasan perubahan fitur, perbaikan bug, dan panduan update tanpa spam.',
        },
        {
          id: 'ben-3',
          title: 'Tanya Jawab & Bantuan Komunitas',
          description:
            'Tanya jawab pemasangan, laporan kendala, dan saran fitur langsung dengan komunitas.',
        },
      ],
    },
    updatedAt: '2026-11-22T10:00:00.000Z',
  };
}
