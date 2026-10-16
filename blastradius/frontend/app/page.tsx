'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  RiNetworkLine, RiRobot2Line, RiBarChart2Line, RiBugLine,
  RiFlashlightLine, RiGroupLine, RiCodeLine, RiAlertLine,
  RiArrowRightLine, RiRefreshLine, RiHistoryLine, RiBrainLine,
} from 'react-icons/ri';
import { fetchGraphStats, fetchHealth, nodeColor } from '@/lib/falkordb';

interface Stats {
  nodes: [string, number][];
  edges: [string, number][];
}

interface Health {
  falkordb?: { status: string };
  graphiti_mcp?: { status: string };
  queryweaver_mcp?: { status: string };
  falkordb_mcp?: { status: string };
}

const QUICK_ACTIONS = [
  {
    href: '/agent',
    icon: RiFlashlightLine,
    label: 'Run Blast Radius',
    desc: 'Ask the agent about impact scope',
    color: '#6366f1',
  },
  {
    href: '/cve',
    icon: RiBugLine,
    label: 'Scan CVEs',
    desc: 'Trace exploit paths in the graph',
    color: '#ef4444',
  },
  {
    href: '/algorithms',
    icon: RiBarChart2Line,
    label: 'Run Algorithms',
    desc: 'PageRank, WCC, CDLP + more',
    color: '#f59e0b',
  },
  {
    href: '/graph',
    icon: RiNetworkLine,
    label: 'Explore Graph',
    desc: 'Interactive 3D force visualizer',
    color: '#10b981',
  },
];

const SERVER_LABELS: Record<string, string> = {
  falkordb:       'FalkorDB Core',
  falkordb_mcp:   '@falkordb/mcpserver',
  graphiti_mcp:   'graphiti-mcp (Track 02)',
  queryweaver_mcp:'queryweaver-mcp (Track 03)',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<Health>({});
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    try {
      const [s, h] = await Promise.all([fetchGraphStats(), fetchHealth()]);
      setStats(s);
      setHealth(h);
    } catch {
      // FalkorDB not running yet
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const totalNodes = stats?.nodes?.reduce((a, r) => a + Number(r[1]), 0) ?? 0;
  const totalEdges = stats?.edges?.reduce((a, r) => a + Number(r[1]), 0) ?? 0;

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">
            <RiNetworkLine size={22} style={{ color: 'var(--primary)' }} />
            BlastRadius Dashboard
          </h1>
          <p className="page-subtitle">
            Autonomous codebase impact analysis · All 3 tracks active · Powered by FalkorDB
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={refreshing} aria-label="Refresh dashboard">
          <RiRefreshLine size={14} className={refreshing ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Metric counters */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="metric-card">
          <div className="metric-value">{totalNodes.toLocaleString()}</div>
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <RiNetworkLine size={12} /> Graph Nodes
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{totalEdges.toLocaleString()}</div>
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <RiArrowRightLine size={12} /> Relationships
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-value" style={{ fontSize: '1.5rem' }}>5</div>
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <RiBarChart2Line size={12} /> Algorithm Types
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-value" style={{ fontSize: '1.5rem' }}>9</div>
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <RiFlashlightLine size={12} /> MCP Tools
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* MCP Server Health */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div className="section-header">
            <div className="section-title">
              <RiFlashlightLine size={16} style={{ color: 'var(--primary)' }} />
              MCP Server Health
            </div>
            <span className="pill pill-primary">4 servers</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(SERVER_LABELS).map(([key, label]) => {
              const s = (health as Record<string, { status: string }>)[key];
              const ok = s?.status === 'ok';
              const offline = s?.status === 'offline' || !s;
              const deg = s?.status === 'degraded';
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</div>
                  <span className={`pill ${ok ? 'pill-success' : offline ? 'pill-danger' : 'pill-warning'}`}>
                    {ok ? 'Online' : offline ? 'Offline' : 'Degraded'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Graph Node Breakdown */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div className="section-header">
            <div className="section-title">
              <RiCodeLine size={16} style={{ color: 'var(--accent)' }} />
              Graph Node Types
            </div>
          </div>
          {stats?.nodes?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {stats.nodes.slice(0, 8).map(([label, count]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: nodeColor(label), flexShrink: 0,
                    boxShadow: `0 0 6px ${nodeColor(label)}66`
                  }} />
                  <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: `${Math.min((Number(count) / Math.max(...stats.nodes.map(r => Number(r[1])))) * 80, 80)}px`,
                      height: 4, background: nodeColor(label), borderRadius: 2, opacity: 0.6,
                    }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 24, textAlign: 'right' }}>{count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>
              No data — run seed script or start backend
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section-header">
        <div className="section-title">
          <RiFlashlightLine size={16} style={{ color: 'var(--accent)' }} />
          Quick Actions
        </div>
      </div>
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, color }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <div className="glass-card" style={{
              padding: '1.25rem', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: '0.75rem',
              minHeight: 120,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-md)',
                background: `${color}20`, border: `1px solid ${color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color }}>
                Open <RiArrowRightLine size={12} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Track coverage */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div className="section-header">
          <div className="section-title">
            <RiBrainLine size={16} style={{ color: 'var(--primary)' }} />
            Track Coverage
          </div>
        </div>
        <div className="grid-3">
          {[
            {
              track: 'Track 01', label: 'Agents on Connected Data',
              desc: 'Multi-hop blast radius, all 5 algorithm categories, CVE exploit chains via SPpaths',
              color: 'var(--primary)', icon: RiNetworkLine,
              tools: ['blast_radius', 'compute_centrality', 'cve_exploit_chain', 'detect_communities'],
            },
            {
              track: 'Track 02', label: 'Memory & State',
              desc: 'Episodic, semantic, procedural memory via graphiti-mcp + ProceduralPlaybook nodes',
              color: 'var(--success)', icon: RiHistoryLine,
              tools: ['memory_lookup', 'graphiti-mcp SSE', 'agent handoffs'],
            },
            {
              track: 'Track 03', label: 'Company Brain',
              desc: 'Dev ownership, ADR governance, SQL correlation via queryweaver, commit history',
              color: 'var(--accent)', icon: RiBrainLine,
              tools: ['get_ownership', 'queryweaver-mcp', 'GraphRAG-SDK'],
            },
          ].map(({ track, label, desc, color, icon: Icon, tools }) => (
            <div key={track} style={{
              padding: '1rem', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                <Icon size={15} style={{ color }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{track}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{label}</div>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.625rem' }}>{desc}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {tools.map(t => <span key={t} className="chip">{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
