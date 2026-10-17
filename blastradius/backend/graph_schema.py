"""
BlastRadius — FalkorDB Graph Schema Bootstrap
Runs on startup: creates all range, vector, and full-text indexes.
"""
import os
import sys
from falkordb import FalkorDB


def bootstrap(graph_name: str = "blastradius") -> None:
    host = os.getenv("FALKORDB_HOST", "localhost")
    port = int(os.getenv("FALKORDB_PORT", 6379))

    print(f"[BlastRadius] Connecting to FalkorDB at {host}:{port}...")
    db = FalkorDB(host=host, port=port)
    g = db.select_graph(graph_name)

    # ── RANGE INDEXES ────────────────────────────────────────────────────────
    range_indexes = [
        "CREATE INDEX FOR (f:Function)        ON (f.id)",
        "CREATE INDEX FOR (f:Function)        ON (f.name)",
        "CREATE INDEX FOR (ep:API_Endpoint)   ON (ep.route)",
        "CREATE INDEX FOR (pkg:Package)       ON (pkg.name)",
        "CREATE INDEX FOR (c:CVE)             ON (c.cve_id)",
        "CREATE INDEX FOR (d:Developer)       ON (d.username)",
        "CREATE INDEX FOR (e:AgentEpisode)    ON (e.session_id)",
        "CREATE INDEX FOR (pr:PullRequest)    ON (pr.pr_id)",
        "CREATE INDEX FOR (inc:PastIncident)  ON (inc.id)",
        "CREATE INDEX FOR (pb:ProceduralPlaybook) ON (pb.name)",
        "CREATE INDEX FOR (adr:ArchitectureDoc)   ON (adr.doc_id)",
        "CREATE INDEX FOR (svc:Service)       ON (svc.name)",
        "CREATE INDEX FOR (cmt:Commit)        ON (cmt.hash)",
    ]
    for idx in range_indexes:
        try:
            g.query(idx)
        except Exception:
            pass  # Index may already exist

    print(f"[BlastRadius] Range indexes ready ({len(range_indexes)} targets)")

    # ── VECTOR INDEXES (HNSW, COSINE) ────────────────────────────────────────
    dim = int(os.getenv("EMBEDDING_DIM", 256))
    vector_indexes = [
        ("Function",         "embedding"),
        ("ArchitectureDoc",  "embedding"),
        ("PastIncident",     "embedding"),
        ("AgentEpisode",     "embedding"),
    ]
    for label, prop in vector_indexes:
        try:
            g.query(
                f"CALL db.idx.vector.createNodeIndex($label, $prop, $dim, 'COSINE')",
                {"label": label, "prop": prop, "dim": dim},
            )
        except Exception:
            pass

    print(f"[BlastRadius] Vector indexes ready ({len(vector_indexes)} targets, dim={dim})")

    # ── FULL-TEXT INDEXES (BM25) ──────────────────────────────────────────────
    fulltext_indexes = [
        ("PastIncident",    ["root_cause", "resolution_patch", "description"]),
        ("CVE",             ["cve_id", "description", "vulnerable_symbol"]),
        ("ArchitectureDoc", ["title", "rule_summary", "body"]),
        ("Function",        ["name", "docstring"]),
    ]
    for label, props in fulltext_indexes:
        prop_args = ", ".join(f"'{p}'" for p in props)
        try:
            g.query(f"CALL db.idx.fulltext.createNodeIndex('{label}', {prop_args})")
        except Exception:
            pass

    print(f"[BlastRadius] Full-text indexes ready ({len(fulltext_indexes)} targets)")
    print(f"[BlastRadius] Schema bootstrap complete on graph '{graph_name}'")


if __name__ == "__main__":
    name = sys.argv[1] if len(sys.argv) > 1 else "blastradius"
    try:
        bootstrap(name)
    except Exception as e:
        print(f"[BlastRadius] Could not connect to FalkorDB on port 6379: {e}")
        print("[BlastRadius] Please start the FalkorDB container first: docker-compose up -d")
        sys.exit(1)
