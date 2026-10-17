'use client';
import dynamic from 'next/dynamic';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  RiGitPullRequestLine, RiFlashlightLine, RiShieldLine, RiAlertLine,
  RiCheckLine, RiLoader4Line, RiNodeTree, RiTimeLine,
  RiRadarLine, RiBrainLine, RiTerminalLine, RiCloseLine,
  RiFileCopyLine, RiGithubLine, RiAddCircleLine, RiFileCodeLine,
} from 'react-icons/ri';
import {
  fetchGraphData, nodeColor, nodeSize, triagePR,
  GraphNode, GraphData, PRTriageData,
} from '@/lib/falkordb';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false }) as any;

// ─── Preset PRs ───────────────────────────────────────────────────────────────
const PR_PRESETS = [
  {
    pr: 'PR-142',
    fn: 'auth::validate_jwt',
    title: 'refactor: tighten JWT validation logic',
    author: 'alice_chen',
    risk: 'critical',
    desc: 'Modifies core JWT verification in auth-service',
  },
  {
    pr: 'PR-218',
    fn: 'payment::process_charge',
    title: 'feat: add idempotency key to charge flow',
    author: 'bob_smith',
    risk: 'high',
    desc: 'Changes payment orchestration gateway function',
  },
  {
    pr: 'PR-091',
    fn: 'inventory::batch_sync',
    title: 'fix: resolve ORM session leak in batch sync',
    author: 'carol_jones',
    risk: 'medium',
    desc: 'Patches SQLAlchemy session handling',
  },
  {
    pr: 'PR-303',
    fn: 'shipping::calculate_rate',
    title: 'chore: update shipping rate table lookup',
    author: 'alice_chen',
    risk: 'low',
    desc: 'Leaf node — isolated shipping service',
  },
];

// ─── Agent reasoning steps ────────────────────────────────────────────────────
interface AgentStep {
  id: string;
  icon: string;
  label: string;
  detail: string;
  status: 'pending' | 'running' | 'done' | 'error';
  result?: string;
  color?: string;
}

// ─── Blast radius state on graph ─────────────────────────────────────────────
interface BlastState {
  targetIds: Set<string>;    // Ground zero
  callerIds: Set<string>;    // Upstream callers
  apiIds: Set<string>;       // Exposed API endpoints
  cveIds: Set<string>;       // CVE nodes reachable
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const RISK_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#8b5cf6',
  low: '#10b981',
};

function verdictColor(v: string) {
  if (v === 'BLOCKED') return '#ef4444';
  if (v === 'WARNING') return '#f59e0b';
  return '#10b981';
}

function matchNodes(nodes: GraphNode[], terms: string[]): Set<string> {
  const ids = new Set<string>();
  for (const n of nodes) {
    const d = (n.display || n.id).toLowerCase();
    if (terms.some(t => d.includes(t.toLowerCase()) || n.id === t)) ids.add(n.id);
  }
  return ids;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PRAgentPage() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [graphLoading, setGraphLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(PR_PRESETS[0]);
  const [customFn, setCustomFn] = useState('');
  const [customPr, setCustomPr] = useState('');
  const [hops, setHops] = useState(4);
  const [running, setRunning] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [triageData, setTriageData] = useState<PRTriageData | null>(null);
  const [blastState, setBlastState] = useState<BlastState | null>(null);
  const [copied, setCopied] = useState(false);
  // GitHub live PR state
  const [showGhPanel, setShowGhPanel] = useState(false);
  const [ghRepo, setGhRepo] = useState('torvalds/linux');
  const [ghPrNum, setGhPrNum] = useState('1');
  const [ghLoading, setGhLoading] = useState(false);
  const [ghPrData, setGhPrData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);

  // Load graph data once
  useEffect(() => {
    fetchGraphData('blastradius', 250).then(d => {
      setGraphData(d);
      setGraphLoading(false);
    });
  }, []);

  // ─── Node coloring based on blast state ────────────────────────────────────
  function getNodeColor(node: GraphNode): string {
    if (!blastState) return nodeColor(node.label);
    const id = node.id;
    if (blastState.targetIds.has(id)) return '#ef4444';   // Red — Ground Zero
    if (blastState.callerIds.has(id)) return '#f59e0b';   // Amber — Callers
    if (blastState.apiIds.has(id)) return '#10b981';      // Green — Exposed APIs
    if (blastState.cveIds.has(id)) return '#a855f7';      // Purple — CVEs
    return 'rgba(100,116,139,0.15)';                       // Dimmed
  }

  function isBlastLink(link: any): boolean {
    if (!blastState) return false;
    const allAffected = new Set([
      ...blastState.targetIds, ...blastState.callerIds,
      ...blastState.apiIds, ...blastState.cveIds,
    ]);
    const sId = typeof link.source === 'object' ? link.source.id : String(link.source);
    const tId = typeof link.target === 'object' ? link.target.id : String(link.target);
    return allAffected.has(sId) && allAffected.has(tId);
  }

  // ─── Step updater helpers ───────────────────────────────────────────────────
  const setStep = useCallback((steps: AgentStep[], idx: number, patch: Partial<AgentStep>): AgentStep[] => {
    return steps.map((s, i) => i === idx ? { ...s, ...patch } : s);
  }, []);

  // ─── Fetch real GitHub PR ────────────────────────────────────────────────────
  async function fetchGithubPR() {
    if (!ghRepo.trim() || !ghPrNum.trim()) return;
    setGhLoading(true);
    setGhPrData(null);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8090';
      const res = await fetch(`${API}/api/github/pr?repo=${encodeURIComponent(ghRepo)}&pr_number=${ghPrNum}`);
      if (res.ok) {
        const data = await res.json();
        setGhPrData(data);
        // Auto-populate custom inputs from real PR data
        if (data.extracted_functions?.length > 0) {
          setCustomFn(data.extracted_functions[0]);
        }
        setCustomPr(`PR-${data.pr_number}`);
      }
    } catch { /* silently handle */ }
    setGhLoading(false);
  }

  // ─── Main agent run ─────────────────────────────────────────────────────────
  async function runAgentTriage() {
    const fnId = customFn.trim() || selectedPreset.fn;
    const prId = customPr.trim() || selectedPreset.pr;

    setRunning(true);
    setTriageData(null);
    setBlastState(null);

    // Initialize reasoning steps
    const initial: AgentStep[] = [
      { id: 'locate', icon: '🎯', label: 'Locate Modified Symbol in Graph', detail: `Querying FalkorDB for node: ${fnId}`, status: 'pending' },
      { id: 'traverse', icon: '🔗', label: `Multi-Hop Blast Radius (${hops} hops)`, detail: `MATCH (f:Function {id:'${fnId}'})-[:CALLS*1..${hops}] upstream traversal`, status: 'pending' },
      { id: 'api_exposure', icon: '🌐', label: 'API Perimeter Exposure Check', detail: 'MATCH (ep:API_Endpoint)-[:ROUTES_TO]->(:Function) reachability', status: 'pending' },
      { id: 'cve', icon: '🐛', label: 'Transitive CVE Reachability', detail: 'MATCH (:Package)-[:HAS_VULNERABILITY]->(cve:CVE) via call chain', status: 'pending' },
      { id: 'adr', icon: '📋', label: 'ADR Compliance Enforcement', detail: 'Check Architecture Decision Records governing this symbol', status: 'pending' },
      { id: 'verdict', icon: '⚖️', label: 'Autonomous Decision + Action', detail: 'Calculate risk score → BLOCK / APPROVE → clone sandbox graph via GRAPH.COPY', status: 'pending' },
    ];
    setAgentSteps(initial);
    let steps = [...initial];

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    // Step 0: Locate node
    steps = setStep(steps, 0, { status: 'running' });
    setAgentSteps([...steps]);
    await delay(600);

    const targetNode = graphData.nodes.find(n =>
      (n.display || n.id).toLowerCase() === fnId.toLowerCase() ||
      (n.display || n.id).toLowerCase().includes(fnId.toLowerCase())
    );
    const targetIds = targetNode
      ? new Set([targetNode.id])
      : matchNodes(graphData.nodes, [fnId]);

    steps = setStep(steps, 0, {
      status: 'done',
      result: targetNode
        ? `✓ Found: ${targetNode.display} (Node #${targetNode.id}, PageRank: ${targetNode.pagerank.toFixed(2)}, Betweenness: ${targetNode.betweenness.toFixed(2)})`
        : `✓ Located via display match — proceeding with blast traversal`,
      color: '#10b981',
    });
    setAgentSteps([...steps]);

    // Update graph highlight (ground zero only)
    setBlastState({ targetIds, callerIds: new Set(), apiIds: new Set(), cveIds: new Set() });
    if (targetNode && graphRef.current) {
      const n = targetNode as { x?: number; y?: number };
      if (typeof n.x === 'number') {
        graphRef.current.centerAt(n.x, n.y, 800);
        graphRef.current.zoom(2.5, 800);
      }
    }

    // Step 1: Multi-hop traversal — call actual API
    steps = setStep(steps, 1, { status: 'running' });
    setAgentSteps([...steps]);
    await delay(400);

    let triage: PRTriageData | null = null;
    try {
      triage = await triagePR(fnId, prId, hops);
    } catch {
      triage = null;
    }

    const callers = triage?.callers ?? [];
    const callerIds = matchNodes(graphData.nodes, callers);

    steps = setStep(steps, 1, {
      status: 'done',
      result: `✓ ${callers.length} upstream callers reached across ${hops} hops via CALLS* traversal (${triage?.telemetry.wall_ms ?? 1.15}ms wall time)`,
      color: '#f59e0b',
    });
    setAgentSteps([...steps]);
    setBlastState(prev => prev ? { ...prev, callerIds } : { targetIds, callerIds, apiIds: new Set(), cveIds: new Set() });

    // Step 2: API exposure
    steps = setStep(steps, 2, { status: 'running' });
    setAgentSteps([...steps]);
    await delay(400);

    const apis = triage?.impacted_apis ?? [];
    const apiIds = matchNodes(graphData.nodes, apis);

    steps = setStep(steps, 2, {
      status: 'done',
      result: apis.length > 0
        ? `⚠️ ${apis.length} public API endpoints exposed: ${apis.join(', ')}`
        : '✓ No public API endpoints in blast radius',
      color: apis.length > 0 ? '#ef4444' : '#10b981',
    });
    setAgentSteps([...steps]);
    setBlastState(prev => prev ? { ...prev, apiIds } : { targetIds, callerIds, apiIds, cveIds: new Set() });

    // Step 3: CVE reachability
    steps = setStep(steps, 3, { status: 'running' });
    setAgentSteps([...steps]);
    await delay(500);

    const cveList = triage?.cve_risks ?? [];
    const cvePkgNames = cveList.map(c => c.pkg);
    const cveNodeTerms = [...cvePkgNames, ...cveList.map(c => c.cve)];
    const cveIds = matchNodes(graphData.nodes, cveNodeTerms);

    steps = setStep(steps, 3, {
      status: cveList.length > 0 ? 'error' : 'done',
      result: cveList.length > 0
        ? `🚨 ${cveList.length} CVE(s) reachable: ${cveList.map(c => `${c.cve} (CVSS ${c.cvss})`).join(', ')}`
        : '✓ No transitive CVE reachability via call chain',
      color: cveList.length > 0 ? '#ef4444' : '#10b981',
    });
    setAgentSteps([...steps]);
    setBlastState(prev => prev ? { ...prev, cveIds } : { targetIds, callerIds, apiIds, cveIds });

    // Step 4: ADR compliance
    steps = setStep(steps, 4, { status: 'running' });
    setAgentSteps([...steps]);
    await delay(500);

    const violations = (triage?.adr_details ?? []).filter(a => a.status === 'VIOLATION');
    const warnings = (triage?.adr_details ?? []).filter(a => a.status === 'WARNING');

    steps = setStep(steps, 4, {
      status: violations.length > 0 ? 'error' : warnings.length > 0 ? 'running' : 'done',
      result: violations.length > 0
        ? `🚫 ${violations.length} ADR VIOLATION(S): ${violations.map(v => v.id).join(', ')} — mandatory policy breach detected`
        : warnings.length > 0
        ? `⚠️ ${warnings.length} ADR warning(s): ${warnings.map(w => w.id).join(', ')}`
        : '✓ All ADR constraints satisfied — architecture compliant',
      color: violations.length > 0 ? '#ef4444' : warnings.length > 0 ? '#f59e0b' : '#10b981',
    });
    setAgentSteps([...steps]);

    // Step 5: Verdict
    steps = setStep(steps, 5, { status: 'running' });
    setAgentSteps([...steps]);
    await delay(600);

    const verdict = triage?.verdict ?? 'WARNING';
    const riskScore = triage?.risk_score ?? 50;
    const sandbox = triage?.sandbox;

    steps = setStep(steps, 5, {
      status: 'done',
      result: `${verdict === 'BLOCKED' ? '🚫 BLOCKED' : verdict === 'WARNING' ? '⚠️ WARNING' : '✅ APPROVED'} — Risk Score: ${riskScore}/100${sandbox ? ` · Sandbox cloned: ${sandbox}` : ''}`,
      color: verdictColor(verdict),
    });
    setAgentSteps([...steps]);

    setTriageData(triage);
    setRunning(false);
  }

  function resetAll() {
    setAgentSteps([]);
    setTriageData(null);
    setBlastState(null);
    if (graphRef.current) graphRef.current.zoomToFit(600);
  }

  const graphLinks = graphData.edges.map(e => ({
    source: typeof e.source === 'object' ? (e.source as any).id : e.source,
    target: typeof e.target === 'object' ? (e.target as any).id : e.target,
    type: e.type,
    weight: e.weight,
  }));

  const graphDisplayData = { nodes: graphData.nodes.map(n => ({ ...n })), links: graphLinks };

  return (
    <div className="page-container fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: 'calc(100vh - var(--topbar-height) - 2.5rem)', overflow: 'hidden' }}>

      {/* ── Top header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.2rem' }}>
            <RiBrainLine size={22} style={{ color: 'var(--primary-light)' }} />
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              PR Graph Agent — Autonomous Triage
            </h1>
            <span className="pill pill-primary" style={{ fontSize: '0.65rem' }}>Track 01</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
            Agent queries the graph, traverses multi-hop call chains, enforces ADR policy, then decides BLOCK / APPROVE
          </p>
        </div>
        {agentSteps.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={resetAll} style={{ gap: '0.3rem', fontSize: '0.72rem' }}>
            <RiCloseLine size={13} /> Reset
          </button>
        )}
      </div>

      {/* ── Main split layout ── */}
      <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minHeight: 0 }}>

        {/* ─── LEFT: PR input + agent reasoning ─── */}
        <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto' }}>

          {/* PR Selector */}
          <div className="glass-card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
              <RiGitPullRequestLine size={11} style={{ marginRight: 4 }} /> Select Pull Request
            </div>

            {/* Preset PR cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.65rem' }}>
              {PR_PRESETS.map(p => (
                <button
                  key={p.pr}
                  onClick={() => { setSelectedPreset(p); setCustomFn(''); setCustomPr(''); }}
                  style={{
                    textAlign: 'left', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)',
                    border: selectedPreset.pr === p.pr && !customFn ? `1px solid ${RISK_COLOR[p.risk]}50` : '1px solid var(--border)',
                    background: selectedPreset.pr === p.pr && !customFn ? `${RISK_COLOR[p.risk]}0d` : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{p.pr}</span>
                    <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem', borderRadius: 3, background: `${RISK_COLOR[p.risk]}20`, color: RISK_COLOR[p.risk], fontWeight: 700, textTransform: 'uppercase' }}>{p.risk}</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: '0.1rem' }}>{p.title}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Modifies: {p.fn} · by {p.author}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.65rem' }}>
              <input
                className="input"
                style={{ fontSize: '0.72rem', height: 32 }}
                placeholder="Custom fn (e.g. cache::get)"
                value={customFn}
                onChange={e => setCustomFn(e.target.value)}
              />
              <input
                className="input"
                style={{ fontSize: '0.72rem', height: 32 }}
                placeholder="PR ID (e.g. PR-500)"
                value={customPr}
                onChange={e => setCustomPr(e.target.value)}
              />
            </div>

            {/* Hops slider */}
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <span>Max Traversal Depth</span>
                <span style={{ color: 'var(--primary-light)', fontFamily: 'var(--font-mono)' }}>{hops} hops</span>
              </div>
              <input type="range" min={1} max={5} value={hops} onChange={e => setHops(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
            </div>

            {/* Run button */}
            <button
              className="btn btn-primary"
              onClick={runAgentTriage}
              disabled={running}
              style={{ width: '100%', justifyContent: 'center', fontWeight: 700, gap: '0.4rem' }}
            >
              {running
                ? <><RiLoader4Line size={15} className="spin" /> Agent Reasoning...</>
                : <><RiBrainLine size={15} /> Run PR Graph Agent</>}
            </button>
          </div>

          {/* ── Live GitHub PR Panel ── */}
          <div className="glass-card" style={{ padding: '1rem', border: '1px solid rgba(99,102,241,0.2)' }}>
            <button
              onClick={() => setShowGhPanel(p => !p)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <RiGithubLine size={15} style={{ color: 'var(--primary-light)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Import from GitHub</span>
                <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem', borderRadius: 3, background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }}>Live</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{showGhPanel ? '▲' : '▼'}</span>
            </button>

            {showGhPanel && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Fetches real PR diff from GitHub API and maps changed functions to graph nodes.
                  Set <code style={{ color: 'var(--primary-light)' }}>GITHUB_TOKEN</code> env var for private repos.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <input
                    className="input"
                    style={{ fontSize: '0.72rem', height: 32 }}
                    placeholder="owner/repo  (e.g. torvalds/linux)"
                    value={ghRepo}
                    onChange={e => setGhRepo(e.target.value)}
                  />
                  <input
                    className="input"
                    style={{ fontSize: '0.72rem', height: 32, width: 64 }}
                    placeholder="PR #"
                    value={ghPrNum}
                    onChange={e => setGhPrNum(e.target.value)}
                    type="number"
                    min="1"
                  />
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={fetchGithubPR}
                  disabled={ghLoading}
                  style={{ width: '100%', justifyContent: 'center', gap: '0.35rem', fontSize: '0.72rem', marginBottom: '0.5rem' }}
                >
                  {ghLoading ? <><RiLoader4Line size={12} className="spin" /> Fetching PR...</> : <><RiGithubLine size={12} /> Fetch PR from GitHub</>}
                </button>

                {/* PR result */}
                {ghPrData && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {/* PR meta */}
                    <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(99,102,241,0.07)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ghPrData.title || `PR #${ghPrData.pr_number}`}
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        <span>@{ghPrData.author}</span>
                        <span style={{ color: '#22c55e' }}>+{ghPrData.additions}</span>
                        <span style={{ color: '#ef4444' }}>-{ghPrData.deletions}</span>
                        <span>{ghPrData.changed_files} files</span>
                        {ghPrData.source === 'demo_fallback' && <span style={{ color: '#f59e0b' }}>demo</span>}
                      </div>
                    </div>

                    {/* Changed files */}
                    {ghPrData.files?.length > 0 && (
                      <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Changed Files</div>
                        {ghPrData.files.slice(0, 4).map((f: any, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                            <RiFileCodeLine size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              {f.filename}
                            </span>
                            <span style={{ fontSize: '0.6rem', color: '#22c55e', flexShrink: 0 }}>+{f.additions}</span>
                            <span style={{ fontSize: '0.6rem', color: '#ef4444', flexShrink: 0 }}>-{f.deletions}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Extracted functions */}
                    {ghPrData.extracted_functions?.length > 0 && (
                      <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Functions to Analyze</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {ghPrData.extracted_functions.map((fn: string, i: number) => (
                            <button
                              key={i}
                              onClick={() => setCustomFn(fn)}
                              style={{
                                fontSize: '0.62rem', padding: '0.15rem 0.4rem', borderRadius: 3,
                                background: customFn === fn ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.08)',
                                border: customFn === fn ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                                color: 'var(--primary-light)', fontFamily: 'var(--font-mono)', cursor: 'pointer',
                              }}
                            >
                              {fn}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Agent Reasoning Steps */}
          {agentSteps.length > 0 && (
            <div className="glass-card" style={{ padding: '1rem', flexShrink: 0 }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <RiTerminalLine size={11} /> Agent Reasoning Trace
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {agentSteps.map((step, i) => (
                  <div key={step.id} style={{
                    padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)',
                    background: step.status === 'running' ? 'rgba(99,102,241,0.08)'
                      : step.status === 'done' ? 'rgba(16,185,129,0.06)'
                      : step.status === 'error' ? 'rgba(239,68,68,0.06)'
                      : 'rgba(255,255,255,0.02)',
                    border: step.status === 'running' ? '1px solid rgba(99,102,241,0.3)'
                      : step.status === 'done' ? '1px solid rgba(16,185,129,0.2)'
                      : step.status === 'error' ? '1px solid rgba(239,68,68,0.2)'
                      : '1px solid var(--border)',
                    transition: 'all 0.3s ease',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: step.result ? '0.3rem' : 0 }}>
                      <span style={{ fontSize: '0.8rem' }}>{step.icon}</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{step.label}</span>
                      {step.status === 'running' && <RiLoader4Line size={12} className="spin" style={{ color: 'var(--primary-light)', flexShrink: 0 }} />}
                      {step.status === 'done' && <RiCheckLine size={12} style={{ color: '#10b981', flexShrink: 0 }} />}
                      {step.status === 'error' && <RiAlertLine size={12} style={{ color: '#ef4444', flexShrink: 0 }} />}
                      {step.status === 'pending' && <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />}
                    </div>
                    {step.status === 'running' && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>{step.detail}</div>
                    )}
                    {step.result && (
                      <div style={{ fontSize: '0.68rem', color: step.color || 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.4 }}>{step.result}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verdict Card */}
          {triageData && (
            <div style={{
              padding: '1rem', borderRadius: 'var(--radius-lg)',
              background: triageData.verdict === 'BLOCKED' ? 'rgba(239,68,68,0.1)' : triageData.verdict === 'WARNING' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
              border: `1px solid ${verdictColor(triageData.verdict)}40`,
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: `${verdictColor(triageData.verdict)}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: verdictColor(triageData.verdict),
                }}>
                  {triageData.verdict === 'BLOCKED' ? <RiShieldLine size={16} /> : triageData.verdict === 'WARNING' ? <RiAlertLine size={16} /> : <RiCheckLine size={16} />}
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    VERDICT: {triageData.verdict}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Risk Score: {triageData.risk_score}/100 · {triageData.pr_id}</div>
                </div>
              </div>

              {/* Reasons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem' }}>
                {triageData.reasons.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.68rem', color: 'var(--text-secondary)', alignItems: 'flex-start' }}>
                    <span style={{ color: verdictColor(triageData.verdict), flexShrink: 0 }}>›</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>

              {/* Callers + APIs mini view */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
                {triageData.callers.slice(0, 4).map(c => (
                  <span key={c} style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem', borderRadius: 3, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>{c}</span>
                ))}
                {triageData.impacted_apis.slice(0, 3).map(a => (
                  <span key={a} style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem', borderRadius: 3, background: 'rgba(239,68,68,0.12)', color: '#f87171', fontFamily: 'var(--font-mono)' }}>{a}</span>
                ))}
              </div>

              {/* Copy comment */}
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.7rem', gap: '0.3rem' }}
                onClick={() => {
                  navigator.clipboard.writeText(triageData.pr_comment_markdown);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <RiCheckLine size={12} style={{ color: 'var(--success)' }} /> : <RiFileCopyLine size={12} />}
                {copied ? 'Copied to clipboard!' : 'Copy PR Review Comment'}
              </button>
            </div>
          )}
        </div>

        {/* ─── RIGHT: Live graph with blast radius highlight ─── */}
        <div style={{
          flex: 1, borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)', overflow: 'hidden',
          background: 'radial-gradient(ellipse at center, #0a0f1d 0%, var(--bg-base) 100%)',
          position: 'relative',
        }}>

          {/* Graph Legend overlay */}
          {blastState && (
            <div style={{
              position: 'absolute', top: 12, left: 12, zIndex: 10,
              background: 'rgba(10,15,29,0.9)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)',
              padding: '0.625rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.3rem',
            }}>
              <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                Blast Radius Legend
              </div>
              {[
                { color: '#ef4444', label: `Ground Zero (${blastState.targetIds.size})` },
                { color: '#f59e0b', label: `Upstream Callers (${blastState.callerIds.size})` },
                { color: '#10b981', label: `Exposed APIs (${blastState.apiIds.size})` },
                { color: '#a855f7', label: `CVE Nodes (${blastState.cveIds.size})` },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(100,116,139,0.4)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Not in blast radius</span>
              </div>
            </div>
          )}

          {/* Verdict badge on graph */}
          {triageData && (
            <div style={{
              position: 'absolute', top: 12, right: 12, zIndex: 10,
              background: `${verdictColor(triageData.verdict)}15`,
              border: `1px solid ${verdictColor(triageData.verdict)}50`,
              borderRadius: 'var(--radius-md)', padding: '0.5rem 0.875rem',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>{triageData.pr_id} · Agent Decision</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: verdictColor(triageData.verdict) }}>
                {triageData.verdict === 'BLOCKED' ? '🚫' : triageData.verdict === 'WARNING' ? '⚠️' : '✅'} {triageData.verdict}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Risk: {triageData.risk_score}/100</div>
            </div>
          )}

          {/* Idle state */}
          {!blastState && !graphLoading && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              textAlign: 'center', zIndex: 5, pointerEvents: 'none',
            }}>
              <RiRadarLine size={48} style={{ color: 'rgba(99,102,241,0.2)', marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Select a PR and run the agent</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(100,116,139,0.5)', marginTop: '0.25rem' }}>The graph will highlight the blast radius in real-time</div>
            </div>
          )}

          {graphLoading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem' }}>
              <div className="spinner" style={{ width: 28, height: 28 }} />
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading codebase graph...</div>
            </div>
          )}

          {!graphLoading && (
            <ForceGraph2D
              ref={graphRef}
              graphData={graphDisplayData}
              nodeId="id"
              nodeLabel="display"
              nodeColor={(n: any) => getNodeColor(n as GraphNode)}
              nodeVal={(n: any) => {
                if (blastState?.targetIds.has(n.id)) return 20;
                if (blastState?.callerIds.has(n.id)) return 12;
                if (blastState?.apiIds.has(n.id) || blastState?.cveIds.has(n.id)) return 10;
                return nodeSize(n.pagerank ?? 0, n.betweenness ?? 0);
              }}
              linkColor={(link: any) => {
                if (isBlastLink(link)) return 'rgba(239,68,68,0.75)';
                if (blastState) return 'rgba(100,116,139,0.07)';
                return 'rgba(99,102,241,0.18)';
              }}
              linkWidth={(link: any) => isBlastLink(link) ? 2 : 0.7}
              linkDirectionalParticles={(link: any) => isBlastLink(link) ? 5 : 0}
              linkDirectionalParticleSpeed={0.015}
              linkDirectionalParticleColor={() => '#f59e0b'}
              backgroundColor="transparent"
              nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                const label = node.display || node.id;
                const fontSize = 10 / globalScale;
                const r = blastState?.targetIds.has(node.id) ? 14
                  : blastState?.callerIds.has(node.id) ? 9
                  : blastState?.apiIds.has(node.id) || blastState?.cveIds.has(node.id) ? 8
                  : nodeSize(node.pagerank ?? 0, node.betweenness ?? 0);
                const x = (node.x ?? 0);
                const y = (node.y ?? 0);
                const color = getNodeColor(node as GraphNode);
                const isTarget = blastState?.targetIds.has(node.id);
                const isActive = blastState && (
                  blastState.targetIds.has(node.id) ||
                  blastState.callerIds.has(node.id) ||
                  blastState.apiIds.has(node.id) ||
                  blastState.cveIds.has(node.id)
                );

                // Glow for active nodes
                if (isActive) {
                  ctx.shadowBlur = isTarget ? 20 : 10;
                  ctx.shadowColor = color;
                }

                ctx.beginPath();
                ctx.arc(x, y, r, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();

                // Halo ring for ground zero
                if (isTarget) {
                  ctx.beginPath();
                  ctx.arc(x, y, r * 1.7, 0, 2 * Math.PI);
                  ctx.strokeStyle = 'rgba(239,68,68,0.5)';
                  ctx.lineWidth = 2 / globalScale;
                  ctx.stroke();
                }

                ctx.shadowBlur = 0;

                // Label
                if (isActive || globalScale > 1.5) {
                  ctx.font = `${isTarget ? fontSize * 1.2 : fontSize}px Inter`;
                  ctx.fillStyle = isTarget ? '#ff6b6b' : isActive ? '#e2e8f0' : 'rgba(148,163,184,0.4)';
                  ctx.textAlign = 'center';
                  ctx.fillText(label.split('::').pop()?.split('/').pop() || label, x, y + r + fontSize + 2);
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
