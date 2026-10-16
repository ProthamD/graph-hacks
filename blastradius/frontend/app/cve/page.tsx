'use client';
import { useState } from 'react';
import {
  RiBugLine, RiSearchLine, RiAlertLine, RiArrowRightLine,
  RiShieldLine, RiExternalLinkLine, RiLoader4Line, RiGitBranchLine,
} from 'react-icons/ri';
import { runTool, CVE_SEED } from '@/lib/falkordb';

interface ExploitResult {
  rows: string[][];
  wall_ms: number;
  explain: string;
}

export default function CVEPage() {
  const [pkg, setPkg] = useState('requests');
  const [cveId, setCveId] = useState('CVE-2023-32681');
  const [result, setResult] = useState<ExploitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [prId, setPrId] = useState('');
  const [sandboxResult, setSandboxResult] = useState<{ sandbox?: string; status?: string } | null>(null);

  async function scan() {
    if (!pkg || !cveId) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await runTool('cve_exploit_chain', { pkg_name: pkg, cve_id: cveId, graph: 'blastradius' });
      setResult(r as ExploitResult);
    } catch (e) {
      setResult({ rows: [], wall_ms: 0, explain: String(e) });
    } finally {
      setLoading(false);
    }
  }

  async function cloneSandbox() {
    if (!prId) return;
    try {
      const r = await runTool('clone_pr_sandbox', { pr_id: prId, base_graph: 'blastradius' });
      setSandboxResult(r as { sandbox?: string; status?: string });
    } catch (e) {
      setSandboxResult({ status: String(e) });
    }
  }

  const cve = CVE_SEED.find(c => c.cve === cveId);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">
          <RiBugLine size={22} style={{ color: 'var(--danger)' }} />
          CVE Exploit Chain Explorer
        </h1>
        <p className="page-subtitle">
          Trace the shortest path from public API to vulnerable package using algo.SPpaths (Algorithm Category 3)
        </p>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Input panel */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.875rem' }}>
            Configure Exploit Chain Scan
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Package Name
            </label>
            <input className="input" value={pkg} onChange={e => setPkg(e.target.value)} placeholder="e.g. requests" />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              CVE ID
            </label>
            <input className="input" value={cveId} onChange={e => setCveId(e.target.value)} placeholder="e.g. CVE-2023-32681" />
          </div>

          <button className="btn btn-danger" onClick={scan} disabled={loading || !pkg || !cveId} style={{ width: '100%' }}>
            {loading ? <RiLoader4Line size={15} className="spin" /> : <RiSearchLine size={15} />}
            Trace Exploit Chain
          </button>

          {/* Quick-select CVEs */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Quick select:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {CVE_SEED.map(c => (
                <button key={c.cve} className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', fontSize: '0.72rem' }}
                  onClick={() => { setPkg(c.pkg); setCveId(c.cve); }}>
                  <RiAlertLine size={11} style={{ color: c.cvss >= 7 ? 'var(--danger)' : c.cvss >= 5 ? 'var(--warning)' : 'var(--success)' }} />
                  {c.pkg} · {c.cve}
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                    color: c.cvss >= 7 ? 'var(--danger)' : c.cvss >= 5 ? 'var(--warning)' : 'var(--success)' }}>
                    CVSS {c.cvss}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CVE Details + Sandbox */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cve && (
            <div className="glass-card" style={{ padding: '1.25rem', borderColor: 'rgba(239,68,68,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
                <RiShieldLine size={16} style={{ color: 'var(--danger)' }} />
                <span style={{ fontWeight: 700 }}>{cve.cve}</span>
                <span className={`pill ${cve.cvss >= 7 ? 'pill-danger' : cve.cvss >= 5 ? 'pill-warning' : 'pill-info'}`}>
                  CVSS {cve.cvss}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                <strong>{cve.label}</strong> in <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-light)' }}>{cve.pkg}</code>
              </div>
              <a
                href={`https://nvd.nist.gov/vuln/detail/${cve.cve}`}
                target="_blank" rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.72rem' }}
              >
                <RiExternalLinkLine size={11} /> NVD Details
              </a>
            </div>
          )}

          {/* PR Sandbox */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RiGitBranchLine size={15} style={{ color: 'var(--accent)' }} />
              Clone PR Sandbox (GRAPH.COPY)
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Create an isolated graph copy to safely run impact analysis without touching the main graph.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input className="input" style={{ flex: 1 }} placeholder="PR ID (e.g. 142)" value={prId} onChange={e => setPrId(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={cloneSandbox} disabled={!prId}>
                Clone
              </button>
            </div>
            {sandboxResult && (
              <div className="fade-in" style={{ marginTop: '0.625rem', padding: '0.5rem 0.75rem', background: 'var(--success-subtle)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--success)' }}>Sandbox ready: </span>
                <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{sandboxResult.sandbox}</code>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exploit chain result */}
      {result && (
        <div className="glass-card fade-in" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="section-title">
              <RiArrowRightLine size={16} style={{ color: 'var(--danger)' }} />
              Exploit Chain Results
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>{result.rows.length} paths found</span>
              <span>{result.wall_ms}ms</span>
            </div>
          </div>

          {result.rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <RiShieldLine size={32} style={{ marginBottom: '0.5rem' }} />
              <div>No exploit path found. Either no public API reaches this CVE, or the graph lacks the data.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {result.rows.map((row, i) => {
                const api = row[0], cveCol = row[1], cvss = row[2], hops = row[3], chain = row[4];
                return (
                  <div key={i} style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', padding: '0.875rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 8, right: 10, fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>
                      Path {i + 1}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem', flexWrap: 'wrap' }}>
                      <span className="pill pill-danger">{String(hops)} hops</span>
                      {cvss && <span className="pill pill-warning">CVSS {String(cvss)}</span>}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>via {String(api)}</span>
                    </div>
                    {/* Chain visualization */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {(Array.isArray(chain) ? chain : String(chain).split(',')).map((node: string, j: number, arr: string[]) => (
                        <span key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            background: j === 0 ? 'var(--success-subtle)' : j === arr.length - 1 ? 'var(--danger-subtle)' : 'var(--primary-subtle)',
                            border: `1px solid ${j === 0 ? 'rgba(16,185,129,0.3)' : j === arr.length - 1 ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.2)'}`,
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
                            color: j === 0 ? 'var(--success)' : j === arr.length - 1 ? 'var(--danger)' : 'var(--primary-light)',
                          }}>
                            {String(node).split('::').pop() || node}
                          </span>
                          {j < arr.length - 1 && (
                            <RiArrowRightLine size={11} style={{ color: 'var(--text-muted)' }} />
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
