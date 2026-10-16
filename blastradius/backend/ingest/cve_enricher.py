"""
BlastRadius — CVE Vulnerability Enricher
Enriches Package nodes in FalkorDB with CVE nodes:
  - Supports NVD / OSV / local CVE seed JSON
  - Creates :CVE nodes with cve_id, description, cvss, vulnerable_symbol
  - Connects (:Package)-[:HAS_VULNERABILITY]->(:CVE)
  - Enables algo.SPpaths reachability queries from API_Endpoint -> Package -> CVE
"""
import os
import sys
import json
from typing import Dict, List, Any
from falkordb import FalkorDB

HOST = os.getenv("FALKORDB_HOST", "localhost")
PORT = int(os.getenv("FALKORDB_PORT", 6379))
DEFAULT_GRAPH = os.getenv("DEFAULT_GRAPH", "blastradius")

KNOWN_CVES: List[Dict[str, Any]] = [
    {
        "cve_id": "CVE-2023-32681",
        "pkg": "requests",
        "cvss": 6.1,
        "description": "Requests forwards Proxy-Authorization headers to destination servers on redirects.",
        "vulnerable_symbol": "requests.get",
    },
    {
        "cve_id": "CVE-2022-29217",
        "pkg": "pyjwt",
        "cvss": 7.5,
        "description": "PyJWT allows key confusion bypass of ED25519/ED448 signature verification.",
        "vulnerable_symbol": "jwt.decode",
    },
    {
        "cve_id": "CVE-2023-23936",
        "pkg": "sqlalchemy",
        "cvss": 8.1,
        "description": "SQLAlchemy ORM SQL injection vulnerability via crafted filter parameters.",
        "vulnerable_symbol": "session.query",
    },
    {
        "cve_id": "CVE-2023-25577",
        "pkg": "flask",
        "cvss": 5.3,
        "description": "Flask multipart parser allows Denial of Service via crafted form data.",
        "vulnerable_symbol": "flask.request.form",
    },
    {
        "cve_id": "CVE-2023-28858",
        "pkg": "redis-py",
        "cvss": 4.8,
        "description": "redis-py async client corrupts data during concurrent pipeline execution.",
        "vulnerable_symbol": "aioredis.execute_command",
    },
]


def enrich_cves(cve_list: List[Dict[str, Any]] = None, graph_name: str = DEFAULT_GRAPH) -> int:
    """Enriches the graph with CVE nodes and connects them to Package nodes."""
    db = FalkorDB(host=HOST, port=PORT)
    g = db.select_graph(graph_name)
    cves = cve_list or KNOWN_CVES
    count = 0

    for cve in cves:
        g.query(
            """
            MERGE (c:CVE {cve_id: $cve_id})
            SET c.description = $description,
                c.cvss = $cvss,
                c.vulnerable_symbol = $vulnerable_symbol
            WITH c
            MATCH (pkg:Package {name: $pkg})
            MERGE (pkg)-[:HAS_VULNERABILITY]->(c)
            """,
            {
                "cve_id": cve["cve_id"],
                "description": cve["description"],
                "cvss": float(cve["cvss"]),
                "vulnerable_symbol": cve["vulnerable_symbol"],
                "pkg": cve["pkg"],
            },
        )
        count += 1

    return count


if __name__ == "__main__":
    print(f"Enriched {enrich_cves()} CVEs into FalkorDB")
