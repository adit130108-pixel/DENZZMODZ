import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { MotionConfig } from 'motion/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { createDefaultSiteConfig } from './utils/siteDefaults';
import { useLenisScroll } from './hooks/useLenisScroll';
import {
  auth,
  checkIsUserAdmin,
  fetchSiteConfigFromFirestore,
} from './lib/firebase';
import { AdminPage } from './pages/AdminPage';
import { DownloadPage } from './pages/DownloadPage';
import { OfflineNoticePage } from './pages/OfflineNoticePage';
import type { AppRoute, SiteConfig } from './types/site';

function parseRouteFromPathname(pathname: string): AppRoute {
  const clean = pathname.replace(/\/+$/, '').toLowerCase();
  if (clean === '/admin') return 'admin';
  return 'download';
}

function routeToPathname(route: AppRoute): string {
  switch (route) {
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined' ? parseRouteFromPathname(window.location.pathname) : 'download'
  );
  const [config, setConfig] = useState<SiteConfig>(() => createDefaultSiteConfig());
  const [configLoaded, setConfigLoaded] = useState(false);

  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecking, setAdminChecking] = useState(false);

  useLenisScroll(`${route}-${configLoaded ? 'ready' : 'loading'}`);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseRouteFromPathname(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const refreshConfig = useCallback(async () => {
    try {
      const nextConfig = await fetchSiteConfigFromFirestore();
      setConfig(nextConfig);
    } catch {
      // Keep current config if network is unavailable
    } finally {
      setConfigLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (!nextUser) {
        setIsAdmin(false);
        setAdminChecking(false);
        return;
      }
      setAdminChecking(true);
      try {
        const adminResult = await checkIsUserAdmin(nextUser);
        setIsAdmin(adminResult);
      } catch {
        setIsAdmin(false);
      } finally {
        setAdminChecking(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const navigate = useCallback((nextRoute: AppRoute) => {
    setRoute(nextRoute);
    const targetPath = routeToPathname(nextRoute);
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, []);

  const trackDownload = useCallback((id: string) => {
    setConfig((prev) => {
      if (id === 'primary') {
        return {
          ...prev,
          download: { ...prev.download, primaryClicks: prev.download.primaryClicks + 1 },
        };
      }
      return {
        ...prev,
        download: {
          ...prev.download,
          items: prev.download.items.map((item) =>
            item.id === id ? { ...item, clicks: item.clicks + 1 } : item
          ),
        },
      };
    });
  }, []);

  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <div className="flex min-h-screen flex-col bg-[#0A0612] bg-[radial-gradient(ellipse_75%_40%_at_50%_-8%,rgba(124,58,237,0.18),transparent)] text-violet-50">
          <Navbar
            brandName={config.brandName}
            activeRoute={route}
            onNavigate={navigate}
            isOnline={config.isOnline}
          />

          <main className="flex-1">
            {!configLoaded ? (
              <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8" aria-busy="true">
                <div className="h-5 w-44 rounded bg-[#1B1230]" />
                <div className="mt-4 h-12 w-3/4 rounded-lg bg-[#1B1230]" />
                <div className="mt-4 h-5 w-2/3 rounded bg-[#140D24]" />
              </div>
            ) : route !== 'admin' && !config.isOnline ? (
              <OfflineNoticePage
                config={config}
                onRefresh={refreshConfig}
                onNavigate={navigate}
              />
            ) : (
              <>
                {route === 'download' && (
                  <DownloadPage
                    config={config}
                    onTrackDownload={trackDownload}
                  />
                )}
                {route === 'admin' && (
                  <AdminPage
                    config={config}
                    authReady={authReady}
                    user={user}
                    isAdmin={isAdmin}
                    adminChecking={adminChecking}
                    onConfigSaved={setConfig}
                  />
                )}
              </>
            )}
          </main>

          <Footer brandName={config.brandName} onNavigate={navigate} />
        </div>
      </MotionConfig>
    </ErrorBoundary>
  );
}
