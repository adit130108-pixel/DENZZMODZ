import { useState } from 'react';
import { ArrowUpRight, Check, Copy, HeartHandshake } from 'lucide-react';
import { EditorialMediaFrame } from '../components/EditorialMediaFrame';
import { MotionCard } from '../components/MotionCard';
import { ScorpionEmblem } from '../components/ScorpionEmblem';
import { WordRevealHeading } from '../components/WordRevealHeading';
import type { SiteConfig } from '../types/site';

interface SupportPageProps {
  config: SiteConfig;
}

export function SupportPage({ config }: SupportPageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(config.sociabuzz.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pt-14">
      <section className="grid gap-8 lg:grid-cols-12 lg:items-stretch">
        <div className="flex flex-col justify-between gap-8 lg:col-span-7">
          <div>
            <div className="flex items-center gap-2.5 text-sm font-medium text-violet-300">
              <ScorpionEmblem className="h-6 w-6" />
              <span>{config.brandName} · Dukungan Sociabuzz</span>
            </div>
            <WordRevealHeading
              as="h1"
              immediate
              text={config.sociabuzz.title}
              className="mt-3 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:leading-[1.08]"
            />
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#C4BBD9] sm:text-lg">
              {config.sociabuzz.subtitle}
            </p>
          </div>

          <MotionCard index={0} className="p-6 sm:p-7">
            <p className="text-xs font-medium text-violet-300">Pesan dari {config.creatorName}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#D8D0EC]">
              {config.sociabuzz.creatorNote}
            </p>

            <div className="mt-5 border-t border-[#24193D] pt-4">
              <p className="text-xs text-[#9B8EC2]">Tautan Resmi Sociabuzz</p>
              <p className="mt-1 truncate font-mono text-xs text-violet-200">
                {config.sociabuzz.url}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href={config.sociabuzz.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-violet-500 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
              >
                <HeartHandshake className="h-4 w-4" aria-hidden="true" />
                {config.sociabuzz.ctaLabel}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#332457] bg-[#19112B] px-4 py-2.5 text-sm font-medium text-violet-100 transition-colors hover:border-violet-500/60 hover:bg-[#22173B] whitespace-nowrap"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                    Link Disalin
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    Salin Link Sociabuzz
                  </>
                )}
              </button>
            </div>
          </MotionCard>
        </div>

        <div className="lg:col-span-5">
          <EditorialMediaFrame
            src="/assets/aistudio/Proyek_Baru_20__396E1FC__26d48dd7.png"
            alt="Logo profil kalajengking ungu bermahkota DX DENZZMODZ"
            caption="Dukungan langsung menjaga rilis gratis dan server tetap cepat"
            className="h-full min-h-[280px] flex flex-col"
          />
        </div>
      </section>

      {/* Scroll-triggered Section */}
      <section aria-label="Pilihan nominal dukungan" className="mt-20 border-t border-[#261B40] pt-14">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-violet-300">01. Apresiasi Sukarela</p>
          <WordRevealHeading
            as="h2"
            text="Pilihan Dukungan untuk Keberlanjutan Rilis"
            className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
          />
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {config.sociabuzz.tiers.map((tier, idx) => (
            <MotionCard key={tier.id} index={idx} className="flex flex-col justify-between p-6">
              <div>
                <p className="font-mono text-2xl font-bold tabular-nums text-violet-300">
                  {tier.amount}
                </p>
                <h3 className="mt-3 font-display text-lg font-bold text-white">
                  {tier.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#C4BBD9]">
                  {tier.description}
                </p>
              </div>

              <div className="mt-6 border-t border-[#24193D] pt-4">
                <a
                  href={config.sociabuzz.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-[#332457] bg-[#19112B] px-4 py-2 text-xs font-semibold text-violet-100 transition-colors hover:border-violet-500 hover:bg-violet-600 hover:text-white whitespace-nowrap"
                >
                  Pilih Dukungan Ini
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </MotionCard>
          ))}
        </div>
      </section>
    </div>
  );
}
