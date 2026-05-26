import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-provider";
import { CookieConsent } from "@/components/cookie-consent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "S/R/E — Gamified Self-Growth Platform",
  description:
    "S/R/E (Start / Restart / Explore) is a free gamified self-growth platform that helps you build better habits, track your Study, Routine, and Exercise progress. Earn XP, unlock achievements, and join a supportive community on your self-improvement journey.",
  keywords: [
    "SRE",
    "self-growth",
    "gamification",
    "habit tracker",
    "learning",
    "fitness",
    "productivity",
    "study tracker",
    "exercise tracker",
    "routine builder",
    "personal development",
    "gamified habits",
    "XP system",
    "achievement tracker",
  ],
  authors: [{ name: "Gowtham", url: "https://sretracker.vercel.app" }],
  creator: "Gowtham",
  publisher: "S/R/E",
  icons: { icon: "/logo.png" },
  metadataBase: new URL("https://sretracker.vercel.app"),
  alternates: {
    canonical: "https://sretracker.vercel.app",
  },
  openGraph: {
    title: "S/R/E — Gamified Self-Growth Platform",
    description:
      "Start / Restart / Explore — Your gamified journey to self-improvement. Track habits, earn XP, and grow with a community.",
    type: "website",
    url: "https://sretracker.vercel.app",
    siteName: "S/R/E",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "S/R/E — Gamified Self-Growth Platform",
    description:
      "Track your Study, Routine, and Exercise habits with XP, achievements, and a supportive community.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "self-improvement",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "S/R/E — Gamified Self-Growth Platform",
    description:
      "A free gamified self-growth platform that helps you build better habits, track your Study, Routine, and Exercise progress with XP, achievements, and community support.",
    url: "https://sretracker.vercel.app",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: "Gowtham",
    },
    featureList: [
      "Habit tracking with daily check-ins",
      "Gamification with XP, levels, and achievements",
      "Fitness progress tracking",
      "Learning and content management",
      "Social features and community feed",
      "AI-powered chatbot assistant",
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content="ca-pub-7745236489664493" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7745236489664493"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>{children}</AuthProvider>
        <CookieConsent />
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
