import Navbar from '@/components/Layout/Navbar';
import { getSession } from '@/lib/session';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <>
      <Navbar nombre={session.nombre} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </>
  );
}
