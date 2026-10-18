'use client';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  if (isLandingPage) {
    return (
      <div className="landing-layout-wrapper" style={{ minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
        {children}
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <TopBar />
      <main className="main-content fade-in">
        {children}
      </main>
    </div>
  );
}
