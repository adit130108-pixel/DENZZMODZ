import { useState } from 'react';
import { Lock, PowerOff, RefreshCw } from 'lucide-react';
import { MotionCard } from '../components/MotionCard';
import { ScorpionEmblem } from '../components/ScorpionEmblem';
import { WordRevealHeading } from '../components/WordRevealHeading';
import type { AppRoute, SiteConfig } from '../types/site';
import { formatUpdatedDate } from '../utils/validation';

interface OfflineNoticePageProps {
  config: SiteConfig;
  onRefresh: () => Promise<void>;
  onNavigate: (route: AppRoute) => void;
}

export function OfflineNoticePage({ config, onRefresh, onNavigate }: OfflineNoticePageProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-14 sm:px-6 lg:px-8 lg:pt-20">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2.5 text-sm font-medium text-violet-300">
          <ScorpionEmblem className="h-6 w-6" />
          <span>{config.brandName} · Mode Pemeliharaan</span>
        </div>

        <WordRevealHeading
          as="h1"
          immediate
          text="Website Sedang Offline Sementara"
          className="mt-3 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:leading-[1.08]"
        />
      </div>

      <MotionCard index={0} className="mt-8 p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#24193D] pb-4">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-amber-300">
            <PowerOff className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Status Layanan: Offline oleh Admin</span>
          </div>
          <span className="font-mono text-xs tabular-nums text-[#9B8EC2]">
            Diperbarui {formatUpdatedDate(config.updatedAt)}
          </span>
        </div>

        <p className="text-base leading-relaxed text-[#E5DDF7]">
          {config.maintenanceMessage}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-60 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {refreshing ? 'Memeriksa Status...' : 'Muat Ulang Status'}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#332457] bg-[#19112B] px-5 py-2.5 text-sm font-semibold text-violet-100 transition-colors hover:border-violet-500/60 hover:bg-[#22173B] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
            Masuk Panel Admin
          </button>
        </div>
      </MotionCard>
    </div>
  );
}
