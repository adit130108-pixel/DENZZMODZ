import { useMemo, useState } from 'react';
import { ArrowUpRight, Check, Copy, Download, HeartHandshake, Radio } from 'lucide-react';
import { EditorialMediaFrame } from '../components/EditorialMediaFrame';
import { MotionCard } from '../components/MotionCard';
import { ScorpionEmblem } from '../components/ScorpionEmblem';
import { WordRevealHeading } from '../components/WordRevealHeading';
import type { SiteConfig } from '../types/site';
import { formatUpdatedDate } from '../utils/validation';

interface DownloadPageProps {
  config: SiteConfig;
  onTrackDownload: (id: string) => void;
}

export function DownloadPage({ config, onTrackDownload }: DownloadPageProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalDownloads = useMemo(
    () => config.download.items.reduce((sum, item) => sum + item.clicks, 0),
    [config.download.items]
  );

  const handleCopy = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 2000);
    } catch {
      setCopiedId(null);
    }
  };

  const scrollToCollection = () => {
    const el = document.getElementById('koleksi-download');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pt-14">
      {/* Hero Split */}
      <section aria-labelledby="hero-heading" className="grid gap-8 lg:grid-cols-12 lg:items-center">
        <div className="flex flex-col justify-center gap-6 lg:col-span-7">
          <div>
            <div className="flex items-center gap-2.5 text-sm font-medium text-violet-300">
              <ScorpionEmblem className="h-6 w-6" />
              <span>{config.brandName}</span>
            </div>
            <WordRevealHeading
              as="h1"
              immediate
              text={config.download.heroTitle}
              className="mt-3 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:leading-[1.08]"
            />
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#C4BBD9] sm:text-lg">
              {config.download.heroSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={scrollToCollection}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-violet-500 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Lihat Daftar Download
            </button>
            <a
              href={config.channel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#332457] bg-[#19112B] px-5 py-2.5 text-sm font-medium text-violet-100 transition-colors duration-150 hover:border-violet-500/60 hover:bg-[#22173B] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
            >
              <Radio className="h-4 w-4 text-violet-400" aria-hidden="true" />
              Gabung Saluran
            </a>
          </div>
        </div>

        <div className="lg:col-span-5">
          <EditorialMediaFrame
            src="/assets/aistudio/Proyek_Baru_20__396E1FC__26d48dd7.png"
            alt="Logo kalajengking ungu bermahkota DX DENZZMODZ"
            caption={`Emblem Resmi · ${config.brandName}`}
            className="h-full min-h-[280px] flex flex-col"
          />
        </div>
      </section>

      {/* Full-width 4-column Summary Strip */}
      <section
        aria-label="Ringkasan rilis"
        className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#2B1E4A] bg-[#2B1E4A] sm:grid-cols-4"
      >
        <div className="bg-[#130D21] px-5 py-4">
          <p className="text-xs text-[#9B8EC2]">Paket Tersedia</p>
          <p className="mt-1 font-mono text-base font-semibold tabular-nums text-white">
            {config.download.items.length} File
          </p>
        </div>
        <div className="bg-[#130D21] px-5 py-4">
          <p className="text-xs text-[#9B8EC2]">Total Unduhan</p>
          <p className="mt-1 font-mono text-base font-semibold tabular-nums text-white">
            {totalDownloads.toLocaleString('id-ID')}x
          </p>
        </div>
        <div className="bg-[#130D21] px-5 py-4">
          <p className="text-xs text-[#9B8EC2]">Saluran Resmi</p>
          <p className="mt-1 text-base font-semibold text-white truncate">
            {config.channel.platform}
          </p>
        </div>
        <div className="bg-[#130D21] px-5 py-4">
          <p className="text-xs text-[#9B8EC2]">Diperbarui</p>
          <p className="mt-1 font-mono text-sm font-medium tabular-nums text-white truncate">
            {formatUpdatedDate(config.updatedAt)}
          </p>
        </div>
      </section>

      {/* Section 2: Download Collection */}
      <section id="koleksi-download" aria-label="Daftar file download" className="mt-20 border-t border-[#261B40] pt-14">
        <div className="max-w-2xl">
          <WordRevealHeading
            as="h2"
            text="Semua Link Download dari DENZZMODZ"
            className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
          />
        </div>

        {config.download.items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#2B1E4A] bg-[#130D21] p-10 text-center">
            <p className="text-sm text-[#C4BBD9]">
              Belum ada file download yang tersedia saat ini.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {config.download.items.map((item, idx) => (
              <MotionCard key={item.id} index={idx} className="flex flex-col justify-between p-6">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9B8EC2]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-violet-300">{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{item.version}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{item.fileSize}</span>
                    </div>
                    <span className="font-mono tabular-nums">
                      {item.clicks.toLocaleString('id-ID')}x
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-xl font-bold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#C4BBD9]">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#24193D] pt-4">
                  <span className="font-mono text-xs text-[#9B8EC2]">{item.format}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.url)}
                      aria-label={`Salin link ${item.title}`}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#332457] bg-[#19112B] px-3 py-2 text-xs font-medium text-violet-100 transition-colors hover:border-violet-500/60 hover:bg-[#22173B] whitespace-nowrap"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                          Tersalin
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          Salin
                        </>
                      )}
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onTrackDownload(item.id)}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-500 whitespace-nowrap"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      Download
                    </a>
                  </div>
                </div>
              </MotionCard>
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Sociabuzz & Community Channel Crosslinks */}
      <section aria-label="Dukungan dan komunitas" className="mt-20 border-t border-[#261B40] pt-14">
        <div className="max-w-2xl">
          <WordRevealHeading
            as="h2"
            text="Dukung Kreator atau Gabung Saluran Resmi"
            className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
          />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <MotionCard index={0} className="flex flex-col justify-between p-6 sm:p-7">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-violet-300">
                <HeartHandshake className="h-4 w-4 text-violet-400" aria-hidden="true" />
                <span>Sociabuzz Creator Support</span>
              </div>
              <h3 className="mt-3 font-display text-2xl font-bold text-white">
                Dukungan Sociabuzz
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#C4BBD9]">
                {config.sociabuzz.subtitle}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={config.sociabuzz.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 whitespace-nowrap"
              >
                {config.sociabuzz.ctaLabel}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </MotionCard>

          <MotionCard index={1} className="flex flex-col justify-between p-6 sm:p-7">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-violet-300">
                <Radio className="h-4 w-4 text-violet-400" aria-hidden="true" />
                <span>{config.channel.platform}</span>
              </div>
              <h3 className="mt-3 font-display text-2xl font-bold text-white">
                {config.channel.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#C4BBD9]">
                {config.channel.subtitle}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={config.channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#332457] bg-[#19112B] px-5 py-2.5 text-sm font-semibold text-violet-100 transition-colors hover:border-violet-500/60 hover:bg-[#22173B] whitespace-nowrap"
              >
                {config.channel.ctaLabel}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </MotionCard>
        </div>
      </section>
    </div>
  );
}
