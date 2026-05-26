import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL, SITE_SHORT_NAME, SITE_TAGLINE } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `${SITE_SHORT_NAME} — Start, Restart, Explore | Self-Growth Platform`,
  description: `Track your learning journey, fitness progression, and content creation growth publicly. ${SITE_SHORT_NAME} (${SITE_TAGLINE}) is built for consistency, accountability, and real visible progress.`,
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    title: `${SITE_SHORT_NAME} — Self-Growth Progression Platform`,
    description: `Track learning, fitness, and creator journeys publicly.`,
    url: `${SITE_URL}/`,
  },
};

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/home');

  // Check for guest cookie
  const cookieStore = await cookies();
  const isGuest = cookieStore.get('sre_guest')?.value === 'true';
  if (isGuest) redirect('/feed');

  redirect('/login');
}
