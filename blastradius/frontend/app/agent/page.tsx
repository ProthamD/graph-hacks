'use client';
import { useState, useRef, useEffect } from 'react';
import {
  RiRobot2Line, RiSendPlane2Line, RiLoader4Line,
  RiCodeLine, RiArrowRightLine, RiDeleteBin2Line,
  RiFileCopyLine, RiCheckLine, RiUser3Line,
} from 'react-icons/ri';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8090';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool_call' | 'tool_result';
  content: string;
  tool?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  loading?: boolean;
}

const SUGGESTIONS = [
  "What breaks if auth::validate_jwt is changed?",
  "Show the CVE exploit chain for requests CVE-2023-32681",
  "Who owns the payment-processor codebase?",
  "Run PageRank and tell me the top 5 most critical functions",
  "Which communities exist in the codebase and how large are they?",
  "What past incidents involved the auth service?",
];

function ToolCallBadge({ tool, args }: { tool: string; args?: Record<string, unknown> }) {
  return (
    <div style={{
      background: 'var(--primary-subtle)', border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: 'var(--radius-md)', padding: '0.625rem 0.875rem',
      display: 'flex', flexDirection: 'column', gap: '0.35rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div className="spinner" style={{ width: 10, height: 10 }} />
        <span style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--primary-light)', fontFamily: 'var(--font-mono)' }}>
          {tool}
        </span>
      </div>
      {args && Object.keys(args).length > 0 && (
        <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          {JSON.stringify(args, null, 0).slice(0, 120)}
        </div>
      )}
    </div>
  );
}

function ToolResultBlock({ tool, result }: { tool: string; result: unknown }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const rows = (result as { rows?: unknown[][] })?.rows ?? [];
  const wallMs = (result as { wall_ms?: number })?.wall_ms;
  const explain = (result as { explain?: string })?.explain;

  function copy() {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div style={{
      background: '#0a0f1e', border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.5rem 0.875rem',
        borderBottom: '1px solid rgba(99,102,241,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RiCodeLine size={13} style={{ color: 'var(--success)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.72rem', color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
            {tool} — {rows.length} rows
          </span>
          {wallMs && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{wallMs}ms</span>}
        </div>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.4rem' }}
            onClick={copy} aria-label="Copy result">
            {copied ? <RiCheckLine size={12} style={{ color: 'var(--success)' }} /> : <RiFileCopyLine size={12} />}
          </button>
          <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.4rem' }}
            onClick={() => setExpanded(e => !e)}>
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0.75rem', maxHeight: 280, overflow: 'auto' }}>
          {rows.slice(0, 15).map((row, i) => (
            <div key={i} style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
              color: 'var(--text-secondary)', padding: '0.2rem 0',
              borderBottom: '1px solid rgba(99,102,241,0.07)',
            }}>
              {JSON.stringify(row)}
            </div>
          ))}
          {explain && (
            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(99,102,241,0.05)', borderRadius: 6 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>EXPLAIN PLAN</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#64748b' }}>{explain.slice(0, 200)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TraceTree({ messages }: { messages: Message[] }) {
  const hops = messages.filter(m => m.role === 'tool_call' || m.role === 'tool_result');
  if (!hops.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '0.75rem',
    }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Traversal Trace
      </div>
      {hops.map((m, i) => (
        <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.375rem' }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: m.role === 'tool_call' ? 'var(--primary-subtle)' : 'var(--success-subtle)',
            border: `1px solid ${m.role === 'tool_call' ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6rem', fontWeight: 700, flexShrink: 0,
            color: m.role === 'tool_call' ? 'var(--primary-light)' : 'var(--success)',
          }}>
            {m.role === 'tool_call' ? '→' : '✓'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', paddingTop: 1 }}>
            {m.tool}
            {m.role === 'tool_result' && ` → ${(m.result as { rows?: unknown[][] })?.rows?.length ?? 0} rows`}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ariaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    ariaRef.current = document.getElementById('aria-live-region') as HTMLDivElement;
  }, []);

  function announce(text: string) {
    if (ariaRef.current) ariaRef.current.textContent = text;
  }

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg };
    const history = messages.filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStreaming(true);
    announce('BlastRadius is analyzing your query...');

    try {
      const res = await fetch(`${API}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'tool_call') {
              const tcMsg: Message = {
                id: `tc-${data.call_id}`,
                role: 'tool_call',
                content: '',
                tool: data.tool,
                args: data.args,
              };
              setMessages(prev => [...prev, tcMsg]);
              announce(`Calling ${data.tool}...`);
            } else if (data.type === 'tool_result') {
              setMessages(prev => {
                const idx = prev.findIndex(m => m.id === `tc-${data.call_id}`);
                if (idx === -1) return prev;
                const updated = [...prev];
                updated[idx] = { ...updated[idx], loading: false };
                return [...updated, {
                  id: `tr-${data.call_id}`,
                  role: 'tool_result',
                  content: '',
                  tool: data.tool,
                  result: data.result,
                }];
              });
            } else if (data.type === 'text') {
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return [...prev.slice(0, -1), { ...last, content: last.content + data.content }];
                }
                return [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: data.content }];
              });
            } else if (data.type === 'done') {
              announce('BlastRadius analysis complete');
              setStreaming(false);
            }
          } catch { /* continue */ }
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error connecting to BlastRadius agent: ${String(e)}. Make sure the backend is running on port 8090.`,
      }]);
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="chat-app-split">
      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <RiRobot2Line size={18} style={{ color: 'var(--primary)' }} />
          <h1 className="page-title" style={{ fontSize: '1rem' }}>BlastRadius AI Agent</h1>
          <span className="pill pill-primary" style={{ marginLeft: 'auto' }}>FalkorDB · LiteLLM</span>
        </div>

        {/* Messages */}
        <div className="glass-card" style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 380 }}>
          {messages.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center' }}>
              <RiRobot2Line size={40} style={{ color: 'var(--primary)', marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 700, marginBottom: '0.375rem' }}>BlastRadius is ready</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: 360 }}>
                Ask me to analyze blast radius, trace CVE exploit paths, run graph algorithms, or query ownership.
              </div>
            </div>
          )}

          {messages.map(m => (
            <div key={m.id} className="fade-in">
              {m.role === 'user' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <div style={{
                    maxWidth: '72%', background: 'var(--primary)', color: 'white',
                    borderRadius: 'var(--radius-md) var(--radius-md) 0 var(--radius-md)',
                    padding: '0.625rem 0.875rem', fontSize: '0.875rem',
                  }}>
                    {m.content}
                  </div>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <RiUser3Line size={14} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              )}
              {m.role === 'assistant' && (
                <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '85%' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-subtle)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <RiRobot2Line size={14} style={{ color: 'var(--primary-light)' }} />
                  </div>
                  <div style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: '0 var(--radius-md) var(--radius-md) var(--radius-md)',
                    padding: '0.625rem 0.875rem', fontSize: '0.875rem', lineHeight: 1.6,
                    whiteSpace: 'pre-wrap', color: 'var(--text-primary)',
                  }}>
                    {m.content}
                    {streaming && m.id === messages[messages.length - 1]?.id && (
                      <span style={{ display: 'inline-block', width: 8, height: 14, background: 'var(--primary)', borderRadius: 2, marginLeft: 2, animation: 'blink 1s step-end infinite' }} />
                    )}
                  </div>
                </div>
              )}
              {m.role === 'tool_call' && (
                <div style={{ maxWidth: '80%' }}>
                  <ToolCallBadge tool={m.tool!} args={m.args} />
                </div>
              )}
              {m.role === 'tool_result' && (
                <div style={{ maxWidth: '90%' }}>
                  <ToolResultBlock tool={m.tool!} result={m.result} />
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            ref={inputRef}
            className="input"
            placeholder="Ask BlastRadius... (e.g. What breaks if auth::validate_jwt changes?)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={streaming}
            aria-label="Chat input"
          />
          <button
            className="btn btn-primary"
            onClick={() => sendMessage()}
            disabled={!input.trim() || streaming}
            aria-label="Send message"
          >
            {streaming ? <RiLoader4Line size={16} className="spin" /> : <RiSendPlane2Line size={16} />}
          </button>
          {messages.length > 0 && (
            <button className="btn btn-ghost" onClick={() => setMessages([])} aria-label="Clear chat">
              <RiDeleteBin2Line size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Right panel — suggestions + trace */}
      <div className="chat-suggestions-panel">
        <div className="glass-card" style={{ padding: '0.875rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>
            Suggested Queries
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {SUGGESTIONS.map(s => (
              <button key={s} className="btn btn-ghost btn-sm"
                style={{ justifyContent: 'flex-start', textAlign: 'left', fontSize: '0.72rem', height: 'auto', padding: '0.4rem 0.6rem', whiteSpace: 'normal' }}
                onClick={() => sendMessage(s)}>
                <RiArrowRightLine size={11} style={{ flexShrink: 0 }} />
                {s}
              </button>
            ))}
          </div>
        </div>

        <TraceTree messages={messages} />
      </div>

      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}
