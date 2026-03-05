import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/Layout/ThemeProvider';

export const metadata: Metadata = {
  title: "Debbie's Life Dashboard",
  description: 'Mis finanzas y objetivos de vida',
};

const themeScript = `(function(){try{var s=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(!s&&d))document.documentElement.setAttribute('data-theme','dark');}catch{}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body style={{ background: 'var(--bg)', minHeight: '100vh' }} suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
