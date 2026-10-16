'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  RiNetworkLine, RiRefreshLine, RiStackLine, RiNodeTree,
  RiFilterLine, RiFullscreenLine, RiCloseLine, RiArrowRightLine,
} from 'react-icons/ri';
import { fetchGraphData, nodeColor, nodeSize, runTool, GraphNode, GraphData } from '@/lib/falkordb';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false }) as any;

const COLOR_MODES = ['label', 'community', 'pagerank', 'cve-risk'] as const;
type ColorMode = typeof COLOR_MODES[number];

function getNodeColor(node: GraphNode, mode: ColorMode): string {
  if (mode === 'label') return nodeColor(node.label);
  if (mode === 'community') {
    const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899','#8b5cf6','#06b6d4'];
    return colors[node.community % colors.length];
  }
  if (mode === 'pagerank') {
    const v = Math.min(node.pagerank / 2.5, 1);
    const r = Math.round(99 + (245 - 99) * v);
    const g = Math.round(102 + (158 - 102) * (1 - v));
    const b = Math.round(241 + (11 - 241) * v);
    return `rgb(${r},${g},${b})`;
  }
  if (mode === 'cve-risk') {
    return node.label === 'CVE' ? '#ef4444' : node.label === 'Package' ? '#f59e0b' : '#6366f1';
  }
  return nodeColor(node.label);
}

export default function GraphPage() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [colorMode, setColorMode] = useState<ColorMode>('label');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [runningAlgo, setRunningAlgo] = useState<string | null>(null);
  const [algoResult, setAlgoResult] = useState<string | null>(null);
  const [filterLabel, setFilterLabel] = useState<string>('');
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

  const filteredData = {
    nodes: filterLabel ? graphData.nodes.filter(n => n.label === filterLabel) : graphData.nodes,
    links: (filterLabel
      ? graphData.edges.filter(e => {
          const fn = graphData.nodes.find(n => n.id === e.source);
          const tn = graphData.nodes.find(n => n.id === e.target);
          return fn?.label === filterLabel || tn?.label === filterLabel;
        })
      : graphData.edges
    ).map(e => ({ source: e.source, target: e.target, type: e.type, weight: e.weight })),
  };

  async function runAlgorithm(algo: string) {
    setRunningAlgo(algo);
    setAlgoResult(null);
    try {
      const result = await runTool(algo, { graph: 'blastradius' });
      const rows = result?.rows ?? [];
      setAlgoResult(`${algo}: ${rows.length} results in ${result.wall_ms}ms`);
      // Reload graph to show updated scores
      await load();
    } catch (e) {
      setAlgoResult(`Error: ${String(e)}`);
    } finally {
      setRunningAlgo(null);
    }
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - var(--topbar-height) - 3rem)' }}>
      {/* Left panel — controls */}
      <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <div className="page-title" style={{ fontSize: '1rem' }}>
            <RiNetworkLine size={18} style={{ color: 'var(--primary)' }} />
            Graph Visualizer
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {graphData.nodes.length} nodes · {graphData.edges.length} edges
          </div>
        </div>

        {/* Color mode */}
        <div className="glass-card" style={{ padding: '0.875rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            <RiStackLine size={11} /> Color Mode
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {COLOR_MODES.map(m => (
              <button key={m} className={`btn btn-sm ${colorMode === m ? 'btn-primary' : 'btn-ghost'}`}
                style={{ justifyContent: 'flex-start' }}
                onClick={() => setColorMode(m)}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Label filter */}
        <div className="glass-card" style={{ padding: '0.875rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            <RiFilterLine size={11} /> Filter by Label
          </div>
          <select
            className="input"
            value={filterLabel}
            onChange={e => setFilterLabel(e.target.value)}
            style={{ fontSize: '0.8rem' }}
          >
            <option value="">All labels</option>
            {labels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Algorithms */}
        <div className="glass-card" style={{ padding: '0.875rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Run Algorithms
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {[
              { tool: 'compute_centrality', label: 'PageRank + Betweenness' },
              { tool: 'detect_communities', label: 'WCC + CDLP' },
            ].map(({ tool, label }) => (
              <button key={tool} className="btn btn-ghost btn-sm"
                style={{ justifyContent: 'flex-start', fontSize: '0.75rem' }}
                disabled={!!runningAlgo}
                onClick={() => runAlgorithm(tool)}>
                {runningAlgo === tool ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <RiArrowRightLine size={12} />}
                {label}
              </button>
            ))}
          </div>
          {algoResult && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
              {algoResult}
            </div>
          )}
        </div>

        {/* Refresh */}
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          <RiRefreshLine size={13} className={loading ? 'spin' : ''} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>

        {/* Legend */}
        <div className="glass-card" style={{ padding: '0.875rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Legend</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {labels.slice(0, 8).map(l => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: nodeColor(l), flexShrink: 0 }} />
                <span style={{ color: 'var(--text-muted)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Graph canvas */}
      <div style={{
        flex: 1, borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', overflow: 'hidden',
        background: 'var(--bg-base)', position: 'relative',
      }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem' }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading graph data...</div>
          </div>
        ) : filteredData.nodes.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem' }}>
            <RiNodeTree size={36} style={{ color: 'var(--text-muted)' }} />
            <div style={{ color: 'var(--text-muted)' }}>No graph data. Start the backend and run seed.</div>
            <button className="btn btn-primary btn-sm" onClick={load}>Retry</button>
          </div>
        ) : (
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredData}
            nodeId="id"
            nodeLabel="display"
            nodeColor={(n: any) => getNodeColor(n as GraphNode, colorMode)}
            nodeVal={(n: any) => nodeSize(n.pagerank ?? 0, n.betweenness ?? 0)}
            linkColor={() => 'rgba(99,102,241,0.25)'}
            linkWidth={1}
            backgroundColor="transparent"
            onNodeClick={(n: any) => setSelectedNode(n as GraphNode)}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const label = node.display || node.id;
              const fontSize = 10 / globalScale;
              const r = nodeSize(node.pagerank ?? 0, node.betweenness ?? 0);
              const x = (node as { x?: number }).x ?? 0;
              const y = (node as { y?: number }).y ?? 0;
              ctx.beginPath();
              ctx.arc(x, y, r, 0, 2 * Math.PI);
              ctx.fillStyle = getNodeColor(node as GraphNode, colorMode);
              ctx.fill();
              ctx.shadowBlur = 8;
              ctx.shadowColor = getNodeColor(node as GraphNode, colorMode);
              if (globalScale > 1.2) {
                ctx.font = `${fontSize}px Inter`;
                ctx.fillStyle = '#e2e8f0';
                ctx.textAlign = 'center';
                ctx.fillText(label.split('::').pop() || label, x, y + r + fontSize);
              }
              ctx.shadowBlur = 0;
            }}
          />
        )}

        {/* Node inspector overlay */}
        {selectedNode && (
          <div style={{
            position: 'absolute', top: 12, right: 12, width: 260,
            background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
            padding: '1rem', boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span className="pill pill-primary">{selectedNode.label}</span>
              <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem' }}
                onClick={() => setSelectedNode(null)}>
                <RiCloseLine size={14} />
              </button>
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.625rem', color: 'var(--text-primary)' }}>
              {selectedNode.display}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[
                { k: 'ID', v: selectedNode.id },
                { k: 'PageRank', v: (selectedNode.pagerank ?? 0).toFixed(4) },
                { k: 'Betweenness', v: (selectedNode.betweenness ?? 0).toFixed(4) },
                { k: 'Community', v: String(selectedNode.community ?? 0) },
                { k: 'WCC', v: String(selectedNode.wcc ?? 0) },
              ].map(({ k, v }) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
