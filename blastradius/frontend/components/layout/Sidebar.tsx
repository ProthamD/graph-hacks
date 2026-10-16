'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  RiNetworkLine, RiRobot2Line, RiBarChart2Line,
  RiBugLine, RiBrainLine, RiHistoryLine,
  RiDashboardLine, RiGitBranchLine, RiSettings3Line,
  RiExternalLinkLine,
} from 'react-icons/ri';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { href: '/',                icon: RiDashboardLine,  label: 'Dashboard' },
  { href: '/graph',           icon: RiNetworkLine,    label: 'Graph Visualizer' },
  { href: '/agent',           icon: RiRobot2Line,     label: 'AI Agent' },
  { href: '/algorithms',      icon: RiBarChart2Line,  label: 'Algorithms' },
  { href: '/cve',             icon: RiBugLine,        label: 'CVE Explorer' },
  { href: '/memory',          icon: RiHistoryLine,    label: 'Memory' },
  { href: '/company-brain',   icon: RiBrainLine,      label: 'Company Brain' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar} role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <RiGitBranchLine size={18} />
        </div>
        <div>
          <div className={styles.logoName}>BlastRadius</div>
          <div className={styles.logoSub}>Graph Intelligence</div>
        </div>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${active ? styles.active : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={16} className={styles.navIcon} />
              <span>{label}</span>
              {active && <div className={styles.activeBar} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer links */}
      <div className={styles.footer}>
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerLink}
          aria-label="Open FalkorDB Browser"
        >
          <RiExternalLinkLine size={13} />
          FalkorDB Browser
        </a>
        <a
          href="http://localhost:8090/docs"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerLink}
        >
          <RiExternalLinkLine size={13} />
          API Docs
        </a>
      </div>
    </aside>
  );
}
