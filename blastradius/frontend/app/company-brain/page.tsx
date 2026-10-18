'use client';
import { useState } from 'react';
import {
  RiBrainLine, RiSearchLine, RiLoader4Line, RiTeamLine,
  RiUser3Line, RiFileTextLine, RiArrowRightLine, RiGitCommitLine,
} from 'react-icons/ri';
import { runTool } from '@/lib/falkordb';

const DEMO_FUNCTIONS = [
  'auth::validate_jwt',
  'payment::process_charge',
  'inventory::batch_sync',
  'gateway::route_request',
  'cache::get',
];

export default function CompanyBrainPage() {
  const [fnId, setFnId] = useState('auth::validate_jwt');
  const [ownerResult, setOwnerResult] = useState<{ rows?: unknown[][] } | null>(null);
  const [loadingOwner, setLoadingOwner] = useState(false);

  const [blastFnId, setBlastFnId] = useState('payment::process_charge');
  const [blastResult, setBlastResult] = useState<{ rows?: unknown[][] } | null>(null);
  const [loadingBlast, setLoadingBlast] = useState(false);

  async function getOwnership() {
    setLoadingOwner(true);
    try {
      const r = await runTool('get_ownership', { function_id: fnId, graph: 'blastradius' });
      setOwnerResult(r as { rows?: unknown[][] });
    } catch (e) {
      setOwnerResult({ rows: [] });
    } finally {
      setLoadingOwner(false);
    }
  }

  async function runBlastRadius() {
    setLoadingBlast(true);
    try {
      const r = await runTool('blast_radius', { function_id: blastFnId, max_hops: 4, graph: 'blastradius' });
      setBlastResult(r as { rows?: unknown[][] });
    } catch (e) {
      setBlastResult({ rows: [] });
    } finally {
      setLoadingBlast(false);
    }
  }

  const ownerRows = ownerResult?.rows ?? [];
  const blastRows = blastResult?.rows ?? [];

  return (
    <div className="page-container fade-in">
      <div className="responsive-header">
        <div>
          <h1 className="page-title">
            <RiBrainLine size={22} style={{ color: 'var(--accent)' }} />
            Company Brain
          </h1>
          <p className="page-subtitle">
            Track 03 — Developer ownership, ADR governance, commit history traversal via FalkorDB
          </p>
        </div>
      </div>

      {/* Track 03 info */}
      <div style={{ marginBottom: '1.5rem', padding: '0.875rem 1.25rem', background: 'var(--accent-subtle)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <RiBrainLine size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--accent)' }}>Track 03 (Company Brain):</strong>{' '}
          Knowledge from commits, ADR docs, SQL CI/CD metrics in one FalkorDB graph. Ownership is computed by
          traversing CALLS*0..2 neighbours and joining via AUTHORED → Commit → MODIFIED relationships.
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Developer Ownership */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RiTeamLine size={16} style={{ color: 'var(--info)' }} />
            Developer Ownership
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Function ID
            </label>
            <select className="input" value={fnId} onChange={e => setFnId(e.target.value)}>
              {DEMO_FUNCTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <button className="btn btn-primary btn-sm" onClick={getOwnership} disabled={loadingOwner} style={{ width: '100%', marginBottom: '0.875rem' }}>
            {loadingOwner ? <RiLoader4Line size={13} className="spin" /> : <RiSearchLine size={13} />}
            Find Owners (2-hop)
          </button>

          {ownerRows.length > 0 && (
            <div className="fade-in">
              {ownerRows.map((row, i) => {
                const username = String(row[0]);
                const team = String(row[1]);
                const commits = Number(row[2]);
                const lines = Number(row[3]);
                const owned = Array.isArray(row[4]) ? row[4] : [];
                return (
                  <div key={i} style={{ padding: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--info-subtle)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RiUser3Line size={15} style={{ color: 'var(--info)' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{username}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{team}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{commits} commits</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lines} lines</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {owned.slice(0, 4).map((fn: unknown) => (
                        <span key={String(fn)} className="chip">
                          <RiGitCommitLine size={9} /> {String(fn)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Blast Radius */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RiArrowRightLine size={16} style={{ color: 'var(--danger)' }} />
            Blast Radius Analysis
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Function to Analyze
            </label>
            <select className="input" value={blastFnId} onChange={e => setBlastFnId(e.target.value)}>
              {DEMO_FUNCTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <button className="btn btn-primary btn-sm" style={{ width: '100%', marginBottom: '0.875rem' }}
            onClick={runBlastRadius} disabled={loadingBlast}>
            {loadingBlast ? <RiLoader4Line size={13} className="spin" /> : <RiArrowRightLine size={13} />}
            Run Blast Radius (4-hop)
          </button>

          {blastRows.length > 0 && (
            <div className="fade-in">
              {blastRows.map((row, i) => {
                const fn = String(row[0]);
                const pr = Number(row[1] ?? 0).toFixed(3);
                const callers = Array.isArray(row[3]) ? row[3] : [];
                const apis = Array.isArray(row[4]) ? row[4] : [];
                const adrs = Array.isArray(row[5]) ? row[5] : [];
                const count = Number(row[6] ?? 0);
                return (
                  <div key={i} style={{ padding: '0.875rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 700 }}>{fn}</span>
                      <span className="pill pill-danger">{count} callers</span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>PR: {pr}</span>
                    </div>
                    {apis.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Impacted APIs:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {apis.slice(0, 5).map((api: unknown) => (
                            <span key={String(api)} className="chip" style={{ color: 'var(--accent)', borderColor: 'rgba(245,158,11,0.3)' }}>
                              {String(api)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {adrs.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>ADR Constraints:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {adrs.slice(0, 3).map((adr: unknown) => (
                            <span key={String(adr)} className="chip" style={{ color: 'var(--info)', borderColor: 'rgba(59,130,246,0.2)' }}>
                              <RiFileTextLine size={9} /> {String(adr)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Architecture docs */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RiFileTextLine size={16} style={{ color: 'var(--info)' }} />
          Architecture Decision Records (ADRs)
        </div>
        <div className="grid-3">
          {[
            { id: 'ADR-001', title: 'HTTP Session Policy', rule: 'All external HTTP calls must use shared requests session', color: 'var(--danger)' },
            { id: 'ADR-002', title: 'JWT Algorithm Policy', rule: 'Explicit algorithm allowlist required in all jwt.decode calls', color: 'var(--warning)' },
            { id: 'ADR-003', title: 'Database Session Policy', rule: 'SQLAlchemy sessions must always use context managers', color: 'var(--info)' },
          ].map(({ id, title, rule, color }) => (
            <div key={id} style={{ padding: '0.875rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color, fontWeight: 700, marginBottom: '0.35rem' }}>{id}</div>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.35rem' }}>{title}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{rule}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '0.875rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          ADRs are ingested via GraphRAG-SDK and stored as ArchitectureDoc nodes with GOVERNS relationships to the relevant functions.
          The agent automatically includes ADR constraints in blast-radius responses.
        </div>
      </div>
    </div>
  );
}
