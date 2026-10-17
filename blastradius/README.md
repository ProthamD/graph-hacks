# BlastRadius — FalkorDB Graph Intelligence

> **WeMakeDevs × FalkorDB Graph Hacks (Oct 15–18, 2026)**  
> Team Zero Degree (HBQZVK) | Solo Architect: Pratham Dey  
> Targets: **Track 01 + Track 02 + Track 03**

## What It Is

BlastRadius is an **autonomous codebase impact analysis agent** built on top of FalkorDB. It:

- Parses codebases into FalkorDB knowledge graphs via `falkordb-code-graph`
- Runs all **5 native FalkorDB algorithm categories** as MCP tools  
- Drives an LLM agent (LiteLLM) to answer blast-radius, CVE, ownership, and memory queries
- Presents a stunning Next.js 15 UI with live D3 force-graph visualization

**Core rule satisfied:** Remove FalkorDB → the product collapses. Every traversal, algorithm, and memory lookup goes through FalkorDB graph queries.

## Quick Start

### Prerequisites
- Docker Desktop
- Python 3.11+
- Node.js 20+
- An OpenAI API key (or Gemini / local Ollama)

### 1. Clone & Configure

```bash
cd "d:\graph hacks\blastradius"
cp .env.example .env
# Edit .env — set your OPENAI_API_KEY
```

### 2. Start FalkorDB (Docker)

```bash
docker-compose up -d
# FalkorDB on :6379, Browser on :3000
# Graphiti MCP on :8000, QueryWeaver on :5000
```

### 3. Bootstrap & Seed

```bash
cd backend
pip install -r requirements.txt
python graph_schema.py          # Creates all indexes
python seeds/seed_demo.py       # Seeds 80+ nodes with microservices topology
```

### 4. Start Backend API

```bash
python api_server.py
# FastAPI + FastMCP running on :8090
```

### 5. Start Frontend

```bash
cd ../frontend
npm install
npm run dev
# Next.js 15 on :3001
```

Open **http://localhost:3001**

## Architecture

```
Next.js 15 UI (:3001)
    ↓ REST / SSE
FastAPI Backend (:8090)
    ↓ Tool calls
LiteLLM Agent (gpt-4o / gemini / ollama)
    ↓ MCP
┌────────────────────────────────────────────┐
│  @falkordb/mcpserver (:8080)               │
│  blastradius-algos FastMCP (:8090)         │
│  graphiti-mcp (:8000 SSE)                  │
│  queryweaver-mcp (:5000)                   │
└────────┬───────────────────────────────────┘
         ↓
    FalkorDB (:6379)
```

## Track Coverage

| Track | Coverage |
|-------|---------|
| **Track 01 — Connected Data** | blast_radius (multi-hop), PageRank, Betweenness, SPpaths (CVE chain), WCC, CDLP — all 5 algorithm categories |
| **Track 02 — Memory & State** | graphiti-mcp SSE, AgentEpisode nodes, ProceduralPlaybook handoffs, episodic timeline |
| **Track 03 — Company Brain** | Developer ownership traversal, ADR governance via GraphRAG-SDK, queryweaver SQL correlation |

## MCP Tool Suite

| Tool | Algorithm Category | Description |
|------|--------------------|-------------|
| `blast_radius` | Traversal | Multi-hop CALLS impact (1..4 hops) |
| `compute_centrality` | 1 (PageRank) + 2 (Betweenness) | Critical function identification |
| `cve_exploit_chain` | 3 (SPpaths) | Shortest exploit path from API to CVE |
| `detect_communities` | 4 (WCC) + 5 (CDLP) | Disconnected islands + community clusters |
| `get_ownership` | Traversal | Developer ownership by commit history |
| `hybrid_search` | Vector + FullText | HNSW + BM25 + 2-hop structural traversal |
| `memory_lookup` | Graph traversal | Episodic memory chain retrieval |
| `clone_pr_sandbox` | GRAPH.COPY | Isolated PR graph for safe analysis |
| `graph_stats` | — | Node/edge counts by label |

## Graph Schema

- **Node labels:** `Function`, `Service`, `API_Endpoint`, `Package`, `CVE`, `Developer`, `Commit`, `PastIncident`, `ArchitectureDoc`, `AgentEpisode`, `ProceduralPlaybook`
- **Relationship types:** `CALLS`, `ROUTES_TO`, `USES_PACKAGE`, `HAS_VULNERABILITY`, `AUTHORED`, `MODIFIED`, `CAUSED_BY`, `INVESTIGATED`, `REMEDIATES`, `GOVERNS`, `CONTAINS`, `NEXT`
- **Indexes:** Range (all primary keys) + HNSW Vector (Function, ArchitectureDoc, PastIncident) + BM25 Full-Text (PastIncident, CVE, ArchitectureDoc)

## Core FalkorDB Cypher Queries & Graph Algorithms (Rule 10)

The product depends on the following exact FalkorDB Cypher queries and graph algorithms:

### 1. Algorithm Categories 1 & 2: PageRank & Betweenness Centrality
```cypher
// 1. PageRank Centrality: Ranks critical architectural nodes
CALL algo.pageRank('Function', 'CALLS') YIELD node, score
SET node.pagerank_score = score;

// 2. Betweenness Centrality: Identifies bottleneck bridge functions
CALL algo.betweenness({nodeLabels: ['Function'], relationshipTypes: ['CALLS']})
YIELD node, score
SET node.betweenness_score = score
RETURN node.id AS fn_id, node.pagerank_score AS pagerank, score AS betweenness
ORDER BY betweenness DESC, pagerank DESC
LIMIT 15;
```

### 2. Algorithm Category 3: Shortest Path CVE Exploit Reachability (`algo.SPpaths`)
```cypher
// Proves shortest path from public API perimeter to a vulnerable package
MATCH (ep:API_Endpoint {is_public: true}),
      (pkg:Package {name: $pkg_name})-[:HAS_VULNERABILITY]->(cve:CVE {cve_id: $cve_id})
CALL algo.SPpaths({
    sourceNode: ep,
    targetNode: pkg,
    relTypes: ['ROUTES_TO', 'CALLS', 'USES_PACKAGE'],
    weightProp: 'weight',
    relDirection: 'outgoing',
    pathCount: 3
}) YIELD path, pathWeight
RETURN ep.route AS exposed_api,
       cve.cve_id AS cve,
       cve.cvss AS cvss_score,
       pathWeight AS hop_count,
       [n IN nodes(path) | coalesce(n.route, n.id, n.name)] AS exploit_chain
ORDER BY hop_count ASC;
```

### 3. Algorithm Categories 4 & 5: WCC & Community Detection (`algo.labelPropagation`)
```cypher
// 4. Weakly Connected Components: Finds disconnected microservices / dead code
CALL algo.WCC({nodeLabels: ['Function'], relationshipTypes: ['CALLS']})
YIELD node, componentId
SET node.wcc_id = componentId;

// 5. Label Propagation (CDLP): Clusters dense microservice communities
CALL algo.labelPropagation({nodeLabels: ['Function'], relationshipTypes: ['CALLS']})
YIELD node, communityId
SET node.community_id = communityId
RETURN communityId,
       count(node) AS cluster_size,
       collect(node.name)[0..8] AS cluster_members
ORDER BY cluster_size DESC
LIMIT 20;
```

### 4. Multi-Hop Blast Radius Traversal & ADR Governance Check
```cypher
MATCH (target:Function {id: $fn_id})
OPTIONAL MATCH path = (caller:Function)-[:CALLS*1..$hops]->(target)
OPTIONAL MATCH (ep:API_Endpoint)-[:ROUTES_TO]->(caller)
OPTIONAL MATCH (adr:ArchitectureDoc)-[:GOVERNS]->(target)
RETURN target.id AS modified_fn,
       target.pagerank_score AS pr_score,
       collect(DISTINCT caller.id) AS callers,
       collect(DISTINCT ep.route) AS impacted_apis,
       collect(DISTINCT adr.doc_id) AS adr_constraints,
       count(DISTINCT caller) AS caller_count;
```

### 5. PR Sandbox Cloning via `GRAPH.COPY`
```redis
GRAPH.COPY blastradius blastradius_pr_142
```

## Hackathon Submission Checklist (Rule 10)

- [x] **Public Source-Code Repository:** https://github.com/prothamd/graph-hacks
- [x] **Primary Graph Database:** FalkorDB (All traversals, algorithms, and triage decisions depend on FalkorDB)
- [x] **Track Entered:** Track 01 (Agents That Act on Connected Data) + Track 02 + Track 03
- [x] **Graph Data Model & Cypher Queries:** Fully documented in README and runnable via FastMCP
- [x] **Local Setup Instructions:** Complete `docker-compose.yml` and `start.ps1` / `start.sh`
- [ ] **Demo Video (3–5 min):** Record working walkthrough showing the UI, FalkorDB Browser, and PR Triage action

