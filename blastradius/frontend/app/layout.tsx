import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { NavProvider } from '@/components/layout/NavContext';

export const metadata: Metadata = {
  title: 'BlastRadius — FalkorDB Graph Intelligence',
  description: 'Autonomous codebase impact analysis, PR triage and SecOps graph agent powered by FalkorDB',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <NavProvider>
          <AppShell>
            {children}
          </AppShell>
        </NavProvider>
        {/* WCAG 2.2 AA — live region for screen readers */}
        <div
          id="aria-live-region"
          aria-live="polite"
          aria-atomic="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
        />
      </body>
    </html>
  );
}
