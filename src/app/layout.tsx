import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SRE — Start, Restart, Explore | Self-Growth Platform",
  description: "Track your learning journey, fitness progression, and content creation growth publicly. SRE (Start · Restart · Explore) is built for consistency, accountability, and real visible progress.",
  keywords: ["SRE", "self-growth", "gamification", "habit tracker", "learning", "fitness", "productivity"],
  authors: [{ name: "Gowtham" }],
  icons: {
    icon: "/favicon-96x96.png",
  },
  openGraph: {
    title: "SRE — Self-Growth Progression Platform",
    description: "Track learning, fitness, and creator journeys publicly.",
    url: "https://sretracker.vercel.app",
    siteName: "SRE Tracker",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SRE Tracker — Gamified Self-Growth Platform",
    description: "Track your fitness, learning, and content creation habits with XP, achievements, and a supportive community.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
