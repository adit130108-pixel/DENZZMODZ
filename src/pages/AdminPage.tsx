import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { Check, Lock, LogOut, Plus, Power, PowerOff, RotateCcw, Save, ShieldAlert, Trash2 } from 'lucide-react';
import { MotionCard } from '../components/MotionCard';
import { ScorpionEmblem } from '../components/ScorpionEmblem';
import { WordRevealHeading } from '../components/WordRevealHeading';
import { createDefaultSiteConfig } from '../utils/siteDefaults';
import {
  OperationType,
  db,
  handleFirestoreError,
  mapFirestoreDocToSiteConfig,
  saveSiteConfigToFirestore,
  signInAdminWithGoogle,
  signOutAdmin,
} from '../lib/firebase';
import type {
  ChannelPlatform,
  DownloadCategory,
  DownloadItem,
  SiteConfig,
} from '../types/site';
import {
  formatFirebaseAuthError,
  formatUpdatedDate,
  validateSiteConfigUpdate,
} from '../utils/validation';

interface AdminPageProps {
  config: SiteConfig;
  authReady: boolean;
  user: User | null;
  isAdmin: boolean;
  adminChecking: boolean;
  onConfigSaved: (nextConfig: SiteConfig) => void;
}

type AdminTab = 'download' | 'sociabuzz' | 'saluran';

const CATEGORY_OPTIONS: DownloadCategory[] = ['Aplikasi', 'Template', 'Asset', 'Dokumen'];
const PLATFORM_OPTIONS: ChannelPlatform[] = [
  'Telegram',
  'WhatsApp Channel',
  'Discord',
  'Lainnya',
];

const INPUT_CLASS =
  'mt-1.5 w-full rounded-xl border border-[#2F2152] bg-[#0D0818] px-3.5 py-2.5 text-sm text-violet-50 placeholder:text-[#7E729F] focus:border-violet-500 focus:outline-none';

const COMPACT_INPUT_CLASS =
  'mt-1 w-full rounded-xl border border-[#2F2152] bg-[#0D0818] px-3 py-2 text-sm text-violet-50 placeholder:text-[#7E729F] focus:border-violet-500 focus:outline-none';

export function AdminPage({
  config,
  authReady,
  user,
  isAdmin,
  adminChecking,
  onConfigSaved,
}: AdminPageProps) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('download');
  const [draft, setDraft] = useState<SiteConfig>(() => structuredClone(config));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(structuredClone(config));
  }, [config]);

  useEffect(() => {
    if (!authReady || !user || !isAdmin) return;

    const path = 'settings/site';
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'site'),
      (snap) => {
        if (snap.exists()) {
          const next = mapFirestoreDocToSiteConfig(snap.data() as Record<string, unknown>);
          onConfigSaved(next);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );

    return () => unsubscribe();
  }, [authReady, user, isAdmin, onConfigSaved]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      await signInAdminWithGoogle();
    } catch (error) {
      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      setAuthError(formatFirebaseAuthError(error, host));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    await signOutAdmin();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;

    setSaveMessage(null);
    setSaveError(null);
    setFieldErrors({});

    const validation = validateSiteConfigUpdate(draft, config);
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      setSaveError('Ada kolom atau URL yang belum valid. Periksa tanda merah di bawah.');
      return;
    }

    setSaving(true);
    try {
      const saved = await saveSiteConfigToFirestore(validation.data, user.uid);
      onConfigSaved(saved);
      setDraft(structuredClone(saved));
      setSaveMessage('Semua link dan pengaturan berhasil disimpan aman ke Firebase Firestore.');
    } catch {
      setSaveError(
        'Gagal menyimpan ke Firebase. Pastikan akun Anda memiliki izin admin dan aturan Firestore aktif.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSiteStatus = async (nextOnline: boolean) => {
    if (!user || !isAdmin) return;

    const updatedDraft: SiteConfig = {
      ...draft,
      isOnline: nextOnline,
    };
    setDraft(updatedDraft);
    setSaveMessage(null);
    setSaveError(null);
    setFieldErrors({});

    const validation = validateSiteConfigUpdate(updatedDraft, config);
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      setSaveError('Ada kolom atau pesan mode offline yang belum valid. Periksa tanda merah di bawah.');
      return;
    }

    setSaving(true);
    try {
      const saved = await saveSiteConfigToFirestore(validation.data, user.uid);
      onConfigSaved(saved);
      setDraft(structuredClone(saved));
      setSaveMessage(
        nextOnline
          ? 'Website DENZZMODZ sekarang ONLINE dan dapat diakses publik.'
          : 'Website DENZZMODZ sekarang OFFLINE (Mode Pemeliharaan aktif untuk pengunjung).'
      );
    } catch {
      setSaveError(
        'Gagal mengubah status online/offline ke Firebase. Pastikan akun Anda memiliki izin admin.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!user || !isAdmin) return;
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    setFieldErrors({});
    try {
      const defaults = createDefaultSiteConfig();
      const saved = await saveSiteConfigToFirestore(defaults, user.uid);
      onConfigSaved(saved);
      setDraft(structuredClone(saved));
      setSaveMessage('Pengaturan di Firebase dikembalikan ke konfigurasi awal.');
    } catch {
      setSaveError('Gagal mereset pengaturan di Firebase.');
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (idx: number, patch: Partial<DownloadItem>) => {
    setDraft((prev) => ({
      ...prev,
      download: {
        ...prev.download,
        items: prev.download.items.map((item, i) => (i === idx ? { ...item, ...patch } : item)),
      },
    }));
  };

  const addItem = () => {
    setDraft((prev) => ({
      ...prev,
      download: {
        ...prev.download,
        items: [
          ...prev.download.items,
          {
            id: `dl-${Date.now()}`,
            title: 'Paket Rilis Baru',
            category: 'Aplikasi',
            version: 'v1.0.0',
            fileSize: '15.0 MB',
            format: 'ZIP',
            description: 'Deskripsi singkat file rilis yang siap diunduh.',
            url: 'https://releases.denzzmodz.id/file-baru.zip',
            clicks: 0,
          },
        ],
      },
    }));
  };

  const removeItem = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      download: {
        ...prev.download,
        items: prev.download.items.filter((_, i) => i !== idx),
      },
    }));
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pt-14">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2.5 text-sm font-medium text-violet-300">
          <ScorpionEmblem className="h-6 w-6" />
          <span>{config.brandName} · Panel Admin Firebase</span>
        </div>
        <WordRevealHeading
          as="h1"
          immediate
          text="Kelola Link Download, Sociabuzz, dan Saluran"
          className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
        />
        <p className="mt-3 text-sm leading-relaxed text-[#C4BBD9] sm:text-base">
          Dilindungi oleh Firebase Authentication dan Firestore Security Rules. Hanya admin terverifikasi yang dapat mengubah tautan.
        </p>
      </div>

      {!authReady || adminChecking ? (
        <MotionCard index={0} className="mt-8 max-w-lg p-6 sm:p-8">
          <div className="space-y-3" aria-busy="true">
            <div className="h-5 w-48 rounded bg-[#1E1535]" />
            <div className="h-10 w-full rounded-lg bg-[#1E1535]" />
            <div className="h-10 w-32 rounded-lg bg-[#1E1535]" />
          </div>
        </MotionCard>
      ) : !user ? (
        <MotionCard index={0} className="mt-8 max-w-lg p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Lock className="h-4 w-4 text-violet-400" aria-hidden="true" />
            <h2>Masuk Admin dengan Google</h2>
          </div>

          {authError && (
            <p
              role="alert"
              className="rounded-lg border border-rose-500/40 bg-rose-950/60 px-3 py-2 text-xs font-medium text-rose-200"
            >
              {authError}
            </p>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={authSubmitting}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-60"
          >
            {authSubmitting ? 'Membuka login Google...' : 'Masuk dengan Google'}
          </button>
        </MotionCard>
      ) : !isAdmin ? (
        <MotionCard index={0} className="mt-8 max-w-lg p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-300">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            <h2>Akses Ditolak</h2>
          </div>
          <p className="text-sm leading-relaxed text-[#C4BBD9]">
            Akun <span className="font-mono text-white">{user.email}</span> tidak terdaftar sebagai admin {config.brandName}. Silakan keluar dan masuk dengan akun admin resmi.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#332457] bg-[#19112B] px-5 py-2.5 text-sm font-semibold text-violet-100 hover:bg-[#22173B]"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Keluar Akun
          </button>
        </MotionCard>
      ) : (
        <form onSubmit={handleSave} className="mt-8 space-y-6">
          {/* Top toolbar */}
          <div className="flex flex-col gap-4 rounded-2xl border border-[#2B1E4A] bg-[#130D21] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div
              role="tablist"
              aria-label="Bagian pengaturan admin"
              className="flex flex-wrap items-center gap-1 rounded-xl border border-[#2B1E4A] bg-[#0D0818] p-1"
            >
              {[
                { id: 'download' as const, label: 'Link Download' },
                { id: 'sociabuzz' as const, label: 'Link Sociabuzz' },
                { id: 'saluran' as const, label: 'Link Join Saluran' },
              ].map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      active ? 'bg-violet-600 text-white' : 'text-[#A89BC9] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[#9B8EC2] mr-1">
                {user.email} · {formatUpdatedDate(config.updatedAt)}
              </span>
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#332457] bg-[#19112B] px-3 py-2 text-xs font-medium text-violet-100 hover:bg-[#22173B] whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#332457] bg-[#19112B] px-3 py-2 text-xs font-medium text-violet-100 hover:bg-[#22173B] whitespace-nowrap"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Keluar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-60 whitespace-nowrap"
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>

          {saveMessage && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-4 py-3 text-sm font-medium text-emerald-200"
            >
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{saveMessage}</span>
            </div>
          )}

          {saveError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/40 bg-rose-950/60 px-4 py-3 text-sm font-medium text-rose-200"
            >
              {saveError}
            </div>
          )}

          {/* Status Website Online / Offline */}
          <div className="rounded-2xl border border-[#2B1E4A] bg-[#130D21] p-6 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {draft.isOnline ? (
                    <>
                      <Power className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                      <span className="text-emerald-300">Status Aktif: Website Sedang Online</span>
                    </>
                  ) : (
                    <>
                      <PowerOff className="h-4 w-4 text-amber-400" aria-hidden="true" />
                      <span className="text-amber-300">
                        Status Aktif: Website Sedang Offline (Mode Pemeliharaan)
                      </span>
                    </>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#9B8EC2]">
                  Saat di-offline-kan, halaman Download, Dukungan Sociabuzz, dan Saluran akan menampilkan layar pemeliharaan sementara halaman Admin tetap aktif.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleToggleSiteStatus(true)}
                  aria-pressed={draft.isOnline}
                  className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap disabled:opacity-60 ${
                    draft.isOnline
                      ? 'bg-emerald-600 text-white'
                      : 'border border-[#332457] bg-[#19112B] text-[#C4BBD9] hover:border-emerald-500/50 hover:text-white'
                  }`}
                >
                  <Power className="h-3.5 w-3.5" aria-hidden="true" />
                  Website Online
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleToggleSiteStatus(false)}
                  aria-pressed={!draft.isOnline}
                  className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap disabled:opacity-60 ${
                    !draft.isOnline
                      ? 'bg-amber-600 text-white'
                      : 'border border-[#332457] bg-[#19112B] text-[#C4BBD9] hover:border-amber-500/50 hover:text-white'
                  }`}
                >
                  <PowerOff className="h-3.5 w-3.5" aria-hidden="true" />
                  Offline-kan Website
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="maintenance-message" className="block text-sm font-medium text-violet-100">
                Pesan Saat Website Offline
              </label>
              <textarea
                id="maintenance-message"
                rows={2}
                maxLength={320}
                value={draft.maintenanceMessage}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    maintenanceMessage: e.target.value,
                  }))
                }
                placeholder="Contoh: Website sedang pemeliharaan sementara untuk pembaruan link rilis."
                className={INPUT_CLASS}
              />
              {fieldErrors['maintenanceMessage'] && (
                <p className="mt-1 text-xs text-rose-300">{fieldErrors['maintenanceMessage']}</p>
              )}
            </div>
          </div>

          {activeTab === 'download' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#2B1E4A] bg-[#130D21] p-6 space-y-5">
                <h2 className="font-display text-lg font-bold text-white">
                  Teks Hero Halaman Download
                </h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="hero-title" className="block text-sm font-medium text-violet-100">
                      Judul Utama Halaman Download
                    </label>
                    <input
                      id="hero-title"
                      type="text"
                      value={draft.download.heroTitle}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          download: { ...prev.download, heroTitle: e.target.value },
                        }))
                      }
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <label htmlFor="hero-subtitle" className="block text-sm font-medium text-violet-100">
                      Subjudul Halaman Download
                    </label>
                    <textarea
                      id="hero-subtitle"
                      rows={2}
                      value={draft.download.heroSubtitle}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          download: { ...prev.download, heroSubtitle: e.target.value },
                        }))
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#2B1E4A] bg-[#130D21] p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-bold text-white">
                    Daftar Kartu Link Download ({draft.download.items.length})
                  </h2>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#332457] bg-[#19112B] px-3.5 py-2 text-xs font-semibold text-violet-100 hover:bg-[#22173B] whitespace-nowrap"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    Tambah Link Download
                  </button>
                </div>

                <div className="divide-y divide-[#24193D]">
                  {draft.download.items.map((item, idx) => (
                    <div key={item.id} className="py-5 first:pt-2 last:pb-0 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-violet-300">
                          Item #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          aria-label={`Hapus ${item.title}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-rose-300 hover:text-rose-200"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Hapus
                        </button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor={`item-title-${idx}`}
                            className="block text-xs font-medium text-[#C4BBD9]"
                          >
                            Judul File
                          </label>
                          <input
                            id={`item-title-${idx}`}
                            type="text"
                            required
                            value={item.title}
                            onChange={(e) => updateItem(idx, { title: e.target.value })}
                            className={COMPACT_INPUT_CLASS}
                          />
                          {fieldErrors[`download.items.${idx}.title`] && (
                            <p className="mt-1 text-xs text-rose-300">
                              {fieldErrors[`download.items.${idx}.title`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor={`item-url-${idx}`}
                            className="block text-xs font-medium text-[#C4BBD9]"
                          >
                            Link Download (URL)
                          </label>
                          <input
                            id={`item-url-${idx}`}
                            type="url"
                            required
                            value={item.url}
                            onChange={(e) => updateItem(idx, { url: e.target.value })}
                            className={`${COMPACT_INPUT_CLASS} font-mono`}
                          />
                          {fieldErrors[`download.items.${idx}.url`] && (
                            <p className="mt-1 text-xs text-rose-300">
                              {fieldErrors[`download.items.${idx}.url`]}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                          <div>
                            <label
                              htmlFor={`item-cat-${idx}`}
                              className="block text-xs font-medium text-[#C4BBD9]"
                            >
                              Kategori
                            </label>
                            <select
                              id={`item-cat-${idx}`}
                              value={item.category}
                              onChange={(e) =>
                                updateItem(idx, { category: e.target.value as DownloadCategory })
                              }
                              className={COMPACT_INPUT_CLASS}
                            >
                              {CATEGORY_OPTIONS.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label
                              htmlFor={`item-ver-${idx}`}
                              className="block text-xs font-medium text-[#C4BBD9]"
                            >
                              Versi
                            </label>
                            <input
                              id={`item-ver-${idx}`}
                              type="text"
                              value={item.version}
                              onChange={(e) => updateItem(idx, { version: e.target.value })}
                              className={`${COMPACT_INPUT_CLASS} font-mono`}
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`item-size-${idx}`}
                              className="block text-xs font-medium text-[#C4BBD9]"
                            >
                              Ukuran
                            </label>
                            <input
                              id={`item-size-${idx}`}
                              type="text"
                              value={item.fileSize}
                              onChange={(e) => updateItem(idx, { fileSize: e.target.value })}
                              className={`${COMPACT_INPUT_CLASS} font-mono`}
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label
                            htmlFor={`item-desc-${idx}`}
                            className="block text-xs font-medium text-[#C4BBD9]"
                          >
                            Deskripsi Singkat
                          </label>
                          <input
                            id={`item-desc-${idx}`}
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(idx, { description: e.target.value })}
                            className={COMPACT_INPUT_CLASS}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sociabuzz' && (
            <div className="rounded-2xl border border-[#2B1E4A] bg-[#130D21] p-6 space-y-5">
              <h2 className="font-display text-lg font-bold text-white">
                Pengaturan Link Dukungan Sociabuzz
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="sociabuzz-url" className="block text-sm font-medium text-violet-100">
                    Link Halaman Sociabuzz (URL)
                  </label>
                  <input
                    id="sociabuzz-url"
                    type="url"
                    required
                    value={draft.sociabuzz.url}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        sociabuzz: { ...prev.sociabuzz, url: e.target.value },
                      }))
                    }
                    className={`${INPUT_CLASS} font-mono`}
                  />
                  {fieldErrors['sociabuzz.url'] && (
                    <p className="mt-1 text-xs text-rose-300">{fieldErrors['sociabuzz.url']}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="sociabuzz-title" className="block text-sm font-medium text-violet-100">
                    Judul Halaman Dukungan
                  </label>
                  <input
                    id="sociabuzz-title"
                    type="text"
                    required
                    value={draft.sociabuzz.title}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        sociabuzz: { ...prev.sociabuzz, title: e.target.value },
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                  {fieldErrors['sociabuzz.title'] && (
                    <p className="mt-1 text-xs text-rose-300">{fieldErrors['sociabuzz.title']}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="sociabuzz-cta" className="block text-sm font-medium text-violet-100">
                    Teks Tombol Sociabuzz
                  </label>
                  <input
                    id="sociabuzz-cta"
                    type="text"
                    value={draft.sociabuzz.ctaLabel}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        sociabuzz: { ...prev.sociabuzz, ctaLabel: e.target.value },
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="sociabuzz-subtitle" className="block text-sm font-medium text-violet-100">
                    Subjudul Penjelasan
                  </label>
                  <textarea
                    id="sociabuzz-subtitle"
                    rows={2}
                    value={draft.sociabuzz.subtitle}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        sociabuzz: { ...prev.sociabuzz, subtitle: e.target.value },
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="sociabuzz-note" className="block text-sm font-medium text-violet-100">
                    Catatan Kreator
                  </label>
                  <textarea
                    id="sociabuzz-note"
                    rows={3}
                    value={draft.sociabuzz.creatorNote}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        sociabuzz: { ...prev.sociabuzz, creatorNote: e.target.value },
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'saluran' && (
            <div className="rounded-2xl border border-[#2B1E4A] bg-[#130D21] p-6 space-y-5">
              <h2 className="font-display text-lg font-bold text-white">
                Pengaturan Link Join Saluran
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="channel-url" className="block text-sm font-medium text-violet-100">
                    Link Join Saluran (URL)
                  </label>
                  <input
                    id="channel-url"
                    type="url"
                    required
                    value={draft.channel.url}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        channel: { ...prev.channel, url: e.target.value },
                      }))
                    }
                    className={`${INPUT_CLASS} font-mono`}
                  />
                  {fieldErrors['channel.url'] && (
                    <p className="mt-1 text-xs text-rose-300">{fieldErrors['channel.url']}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="channel-name" className="block text-sm font-medium text-violet-100">
                    Nama Saluran
                  </label>
                  <input
                    id="channel-name"
                    type="text"
                    required
                    value={draft.channel.name}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        channel: { ...prev.channel, name: e.target.value },
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                  {fieldErrors['channel.name'] && (
                    <p className="mt-1 text-xs text-rose-300">{fieldErrors['channel.name']}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="channel-platform" className="block text-sm font-medium text-violet-100">
                    Platform Saluran
                  </label>
                  <select
                    id="channel-platform"
                    value={draft.channel.platform}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        channel: {
                          ...prev.channel,
                          platform: e.target.value as ChannelPlatform,
                        },
                      }))
                    }
                    className={INPUT_CLASS}
                  >
                    {PLATFORM_OPTIONS.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="channel-handle" className="block text-sm font-medium text-violet-100">
                    Handle / Username Saluran
                  </label>
                  <input
                    id="channel-handle"
                    type="text"
                    value={draft.channel.handle}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        channel: { ...prev.channel, handle: e.target.value },
                      }))
                    }
                    className={`${INPUT_CLASS} font-mono`}
                  />
                </div>

                <div>
                  <label htmlFor="channel-cta" className="block text-sm font-medium text-violet-100">
                    Teks Tombol Gabung
                  </label>
                  <input
                    id="channel-cta"
                    type="text"
                    value={draft.channel.ctaLabel}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        channel: { ...prev.channel, ctaLabel: e.target.value },
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="channel-title" className="block text-sm font-medium text-violet-100">
                    Judul Halaman Saluran
                  </label>
                  <input
                    id="channel-title"
                    type="text"
                    value={draft.channel.title}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        channel: { ...prev.channel, title: e.target.value },
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="channel-subtitle" className="block text-sm font-medium text-violet-100">
                    Deskripsi Saluran
                  </label>
                  <textarea
                    id="channel-subtitle"
                    rows={2}
                    value={draft.channel.subtitle}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        channel: { ...prev.channel, subtitle: e.target.value },
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
