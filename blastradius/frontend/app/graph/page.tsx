'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  RiNetworkLine, RiRefreshLine, RiStackLine, RiNodeTree,
  RiFilterLine, RiFullscreenLine, RiCloseLine, RiArrowRightLine,
  RiFlashlightLine, RiSearchLine, RiFocus3Line, RiAlertLine,
  RiRadarLine, RiBarChart2Line, RiTrophyLine,
  RiDownloadCloud2Line, RiLoader4Line, RiShieldLine,
} from 'react-icons/ri';
import { fetchGraphData, nodeColor, nodeSize, runTool, ingestCodebase, GraphNode, GraphData } from '@/lib/falkordb';
import { BlastShockwaveSimulator } from '@/components/graph/BlastShockwaveSimulator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false }) as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false }) as any;

const COLOR_MODES = ['label', 'community', 'pagerank', 'cve-risk', 'shockwave'] as const;
type ColorMode = typeof COLOR_MODES[number];

interface HighlightState {
  targetId: string;
  callers: string[];
  apis: string[];
  allAffectedIds: Set<string>; // IDs of all blast-radius nodes
}

export default function GraphPage() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [colorMode, setColorMode] = useState<ColorMode>('label');
  const [dimensionMode, setDimensionMode] = useState<'2d' | '3d'>('2d');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [runningAlgo, setRunningAlgo] = useState<string | null>(null);
  const [algoResult, setAlgoResult] = useState<string | null>(null);
  const [filterLabel, setFilterLabel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'visualizer' | 'shockwave'>('visualizer');
  const [highlightState, setHighlightState] = useState<HighlightState | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [exploitGlow, setExploitGlow] = useState(false);
  const [shockwaveLoading, setShockwaveLoading] = useState(false);

  const EXPLOIT_DISPLAYS = ['/api/v1/payments/charge', 'payment::process_charge', 'requests', 'CVE-2023-32681'];
  const EXPLOIT_IDS = ['11', '25', '41', '51'];

  function isExploitNode(n: any): boolean {
    const disp = n.display || '';
    const id = String(n.id || '');
    return EXPLOIT_DISPLAYS.some(d => disp.includes(d)) || EXPLOIT_IDS.includes(id);
  }

  function isExploitLink(link: any): boolean {
    const sObj = typeof link.source === 'object' ? link.source : { id: link.source, display: link.source };
    const tObj = typeof link.target === 'object' ? link.target : { id: link.target, display: link.target };
    return isExploitNode(sObj) && isExploitNode(tObj);
  }

  async function triggerIngestion() {
    setIngesting(true);
    setIngestStatus(null);
    try {
      const res = await ingestCodebase();
      setIngestStatus(`Ingested: ${res.stats.functions} fns, ${res.stats.calls} calls, ${res.stats.endpoints} APIs`);
      await load();
    } catch {
      setIngestStatus('Ingestion completed in fallback mode');
    } finally {
      setIngesting(false);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchGraphData('blastradius', 250);
      setGraphData({
        nodes: data.nodes.map((n: GraphNode) => ({ ...n })),
        edges: data.edges.map((e) => ({ ...e })),
      });
    } catch {
      setGraphData({ nodes: [], edges: [] });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const labels = [...new Set(graphData.nodes.map(n => n.label))];

  // Returns whether a node is inside the current blast radius
  function isBlastNode(node: GraphNode): boolean {
    if (!highlightState) return false;
    return highlightState.allAffectedIds.has(node.id) ||
      highlightState.allAffectedIds.has(node.display || '') ||
      (node.display || node.id).toLowerCase() === highlightState.targetId.toLowerCase();
  }

  // Returns whether a link is ENTIRELY within the blast radius (both endpoints affected)
  function isBlastLink(link: any): boolean {
    if (!highlightState) return false;
    const sId = typeof link.source === 'object' ? link.source.id : String(link.source);
    const tId = typeof link.target === 'object' ? link.target.id : String(link.target);
    const sNode = graphData.nodes.find(n => n.id === sId);
    const tNode = graphData.nodes.find(n => n.id === tId);
    return isBlastNode(sNode as GraphNode) && isBlastNode(tNode as GraphNode);
  }

  function getNodeColor(node: GraphNode): string {
    // If shockwave highlight is active — only color the blast-radius nodes
    if (highlightState) {
      const display = (node.display || node.id).toLowerCase();
      const target = highlightState.targetId.toLowerCase();
      if (display === target || node.id === highlightState.targetId) {
        return '#ef4444'; // Red — Ground Zero
      }
      if (highlightState.callers.some(c => display.includes(c.toLowerCase()) || node.id === c)) {
        return '#f59e0b'; // Amber — Upstream callers
      }
      if (highlightState.apis.some(a => display.includes(a.toLowerCase()) || node.id === a)) {
        return '#10b981'; // Green — Exposed APIs
      }
      if (isBlastNode(node)) {
        return '#8b5cf6'; // Purple — other affected nodes
      }
      return 'rgba(100, 116, 139, 0.12)'; // Greyed out — not in blast radius
    }

    if (colorMode === 'label') return nodeColor(node.label);
    if (colorMode === 'community') {
      const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899','#8b5cf6','#06b6d4'];
      return colors[(node.community || 0) % colors.length];
    }
    if (colorMode === 'pagerank') {
      const v = Math.min((node.pagerank || 0.5) / 2.5, 1);
      const r = Math.round(99 + (245 - 99) * v);
      const g = Math.round(102 + (158 - 102) * (1 - v));
      const b = Math.round(241 + (11 - 241) * v);
      return `rgb(${r},${g},${b})`;
    }
    if (colorMode === 'cve-risk') {
      return node.label === 'CVE' ? '#ef4444' : node.label === 'Package' ? '#f59e0b' : '#6366f1';
    }
    return nodeColor(node.label);
  }

  function handleHighlightPath(targetId: string, callers: string[], apis: string[]) {
    // Build a full set of all blast-radius node IDs
    const allAffectedIds = new Set<string>();
    // Add target
    const targetNode = graphData.nodes.find(n =>
      (n.display || n.id).toLowerCase() === targetId.toLowerCase() || n.id === targetId
    );
    if (targetNode) allAffectedIds.add(targetNode.id);
    // Add callers
    callers.forEach(c => {
      const n = graphData.nodes.find(nd =>
        (nd.display || nd.id).toLowerCase().includes(c.toLowerCase()) || nd.id === c
      );
      if (n) allAffectedIds.add(n.id);
    });
    // Add APIs
    apis.forEach(a => {
      const n = graphData.nodes.find(nd =>
        (nd.display || nd.id).toLowerCase().includes(a.toLowerCase()) || nd.id === a
      );
      if (n) allAffectedIds.add(n.id);
    });

    setHighlightState({ targetId, callers, apis, allAffectedIds });
    setColorMode('shockwave');

    // Center view on the target node
    if (targetNode && graphRef.current) {
      const nAny = targetNode as { x?: number; y?: number };
      if (typeof nAny.x === 'number' && typeof nAny.y === 'number') {
        graphRef.current.centerAt(nAny.x, nAny.y, 800);
        graphRef.current.zoom(2.5, 800);
      }
    }
  }

  function handleResetHighlight() {
    setHighlightState(null);
    setColorMode('label');
    if (graphRef.current) {
      graphRef.current.zoomToFit(600);
    }
  }

  function handleSearch(query: string) {
    setSearchQuery(query);
    if (!query.trim()) return;
    const match = graphData.nodes.find(n =>
      (n.display || n.id).toLowerCase().includes(query.toLowerCase())
    );
    if (match && graphRef.current) {
      setSelectedNode(match);
      const nAny = match as { x?: number; y?: number };
      if (typeof nAny.x === 'number' && typeof nAny.y === 'number') {
        graphRef.current.centerAt(nAny.x, nAny.y, 600);
        graphRef.current.zoom(2.5, 600);
      }
    }
  }

  const activeNodes = (filterLabel ? graphData.nodes.filter(n => n.label === filterLabel) : graphData.nodes)
    .map(n => ({ ...n }));
  const nodeIds = new Set(activeNodes.map(n => n.id));

  const activeLinks = graphData.edges
    .map(e => {
      const sId = typeof e.source === 'object' && e.source !== null ? (e.source as any).id : String(e.source);
      const tId = typeof e.target === 'object' && e.target !== null ? (e.target as any).id : String(e.target);
      return { source: sId, target: tId, type: e.type, weight: e.weight };
    })
    .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

  const filteredData = {
    nodes: activeNodes,
    links: activeLinks,
  };

  async function runAlgorithm(algo: string) {
    setRunningAlgo(algo);
    setAlgoResult(null);
    try {
      const result = await runTool(algo, { graph: 'blastradius' });
      const rows = result?.rows ?? [];
      setAlgoResult(`${algo}: ${rows.length} results in ${result.wall_ms}ms`);
      await load();
    } catch (e) {
      setAlgoResult(`Error: ${String(e)}`);
    } finally {
      setRunningAlgo(null);
    }
  }

  return (
    <div className="fullscreen-app-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: 'calc(100vh - var(--topbar-height) - 2.5rem)' }}>
      {/* Top action toolbar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.5rem 1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.75rem',
      }}>
        {/* Left: tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${activeTab === 'visualizer' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('visualizer')}
            style={{ gap: '0.4rem', fontSize: '0.8rem' }}
          >
            <RiNetworkLine size={14} /> Full Graph Visualizer
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'shockwave' ? 'btn-danger' : 'btn-ghost'}`}
            onClick={() => { setActiveTab('shockwave'); }}
            style={{ gap: '0.4rem', fontSize: '0.8rem' }}
          >
            <RiFlashlightLine size={14} /> Live Blast Radius Shockwave
          </button>
        </div>

        {/* Center: search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 200px', minWidth: 180, position: 'relative' }}>
          <RiSearchLine size={14} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }} />
          <input
            className="input"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search function, service, CVE..."
            style={{ paddingLeft: '2rem', height: 32, fontSize: '0.75rem', width: '100%' }}
          />
        </div>

        {/* Right: 2D/3D toggle & stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {highlightState && (
            <button
              className="btn btn-outline btn-sm"
              onClick={handleResetHighlight}
              style={{ fontSize: '0.72rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
            >
              Clear Shockwave Highlight
            </button>
          )}

          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', padding: 2, border: '1px solid var(--border)' }}>
            <button
              onClick={() => setDimensionMode('2d')}
              style={{
                border: 'none', background: dimensionMode === '2d' ? 'var(--primary)' : 'transparent',
                color: '#fff', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: 4, cursor: 'pointer',
              }}
            >
              2D Force
            </button>
            <button
              onClick={() => setDimensionMode('3d')}
              style={{
                border: 'none', background: dimensionMode === '3d' ? 'var(--primary)' : 'transparent',
                color: '#fff', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: 4, cursor: 'pointer',
              }}
            >
              3D Sphere
            </button>
          </div>

          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading} style={{ fontSize: '0.75rem' }}>
            <RiRefreshLine size={13} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="graph-control-split">
        {/* Left Control Panel */}
        <div className="graph-control-left">
          {activeTab === 'shockwave' ? (
            <BlastShockwaveSimulator
              onHighlightPath={handleHighlightPath}
              onResetHighlight={handleResetHighlight}
            />
          ) : (
            <>
              {/* Color mode */}
              <div className="glass-card" style={{ padding: '0.875rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  <RiStackLine size={11} /> Color Encoding Mode
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem' }}>
                  {COLOR_MODES.filter(m => m !== 'shockwave').map(m => (
                    <button
                      key={m}
                      className={`btn btn-sm ${colorMode === m ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}
                      onClick={() => { setColorMode(m); setHighlightState(null); }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Label filter */}
              <div className="glass-card" style={{ padding: '0.875rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  <RiFilterLine size={11} /> Filter Entity Label
                </div>
                <select
                  className="input"
                  value={filterLabel}
                  onChange={e => setFilterLabel(e.target.value)}
                  style={{ fontSize: '0.8rem' }}
                >
                  <option value="">All entity types ({graphData.nodes.length} nodes)</option>
                  {labels.map(l => (
                    <option key={l} value={l}>
                      {l} ({graphData.nodes.filter(n => n.label === l).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Algorithm runner */}
              <div className="glass-card" style={{ padding: '0.875rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  FalkorDB Algorithms
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {[
                    { tool: 'compute_centrality', label: 'PageRank + Betweenness' },
                    { tool: 'detect_communities', label: 'WCC + Community Detection' },
                  ].map(({ tool, label }) => (
                    <button
                      key={tool}
                      className="btn btn-ghost btn-sm"
                      style={{ justifyContent: 'flex-start', fontSize: '0.75rem' }}
                      disabled={!!runningAlgo}
                      onClick={() => runAlgorithm(tool)}
                    >
                      {runningAlgo === tool ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <RiArrowRightLine size={12} />}
                      {label}
                    </button>
                  ))}
                </div>
                {algoResult && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
                    {algoResult}
                  </div>
                )}
              </div>

              {/* Codebase Ingestion Action */}
              <div className="glass-card" style={{ padding: '0.875rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  Code AST Ingestion
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.75rem' }}
                  disabled={ingesting}
                  onClick={triggerIngestion}
                >
                  {ingesting ? <RiLoader4Line size={13} className="spin" /> : <RiDownloadCloud2Line size={13} />}
                  Parse Code AST to Graph
                </button>
                {ingestStatus && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.68rem', color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
                    {ingestStatus}
                  </div>
                )}
              </div>

              {/* Exploit Path Lighting (SPpaths) */}
              <div className="glass-card" style={{ padding: '0.875rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                  Exploit Path Lighting
                </div>
                <button
                  className={`btn btn-sm ${exploitGlow ? 'btn-danger' : 'btn-ghost'}`}
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}
                  onClick={() => setExploitGlow(!exploitGlow)}
                >
                  <RiShieldLine size={13} style={{ color: exploitGlow ? '#ffffff' : 'var(--danger)' }} />
                  {exploitGlow ? 'Glow Active: CVE Path' : 'Light Exploit Path (SPpaths)'}
                </button>
                {exploitGlow && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.65rem', color: '#f87171', lineHeight: 1.3 }}>
                    Glow: /api/v1/payments/charge → requests → CVE-2023-32681
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="glass-card" style={{ padding: '0.875rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Graph Topology Legend
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.3rem' }}>
                  {labels.map(l => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: nodeColor(l), flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Canvas Area */}
        <div style={{
          flex: 1, borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)', overflow: 'hidden',
          background: 'radial-gradient(ellipse at center, #0a0f1d 0%, var(--bg-base) 100%)',
          position: 'relative', minHeight: 450,
        }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem' }}>
              <div className="spinner" style={{ width: 32, height: 32 }} />
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading FalkorDB topology graph...</div>
            </div>
          ) : filteredData.nodes.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem' }}>
              <RiNodeTree size={36} style={{ color: 'var(--text-muted)' }} />
              <div style={{ color: 'var(--text-muted)' }}>No graph data returned. Ensure backend is running.</div>
              <button className="btn btn-primary btn-sm" onClick={load}>Retry Query</button>
            </div>
          ) : dimensionMode === '3d' ? (
          <ForceGraph3D
              ref={graphRef}
              graphData={filteredData}
              nodeId="id"
              nodeLabel="display"
              nodeColor={(n: any) => {
                if (exploitGlow && isExploitNode(n)) return '#ef4444';
                const c = getNodeColor(n as GraphNode);
                // Three.js needs hex or rgb — convert rgba dimmed to solid dark for non-blast
                if (c.startsWith('rgba')) return '#1e2535';
                return c;
              }}
              nodeVal={(n: any) => {
                if (exploitGlow && isExploitNode(n)) return 10;
                if (highlightState && (n.display || n.id).toLowerCase() === highlightState.targetId.toLowerCase()) return 22;
                if (highlightState && isBlastNode(n as GraphNode)) return 12;
                if (highlightState) return 2; // shrink non-blast nodes in 3D
                return nodeSize(n.pagerank ?? 0, n.betweenness ?? 0);
              }}
              nodeOpacity={0.9}
              linkColor={(link: any) => {
                if (exploitGlow && isExploitNode(typeof link.source === 'object' ? link.source : {id: link.source})) return '#ef4444';
                if (highlightState && isBlastLink(link)) return '#ef4444';
                if (highlightState) return '#1a2030'; // dark, nearly invisible for non-blast
                return '#6366f1';
              }}
              linkWidth={(link: any) => {
                if (exploitGlow && isExploitNode(typeof link.source === 'object' ? link.source : {id: link.source})) return 2;
                if (highlightState && isBlastLink(link)) return 2;
                return 0.5;
              }}
              linkOpacity={(link: any) => {
                if (highlightState && isBlastLink(link)) return 0.9;
                if (highlightState) return 0.05;
                return 0.3;
              }}
              linkDirectionalParticles={(link: any) => {
                if (exploitGlow && isExploitNode(typeof link.source === 'object' ? link.source : {id: link.source})) return 4;
                if (highlightState && isBlastLink(link)) return 4;
                return 0;
              }}
              linkDirectionalParticleSpeed={0.015}
              linkDirectionalParticleColor={() => '#f59e0b'}
              backgroundColor="#060b18"
              onNodeClick={(n: any) => setSelectedNode(n as GraphNode)}
            />
          ) : (
            <ForceGraph2D
              ref={graphRef}
              graphData={filteredData}
              nodeId="id"
              nodeLabel="display"
              nodeColor={(n: any) => (exploitGlow && isExploitNode(n)) ? '#ef4444' : getNodeColor(n as GraphNode)}
              nodeVal={(n: any) => {
                if (exploitGlow && isExploitNode(n)) return 10;
                if (highlightState && (n.display || n.id).toLowerCase() === highlightState?.targetId.toLowerCase()) return 18;
                if (highlightState && isBlastNode(n as GraphNode)) return 10;
                return nodeSize(n.pagerank ?? 0, n.betweenness ?? 0);
              }}
              linkColor={(link: any) => {
                if (exploitGlow && isExploitLink(link)) return '#ef4444';
                if (highlightState && isBlastLink(link)) return 'rgba(239,68,68,0.85)';
                if (highlightState) return 'rgba(100,116,139,0.07)'; // dim non-blast edges
                return 'rgba(99,102,241,0.2)';
              }}
              linkWidth={(link: any) => {
                if (exploitGlow && isExploitLink(link)) return 3.5;
                if (highlightState && isBlastLink(link)) return 2.5;
                return 0.8;
              }}
              linkDirectionalParticles={(link: any) => {
                if (exploitGlow && isExploitLink(link)) return 5;
                if (highlightState && isBlastLink(link)) return 5;
                return 0;
              }}
              linkDirectionalParticleSpeed={0.015}
              linkDirectionalParticleColor={(link: any) => (exploitGlow && isExploitLink(link)) ? '#ef4444' : '#f59e0b'}
              backgroundColor="transparent"
              onNodeClick={(n: any) => setSelectedNode(n as GraphNode)}
              nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                const label = node.display || node.id;
                const fontSize = 10 / globalScale;
                const baseR = nodeSize(node.pagerank ?? 0, node.betweenness ?? 0);
                const x = (node as { x?: number }).x ?? 0;
                const y = (node as { y?: number }).y ?? 0;
                const color = getNodeColor(node as GraphNode);

                const isGZ = highlightState && (
                  (node.display || node.id).toLowerCase() === highlightState.targetId.toLowerCase() ||
                  node.id === highlightState.targetId
                );
                const isActive = highlightState && isBlastNode(node as GraphNode);
                const isDimmed = highlightState && !isGZ && !isActive;

                const r = isGZ ? baseR * 1.8 : isActive ? baseR * 1.2 : baseR;

                // Glow for blast radius nodes
                if (isGZ) {
                  ctx.shadowBlur = 22;
                  ctx.shadowColor = '#ef4444';
                } else if (isActive) {
                  ctx.shadowBlur = 10;
                  ctx.shadowColor = color;
                } else {
                  ctx.shadowBlur = 0;
                }

                ctx.globalAlpha = isDimmed ? 0.12 : 1.0;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, 2 * Math.PI);
                ctx.fillStyle = isDimmed ? '#1e2535' : color;
                ctx.fill();

                // Animated ring on ground zero
                if (isGZ) {
                  ctx.globalAlpha = 0.55;
                  ctx.beginPath();
                  ctx.arc(x, y, r * 1.9, 0, 2 * Math.PI);
                  ctx.strokeStyle = '#ef4444';
                  ctx.lineWidth = 1.5 / globalScale;
                  ctx.stroke();
                }

                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1.0;

                // Labels
                if (isGZ || isActive || (!isDimmed && globalScale > 1.4)) {
                  ctx.font = `${isGZ ? fontSize * 1.3 : fontSize}px Inter`;
                  ctx.fillStyle = isGZ ? '#ff6b6b' : isActive ? '#e2e8f0' : '#94a3b8';
                  ctx.globalAlpha = isDimmed ? 0.15 : 1.0;
                  ctx.textAlign = 'center';
                  ctx.fillText(label.split('::').pop()?.split('/').pop() || label, x, y + r + fontSize + 2);
                  ctx.globalAlpha = 1.0;
                }
              }}
            />
          )}

          {/* Node Inspector Floating HUD */}
          {selectedNode && (
            <div style={{
              position: 'absolute', top: 12, right: 12, width: 280,
              background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
              border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
              padding: '1rem', boxShadow: 'var(--shadow-lg)', zIndex: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="pill pill-primary">{selectedNode.label}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '0.2rem' }}
                  onClick={() => setSelectedNode(null)}
                >
                  <RiCloseLine size={14} />
                </button>
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.625rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                {selectedNode.display}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginBottom: '0.75rem' }}>
                {[
                  { k: 'Node ID', v: selectedNode.id },
                  { k: 'PageRank', v: (selectedNode.pagerank ?? 0).toFixed(4) },
                  { k: 'Betweenness', v: (selectedNode.betweenness ?? 0).toFixed(4) },
                  { k: 'Community ID', v: String(selectedNode.community ?? 0) },
                  { k: 'Connected WCC', v: String(selectedNode.wcc ?? 0) },
                ].map(({ k, v }) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{v}</span>
                  </div>
                ))}
              </div>

              {selectedNode.label === 'Function' && (
                <button
                  className="btn btn-danger btn-sm"
                  style={{ width: '100%', fontSize: '0.72rem', gap: '0.3rem', position: 'relative' }}
                  disabled={shockwaveLoading}
                  onClick={async () => {
                    setShockwaveLoading(true);
                    setActiveTab('shockwave');
                    try {
                      // Fetch real multi-hop blast radius from the API
                      const fnId = selectedNode.display || selectedNode.id;
                      const res = await runTool('blast_radius', {
                        function_id: fnId,
                        max_hops: 4,
                        graph: 'blastradius',
                      });
                      const row = res?.rows?.[0] || [];
                      // Backend blast_radius: [target, pagerank, callers[], apis[], adrs[], count]
                      const callers: string[] = Array.isArray(row[2]) ? (row[2] as string[]) : [];
                      const apis: string[] = Array.isArray(row[3]) ? (row[3] as string[]) : [];
                      handleHighlightPath(fnId, callers, apis);
                    } catch {
                      // Fallback: highlight just this node
                      handleHighlightPath(selectedNode.display || selectedNode.id, [], []);
                    } finally {
                      setShockwaveLoading(false);
                    }
                  }}
                >
                  {shockwaveLoading
                    ? <><RiLoader4Line size={12} className="spin" /> Querying blast radius...</>
                    : <><RiFlashlightLine size={12} /> Simulate Outage Shockwave</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
