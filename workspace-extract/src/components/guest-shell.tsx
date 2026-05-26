'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Rss, Compass, Menu, LogIn, UserPlus, Sun, Moon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ErrorBoundary } from '@/components/error-boundary';
import { Logo } from '@/components/logo';
import { GuestProvider, useGuest } from '@/components/guest-guard';
import { SITE_NAME } from '@/lib/site-config';
import { useTheme } from 'next-themes';

const GUEST_TABS = [
  { name: 'Feed', href: '/feed', icon: Rss },
  { name: 'Discover', href: '/discover', icon: Compass },
];

function GuestShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showLoginPrompt } = useGuest();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Guest session cleanup: check cookie validity every 60 seconds
  // The cookie has max-age=86400 (24h), so it auto-expires in the browser.
  // This effect extends the cookie on activity and redirects if expired.
  useEffect(() => {
    let lastExtend = Date.now();

    function extendGuestSession() {
      // Throttle: only extend once per 5 minutes to avoid excessive writes
      const now = Date.now();
      if (now - lastExtend < 300000) return;
      lastExtend = now;

      // Only extend if currently a guest
      if (localStorage.getItem('sre_guest') === 'true') {
        const cookieExists = document.cookie.includes('sre_guest=true');
        if (cookieExists) {
          // Extend cookie by 24 hours from now (activity refresh)
          document.cookie = 'sre_guest=true; path=/; max-age=86400; SameSite=Lax';
        } else {
          // Cookie expired — clean up and redirect to login
          localStorage.removeItem('sre_guest');
          router.push('/login');
        }
      }
    }

    // Extend on mount and on any navigation
    extendGuestSession();

    // Check every 60 seconds for cookie expiration
    const interval = setInterval(extendGuestSession, 60000);

    // Also extend on user interaction (mouse move, key press, scroll)
    const handleActivity = () => {
      extendGuestSession();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [pathname, router]);

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 glass-glowing">
        <div className="flex items-center gap-2">
          <Logo size={28} showText />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-muted-foreground hover:text-foreground transition-colors p-2"
          >
            {mounted && (theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />)}
          </button>
          <Button
            onClick={() => router.push('/login')}
            size="sm"
            className="gradient-blue text-white font-semibold h-8 px-3 text-xs rounded-lg"
          >
            <LogIn size={14} className="mr-1" /> Sign In
          </Button>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 p-4 pb-28">
        <ErrorBoundary>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>

        {/* Guest banner */}
        <div className="mt-4 p-4 rounded-xl bg-blue-600/10 border border-blue-500/20 text-center">
          <p className="text-sm text-foreground font-medium">Want to interact and track your progress?</p>
          <p className="text-xs text-muted-foreground mt-1 mb-3">Sign up for free to post, comment, follow, and use all features.</p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => router.push('/login')}
              size="sm"
              className="gradient-blue text-white font-semibold h-8 px-4 text-xs rounded-lg"
            >
              <LogIn size={14} className="mr-1" /> Sign In
            </Button>
            <Button
              onClick={() => router.push('/signup')}
              size="sm"
              variant="outline"
              className="border-border text-foreground font-semibold h-8 px-4 text-xs rounded-lg"
            >
              <UserPlus size={14} className="mr-1" /> Sign Up
            </Button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground/50">
          <a href="/about" className="hover:text-muted-foreground transition-colors">About</a>
          <span>·</span>
          <a href="/contact" className="hover:text-muted-foreground transition-colors">Contact</a>
          <span>·</span>
          <a href="/privacy" className="hover:text-muted-foreground transition-colors">Privacy Policy</a>
          <span>·</span>
          <a href="/terms" className="hover:text-muted-foreground transition-colors">Terms & Conditions</a>
          <span>·</span>
          <a href="/community-guidelines" className="hover:text-muted-foreground transition-colors">Community Guidelines</a>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto">
        <div className="glass-glowing backdrop-blur-2xl bg-background/80 dark:bg-[#0B1120]/70 border border-border rounded-[1.75rem] shadow-lg shadow-blue-900/10 dark:shadow-blue-900/20 px-2">
          <div className="flex items-center justify-around h-16">
            {GUEST_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.href);
              return (
                <button
                  key={tab.href}
                  onClick={() => router.push(tab.href)}
                  className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 transition-colors rounded-xl ${
                    active ? 'text-blue-400 bg-blue-600/10' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-[10px] font-medium">{tab.name}</span>
                </button>
              );
            })}

            {/* More menu for guests */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 text-muted-foreground transition-colors hover:text-foreground rounded-xl">
                  <Menu size={22} />
                  <span className="text-[10px] font-medium">More</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-background border-border rounded-t-3xl max-h-[60vh]">
                <SheetHeader>
                  <SheetTitle className="text-foreground text-left">Browse {SITE_NAME}</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-3 gap-3 py-3">
                  <button
                    onClick={() => { router.push('/about'); setMobileMenuOpen(false); }}
                    className="flex flex-col items-center gap-2 rounded-xl p-4 bg-accent text-muted-foreground hover:bg-accent/80 transition-all"
                  >
                    <Home size={22} />
                    <span className="text-xs font-medium">About</span>
                  </button>
                </div>
                <Separator className="bg-border" />
                <button
                  onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); }}
                  className="flex items-center gap-3 w-full p-4 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                >
                  {mounted && (theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />)}
                  <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <Separator className="bg-border" />
                <div className="p-4">
                  <Button
                    onClick={() => { setMobileMenuOpen(false); router.push('/login'); }}
                    className="w-full gradient-blue text-white font-semibold h-10 rounded-lg"
                  >
                    <LogIn size={16} className="mr-2" /> Sign In to Unlock All Features
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </div>
  );
}

export function GuestShell({ children }: { children: React.ReactNode }) {
  return (
    <GuestProvider>
      <GuestShellInner>{children}</GuestShellInner>
    </GuestProvider>
  );
}
