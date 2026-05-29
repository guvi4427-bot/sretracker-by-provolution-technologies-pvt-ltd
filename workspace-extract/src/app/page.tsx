import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CANONICAL_URL, SITE_SHORT_NAME, SITE_TAGLINE } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `${SITE_SHORT_NAME} — Start, Restart, Explore | Self-Growth Platform`,
  description: `Track your learning journey, fitness progression, and content creation growth publicly. ${SITE_SHORT_NAME} (${SITE_TAGLINE}) is built for consistency, accountability, and real visible progress.`,
  alternates: { canonical: `${CANONICAL_URL}/` },
  openGraph: {
    title: `${SITE_SHORT_NAME} — Self-Growth Progression Platform`,
    description: `Track learning, fitness, and creator journeys publicly.`,
    url: `${CANONICAL_URL}/`,
  },
};

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  // Authenticated users get an immediate server redirect
  if (session) redirect('/home');

  // Guest users redirect to feed
  const cookieStore = await cookies();
  const isGuest = cookieStore.get('sre_guest')?.value === 'true';
  if (isGuest) redirect('/feed');

  // Unauthenticated users see the intro landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1120] via-[#0F172A] to-[#1A1040] flex flex-col items-center justify-center px-6 text-center">
      {/* Logo / Brand */}
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 mb-4">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
          {SITE_SHORT_NAME}
        </h1>
        <p className="text-lg text-blue-300/80 mt-2 font-medium">{SITE_TAGLINE}</p>
      </div>

      {/* Value Props */}
      <div className="max-w-md space-y-4 mb-10">
        <p className="text-white/70 text-base leading-relaxed">
          Track your <span className="text-blue-400 font-semibold">learning</span>, build your <span className="text-emerald-400 font-semibold">fitness</span>, and grow as a <span className="text-amber-400 font-semibold">creator</span> — all in one place.
        </p>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-2xl mb-1">📚</div>
            <p className="text-white/80 font-medium">Learn</p>
            <p className="text-white/40 text-xs">Track courses & skills</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-2xl mb-1">💪</div>
            <p className="text-white/80 font-medium">Fitness</p>
            <p className="text-white/40 text-xs">Log workouts & meals</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-2xl mb-1">✍️</div>
            <p className="text-white/80 font-medium">Create</p>
            <p className="text-white/40 text-xs">Share your journey</p>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Link
          href="/login"
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl text-center hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/25"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="flex-1 px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl text-center hover:bg-white/20 transition-all"
        >
          Get Started
        </Link>
      </div>

      <p className="text-white/30 text-xs mt-8">
        Consistency beats intensity. Your growth is visible here.
      </p>
    </div>
  );
}
