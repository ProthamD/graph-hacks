'use client';
import { useState } from 'react';
import {
  RiBarChart2Line, RiPlayLine, RiLoader4Line, RiArrowRightLine,
  RiInformationLine, RiTimeLine, RiCodeLine,
} from 'react-icons/ri';
import { runTool } from '@/lib/falkordb';

const ALGORITHMS = [
  {
    id: 'compute_centrality',
    name: 'PageRank + Betweenness',
    category: 'Categories 1 & 2',
    desc: 'Identifies the most influential functions (PageRank) and critical bridge nodes (Betweenness Centrality) in the call graph.',
    color: 'var(--primary)',
    cypher: `CALL algo.pageRank('Function','CALLS') YIELD node, score SET node.pagerank_score = score;\nCALL algo.betweenness({nodeLabels:['Function'],relationshipTypes:['CALLS']}) YIELD node, score SET node.betweenness_score = score RETURN node.id, score ORDER BY score DESC LIMIT 15`,
  },
  {
    id: 'detect_communities',
    name: 'WCC + Label Propagation',
    category: 'Categories 4 & 5',
    desc: 'Finds disconnected islands (WCC) and dense microservice communities (CDLP/Label Propagation) in the codebase graph.',
    color: 'var(--success)',
    cypher: `CALL algo.WCC({nodeLabels:['Function'],relationshipTypes:['CALLS']}) YIELD node, componentId SET node.wcc_id=componentId;\nCALL algo.labelPropagation({nodeLabels:['Function'],relationshipTypes:['CALLS']}) YIELD node, communityId SET node.community_id=communityId RETURN communityId, count(node) ORDER BY count(node) DESC`,
  },
  {
    id: 'blast_radius',
    name: 'Multi-Hop Blast Radius',
    category: 'Traversal Tool',
    desc: 'Traverses the CALLS graph up to N hops to find all functions, APIs, and ADRs impacted by a change.',
    color: 'var(--accent)',
    cypher: `MATCH (target:Function {id: $fn_id})\nOPTIONAL MATCH path = (caller:Function)-[:CALLS*1..4]->(target)\nOPTIONAL MATCH (ep:API_Endpoint)-[:ROUTES_TO]->(caller)\nRETURN target.id, collect(DISTINCT caller.id) AS callers, collect(DISTINCT ep.route) AS apis`,
    extraArgs: { function_id: 'auth::validate_jwt', max_hops: 4 },
  },
  {
    id: 'cve_exploit_chain',
    name: 'CVE Exploit Chain (SPpaths)',
    category: 'Category 3 — Shortest Path',
    desc: 'Uses algo.SPpaths to find the minimal-hop exploit path from a public API endpoint to a vulnerable package.',
    color: 'var(--danger)',
    cypher: `MATCH (ep:API_Endpoint {is_public: true}),\n      (pkg:Package {name: $pkg_name})-[:HAS_VULNERABILITY]->(cve:CVE {cve_id: $cve_id})\nCALL algo.SPpaths({sourceNode: ep, targetNode: pkg, relTypes:['ROUTES_TO','CALLS','USES_PACKAGE'], pathCount: 3}) YIELD path, pathWeight\nRETURN ep.route, cve.cve_id, pathWeight, [n IN nodes(path)|n.id] AS chain`,
    extraArgs: { pkg_name: 'requests', cve_id: 'CVE-2023-32681' },
  },
];

interface AlgoResult {
  rows: unknown[][];
  wall_ms: number;
  engine_ms: number;
  explain: string;
}

export default function AlgorithmsPage() {
  const [results, setResults] = useState<Record<string, AlgoResult | null>>({});
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [expandedExplain, setExpandedExplain] = useState<Record<string, boolean>>({});

  async function runAlgo(id: string, extraArgs?: Record<string, unknown>) {
    setRunning(prev => ({ ...prev, [id]: true }));
    try {
      const r = await runTool(id, { graph: 'blastradius', ...(extraArgs ?? {}) });
      setResults(prev => ({ ...prev, [id]: r as AlgoResult }));
    } catch (e) {
      setResults(prev => ({ ...prev, [id]: { rows: [], wall_ms: 0, engine_ms: 0, explain: String(e) } }));
    } finally {
      setRunning(prev => ({ ...prev, [id]: false }));
    }
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">
          <RiBarChart2Line size={22} style={{ color: 'var(--primary)' }} />
          Algorithm Comparison Dashboard
        </h1>
        <p className="page-subtitle">
          All 5 FalkorDB native algorithm categories — run, compare, and visualize results
        </p>
      </div>

      {/* FalkorDB algorithm categories banner */}
      <div style={{ marginBottom: '1.5rem', padding: '0.875rem 1.25rem', background: 'var(--primary-subtle)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <RiInformationLine size={16} style={{ color: 'var(--primary-light)', flexShrink: 0 }} />
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--primary-light)' }}>All 5 native algorithm categories covered:</strong>{' '}
          PageRank (1) · Betweenness Centrality (2) · SPpaths/Shortest Path (3) · WCC (4) · CDLP/LabelPropagation (5)
          — All wrapped as FastMCP tools, callable by the LLM agent.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {ALGORITHMS.map(algo => {
          const result = results[algo.id];
          const isRunning = running[algo.id];
          const rows = result?.rows ?? [];

          return (
            <div key={algo.id} className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: algo.color, boxShadow: `0 0 8px ${algo.color}88` }} />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{algo.name}</h3>
                    <span className="pill pill-primary" style={{ fontSize: '0.65rem' }}>{algo.category}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 520 }}>{algo.desc}</p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={isRunning}
                  onClick={() => runAlgo(algo.id, algo.extraArgs)}
                >
                  {isRunning ? <RiLoader4Line size={13} className="spin" /> : <RiPlayLine size={13} />}
                  Run
                </button>
              </div>

              {/* Cypher preview */}
              <div className="cypher-block" style={{ marginBottom: '0.875rem', fontSize: '0.72rem' }}>
                <pre style={{ background: 'none', border: 'none', padding: 0, margin: 0, color: '#a5b4fc', fontSize: 'inherit', whiteSpace: 'pre-wrap' }}>
                  {algo.cypher}
                </pre>
              </div>

              {/* Results */}
              {result && (
                <div className="fade-in">
                  {/* Timing bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--success)' }}>
                      <RiTimeLine size={12} />
                      Wall: <strong>{result.wall_ms}ms</strong>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Engine: {result.engine_ms}ms
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--primary-light)' }}>
                      {rows.length} rows returned
                    </div>
                  </div>

                  {/* Result rows */}
                  {rows.length > 0 && (
                    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                        {rows.slice(0, 12).map((row, i) => (
                          <div key={i} style={{
                            display: 'flex', gap: '1rem', padding: '0.4rem 0.75rem',
                            fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                            color: 'var(--text-secondary)',
                            borderBottom: '1px solid rgba(99,102,241,0.06)',
                            background: i % 2 === 0 ? 'transparent' : 'rgba(99,102,241,0.02)',
                          }}>
                            <span style={{ color: 'var(--text-muted)', minWidth: 20 }}>{i + 1}</span>
                            {(row as unknown[]).map((cell, j) => (
                              <span key={j} style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                                {typeof cell === 'object' ? JSON.stringify(cell).slice(0, 60) : String(cell ?? '—')}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* EXPLAIN plan */}
                  {result.explain && (
                    <div style={{ marginTop: '0.625rem' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.7rem' }}
                        onClick={() => setExpandedExplain(p => ({ ...p, [algo.id]: !p[algo.id] }))}
                      >
                        <RiCodeLine size={11} />
                        GRAPH.EXPLAIN {expandedExplain[algo.id] ? '▲' : '▼'}
                      </button>
                      {expandedExplain[algo.id] && (
                        <div className="cypher-block" style={{ marginTop: '0.375rem', fontSize: '0.65rem', color: '#64748b' }}>
                          <pre style={{ margin: 0, background: 'none', border: 'none', padding: 0, whiteSpace: 'pre-wrap', color: 'inherit' }}>
                            {result.explain.slice(0, 600)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Graph RAG vs Vector RAG comparison */}
      <div className="glass-card" style={{ padding: '1.25rem', marginTop: '1.5rem' }}>
        <div className="section-header">
          <div className="section-title">
            <RiArrowRightLine size={16} style={{ color: 'var(--accent)' }} />
            Graph RAG vs Vector RAG — Context Quality
          </div>
          <span className="pill pill-warning">FalkorDB Benchmark</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          FalkorDB's own benchmarks show GraphRAG outperforms pure vector search by 16 points on multi-hop reasoning tasks.
        </p>
        <div className="grid-2">
          {[
            { label: 'Graph RAG (FalkorDB)', score: 71.48, color: 'var(--primary)', desc: 'Traversal + structural context + vector similarity' },
            { label: 'Vector-Only RAG', score: 55.39, color: 'var(--text-muted)', desc: 'Pure embedding similarity search' },
          ].map(({ label, score, color, desc }) => (
            <div key={label} style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ flex: 1, height: 8, background: 'var(--bg-surface)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 1s ease' }} />
                </div>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color, minWidth: 50 }}>{score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
