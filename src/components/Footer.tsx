import type { AppRoute } from '../types/site';
import { ScorpionEmblem } from './ScorpionEmblem';

interface FooterProps {
  brandName: string;
  onNavigate: (route: AppRoute) => void;
}

export function Footer({ brandName, onNavigate }: FooterProps) {
  const go = (e: React.MouseEvent<HTMLAnchorElement>, route: AppRoute) => {
    e.preventDefault();
    onNavigate(route);
  };

  return (
    <footer className="border-t border-[#261B40] bg-[#0D0818]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <ScorpionEmblem className="h-9 w-9" />
          <p className="font-display text-base font-bold text-white">{brandName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm text-[#C4BBD9]">
          <a href="/" onClick={(e) => go(e, 'download')} className="hover:text-white whitespace-nowrap">
            Download
          </a>
          <a href="/admin" onClick={(e) => go(e, 'admin')} className="hover:text-white whitespace-nowrap">
            Panel Admin
          </a>
        </div>
      </div>
    </footer>
  );
}
