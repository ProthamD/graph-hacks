"""
BlastRadius — GraphRAG Documentation Ingestion
Parses Architecture Decision Records (ADRs) and Markdown specs into FalkorDB:
  - Creates :ArchitectureDoc nodes with title, rule_summary, status, and body
  - Links to target :Function or :Service nodes via :GOVERNS relationships
  - Integrates with GraphRAG-SDK and LiteLLM embeddings for vector indexing
"""
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Any
from falkordb import FalkorDB

HOST = os.getenv("FALKORDB_HOST", "localhost")
PORT = int(os.getenv("FALKORDB_PORT", 6379))
DEFAULT_GRAPH = os.getenv("DEFAULT_GRAPH", "blastradius")


def parse_adr_markdown(content: str, filename: str) -> Dict[str, Any]:
    """Extracts metadata, rule summary, and governed symbols from ADR markdown."""
    title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else filename

    doc_id_match = re.search(r"(ADR-\d+)", filename + " " + content)
    doc_id = doc_id_match.group(1) if doc_id_match else Path(filename).stem.upper()

    status_match = re.search(r"\bStatus:\s*([A-Za-z]+)", content, re.IGNORECASE)
    status = status_match.group(1).capitalize() if status_match else "Accepted"

    # Extract rule / decision summary
    decision_match = re.search(r"##\s*Decision\s*([\s\S]*?)(?=##|\Z)", content, re.IGNORECASE)
    rule_summary = ""
    if decision_match:
        rule_summary = decision_match.group(1).strip().replace("\n", " ")[:300]
    else:
        rule_summary = content[:250].strip().replace("\n", " ")

    # Find governed function / service tokens (e.g. `auth`, `payment`, function names)
    governed = set(re.findall(r"`([a-zA-Z0-9_]+(?:::[a-zA-Z0-9_]+)?)`", content))

    return {
        "doc_id": doc_id,
        "title": title,
        "status": status,
        "rule_summary": rule_summary,
        "body": content[:1500],
        "governed_symbols": list(governed),
    }


def ingest_docs_dir(docs_dir: str, graph_name: str = DEFAULT_GRAPH) -> int:
    """Ingests ADR files from a directory into FalkorDB ArchitectureDoc nodes."""
    db = FalkorDB(host=HOST, port=PORT)
    g = db.select_graph(graph_name)
    path = Path(docs_dir).resolve()
    count = 0

    for md_file in path.glob("**/*.md"):
        try:
            with open(md_file, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            adr = parse_adr_markdown(content, md_file.name)

            g.query(
                """
                MERGE (d:ArchitectureDoc {doc_id: $doc_id})
                SET d.title = $title,
                    d.status = $status,
                    d.rule_summary = $rule_summary,
                    d.body = $body
                """,
                {
                    "doc_id": adr["doc_id"],
                    "title": adr["title"],
                    "status": adr["status"],
                    "rule_summary": adr["rule_summary"],
                    "body": adr["body"],
                },
            )
            count += 1

            # Connect GOVERNS edges to any matching functions or services
            for sym in adr["governed_symbols"]:
                g.query(
                    """
                    MATCH (d:ArchitectureDoc {doc_id: $doc_id})
                    MATCH (f:Function) WHERE f.id CONTAINS $sym OR f.name = $sym
                    MERGE (d)-[:GOVERNS]->(f)
                    """,
                    {"doc_id": adr["doc_id"], "sym": sym},
                )
                g.query(
                    """
                    MATCH (d:ArchitectureDoc {doc_id: $doc_id})
                    MATCH (s:Service) WHERE s.name CONTAINS $sym
                    MERGE (d)-[:GOVERNS]->(s)
                    """,
                    {"doc_id": adr["doc_id"], "sym": sym},
                )
        except Exception as e:
            print(f"[GraphRAG-Ingest] Skipping {md_file.name}: {e}")

    return count


if __name__ == "__main__":
    p = sys.argv[1] if len(sys.argv) > 1 else "."
    print(f"Ingested {ingest_docs_dir(p)} documents")
