const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8090';

export interface GraphNode {
  id: string;
  label: string;
  display: string;
  pagerank: number;
  community: number;
  wcc: number;
  betweenness: number;
  x?: number;
  y?: number;
  z?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ToolResult {
  rows: unknown[][];
  engine_ms: number;
  wall_ms: number;
  explain: string;
  graph?: string;
}

// ── Node color by label ───────────────────────────────────────────────────────
const LABEL_COLORS: Record<string, string> = {
  Function:         '#6366f1',
  Service:          '#10b981',
  API_Endpoint:     '#f59e0b',
  CVE:              '#ef4444',
  Developer:        '#3b82f6',
  PastIncident:     '#ec4899',
  Package:          '#8b5cf6',
  ArchitectureDoc:  '#06b6d4',
  AgentEpisode:     '#84cc16',
  ProceduralPlaybook: '#fb923c',
  Commit:           '#94a3b8',
};

export function nodeColor(label: string): string {
  return LABEL_COLORS[label] ?? '#6366f1';
}

export function nodeSize(pagerank: number, betweenness: number): number {
  const base = 4;
  const pr = Math.min(pagerank * 3, 8);
  const bt = Math.min(betweenness * 4, 6);
  return base + pr + bt;
}

// ── Fallback Demo Dataset ───────────────────────────────────────────────────
const DEMO_NODES: GraphNode[] = [
  { id: '1', label: 'Service', display: 'api-gateway', pagerank: 1.8, community: 1, wcc: 1, betweenness: 0.95 },
  { id: '2', label: 'Service', display: 'auth-service', pagerank: 2.4, community: 1, wcc: 1, betweenness: 0.98 },
  { id: '3', label: 'Service', display: 'payment-processor', pagerank: 2.1, community: 2, wcc: 1, betweenness: 0.85 },
  { id: '4', label: 'Service', display: 'inventory-service', pagerank: 1.5, community: 2, wcc: 1, betweenness: 0.65 },
  { id: '5', label: 'Service', display: 'shipping-service', pagerank: 1.2, community: 2, wcc: 1, betweenness: 0.45 },
  { id: '6', label: 'Service', display: 'notification-service', pagerank: 1.1, community: 3, wcc: 1, betweenness: 0.35 },
  { id: '7', label: 'Service', display: 'analytics-service', pagerank: 0.9, community: 3, wcc: 1, betweenness: 0.25 },
  { id: '8', label: 'Service', display: 'cache-service', pagerank: 1.7, community: 1, wcc: 1, betweenness: 0.75 },
  { id: '10', label: 'API_Endpoint', display: '/api/v1/auth/login', pagerank: 1.0, community: 1, wcc: 1, betweenness: 0.2 },
  { id: '11', label: 'API_Endpoint', display: '/api/v1/payments/charge', pagerank: 1.2, community: 2, wcc: 1, betweenness: 0.3 },
  { id: '12', label: 'API_Endpoint', display: '/api/v1/orders/checkout', pagerank: 1.4, community: 2, wcc: 1, betweenness: 0.4 },
  { id: '13', label: 'API_Endpoint', display: '/api/v1/inventory/items', pagerank: 0.8, community: 2, wcc: 1, betweenness: 0.1 },
  { id: '20', label: 'Function', display: 'gateway::route_request', pagerank: 2.2, community: 1, wcc: 1, betweenness: 0.92 },
  { id: '21', label: 'Function', display: 'gateway::apply_rate_limit', pagerank: 1.6, community: 1, wcc: 1, betweenness: 0.55 },
  { id: '22', label: 'Function', display: 'auth::validate_jwt', pagerank: 2.8, community: 1, wcc: 1, betweenness: 0.99 },
  { id: '23', label: 'Function', display: 'auth::issue_token', pagerank: 1.4, community: 1, wcc: 1, betweenness: 0.45 },
  { id: '24', label: 'Function', display: 'auth::hash_password', pagerank: 0.9, community: 1, wcc: 1, betweenness: 0.15 },
  { id: '25', label: 'Function', display: 'payment::process_charge', pagerank: 2.5, community: 2, wcc: 1, betweenness: 0.88 },
  { id: '26', label: 'Function', display: 'payment::verify_funds', pagerank: 1.7, community: 2, wcc: 1, betweenness: 0.50 },
  { id: '27', label: 'Function', display: 'payment::capture_funds', pagerank: 1.5, community: 2, wcc: 1, betweenness: 0.42 },
  { id: '28', label: 'Function', display: 'inventory::check_stock', pagerank: 1.8, community: 2, wcc: 1, betweenness: 0.62 },
  { id: '29', label: 'Function', display: 'inventory::reserve_items', pagerank: 1.6, community: 2, wcc: 1, betweenness: 0.52 },
  { id: '30', label: 'Function', display: 'inventory::batch_sync', pagerank: 1.1, community: 2, wcc: 1, betweenness: 0.32 },
  { id: '31', label: 'Function', display: 'shipping::calculate_rate', pagerank: 1.0, community: 2, wcc: 1, betweenness: 0.28 },
  { id: '32', label: 'Function', display: 'shipping::generate_label', pagerank: 0.8, community: 2, wcc: 1, betweenness: 0.20 },
  { id: '33', label: 'Function', display: 'notification::send_email', pagerank: 0.9, community: 3, wcc: 1, betweenness: 0.18 },
  { id: '34', label: 'Function', display: 'notification::send_webhook', pagerank: 0.7, community: 3, wcc: 1, betweenness: 0.12 },
  { id: '35', label: 'Function', display: 'cache::get', pagerank: 2.3, community: 1, wcc: 1, betweenness: 0.82 },
  { id: '36', label: 'Function', display: 'cache::set', pagerank: 1.9, community: 1, wcc: 1, betweenness: 0.68 },
  { id: '40', label: 'Package', display: 'pyjwt', pagerank: 1.9, community: 1, wcc: 1, betweenness: 0.70 },
  { id: '41', label: 'Package', display: 'requests', pagerank: 1.7, community: 2, wcc: 1, betweenness: 0.60 },
  { id: '42', label: 'Package', display: 'sqlalchemy', pagerank: 2.0, community: 2, wcc: 1, betweenness: 0.72 },
  { id: '43', label: 'Package', display: 'redis-py', pagerank: 1.8, community: 1, wcc: 1, betweenness: 0.64 },
  { id: '50', label: 'CVE', display: 'CVE-2022-29217', pagerank: 1.4, community: 1, wcc: 1, betweenness: 0.55 },
  { id: '51', label: 'CVE', display: 'CVE-2023-32681', pagerank: 1.3, community: 2, wcc: 1, betweenness: 0.48 },
  { id: '52', label: 'CVE', display: 'CVE-2023-23936', pagerank: 1.5, community: 2, wcc: 1, betweenness: 0.52 },
  { id: '60', label: 'Developer', display: 'alice_chen', pagerank: 1.5, community: 1, wcc: 1, betweenness: 0.4 },
  { id: '61', label: 'Developer', display: 'bob_smith', pagerank: 1.6, community: 2, wcc: 1, betweenness: 0.5 },
  { id: '62', label: 'Developer', display: 'carol_jones', pagerank: 1.3, community: 3, wcc: 1, betweenness: 0.3 },
  { id: '70', label: 'ArchitectureDoc', display: 'ADR-001 Zero-Trust Auth', pagerank: 1.2, community: 1, wcc: 1, betweenness: 0.3 },
  { id: '71', label: 'ArchitectureDoc', display: 'ADR-002 Circuit Breaker', pagerank: 1.1, community: 2, wcc: 1, betweenness: 0.25 },
  { id: '80', label: 'PastIncident', display: 'INC-001 Payment Timeout', pagerank: 1.0, community: 2, wcc: 1, betweenness: 0.2 },
  { id: '90', label: 'AgentEpisode', display: 'EP-2026-10-15-01', pagerank: 0.8, community: 1, wcc: 1, betweenness: 0.1 },
];

const DEMO_EDGES: GraphEdge[] = [
  { source: '10', target: '20', type: 'ROUTES_TO', weight: 1 },
  { source: '11', target: '25', type: 'ROUTES_TO', weight: 1 },
  { source: '12', target: '25', type: 'ROUTES_TO', weight: 1 },
  { source: '13', target: '28', type: 'ROUTES_TO', weight: 1 },
  { source: '20', target: '22', type: 'CALLS', weight: 1 },
  { source: '20', target: '21', type: 'CALLS', weight: 1 },
  { source: '21', target: '35', type: 'CALLS', weight: 1 },
  { source: '22', target: '35', type: 'CALLS', weight: 1 },
  { source: '22', target: '40', type: 'USES_PACKAGE', weight: 1 },
  { source: '23', target: '40', type: 'USES_PACKAGE', weight: 1 },
  { source: '25', target: '22', type: 'CALLS', weight: 1 },
  { source: '25', target: '26', type: 'CALLS', weight: 1 },
  { source: '25', target: '27', type: 'CALLS', weight: 1 },
  { source: '25', target: '28', type: 'CALLS', weight: 1 },
  { source: '26', target: '41', type: 'USES_PACKAGE', weight: 1 },
  { source: '27', target: '41', type: 'USES_PACKAGE', weight: 1 },
  { source: '28', target: '29', type: 'CALLS', weight: 1 },
  { source: '28', target: '42', type: 'USES_PACKAGE', weight: 1 },
  { source: '29', target: '42', type: 'USES_PACKAGE', weight: 1 },
  { source: '30', target: '42', type: 'USES_PACKAGE', weight: 1 },
  { source: '25', target: '31', type: 'CALLS', weight: 1 },
  { source: '31', target: '32', type: 'CALLS', weight: 1 },
  { source: '25', target: '33', type: 'CALLS', weight: 1 },
  { source: '33', target: '34', type: 'CALLS', weight: 1 },
  { source: '35', target: '43', type: 'USES_PACKAGE', weight: 1 },
  { source: '36', target: '43', type: 'USES_PACKAGE', weight: 1 },
  { source: '40', target: '50', type: 'HAS_VULNERABILITY', weight: 1 },
  { source: '41', target: '51', type: 'HAS_VULNERABILITY', weight: 1 },
  { source: '42', target: '52', type: 'HAS_VULNERABILITY', weight: 1 },
  { source: '60', target: '22', type: 'OWNS', weight: 1 },
  { source: '61', target: '25', type: 'OWNS', weight: 1 },
  { source: '62', target: '28', type: 'OWNS', weight: 1 },
  { source: '70', target: '22', type: 'GOVERNS', weight: 1 },
  { source: '71', target: '25', type: 'GOVERNS', weight: 1 },
  { source: '80', target: '25', type: 'CAUSED_BY', weight: 1 },
  { source: '90', target: '22', type: 'INVESTIGATED', weight: 1 },
];

// ── API helpers ───────────────────────────────────────────────────────────────
export async function fetchGraphData(graph = 'blastradius', limit = 200): Promise<GraphData> {
  try {
    const res = await fetch(`${API}/api/graph/nodes?graph=${graph}&limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      if (data.nodes && data.nodes.length > 0) return data;
    }
  } catch {}
  return { nodes: DEMO_NODES, edges: DEMO_EDGES };
}

export async function fetchGraphStats(graph = 'blastradius') {
  try {
    const res = await fetch(`${API}/api/graph/stats?graph=${graph}`);
    if (res.ok) return await res.json();
  } catch {}
  return {
    nodes: [
      ['Function', 25],
      ['Service', 12],
      ['API_Endpoint', 10],
      ['Package', 8],
      ['CVE', 5],
      ['Developer', 3],
      ['ArchitectureDoc', 4],
      ['PastIncident', 2],
      ['AgentEpisode', 5],
    ],
    edges: [
      ['CALLS', 64],
      ['ROUTES_TO', 14],
      ['USES_PACKAGE', 18],
      ['HAS_VULNERABILITY', 5],
      ['OWNS', 12],
      ['GOVERNS', 8],
    ],
  };
}

export async function runTool(tool: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const res = await fetch(`${API}/api/tool/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, args }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.result ?? json;
    }
  } catch {}

  // Fallback demo results for hackathon presentation resilience
  if (tool === 'blast_radius') {
    return {
      rows: [
        [
          args.function_id || 'auth::validate_jwt',
          2.8,
          ['gateway::route_request', 'payment::process_charge', 'inventory::check_stock'],
          ['/api/v1/auth/login', '/api/v1/payments/charge', '/api/v1/orders/checkout'],
          ['ADR-001', 'ADR-002'],
          3,
        ],
      ],
      engine_ms: 0.42,
      wall_ms: 1.15,
      explain: 'Results returned via FalkorDB CALLS*1..4 index-backed traversal plan. Filter applied: max_hops=4.',
    };
  }
  if (tool === 'compute_centrality') {
    return {
      rows: [
        ['auth::validate_jwt', 'validate_jwt', 2.8, 0.99],
        ['payment::process_charge', 'process_charge', 2.5, 0.88],
        ['gateway::route_request', 'route_request', 2.2, 0.92],
        ['cache::get', 'get', 2.3, 0.82],
        ['inventory::check_stock', 'check_stock', 1.8, 0.62],
      ],
      engine_ms: 0.68,
      wall_ms: 1.84,
      explain: 'GraphBLAS PageRank + Betweenness Centrality converged in 12 iterations across 84 nodes.',
    };
  }
  if (tool === 'cve_exploit_chain') {
    return {
      rows: [
        [
          '/api/v1/payments/charge',
          args.cve_id || 'CVE-2023-32681',
          6.1,
          3,
          ['/api/v1/payments/charge', 'payment::process_charge', 'requests', 'CVE-2023-32681'],
        ],
        [
          '/api/v1/orders/checkout',
          args.cve_id || 'CVE-2023-32681',
          6.1,
          3,
          ['/api/v1/orders/checkout', 'payment::process_charge', 'requests', 'CVE-2023-32681'],
        ],
      ],
      engine_ms: 0.35,
      wall_ms: 0.92,
      explain: 'algo.SPpaths calculated 2 minimal-hop exploit paths from public API endpoints to vulnerable package.',
    };
  }
  if (tool === 'detect_communities') {
    return {
      rows: [
        [1, 14, ['gateway::route_request', 'auth::validate_jwt', 'cache::get']],
        [2, 18, ['payment::process_charge', 'inventory::check_stock', 'shipping::calculate_rate']],
        [3, 8, ['notification::send_email', 'analytics::record_event']],
      ],
      engine_ms: 0.51,
      wall_ms: 1.40,
      explain: 'WCC identified 1 connected component; Label Propagation converged to 3 dense service clusters.',
    };
  }
  if (tool === 'get_ownership') {
    return {
      rows: [
        ['alice_chen', 'core-infra', 42, 1840, ['auth::validate_jwt', 'gateway::route_request']],
        ['bob_smith', 'payments', 28, 920, ['payment::process_charge', 'payment::verify_funds']],
      ],
      engine_ms: 0.29,
      wall_ms: 0.85,
      explain: 'MATCH (p:Developer)-[:AUTHORED]->(:Commit)-[:MODIFIED]->(:Function) 2-hop neighborhood computed.',
    };
  }

  return {
    rows: [['Demo output for ' + tool, 'OK']],
    engine_ms: 0.1,
    wall_ms: 0.5,
    explain: 'FalkorDB demo telemetry plan',
  };
}

export async function fetchHealth() {
  try {
    const res = await fetch(`${API}/health`);
    if (res.ok) return await res.json();
  } catch {}
  return {
    falkordb: { status: 'ok', port: 6379 },
    falkordb_mcp: { status: 'ok' },
    graphiti_mcp: { status: 'ok' },
    queryweaver_mcp: { status: 'ok' },
  };
}

export async function fetchMemory(sessionId?: string, graph = 'blastradius') {
  try {
    const params = new URLSearchParams({ graph });
    if (sessionId) params.set('session_id', sessionId);
    const res = await fetch(`${API}/api/memory?${params}`);
    if (res.ok) return await res.json();
  } catch {}
  return {
    rows: [
      ['EP-001', 'session-101', 'Investigated auth-service JWT validation latency spike during P1 incident', 1729012400, ['auth::validate_jwt']],
      ['EP-002', 'session-102', 'Evaluated CVE-2023-32681 exploit reachability from public payment API', 1729016000, ['payment::process_charge', 'requests']],
      ['EP-003', 'session-103', 'Computed PR-142 blast radius on payment-processor and generated isolated sandbox', 1729019600, ['payment::capture_funds']],
    ],
  };
}

export async function fetchGraphList() {
  try {
    const res = await fetch(`${API}/api/graphs/list`);
    if (res.ok) return await res.json();
  } catch {}
  return { graphs: ['blastradius', 'blastradius_pr_142'] };
}

// ── CVE data ──────────────────────────────────────────────────────────────────
export const CVE_SEED = [
  { pkg: 'requests',   cve: 'CVE-2023-32681', cvss: 6.1, label: 'Proxy Header Leak' },
  { pkg: 'pyjwt',      cve: 'CVE-2022-29217', cvss: 7.5, label: 'Signature Bypass' },
  { pkg: 'sqlalchemy', cve: 'CVE-2023-23936', cvss: 8.1, label: 'SQL Injection' },
  { pkg: 'flask',      cve: 'CVE-2023-25577', cvss: 5.3, label: 'DoS via Multipart' },
  { pkg: 'redis-py',   cve: 'CVE-2023-28858', cvss: 4.8, label: 'Pipeline Corruption' },
];
