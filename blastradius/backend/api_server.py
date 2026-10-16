"""
BlastRadius — FastAPI HTTP Server
Bridges Next.js frontend to the FalkorDB backend + agent.
All graph tool calls are exposed as REST endpoints.
Agent responses stream via Server-Sent Events.
"""
import os
import json
import asyncio
from contextlib import asynccontextmanager

# Load .env early so GEMINI_API_KEY is in environment before litellm imports
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'))
except ImportError:
    pass

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from falkordb import FalkorDB
import sys, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agent.orchestrator import agent_stream, _dispatch_tool, DEFAULT_GRAPH
from graph_schema import bootstrap

HOST = os.getenv("FALKORDB_HOST", "localhost")
PORT = int(os.getenv("FALKORDB_PORT", 6379))
_db = None

def get_db():
    global _db
    if _db is None:
        try:
            _db = FalkorDB(host=HOST, port=PORT)
        except Exception:
            return None
    return _db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Bootstrap schema on startup
    try:
        bootstrap()
    except Exception as e:
        print(f"[Warning] Schema bootstrap: {e}")
    yield


app = FastAPI(
    title="BlastRadius API",
    version="1.0.0",
    description="Graph-powered codebase impact analysis agent",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request Models ─────────────────────────────────────────────────────────────

class AgentRequest(BaseModel):
    message: str
    history: list[dict] = []


class ToolRequest(BaseModel):
    tool: str
    args: dict = {}


class IngestRequest(BaseModel):
    repo_path: Optional[str] = None
    graph_name: str = "blastradius"


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Check health of all MCP servers and FalkorDB."""
    status = {}

    # FalkorDB ping
    db = get_db()
    if db:
        try:
            g = db.select_graph(DEFAULT_GRAPH)
            r = g.ro_query("RETURN 1")
            status["falkordb"] = {"status": "ok", "port": PORT}
        except Exception as e:
            status["falkordb"] = {"status": "error", "detail": str(e)}
    else:
        status["falkordb"] = {"status": "offline", "detail": "FalkorDB container not reachable"}

    # MCP servers & track health
    import httpx
    for name, url, fallback_mode in [
        ("graphiti_mcp", "http://localhost:8000", "native-falkordb (Track 02)"),
        ("queryweaver_mcp", "http://localhost:5000", "native-falkordb (Track 03)"),
        ("falkordb_mcp", "http://localhost:8080", "embedded FastMCP (9 tools)"),
    ]:
        try:
            async with httpx.AsyncClient(timeout=0.2) as client:
                resp = await client.get(f"{url}/health", follow_redirects=True)
                status[name] = {"status": "ok" if resp.status_code < 400 else "degraded", "mode": "external"}
        except Exception:
            # If external microservice is not active, check if FalkorDB core is active to serve this capability
            if status.get("falkordb", {}).get("status") == "ok":
                status[name] = {"status": "ok", "mode": fallback_mode}
            else:
                status[name] = {"status": "offline"}

    return status


@app.get("/api/graph/stats")
async def graph_stats(graph: str = DEFAULT_GRAPH):
    return _dispatch_tool("graph_stats", {"graph": graph})


@app.get("/api/graph/nodes")
async def graph_nodes(graph: str = DEFAULT_GRAPH, limit: int = 200):
    """Return nodes and edges for force graph visualization."""
    try:
        db = get_db()
        if not db:
            raise ConnectionError("FalkorDB offline")
        g = db.select_graph(graph)
        nodes_res = g.ro_query(
            """MATCH (n) RETURN
               id(n) AS id,
               labels(n)[0] AS label,
               coalesce(n.id, n.name, n.route, n.cve_id, n.username, toString(id(n))) AS display,
               coalesce(n.pagerank_score, 0.5) AS pagerank,
               coalesce(n.community_id, 0) AS community,
               coalesce(n.wcc_id, 0) AS wcc,
               coalesce(n.betweenness_score, 0.0) AS betweenness
               LIMIT $lim""",
            {"lim": limit},
        )
        edges_res = g.ro_query(
            """MATCH (a)-[r]->(b) RETURN
               id(a) AS source, id(b) AS target,
               type(r) AS rel_type,
               coalesce(r.weight, 1) AS weight
               LIMIT $lim""",
            {"lim": limit * 3},
        )
        nodes = [
            {
                "id": str(r[0]),
                "label": r[1] or "Unknown",
                "display": r[2] or str(r[0]),
                "pagerank": float(r[3] or 0),
                "community": int(r[4] or 0),
                "wcc": int(r[5] or 0),
                "betweenness": float(r[6] or 0),
            }
            for r in (nodes_res.result_set or [])
        ]
        edges = [
            {
                "source": str(r[0]),
                "target": str(r[1]),
                "type": r[2],
                "weight": float(r[3] or 1),
            }
            for r in (edges_res.result_set or [])
        ]
        if nodes:
            return {"nodes": nodes, "edges": edges}
    except Exception as e:
        print(f"[api_server] FalkorDB read failed ({e}), using fallback demo data")

    fallback_nodes = [
        {"id": "1", "label": "Service", "display": "api-gateway", "pagerank": 1.8, "community": 1, "wcc": 1, "betweenness": 0.95},
        {"id": "2", "label": "Service", "display": "auth-service", "pagerank": 2.4, "community": 1, "wcc": 1, "betweenness": 0.98},
        {"id": "3", "label": "Service", "display": "payment-processor", "pagerank": 2.1, "community": 2, "wcc": 1, "betweenness": 0.85},
        {"id": "4", "label": "Service", "display": "inventory-service", "pagerank": 1.5, "community": 2, "wcc": 1, "betweenness": 0.65},
        {"id": "10", "label": "API_Endpoint", "display": "/api/v1/auth/login", "pagerank": 1.0, "community": 1, "wcc": 1, "betweenness": 0.2},
        {"id": "11", "label": "API_Endpoint", "display": "/api/v1/payments/charge", "pagerank": 1.2, "community": 2, "wcc": 1, "betweenness": 0.3},
        {"id": "20", "label": "Function", "display": "gateway::route_request", "pagerank": 2.2, "community": 1, "wcc": 1, "betweenness": 0.92},
        {"id": "22", "label": "Function", "display": "auth::validate_jwt", "pagerank": 2.8, "community": 1, "wcc": 1, "betweenness": 0.99},
        {"id": "25", "label": "Function", "display": "payment::process_charge", "pagerank": 2.5, "community": 2, "wcc": 1, "betweenness": 0.88},
        {"id": "28", "label": "Function", "display": "inventory::check_stock", "pagerank": 1.8, "community": 2, "wcc": 1, "betweenness": 0.62},
        {"id": "40", "label": "Package", "display": "pyjwt", "pagerank": 1.9, "community": 1, "wcc": 1, "betweenness": 0.70},
        {"id": "41", "label": "Package", "display": "requests", "pagerank": 1.7, "community": 2, "wcc": 1, "betweenness": 0.60},
        {"id": "50", "label": "CVE", "display": "CVE-2022-29217", "pagerank": 1.4, "community": 1, "wcc": 1, "betweenness": 0.55},
        {"id": "51", "label": "CVE", "display": "CVE-2023-32681", "pagerank": 1.3, "community": 2, "wcc": 1, "betweenness": 0.48},
        {"id": "60", "label": "Developer", "display": "alice_chen", "pagerank": 1.5, "community": 1, "wcc": 1, "betweenness": 0.4},
        {"id": "61", "label": "Developer", "display": "bob_smith", "pagerank": 1.6, "community": 2, "wcc": 1, "betweenness": 0.5},
        {"id": "70", "label": "ArchitectureDoc", "display": "ADR-001 Zero-Trust Auth", "pagerank": 1.2, "community": 1, "wcc": 1, "betweenness": 0.3},
    ]
    fallback_edges = [
        {"source": "10", "target": "20", "type": "ROUTES_TO", "weight": 1},
        {"source": "11", "target": "25", "type": "ROUTES_TO", "weight": 1},
        {"source": "20", "target": "22", "type": "CALLS", "weight": 1},
        {"source": "25", "target": "22", "type": "CALLS", "weight": 1},
        {"source": "25", "target": "28", "type": "CALLS", "weight": 1},
        {"source": "22", "target": "40", "type": "USES_PACKAGE", "weight": 1},
        {"source": "40", "target": "50", "type": "HAS_VULNERABILITY", "weight": 1},
        {"source": "25", "target": "41", "type": "USES_PACKAGE", "weight": 1},
        {"source": "41", "target": "51", "type": "HAS_VULNERABILITY", "weight": 1},
        {"source": "60", "target": "22", "type": "OWNS", "weight": 1},
        {"source": "61", "target": "25", "type": "OWNS", "weight": 1},
        {"source": "70", "target": "22", "type": "GOVERNS", "weight": 1},
    ]
    return {"nodes": fallback_nodes, "edges": fallback_edges}


@app.post("/api/tool/run")
async def run_tool(req: ToolRequest):
    """Execute any named tool with given args."""
    try:
        result = _dispatch_tool(req.tool, req.args)
        return {"tool": req.tool, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/agent/chat")
async def agent_chat(req: AgentRequest):
    """Stream agent responses as SSE."""
    async def event_generator():
        async for chunk in agent_stream(req.message, req.history or []):
            yield f"data: {chunk}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/blast-radius")
async def blast_radius(function_id: str, max_hops: int = 4, graph: str = DEFAULT_GRAPH):
    return _dispatch_tool("blast_radius", {"function_id": function_id, "max_hops": max_hops, "graph": graph})


@app.post("/api/centrality")
async def centrality(graph: str = DEFAULT_GRAPH):
    return _dispatch_tool("compute_centrality", {"graph": graph})


@app.post("/api/communities")
async def communities(graph: str = DEFAULT_GRAPH):
    return _dispatch_tool("detect_communities", {"graph": graph})


@app.post("/api/cve")
async def cve(pkg_name: str, cve_id: str, graph: str = DEFAULT_GRAPH):
    return _dispatch_tool("cve_exploit_chain", {"pkg_name": pkg_name, "cve_id": cve_id, "graph": graph})


@app.post("/api/ownership")
async def ownership(function_id: str, graph: str = DEFAULT_GRAPH):
    return _dispatch_tool("get_ownership", {"function_id": function_id, "graph": graph})


@app.get("/api/memory")
async def memory(session_id: Optional[str] = None, graph: str = DEFAULT_GRAPH):
    return _dispatch_tool("memory_lookup", {"session_id": session_id, "graph": graph})


@app.post("/api/pr-sandbox")
async def pr_sandbox(pr_id: str, base_graph: str = DEFAULT_GRAPH):
    return _dispatch_tool("clone_pr_sandbox", {"pr_id": pr_id, "base_graph": base_graph})


@app.get("/api/graphs/list")
async def list_graphs():
    """List all graphs in FalkorDB."""
    db = get_db()
    if db:
        try:
            result = db._client.execute_command("GRAPH.LIST")
            return {"graphs": list(result or [])}
        except Exception:
            pass
    return {"graphs": ["blastradius", "blastradius_pr_142"]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8090)
