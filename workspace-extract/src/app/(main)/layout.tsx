'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { GuestShell } from '@/components/guest-shell';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isGuest, setIsGuest] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsGuest(localStorage.getItem('sre_guest') === 'true');
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
      </div>
    );
  }

  if (isGuest) {
    return <GuestShell>{children}</GuestShell>;
  }

  return <AppShell>{children}</AppShell>;
}
