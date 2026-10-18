'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  RiFlashlightLine, RiShieldLine, RiAlertLine, RiCheckLine,
  RiGitBranchLine, RiNodeTree, RiArrowRightLine, RiTimeLine,
  RiFileCopyLine, RiLoader4Line, RiCodeLine, RiExternalLinkLine,
  RiLockLine, RiTerminalBoxLine,
} from 'react-icons/ri';
import { triagePR, PRTriageData } from '@/lib/falkordb';

const QUICK_PICK_FNS = [
  { id: 'auth::validate_jwt', label: 'auth::validate_jwt', desc: 'Central JWT verification (Top 5% Centrality)', risk: 'high' },
  { id: 'payment::process_charge', label: 'payment::process_charge', desc: 'Payment orchestration & gateway', risk: 'high' },
  { id: 'inventory::batch_sync', label: 'inventory::batch_sync', desc: 'Batch stock sync (uses SQLAlchemy)', risk: 'medium' },
  { id: 'cache::get', label: 'cache::get', desc: 'Redis cache retrieval layer', risk: 'low' },
  { id: 'shipping::calculate_rate', label: 'shipping::calculate_rate', desc: 'Shipping fee calculator (Leaf node)', risk: 'low' },
];

export default function BlastRadiusPage() {
  const [fnId, setFnId] = useState('auth::validate_jwt');
  const [prId, setPrId] = useState('PR-142');
  const [hops, setHops] = useState(4);
  const [loading, setLoading] = useState(false);
  const [triageData, setTriageData] = useState<PRTriageData | null>(null);
  const [copied, setCopied] = useState(false);
  const [showExplain, setShowExplain] = useState(false);

  async function handleTriage() {
    if (!fnId) return;
    setLoading(true);
    try {
      const data = await triagePR(fnId, prId, hops);
      setTriageData(data);
    } catch {
      // triagePR has built-in resilient fallback
    } finally {
      setLoading(false);
    }
  }

  function copyComment() {
    if (!triageData?.pr_comment_markdown) return;
    navigator.clipboard.writeText(triageData.pr_comment_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="page-container fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
          <RiFlashlightLine size={24} style={{ color: 'var(--accent)' }} />
          <h1 className="page-title" style={{ fontSize: '1.25rem', margin: 0 }}>
            PR Blast Radius & Autonomous Triage
          </h1>
          <span className="pill pill-primary" style={{ fontSize: '0.7rem' }}>
            Track 01: Agents That Act on Connected Data
          </span>
        </div>
        <p className="page-subtitle">
          Multi-hop impact analysis, policy compliance, and automated pull request action decisions powered by FalkorDB
        </p>
      </div>

      {/* Banner to PR Graph Agent */}
      <Link href="/pr-agent" style={{ textDecoration: 'none', display: 'block', marginBottom: '1.25rem' }}>
        <div style={{
          padding: '0.875rem 1.25rem', borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(168,85,247,0.12) 100%)',
          border: '1px solid rgba(99,102,241,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '0.75rem',
          transition: 'all 0.2s ease', cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem' }}>⚡</span>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Try the Interactive PR Graph Agent (Track 01 Core Experience)
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                Features real-time 2D Graph Visualizer, 5 FastMCP Protocol Tool Traces, Depth Tiers (d1/d2/d3), and Live GitHub PR import.
              </div>
            </div>
          </div>
          <span className="btn btn-primary btn-sm" style={{ gap: '0.3rem', fontSize: '0.75rem', flexShrink: 0 }}>
            Launch Agent <RiArrowRightLine size={14} />
          </span>
        </div>
      </Link>

      {/* Input Controls */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          {/* Target Symbol */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
              Modified Symbol / Function ID
            </label>
            <input
              className="input"
              value={fnId}
              onChange={e => setFnId(e.target.value)}
              placeholder="e.g. auth::validate_jwt"
            />
          </div>

          {/* PR Identifier */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
              Pull Request Reference
            </label>
            <input
              className="input"
              value={prId}
              onChange={e => setPrId(e.target.value)}
              placeholder="e.g. PR-142"
            />
          </div>

          {/* Max Traversal Hops */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Max Traversal Depth
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontFamily: 'var(--font-mono)' }}>
                {hops} hops
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={hops}
              onChange={e => setHops(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>
        </div>

        {/* Quick Picks */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick Test Cases:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {QUICK_PICK_FNS.map(item => (
              <button
                key={item.id}
                className={`btn btn-sm ${fnId === item.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.72rem' }}
                onClick={() => setFnId(item.id)}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: item.risk === 'high' ? 'var(--danger)' : item.risk === 'medium' ? 'var(--warning)' : 'var(--success)'
                }} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          className="btn btn-primary"
          onClick={handleTriage}
          disabled={loading || !fnId}
          style={{ width: '100%', justifyContent: 'center', fontWeight: 700, padding: '0.75rem' }}
        >
          {loading ? <RiLoader4Line size={16} className="spin" /> : <RiFlashlightLine size={16} />}
          Execute Autonomous PR Triage Action
        </button>
      </div>

      {/* Results View */}
      {triageData && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Verdict Banner */}
          <div style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            background: triageData.verdict === 'BLOCKED'
              ? 'rgba(239,68,68,0.12)'
              : triageData.verdict === 'WARNING'
              ? 'rgba(245,158,11,0.12)'
              : 'rgba(16,185,129,0.12)',
            border: `1px solid ${
              triageData.verdict === 'BLOCKED'
                ? 'rgba(239,68,68,0.35)'
                : triageData.verdict === 'WARNING'
                ? 'rgba(245,158,11,0.35)'
                : 'rgba(16,185,129,0.35)'
            }`,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: triageData.verdict === 'BLOCKED' ? 'rgba(239,68,68,0.2)' : triageData.verdict === 'WARNING' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: triageData.verdict === 'BLOCKED' ? 'var(--danger)' : triageData.verdict === 'WARNING' ? 'var(--warning)' : 'var(--success)',
                }}>
                  {triageData.verdict === 'BLOCKED' ? <RiShieldLine size={20} /> : triageData.verdict === 'WARNING' ? <RiAlertLine size={20} /> : <RiCheckLine size={20} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      VERDICT: {triageData.verdict}
                    </span>
                    <span className={`pill ${triageData.verdict === 'BLOCKED' ? 'pill-danger' : triageData.verdict === 'WARNING' ? 'pill-warning' : 'pill-success'}`}>
                      Risk Score: {triageData.risk_score} / 100
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Autonomous policy enforcement decision for {triageData.pr_id}
                  </div>
                </div>
              </div>

              {/* Sandbox info */}
              {triageData.sandbox && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: '0.75rem',
                }}>
                  <RiGitBranchLine size={13} style={{ color: 'var(--accent)' }} />
                  <span style={{ color: 'var(--text-muted)' }}>PR Sandbox Cloned:</span>
                  <code style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{triageData.sandbox}</code>
                </div>
              )}
            </div>

            {/* Reasons List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingLeft: '0.5rem' }}>
              {triageData.reasons.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span style={{ color: triageData.verdict === 'BLOCKED' ? 'var(--danger)' : triageData.verdict === 'WARNING' ? 'var(--warning)' : 'var(--success)' }}>•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid-2">
            {/* Impacted APIs & Callers */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div className="section-header">
                <div className="section-title">
                  <RiNodeTree size={16} style={{ color: 'var(--primary)' }} />
                  Upstream Callers & Perimeter Exposure
                </div>
                <span className="pill pill-primary">{triageData.caller_count} Callers</span>
              </div>

              {/* Callers */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Transitive Callers ({hops} Hops)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {triageData.callers.map(c => (
                    <span key={c} style={{
                      padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)',
                      background: 'var(--primary-subtle)', border: '1px solid rgba(99,102,241,0.2)',
                      fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--primary-light)'
                    }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Impacted APIs */}
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Exposed API Perimeter
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {triageData.impacted_apis.map(api => (
                    <div key={api} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      fontSize: '0.75rem', fontFamily: 'var(--font-mono)',
                    }}>
                      <span style={{ color: 'var(--text-primary)' }}>{api}</span>
                      <span className="pill pill-warning" style={{ fontSize: '0.62rem' }}>Public Route</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Governance & CVE Risks */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div className="section-header">
                <div className="section-title">
                  <RiShieldLine size={16} style={{ color: 'var(--danger)' }} />
                  ADR Compliance & CVE Reachability
                </div>
              </div>

              {/* ADRs & Policy Enforcement */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Architecture Decision Records (ADR Governance)
                </div>
                {triageData.adr_details && triageData.adr_details.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {triageData.adr_details.map(adr => {
                      const isViolation = adr.status === 'VIOLATION';
                      const isWarning = adr.status === 'WARNING';
                      const borderColor = isViolation ? 'rgba(239,68,68,0.3)' : isWarning ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)';
                      const badgeClass = isViolation ? 'pill pill-danger' : isWarning ? 'pill pill-warning' : 'pill pill-success';
                      return (
                        <div key={adr.id} style={{
                          padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-elevated)', border: `1px solid ${borderColor}`,
                          fontSize: '0.75rem',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                              <RiLockLine size={13} style={{ color: isViolation ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--success)' }} />
                              <span style={{ color: 'var(--text-primary)' }}>{adr.id}: {adr.title}</span>
                            </div>
                            <span className={badgeClass} style={{ fontSize: '0.62rem' }}>
                              {adr.status}
                            </span>
                          </div>
                          {adr.breach_reason && (
                            <div style={{
                              fontSize: '0.72rem',
                              color: isViolation ? '#fca5a5' : isWarning ? '#fcd34d' : 'var(--text-muted)',
                              marginTop: '0.2rem',
                            }}>
                              {adr.breach_reason}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : triageData.adr_constraints.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {triageData.adr_constraints.map(adr => (
                      <div key={adr} style={{
                        padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-elevated)', border: '1px solid rgba(6,182,212,0.25)',
                        fontSize: '0.75rem', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '0.5rem'
                      }}>
                        <RiLockLine size={13} />
                        <span>{adr}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No ADR constraints linked.</div>
                )}
              </div>

              {/* CVEs */}
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Transitive Vulnerabilities
                </div>
                {triageData.cve_risks.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {triageData.cve_risks.map(c => (
                      <div key={c.cve} style={{
                        padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                        display: 'flex', flexDirection: 'column', gap: '0.2rem',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
                            {c.cve} ({c.pkg})
                          </span>
                          <span className="pill pill-danger" style={{ fontSize: '0.62rem' }}>CVSS {c.cvss}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.impact}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>✓ No transitive CVE risks found in call graph.</div>
                )}
              </div>
            </div>
          </div>

          {/* Generated PR Review Comment */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div className="section-title">
                <RiTerminalBoxLine size={16} style={{ color: 'var(--accent)' }} />
                Generated Autonomous PR Review Comment
              </div>
              <button className="btn btn-ghost btn-sm" onClick={copyComment}>
                {copied ? <RiCheckLine size={13} style={{ color: 'var(--success)' }} /> : <RiFileCopyLine size={13} />}
                {copied ? 'Copied!' : 'Copy Markdown'}
              </button>
            </div>
            <div style={{
              background: '#090d16', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-md)', padding: '1rem',
              fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
              color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: 240, overflowY: 'auto'
            }}>
              {triageData.pr_comment_markdown}
            </div>
          </div>

          {/* FalkorDB Telemetry & EXPLAIN Plan */}
          <div className="glass-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--success)' }}>
                  <RiTimeLine size={13} /> FalkorDB Wall: <strong>{triageData.telemetry.wall_ms}ms</strong>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Graph: <code style={{ color: 'var(--primary-light)' }}>{triageData.telemetry.graph}</code>
                </span>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.72rem' }}
                onClick={() => setShowExplain(!showExplain)}
              >
                <RiCodeLine size={12} />
                GRAPH.EXPLAIN Plan {showExplain ? '▲' : '▼'}
              </button>
            </div>
            {showExplain && (
              <div className="cypher-block" style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: '#94a3b8' }}>
                <pre style={{ margin: 0, background: 'none', border: 'none', padding: 0, whiteSpace: 'pre-wrap' }}>
                  {triageData.telemetry.explain}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
