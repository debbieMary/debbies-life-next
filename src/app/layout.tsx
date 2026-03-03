import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Debbie's Life Dashboard",
  description: 'Mis finanzas y objetivos de vida',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body style={{ background: '#fff7f9', minHeight: '100vh' }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
