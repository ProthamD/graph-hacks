"""
BlastRadius — Core FastMCP Server
Exposes all 8 graph algorithm tools via MCP protocol.
All reads use ro_query; writes use query with explicit flag.
Every response includes GRAPH.EXPLAIN telemetry.

Run: python backend/mcp_server.py
"""
import os
import time
import json

from falkordb import FalkorDB
try:
    from fastmcp import FastMCP
except ImportError:
    try:
        from mcp.server.fastmcp import FastMCP
    except (ImportError, ModuleNotFoundError):
        from mcp.server import MCPServer as FastMCP

# ── Connection ────────────────────────────────────────────────────────────────
_db = None

def _get_db():
    global _db
    if _db is None:
        try:
            _db = FalkorDB(
                host=os.getenv("FALKORDB_HOST", "localhost"),
                port=int(os.getenv("FALKORDB_PORT", 6379)),
            )
        except Exception:
            return None
    return _db

mcp = FastMCP("BlastRadius-FalkorDB-Algos", version="1.0.0")

DEFAULT_GRAPH = os.getenv("DEFAULT_GRAPH", "blastradius")


def _exec(
    graph: str,
    cypher: str,
    params: dict | None = None,
    ro: bool = True,
) -> dict:
    """Execute a Cypher query and return rows + telemetry."""
    db = _get_db()
    if db is None:
        return {
            "rows": [],
            "engine_ms": 0.0,
            "wall_ms": 0.0,
            "explain": "FalkorDB connection unavailable (ensure FalkorDB container is running on port 6379)",
            "graph": graph,
            "error": "falkordb_offline",
        }
    try:
        g = db.select_graph(graph)
        t0 = time.perf_counter()
        if ro:
            res = g.ro_query(cypher, params or {})
        else:
            res = g.query(cypher, params or {})
        wall_ms = round((time.perf_counter() - t0) * 1000, 2)

        # Grab EXPLAIN plan (best-effort)
        try:
            plan = str(g.explain(cypher))[:800]
        except Exception:
            plan = "unavailable"

        return {
            "rows": [list(r) for r in (res.result_set or [])],
            "engine_ms": float(getattr(res, "run_time_ms", wall_ms)),
            "wall_ms": wall_ms,
            "explain": plan,
            "graph": graph,
        }
    except Exception as e:
        return {
            "rows": [],
            "engine_ms": 0.0,
            "wall_ms": 0.0,
            "explain": f"Execution error: {str(e)}",
            "graph": graph,
            "error": str(e),
        }


# ── TOOL 1: Blast Radius ──────────────────────────────────────────────────────
@mcp.tool()
def blast_radius(
    function_id: str,
    max_hops: int = 4,
    graph: str = DEFAULT_GRAPH,
) -> dict:
    """
    Multi-hop upstream caller impact analysis.
    Finds every function that transitively calls the given function
    (up to max_hops), the public API endpoints that expose those callers,
    and any Architecture Decision Records (ADRs) governing the target.

    Returns: callers list, impacted API routes, ADR constraints, hop counts.
    """
    cypher = """
    MATCH (target:Function {id: $fn_id})
    OPTIONAL MATCH path = (caller:Function)-[:CALLS*1..$hops]->(target)
    OPTIONAL MATCH (ep:API_Endpoint)-[:ROUTES_TO]->(caller)
    OPTIONAL MATCH (adr:ArchitectureDoc)-[:GOVERNS]->(target)
    RETURN
        target.id            AS modified_fn,
        target.pagerank_score AS pr_score,
        target.community_id  AS cluster,
        collect(DISTINCT caller.id)   AS callers,
        collect(DISTINCT ep.route)    AS impacted_apis,
        collect(DISTINCT adr.doc_id)  AS adr_constraints,
        count(DISTINCT caller)        AS caller_count
    """
    return _exec(graph, cypher, {"fn_id": function_id, "hops": max_hops})


# ── TOOL 2: PageRank + Betweenness (Algorithm Categories 1 & 2) ───────────────
@mcp.tool()
def compute_centrality(graph: str = DEFAULT_GRAPH) -> dict:
    """
    Runs PageRank and Betweenness Centrality on the Function:CALLS call graph.
    Persists scores back to each Function node.
    Returns the top 15 functions by betweenness (critical bridge nodes).
    """
    # PageRank — write pass
    _exec(
        graph,
        "CALL algo.pageRank('Function', 'CALLS') YIELD node, score "
        "SET node.pagerank_score = score RETURN count(node) AS updated",
        ro=False,
    )
    # Betweenness — write pass then return ranked results
    return _exec(
        graph,
        """
        CALL algo.betweenness({nodeLabels: ['Function'], relationshipTypes: ['CALLS']})
        YIELD node, score
        SET node.betweenness_score = score
        RETURN node.id AS fn_id,
               node.name AS fn_name,
               node.pagerank_score AS pagerank,
               score AS betweenness
        ORDER BY betweenness DESC, pagerank DESC
        LIMIT 15
        """,
        ro=False,
    )


# ── TOOL 3: CVE Exploit Chain via SPpaths (Algorithm Category 3) ──────────────
@mcp.tool()
def cve_exploit_chain(
    pkg_name: str,
    cve_id: str,
    graph: str = DEFAULT_GRAPH,
) -> dict:
    """
    Computes the shortest exploit path from any public API endpoint to a
    vulnerable package/CVE using algo.SPpaths (weighted shortest path).
    Returns hop-by-hop exploit chain for up to 3 paths.
    """
    cypher = """
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
    RETURN
        ep.route   AS exposed_api,
        cve.cve_id AS cve,
        cve.cvss   AS cvss_score,
        pathWeight AS hop_count,
        [n IN nodes(path) | coalesce(n.route, n.id, n.name)] AS exploit_chain
    ORDER BY hop_count ASC
    """
    return _exec(graph, cypher, {"pkg_name": pkg_name, "cve_id": cve_id})


# ── TOOL 4: WCC + CDLP Community Detection (Algorithm Categories 4 & 5) ───────
@mcp.tool()
def detect_communities(graph: str = DEFAULT_GRAPH) -> dict:
    """
    Runs both WCC (Weakly Connected Components) and CDLP (Label Propagation)
    on the Function:CALLS graph. Persists wcc_id and community_id on each node.
    Returns community cluster summary (up to 20 clusters).
    """
    # WCC — identifies disconnected islands
    _exec(
        graph,
        """
        CALL algo.WCC({nodeLabels: ['Function'], relationshipTypes: ['CALLS']})
        YIELD node, componentId
        SET node.wcc_id = componentId
        RETURN count(node) AS updated
        """,
        ro=False,
    )
    # CDLP — identifies dense communities within connected components
    return _exec(
        graph,
        """
        CALL algo.labelPropagation({
            nodeLabels: ['Function'],
            relationshipTypes: ['CALLS']
        })
        YIELD node, communityId
        SET node.community_id = communityId
        RETURN communityId,
               count(node) AS cluster_size,
               collect(node.name)[0..8] AS cluster_members
        ORDER BY cluster_size DESC
        LIMIT 20
        """,
        ro=False,
    )


# ── TOOL 5: Developer Ownership (Company Brain) ───────────────────────────────
@mcp.tool()
def get_ownership(
    function_id: str,
    graph: str = DEFAULT_GRAPH,
) -> dict:
    """
    Identifies which developer(s) own a function and its 2-hop neighbourhood
    based on commit history. Returns engineer, team, commit count, and lines owned.
    """
    cypher = """
    MATCH (target:Function {id: $fn_id})-[:CALLS*0..2]-(neighbor:Function)
    MATCH (p:Developer)-[:AUTHORED]->(c:Commit)-[m:MODIFIED]->(neighbor)
    WHERE m.invalidated_at IS NULL
    RETURN
        p.username AS engineer,
        p.team AS team,
        count(DISTINCT c) AS commits,
        sum(m.lines_changed) AS lines_owned,
        collect(DISTINCT neighbor.name)[0..5] AS owned_subgraph
    ORDER BY commits DESC, lines_owned DESC
    LIMIT 5
    """
    return _exec(graph, cypher, {"fn_id": function_id})


# ── TOOL 6: Hybrid Vector + Full-Text GraphRAG ────────────────────────────────
@mcp.tool()
def hybrid_search(
    query_embedding: list[float],
    error_keyword: str,
    graph: str = DEFAULT_GRAPH,
) -> dict:
    """
    Single-pass GraphRAG combining:
    - HNSW vector similarity search on Function embeddings
    - BM25 full-text search on PastIncident root_cause / resolution_patch
    - 2-hop structural traversal to find upstream callers and governing ADRs

    Returns merged context for LLM grounding.
    """
    vector_result = _exec(
        graph,
        """
        CALL db.idx.vector.queryNodes('Function', 'embedding', 5, vecf32($emb))
        YIELD node AS fn, score
        MATCH (fn)<-[:CALLS*0..2]-(upstream:Function)
        OPTIONAL MATCH (adr:ArchitectureDoc)-[:GOVERNS]->(fn)
        RETURN fn.id AS matched_fn,
               fn.name AS fn_name,
               (1.0 - score) AS semantic_score,
               collect(DISTINCT upstream.id) AS upstream_callers,
               collect(DISTINCT adr.title) AS governing_docs
        ORDER BY semantic_score DESC
        LIMIT 5
        """,
        {"emb": query_embedding},
    )
    fulltext_result = _exec(
        graph,
        """
        CALL db.idx.fulltext.queryNodes('PastIncident', $kw)
        YIELD node AS inc
        MATCH (inc)-[:CAUSED_BY]->(fn:Function)
        OPTIONAL MATCH (ep:AgentEpisode)-[:INVESTIGATED]->(fn)
        OPTIONAL MATCH (pb:ProceduralPlaybook)-[:REMEDIATES]->(fn)
        RETURN inc.id AS incident,
               inc.title AS title,
               fn.id AS fn,
               ep.session_id AS episode,
               pb.name AS playbook
        LIMIT 5
        """,
        {"kw": error_keyword},
    )
    return {"vector": vector_result, "fulltext": fulltext_result}


# ── TOOL 7: Episodic Memory Lookup (Track 02) ─────────────────────────────────
@mcp.tool()
def memory_lookup(
    session_id: str | None = None,
    graph: str = DEFAULT_GRAPH,
) -> dict:
    """
    Retrieves episodic memory from AgentEpisode nodes.
    If session_id is provided, returns that session's episode chain.
    Otherwise returns the 10 most recent episodes across all sessions.
    """
    if session_id:
        cypher = """
        MATCH (ep:AgentEpisode {session_id: $sid})
        OPTIONAL MATCH (ep)-[:INVESTIGATED]->(fn:Function)
        OPTIONAL MATCH (ep)-[:NEXT]->(next_ep:AgentEpisode)
        RETURN ep.id AS episode_id,
               ep.summary AS summary,
               ep.timestamp AS ts,
               collect(DISTINCT fn.id) AS investigated_fns,
               next_ep.id AS next_episode
        ORDER BY ep.timestamp ASC
        """
        return _exec(graph, cypher, {"sid": session_id})
    else:
        cypher = """
        MATCH (ep:AgentEpisode)
        OPTIONAL MATCH (ep)-[:INVESTIGATED]->(fn:Function)
        RETURN ep.id AS episode_id,
               ep.session_id AS session,
               ep.summary AS summary,
               ep.timestamp AS ts,
               collect(DISTINCT fn.id) AS investigated_fns
        ORDER BY ep.timestamp DESC
        LIMIT 10
        """
        return _exec(graph, cypher)


# ── TOOL 8: PR Sandbox via GRAPH.COPY ─────────────────────────────────────────
@mcp.tool()
def clone_pr_sandbox(
    pr_id: str,
    base_graph: str = DEFAULT_GRAPH,
) -> dict:
    """
    Creates an isolated PR sandbox by cloning the main graph using GRAPH.COPY.
    The sandbox is named {base_graph}_pr_{pr_id}.
    Safe to run impact analysis on sandbox without touching production graph.
    """
    sandbox = f"{base_graph}_pr_{pr_id}"
    db = _get_db()
    if db is None:
        return {"sandbox": sandbox, "status": "simulated", "base": base_graph}
    try:
        db._client.execute_command("GRAPH.COPY", base_graph, sandbox)
        return {"sandbox": sandbox, "status": "ready", "base": base_graph}
    except Exception as e:
        # May already exist — that's fine
        return {"sandbox": sandbox, "status": "exists_or_error", "detail": str(e)}


# ── TOOL 9: Graph Statistics ──────────────────────────────────────────────────
@mcp.tool()
def graph_stats(graph: str = DEFAULT_GRAPH) -> dict:
    """Returns node count, edge count, and label breakdown for a graph."""
    nodes = _exec(graph, "MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count ORDER BY count DESC")
    edges = _exec(graph, "MATCH ()-[r]->() RETURN type(r) AS rel, count(r) AS count ORDER BY count DESC")
    return {"nodes": nodes["rows"], "edges": edges["rows"]}


if __name__ == "__main__":
    import sys
    transport = sys.argv[1] if len(sys.argv) > 1 else "stdio"
    mcp.run(transport=transport)
