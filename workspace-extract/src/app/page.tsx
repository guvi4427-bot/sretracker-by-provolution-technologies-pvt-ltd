import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/home');

  // Check for guest cookie
  const cookieStore = await cookies();
  const isGuest = cookieStore.get('sre_guest')?.value === 'true';
  if (isGuest) redirect('/feed');

  redirect('/login');
}
