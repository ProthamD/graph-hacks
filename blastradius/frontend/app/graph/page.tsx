'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  RiNetworkLine, RiRefreshLine, RiStackLine, RiNodeTree,
  RiFilterLine, RiFullscreenLine, RiCloseLine, RiArrowRightLine,
  RiFlashlightLine, RiSearchLine, RiFocus3Line, RiAlertLine,
  RiRadarLine, RiBarChart2Line, RiTrophyLine,
} from 'react-icons/ri';
import { fetchGraphData, nodeColor, nodeSize, runTool, GraphNode, GraphData } from '@/lib/falkordb';
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

  function getNodeColor(node: GraphNode): string {
    // If shockwave highlight is active
    if (highlightState) {
      const display = (node.display || node.id).toLowerCase();
      const target = highlightState.targetId.toLowerCase();
      if (display === target || node.id === highlightState.targetId) {
        return '#ef4444'; // Red Ground Zero
      }
      if (highlightState.callers.some(c => display.includes(c.toLowerCase()) || node.id === c)) {
        return '#f59e0b'; // Amber Callers
      }
      if (highlightState.apis.some(a => display.includes(a.toLowerCase()) || node.id === a)) {
        return '#10b981'; // Green APIs
      }
      return 'rgba(100, 116, 139, 0.2)'; // Dimmed
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
    setHighlightState({ targetId, callers, apis });
    setColorMode('shockwave');

    // Find target node and center view
    const target = graphData.nodes.find(n =>
      (n.display || n.id).toLowerCase() === targetId.toLowerCase() || n.id === targetId
    );
    if (target && graphRef.current) {
      const nAny = target as { x?: number; y?: number };
      if (typeof nAny.x === 'number' && typeof nAny.y === 'number') {
        graphRef.current.centerAt(nAny.x, nAny.y, 800);
        graphRef.current.zoom(2.2, 800);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: 'calc(100vh - var(--topbar-height) - 2.5rem)' }}>
      {/* Top action toolbar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.5rem 1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
      }}>
        {/* Left: tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 280, position: 'relative' }}>
          <RiSearchLine size={14} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }} />
          <input
            className="input"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search function, service, CVE..."
            style={{ paddingLeft: '2rem', height: 32, fontSize: '0.75rem' }}
          />
        </div>

        {/* Right: 2D/3D toggle & stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
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
      <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minHeight: 0 }}>
        {/* Left Control Panel */}
        <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
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
          position: 'relative',
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
              nodeColor={(n: any) => getNodeColor(n as GraphNode)}
              nodeVal={(n: any) => nodeSize(n.pagerank ?? 0, n.betweenness ?? 0)}
              linkColor={() => highlightState ? 'rgba(239,68,68,0.4)' : 'rgba(99,102,241,0.25)'}
              linkWidth={highlightState ? 2 : 1}
              linkDirectionalParticles={highlightState ? 4 : 0}
              linkDirectionalParticleSpeed={0.015}
              backgroundColor="transparent"
              onNodeClick={(n: any) => setSelectedNode(n as GraphNode)}
            />
          ) : (
            <ForceGraph2D
              ref={graphRef}
              graphData={filteredData}
              nodeId="id"
              nodeLabel="display"
              nodeColor={(n: any) => getNodeColor(n as GraphNode)}
              nodeVal={(n: any) => nodeSize(n.pagerank ?? 0, n.betweenness ?? 0)}
              linkColor={() => highlightState ? 'rgba(239,68,68,0.35)' : 'rgba(99,102,241,0.2)'}
              linkWidth={highlightState ? 2 : 1}
              linkDirectionalParticles={highlightState ? 4 : 0}
              linkDirectionalParticleSpeed={0.015}
              backgroundColor="transparent"
              onNodeClick={(n: any) => setSelectedNode(n as GraphNode)}
              nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                const label = node.display || node.id;
                const fontSize = 10 / globalScale;
                const r = nodeSize(node.pagerank ?? 0, node.betweenness ?? 0);
                const x = (node as { x?: number }).x ?? 0;
                const y = (node as { y?: number }).y ?? 0;
                const isTarget = highlightState && (
                  (node.display || node.id).toLowerCase() === highlightState.targetId.toLowerCase() ||
                  node.id === highlightState.targetId
                );

                ctx.beginPath();
                ctx.arc(x, y, isTarget ? r * 1.5 : r, 0, 2 * Math.PI);
                ctx.fillStyle = getNodeColor(node as GraphNode);
                ctx.fill();

                if (isTarget) {
                  // Glowing red halo
                  ctx.beginPath();
                  ctx.arc(x, y, r * 2.2, 0, 2 * Math.PI);
                  ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
                  ctx.lineWidth = 2 / globalScale;
                  ctx.stroke();
                }

                ctx.shadowBlur = isTarget ? 15 : 6;
                ctx.shadowColor = getNodeColor(node as GraphNode);

                if (globalScale > 1.2 || isTarget) {
                  ctx.font = `${isTarget ? fontSize * 1.2 : fontSize}px Inter`;
                  ctx.fillStyle = isTarget ? '#ff4d4d' : '#e2e8f0';
                  ctx.textAlign = 'center';
                  ctx.fillText(label.split('::').pop() || label, x, y + r + fontSize + 2);
                }
                ctx.shadowBlur = 0;
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
                  style={{ width: '100%', fontSize: '0.72rem', gap: '0.3rem' }}
                  onClick={() => {
                    setActiveTab('shockwave');
                    handleHighlightPath(selectedNode.display || selectedNode.id, [], []);
                  }}
                >
                  <RiFlashlightLine size={12} /> Simulate Outage Shockwave
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
