import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { AppRoute } from '../types/site';
import { ScorpionEmblem } from './ScorpionEmblem';

interface NavbarProps {
  brandName: string;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  isOnline?: boolean;
}

const NAV_ITEMS: { route: AppRoute; label: string; href: string }[] = [
  { route: 'download', label: 'Download', href: '/' },
  { route: 'admin', label: 'Admin', href: '/admin' },
];

export function Navbar({
  brandName,
  activeRoute,
  onNavigate,
  isOnline = true,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, route: AppRoute) => {
    e.preventDefault();
    setMobileOpen(false);
    onNavigate(route);
  };

  const handleGoToDownloads = () => {
    setMobileOpen(false);
    if (activeRoute !== 'download') {
      onNavigate('download');
      window.setTimeout(() => {
        document.getElementById('koleksi-download')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return;
    }
    document.getElementById('koleksi-download')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#261B40] bg-[#0A0612]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, 'download')}
          className="inline-flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-500"
        >
          <ScorpionEmblem className="h-8 w-8" />
          <span>{brandName}</span>
        </a>

        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeRoute === item.route;
            return (
              <a
                key={item.route}
                href={item.href}
                onClick={(e) => handleLinkClick(e, item.route)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-500 ${
                  isActive ? 'text-white font-semibold' : 'text-[#A89BC9] hover:text-white'
                }`}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 -bottom-0.5 h-0.5 bg-violet-500 transition-transform duration-200 origin-left ${
                    isActive ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {isOnline ? (
            <button
              type="button"
              onClick={handleGoToDownloads}
              className="hidden sm:inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-violet-500 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
            >
              Koleksi Download
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="hidden sm:inline-flex items-center justify-center rounded-lg border border-amber-500/40 bg-amber-950/60 px-4 py-2 text-xs font-semibold text-amber-200 transition-colors duration-150 hover:bg-amber-900/60 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              Mode Offline · Admin
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#2B1E4A] bg-[#130D21] text-violet-100 md:hidden focus-visible:outline-2 focus-visible:outline-violet-500"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#261B40] bg-[#100A1D] px-4 py-4 md:hidden">
          <nav aria-label="Navigasi seluler" className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeRoute === item.route;
              return (
                <a
                  key={item.route}
                  href={item.href}
                  onClick={(e) => handleLinkClick(e, item.route)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium ${
                    isActive ? 'bg-[#1D1433] text-white font-semibold' : 'text-[#C4BBD9]'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
            {isOnline ? (
              <button
                type="button"
                onClick={handleGoToDownloads}
                className="mt-2 flex min-h-[44px] items-center justify-center rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white"
              >
                Koleksi Download
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onNavigate('admin');
                }}
                className="mt-2 flex min-h-[44px] items-center justify-center rounded-lg border border-amber-500/40 bg-amber-950/60 px-4 text-sm font-semibold text-amber-200"
              >
                Mode Offline · Buka Admin
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
