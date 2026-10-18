'use client';
import { useEffect, useState } from 'react';
import {
  RiHistoryLine, RiRefreshLine, RiSearchLine, RiLoader4Line,
  RiRobot2Line, RiTimeLine, RiArrowRightLine,
} from 'react-icons/ri';
import { fetchMemory, runTool } from '@/lib/falkordb';

interface Episode {
  episode_id: string;
  session: string;
  summary: string;
  ts: number;
  investigated_fns: string[];
}

export default function MemoryPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKw, setSearchKw] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<unknown[] | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetchMemory();
      const rows = (r?.rows ?? []) as unknown[][];
      setEpisodes(rows.map((row) => ({
        episode_id: String(row[0]),
        session: String(row[1]),
        summary: String(row[2]),
        ts: Number(row[3]) * 1000,
        investigated_fns: Array.isArray(row[4]) ? row[4].map(String) : [],
      })));
    } catch {
      setEpisodes([]);
    } finally {
      setLoading(false);
    }
  }

  async function search() {
    if (!searchKw) return;
    setSearching(true);
    try {
      const r = await runTool('hybrid_search', { error_keyword: searchKw, graph: 'blastradius' });
      setSearchResult((r as { fulltext?: { rows?: unknown[] } })?.fulltext?.rows ?? []);
    } catch {
      setSearchResult([]);
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => { load(); }, []);

  function formatTime(ms: number) {
    if (!ms) return '—';
    const d = new Date(ms);
    return d.toLocaleString();
  }

  return (
    <div className="page-container fade-in">
      <div className="responsive-header">
        <div>
          <h1 className="page-title">
            <RiHistoryLine size={22} style={{ color: 'var(--success)' }} />
            Episodic Memory
          </h1>
          <p className="page-subtitle">
            Track 02 — Agent episodes from graphiti-mcp · Semantic + full-text search across incidents
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          <RiRefreshLine size={13} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search bar */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.625rem' }}>
          Full-text + Semantic Search across Past Incidents (BM25 + HNSW Vector)
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="e.g. timeout, auth failure, memory leak..."
            value={searchKw}
            onChange={e => setSearchKw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            style={{ flex: '1 1 200px' }}
          />
          <button className="btn btn-primary btn-sm" onClick={search} disabled={searching || !searchKw}>
            {searching ? <RiLoader4Line size={14} className="spin" /> : <RiSearchLine size={14} />}
            Search
          </button>
        </div>
        {searchResult !== null && (
          <div className="fade-in" style={{ marginTop: '0.875rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {(searchResult as unknown[]).length} incidents found
            </div>
            {(searchResult as unknown[][]).slice(0, 5).map((row, i) => (
              <div key={i} style={{
                padding: '0.625rem 0.75rem', background: 'var(--bg-elevated)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                marginBottom: '0.375rem', fontSize: '0.78rem',
              }}>
                <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{String(row[1] || row[0])}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Function: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-light)' }}>{String(row[2])}</code>
                  {Boolean(row[3]) && <> · Episode: {String(row[3])}</>}
                  {Boolean(row[4]) && <> · Playbook: <span style={{ color: 'var(--accent)' }}>{String(row[4])}</span></>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Episode timeline */}
      <div className="section-header">
        <div className="section-title">
          <RiTimeLine size={16} style={{ color: 'var(--primary)' }} />
          Episode Timeline
        </div>
        <span className="pill pill-primary">{episodes.length} episodes</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 0.75rem' }} />
          Loading episodes...
        </div>
      ) : episodes.length === 0 ? (
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <RiHistoryLine size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
          <div style={{ color: 'var(--text-muted)' }}>No episodes found. Run the agent a few times to create episodes.</div>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '2rem' }}>
          {/* Timeline line */}
          <div style={{ position: 'absolute', left: '0.625rem', top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {episodes.map((ep, i) => (
              <div key={ep.episode_id} className="fade-in glass-card" style={{ padding: '1rem', position: 'relative' }}>
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute', left: -34, top: '50%', transform: 'translateY(-50%)',
                  width: 14, height: 14, borderRadius: '50%',
                  background: 'var(--primary)', border: '2px solid var(--bg-base)',
                  boxShadow: '0 0 8px var(--primary-glow)',
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                      <RiRobot2Line size={13} style={{ color: 'var(--primary-light)' }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--primary-light)' }}>
                        {ep.episode_id}
                      </span>
                      <span className="pill pill-primary" style={{ fontSize: '0.65rem' }}>
                        {ep.session}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      {ep.summary}
                    </div>
                    {ep.investigated_fns.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {ep.investigated_fns.map(fn => (
                          <span key={fn} className="chip">
                            <RiArrowRightLine size={9} /> {fn}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                    {formatTime(ep.ts)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
