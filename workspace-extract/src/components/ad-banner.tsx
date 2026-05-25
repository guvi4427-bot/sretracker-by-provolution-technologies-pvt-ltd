'use client';

import { useEffect, useRef } from 'react';

/**
 * Google AdSense Banner Component
 *
 * Formats:
 * - "horizontal" — leaderboard/banner ad (728x90) for between content sections
 * - "vertical"   — sidebar ad (300x250) for side panels
 * - "in-feed"    — native in-feed ad that blends into feed lists
 * - "in-article" — mid-article ad for long content pages
 */

type AdFormat = 'horizontal' | 'vertical' | 'in-feed' | 'in-article';

interface AdBannerProps {
  format: AdFormat;
  slot?: string;          // Ad unit slot ID from AdSense dashboard
  className?: string;
  style?: React.CSSProperties;
}

const FORMAT_CONFIG: Record<AdFormat, { layout: string; style: React.CSSProperties; minHeight: string }> = {
  horizontal: {
    layout: 'in-page',
    style: { display: 'block', width: '100%', minHeight: '90px' },
    minHeight: '90px',
  },
  vertical: {
    layout: 'in-page',
    style: { display: 'block', width: '300px', minHeight: '250px', margin: '0 auto' },
    minHeight: '250px',
  },
  'in-feed': {
    layout: 'in-feed',
    style: { display: 'block', width: '100%', minHeight: '120px' },
    minHeight: '120px',
  },
  'in-article': {
    layout: 'in-article',
    style: { display: 'block', width: '100%', minHeight: '150px', textAlign: 'center' },
    minHeight: '150px',
  },
};

export function AdBanner({ format, slot, className = '', style }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const config = FORMAT_CONFIG[format];
  const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

  useEffect(() => {
    if (!isProduction || !slot) return;

    try {
      // Push ad to AdSense queue after mount
      const adsbygoogle = (window as any).adsbygoogle || [];
      if (!adRef.current?.querySelector('iframe')) {
        adsbygoogle.push({});
      }
    } catch (e) {
      // AdSense not loaded yet, silently ignore
    }
  }, [isProduction, slot]);

  // Show a subtle placeholder in development
  if (!isProduction) {
    return (
      <div
        className={`flex items-center justify-center bg-accent/30 border border-border/50 rounded-lg ${className}`}
        style={{ ...config.style, ...style, minHeight: config.minHeight, opacity: 0.5 }}
      >
        <span className="text-[10px] text-muted-foreground/50">Ad Space ({format})</span>
      </div>
    );
  }

  if (!slot) return null;

  return (
    <div ref={adRef} className={`ad-container ${className}`} style={{ ...config.style, ...style }}>
      <ins
        className="adsbygoogle"
        style={config.style}
        data-ad-client="ca-pub-7745236489664493"
        data-ad-slot={slot}
        data-ad-layout={config.layout}
        data-ad-layout-key={format === 'in-feed' ? '-fb+5w+4e-db+86' : format === 'in-article' ? '-6t+7a+3r+5y' : undefined}
        data-ad-format={format === 'in-feed' ? 'fluid' : format === 'in-article' ? 'fluid' : 'auto'}
        data-full-width-responsive="true"
      />
    </div>
  );
}

/**
 * A styled wrapper that gives the ad a consistent card-like appearance
 * matching the platform's glass-card design system.
 */
export function AdCard({ format, slot, className = '' }: { format: AdFormat; slot?: string; className?: string }) {
  return (
    <div
      className={`relative rounded-xl border border-border/40 bg-accent/20 backdrop-blur-sm overflow-hidden ${className}`}
      style={{ minHeight: FORMAT_CONFIG[format].minHeight }}
    >
      {/* Subtle "Ad" label — required by AdSense policy for transparency */}
      <div className="absolute top-1.5 right-2 z-10">
        <span className="text-[9px] text-muted-foreground/40 tracking-wider uppercase">Ad</span>
      </div>
      <div className="p-2">
        <AdBanner format={format} slot={slot} />
      </div>
    </div>
  );
}
