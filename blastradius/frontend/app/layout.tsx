import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

export const metadata: Metadata = {
  title: 'BlastRadius — FalkorDB Graph Intelligence',
  description: 'Autonomous codebase, PR triage and SecOps graph agent powered by FalkorDB',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="app-layout">
          <Sidebar />
          <TopBar />
          <main className="main-content fade-in">
            {children}
          </main>
        </div>
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
