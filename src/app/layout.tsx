import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Layout/Navbar';

export const metadata: Metadata = {
  title: "Debbie's Life Dashboard",
  description: 'Mis finanzas y objetivos de vida',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body style={{ background: '#fff7f9', minHeight: '100vh' }} suppressHydrationWarning>
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
