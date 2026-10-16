"""
BlastRadius — Code Graph Ingestion
Parses Python source code into FalkorDB knowledge graph.
Uses Python AST parser or falkordb-code-graph (cgraph) to extract:
  - Functions, Classes, Modules
  - CALLS, CONTAINS, IMPORTS relationships
  - FastAPI / Flask route decorators -> API_Endpoint nodes with ROUTES_TO edges
"""
import ast
import os
import sys
from pathlib import Path
from typing import Dict, List, Set, Any
from falkordb import FalkorDB

HOST = os.getenv("FALKORDB_HOST", "localhost")
PORT = int(os.getenv("FALKORDB_PORT", 6379))
DEFAULT_GRAPH = os.getenv("DEFAULT_GRAPH", "blastradius")


class ASTGraphExtractor(ast.NodeVisitor):
    def __init__(self, file_path: str, module_name: str):
        self.file_path = file_path
        self.module_name = module_name
        self.functions: List[Dict[str, Any]] = []
        self.classes: List[Dict[str, Any]] = []
        self.calls: List[Dict[str, str]] = []
        self.endpoints: List[Dict[str, Any]] = []
        self.current_class = None
        self.current_function = None

    def visit_ClassDef(self, node: ast.ClassDef):
        prev_class = self.current_class
        self.current_class = node.name
        self.classes.append({
            "id": f"{self.module_name}::{node.name}",
            "name": node.name,
            "module": self.module_name,
            "line": node.lineno,
            "docstring": ast.get_docstring(node) or "",
        })
        self.generic_visit(node)
        self.current_class = prev_class

    def visit_FunctionDef(self, node: ast.FunctionDef):
        fn_id = f"{self.module_name}::{node.name}"
        if self.current_class:
            fn_id = f"{self.module_name}::{self.current_class}.{node.name}"
        
        doc = ast.get_docstring(node) or ""
        self.functions.append({
            "id": fn_id,
            "name": node.name,
            "module": self.module_name,
            "line": node.lineno,
            "docstring": doc,
        })

        # Check for route decorators (@app.get, @router.post, etc.)
        for dec in node.decorator_list:
            route_path = None
            method = "GET"
            if isinstance(dec, ast.Call):
                if isinstance(dec.func, ast.Attribute) and dec.func.attr in ("get", "post", "put", "delete", "patch", "route"):
                    method = dec.func.attr.upper()
                    if dec.args and isinstance(dec.args[0], ast.Constant):
                        route_path = dec.args[0].value
                elif isinstance(dec.func, ast.Name) and dec.func.id in ("route", "get", "post"):
                    if dec.args and isinstance(dec.args[0], ast.Constant):
                        route_path = dec.args[0].value
            if route_path:
                self.endpoints.append({
                    "route": str(route_path),
                    "method": method,
                    "target_fn": fn_id,
                    "is_public": not any(x in str(route_path).lower() for x in ["admin", "internal", "private"]),
                })

        prev_fn = self.current_function
        self.current_function = fn_id
        self.generic_visit(node)
        self.current_function = prev_fn

    def visit_Call(self, node: ast.Call):
        if self.current_function:
            callee_name = None
            if isinstance(node.func, ast.Name):
                callee_name = node.func.id
            elif isinstance(node.func, ast.Attribute):
                callee_name = node.func.attr

            if callee_name and not callee_name.startswith("__"):
                self.calls.append({
                    "caller": self.current_function,
                    "callee": callee_name,
                })
        self.generic_visit(node)


def ingest_codebase(repo_dir: str, graph_name: str = DEFAULT_GRAPH) -> Dict[str, int]:
    """Scans Python files in repo_dir and creates graph nodes/edges in FalkorDB."""
    db = FalkorDB(host=HOST, port=PORT)
    g = db.select_graph(graph_name)
    repo_path = Path(repo_dir).resolve()

    stats = {"functions": 0, "classes": 0, "calls": 0, "endpoints": 0}
    fn_name_to_ids: Dict[str, Set[str]] = {}

    for py_file in repo_path.glob("**/*.py"):
        if any(p.startswith(".") or p in ("venv", "node_modules", "__pycache__") for p in py_file.parts):
            continue
        rel = py_file.relative_to(repo_path)
        mod_name = str(rel.with_suffix("")).replace(os.sep, ".")

        try:
            with open(py_file, "r", encoding="utf-8", errors="ignore") as f:
                tree = ast.parse(f.read(), filename=str(py_file))
        except Exception:
            continue

        extractor = ASTGraphExtractor(str(rel), mod_name)
        extractor.visit(tree)

        # Ingest functions
        for fn in extractor.functions:
            g.query(
                """
                MERGE (f:Function {id: $id})
                SET f.name = $name, f.module = $module, f.line = $line, f.docstring = $docstring
                """,
                fn,
            )
            stats["functions"] += 1
            fn_name_to_ids.setdefault(fn["name"], set()).add(fn["id"])

        # Ingest classes
        for cl in extractor.classes:
            g.query(
                """
                MERGE (c:Class {id: $id})
                SET c.name = $name, c.module = $module, c.line = $line
                """,
                cl,
            )
            stats["classes"] += 1

        # Ingest endpoints
        for ep in extractor.endpoints:
            g.query(
                """
                MERGE (e:API_Endpoint {route: $route})
                SET e.method = $method, e.is_public = $is_public
                WITH e
                MATCH (f:Function {id: $target_fn})
                MERGE (e)-[:ROUTES_TO {weight: 1}]->(f)
                """,
                ep,
            )
            stats["endpoints"] += 1

        # Resolve calls
        for c in extractor.calls:
            targets = fn_name_to_ids.get(c["callee"], set())
            for tgt_id in targets:
                if tgt_id != c["caller"]:
                    g.query(
                        """
                        MATCH (caller:Function {id: $caller})
                        MATCH (callee:Function {id: $callee})
                        MERGE (caller)-[:CALLS {weight: 1}]->(callee)
                        """,
                        {"caller": c["caller"], "callee": tgt_id},
                    )
                    stats["calls"] += 1

    return stats


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "."
    print(f"Ingesting codebase at: {path}")
    print(ingest_codebase(path))
