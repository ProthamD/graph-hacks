'use client';
import { useEffect, useState } from 'react';
import {
  RiCircleFill, RiLoader4Line, RiGitBranchLine, RiFlashlightLine,
  RiTrophyLine, RiMenuLine, RiCloseLine,
} from 'react-icons/ri';
import styles from './TopBar.module.css';
import { JudgeTourModal } from '@/components/presentation/JudgeTourModal';
import { useNav } from './NavContext';

interface ServerStatus {
  falkordb?: { status: string };
  graphiti_mcp?: { status: string };
  queryweaver_mcp?: { status: string };
  falkordb_mcp?: { status: string };
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8090';

export function TopBar() {
  const [status, setStatus] = useState<ServerStatus>({});
  const [loading, setLoading] = useState(true);
  const [tourOpen, setTourOpen] = useState(false);
  const { mobileOpen, toggleMobile } = useNav();

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch(`${API}/health`, { cache: 'no-store' });
        if (res.ok) setStatus(await res.json());
      } catch {
        setStatus({});
      } finally {
        setLoading(false);
      }
    }
    checkHealth();
    const t = setInterval(checkHealth, 15_000);
    return () => clearInterval(t);
  }, []);

  const servers = [
    { key: 'falkordb',       label: 'FalkorDB' },
    { key: 'falkordb_mcp',   label: 'MCP' },
    { key: 'graphiti_mcp',   label: 'Memory' },
    { key: 'queryweaver_mcp',label: 'SQL' },
  ] as const;

  function statusColor(key: string) {
    if (loading) return '#64748b';
    const s = (status as Record<string, { status: string }>)[key];
    if (!s) return '#64748b';
    if (s.status === 'ok') return '#10b981';
    if (s.status === 'offline') return '#ef4444';
    return '#f59e0b';
  }

  return (
    <>
      <header className={styles.topbar} role="banner">
        <div className={styles.left}>
          {/* Mobile hamburger menu toggle */}
          <button
            className={styles.menuButton}
            onClick={toggleMobile}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <RiCloseLine size={20} /> : <RiMenuLine size={20} />}
          </button>

          <div className={styles.brandGroup}>
            <RiFlashlightLine size={14} style={{ color: 'var(--accent)' }} />
            <span className={styles.tagline}>BlastRadius</span>
            <span className={styles.sep}>·</span>
            <span className={styles.sub}>FalkorDB Graph Agent</span>
          </div>

          {/* Interactive Judge Walkthrough Button */}
          <button
            onClick={() => setTourOpen(true)}
            className={styles.tourButton}
            aria-label="Open Judge Demo Tour"
          >
            <RiTrophyLine size={13} style={{ color: 'var(--accent)' }} />
            <span>Judge Demo Tour</span>
          </button>
        </div>

        <div className={styles.right}>
          {/* Server status pills */}
          <div className={styles.servers}>
            {servers.map(({ key, label }) => (
              <div key={key} className={styles.serverPill} aria-label={`${label} status: ${statusColor(key)}`}>
                {loading ? (
                  <RiLoader4Line size={10} className={styles.spin} />
                ) : (
                  <RiCircleFill size={8} style={{ color: statusColor(key) }} />
                )}
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className={styles.divider} />

          {/* Graph info */}
          <div className={styles.graphBadge}>
            <RiGitBranchLine size={13} />
            <span>blastradius</span>
          </div>
        </div>
      </header>

      {/* Presentation Modal */}
      <JudgeTourModal isOpen={tourOpen} onClose={() => setTourOpen(false)} />
    </>
  );
}
