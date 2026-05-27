import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { CANONICAL_URL, SITE_SHORT_NAME, SITE_TAGLINE } from '@/lib/site-config';

/**
 * Root page — serves correct SEO metadata (canonical, OG) for "/"
 * then redirects authenticated users server-side and
 * unauthenticated users client-side so the <head> metadata
 * is always present in the HTML response.
 */
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
  // Authenticated users get an immediate server redirect (no SEO impact)
  if (session) redirect('/home');

  // Guest and unauthenticated users get a client-side redirect
  // so the canonical and OG metadata are present in the HTML <head>
  const cookieStore = await cookies();
  const isGuest = cookieStore.get('sre_guest')?.value === 'true';
  const target = isGuest ? '/feed' : '/login';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace("${target}");`,
        }}
      />
      <noscript>
        <meta httpEquiv="refresh" content={`0;url=${target}`} />
        <p>
          Redirecting to <a href={target}>{isGuest ? 'Feed' : 'Login'}</a>...
        </p>
      </noscript>
    </div>
  );
}
