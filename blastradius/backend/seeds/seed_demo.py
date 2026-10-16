"""
BlastRadius — Synthetic Demo Seed Dataset
Generates a realistic microservices codebase topology in FalkorDB.
Run: python seeds/seed_demo.py
"""
import os
import sys
import random
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from falkordb import FalkorDB

HOST = os.getenv("FALKORDB_HOST", "localhost")
PORT = int(os.getenv("FALKORDB_PORT", 6379))
GRAPH = os.getenv("DEMO_GRAPH", "blastradius")

# ── Seed Data Definitions ─────────────────────────────────────────────────

SERVICES = [
    "api-gateway", "auth-service", "payment-processor",
    "notification-service", "inventory-service", "shipping-service",
    "search-service", "analytics-service", "billing-service",
    "reporting-service", "cache-service", "queue-service",
]

DEVELOPERS = [
    {"username": "alice_chen",  "team": "core-infra",  "email": "alice@example.com"},
    {"username": "bob_smith",   "team": "payments",    "email": "bob@example.com"},
    {"username": "carol_jones", "team": "platform",    "email": "carol@example.com"},
]

PACKAGES = [
    {"name": "requests",   "version": "2.28.0"},
    {"name": "pyjwt",      "version": "2.4.0"},
    {"name": "sqlalchemy", "version": "1.4.46"},
    {"name": "flask",      "version": "2.2.2"},
    {"name": "redis-py",   "version": "4.3.4"},
]

CVES = [
    {
        "cve_id": "CVE-2023-32681",
        "pkg": "requests",
        "description": "Requests library forwards proxy-authorization headers to destination servers on HTTP redirects.",
        "cvss": 6.1,
        "vulnerable_symbol": "requests.get",
    },
    {
        "cve_id": "CVE-2022-29217",
        "pkg": "pyjwt",
        "description": "PyJWT allows bypass of ED25519/ED448 signature verification via key confusion.",
        "cvss": 7.5,
        "vulnerable_symbol": "jwt.decode",
    },
    {
        "cve_id": "CVE-2023-23936",
        "pkg": "sqlalchemy",
        "description": "SQLAlchemy ORM allows SQL injection via crafted filter parameters.",
        "cvss": 8.1,
        "vulnerable_symbol": "session.query",
    },
    {
        "cve_id": "CVE-2023-25577",
        "pkg": "flask",
        "description": "Flask multipart parser allows DoS via crafted multipart data.",
        "cvss": 5.3,
        "vulnerable_symbol": "flask.request.form",
    },
    {
        "cve_id": "CVE-2023-28858",
        "pkg": "redis-py",
        "description": "redis-py async client may corrupt data during concurrent pipeline usage.",
        "cvss": 4.8,
        "vulnerable_symbol": "aioredis.execute_command",
    },
]

PAST_INCIDENTS = [
    {
        "id": "INC-001",
        "title": "Payment processor timeout cascade",
        "root_cause": "auth-service JWT validation timeout caused payment-processor retry storm",
        "resolution_patch": "Added circuit breaker and JWT cache layer; increased timeout to 5s",
        "description": "Payment service experienced 503 errors for 23 minutes due to auth token validation latency spike",
        "severity": "P1",
    },
    {
        "id": "INC-002",
        "title": "Inventory service data corruption",
        "root_cause": "SQLAlchemy session not properly closed in inventory batch job causing stale reads",
        "resolution_patch": "Wrapped all batch queries in explicit session context managers; added session pool health check",
        "description": "Inventory counts drifted from actual stock due to ORM session leak",
        "severity": "P2",
    },
]

ADRS = [
    {
        "doc_id": "ADR-001",
        "title": "All external HTTP calls must use shared requests session",
        "rule_summary": "Mandatory use of centralized HTTP session to prevent token leakage",
        "body": "To prevent proxy-authorization header forwarding (ref CVE-2023-32681), all services must use the shared RequestsSession singleton from core.http_client instead of raw requests.get/post calls.",
    },
    {
        "doc_id": "ADR-002",
        "title": "JWT tokens must be validated with explicit algorithm allowlist",
        "rule_summary": "Explicit algorithm parameter required in jwt.decode calls",
        "body": "Following CVE-2022-29217, all JWT decode calls must pass algorithms=['RS256'] or ['HS256'] explicitly. No wildcard algorithm acceptance.",
    },
    {
        "doc_id": "ADR-003",
        "title": "Database sessions must use context managers",
        "rule_summary": "SQLAlchemy sessions must always be wrapped in with-statement",
        "body": "All SQLAlchemy session usage must use context managers (with Session() as session:) to prevent session leaks that caused INC-002.",
    },
]

PLAYBOOKS = [
    {
        "name": "auth-service-degradation",
        "steps": "1. Check auth-service pod health\n2. Verify JWT secret rotation\n3. Enable circuit breaker\n4. Notify payments team",
        "triggers": "auth-service latency > 500ms",
    },
    {
        "name": "payment-cascade-mitigation",
        "steps": "1. Enable payment service fallback mode\n2. Throttle retry rate to 1/s\n3. Alert core-infra team\n4. Check dependency graph blast radius",
        "triggers": "payment-processor error rate > 5%",
    },
    {
        "name": "cve-response-protocol",
        "steps": "1. Run cve_exploit_chain tool\n2. Identify blast radius\n3. Create PR sandbox\n4. Patch vulnerable package\n5. Run full test suite",
        "triggers": "CVE CVSS >= 7.0 affecting any production package",
    },
    {
        "name": "database-incident-response",
        "steps": "1. Identify affected session pool\n2. Drain active connections\n3. Restart connection pool\n4. Validate data consistency",
        "triggers": "Database error rate > 1% or connection pool exhaustion",
    },
]


def seed(db: FalkorDB) -> None:
    g = db.select_graph(GRAPH)
    dummy_emb = [0.01 * (i % 100) for i in range(256)]
    ts = int(time.time())

    print("[Seed] Creating Services...")
    for svc in SERVICES:
        g.query(
            "MERGE (s:Service {name: $name}) SET s.status = 'HEALTHY', s.tier = $tier, s.region = 'us-east-1'",
            {"name": svc, "tier": "1" if svc in ["api-gateway", "auth-service", "payment-processor"] else "2"},
        )

    print("[Seed] Creating Developer nodes...")
    for dev in DEVELOPERS:
        g.query(
            "MERGE (d:Developer {username: $username}) SET d.team = $team, d.email = $email",
            dev,
        )

    print("[Seed] Creating Package nodes...")
    for pkg in PACKAGES:
        g.query(
            "MERGE (p:Package {name: $name}) SET p.version = $version",
            pkg,
        )

    print("[Seed] Creating CVE nodes and linking to packages...")
    for cve in CVES:
        g.query(
            """MERGE (c:CVE {cve_id: $cve_id})
               SET c.description = $description, c.cvss = $cvss,
                   c.vulnerable_symbol = $vulnerable_symbol
               WITH c
               MATCH (p:Package {name: $pkg})
               MERGE (p)-[:HAS_VULNERABILITY]->(c)""",
            cve,
        )

    print("[Seed] Creating Function nodes with call graph...")
    # Service → API Endpoint → Function call chains
    service_fns = {
        "api-gateway": ["gateway::route_request", "gateway::authenticate_token", "gateway::rate_limit", "gateway::load_balance"],
        "auth-service": ["auth::validate_jwt", "auth::refresh_token", "auth::lookup_user", "auth::hash_password", "auth::create_session"],
        "payment-processor": ["payment::process_charge", "payment::validate_card", "payment::call_stripe", "payment::record_transaction", "payment::refund"],
        "notification-service": ["notify::send_email", "notify::send_sms", "notify::send_push", "notify::template_render"],
        "inventory-service": ["inventory::get_stock", "inventory::update_stock", "inventory::batch_sync", "inventory::reserve_items"],
        "shipping-service": ["shipping::calculate_rate", "shipping::create_label", "shipping::track_shipment"],
        "search-service": ["search::query_index", "search::rerank_results", "search::embed_query"],
        "analytics-service": ["analytics::track_event", "analytics::aggregate_metrics", "analytics::export_report"],
        "billing-service": ["billing::generate_invoice", "billing::apply_discount", "billing::reconcile"],
        "reporting-service": ["reporting::run_report", "reporting::export_csv", "reporting::schedule_job"],
        "cache-service": ["cache::get", "cache::set", "cache::invalidate", "cache::warm_up"],
        "queue-service": ["queue::publish", "queue::consume", "queue::retry_dead_letter"],
    }

    # Create all function nodes
    for svc, fns in service_fns.items():
        for fn_id in fns:
            g.query(
                """MERGE (f:Function {id: $id})
                   SET f.name = $name, f.service = $svc,
                       f.docstring = $docstring,
                       f.embedding = $emb,
                       f.pagerank_score = $pr, f.betweenness_score = $bt,
                       f.community_id = 0, f.wcc_id = 0
                   WITH f
                   MATCH (s:Service {name: $svc})
                   MERGE (s)-[:CONTAINS]->(f)""",
                {
                    "id": fn_id,
                    "name": fn_id.split("::")[-1],
                    "svc": svc,
                    "docstring": f"Core function in {svc} service",
                    "emb": dummy_emb,
                    "pr": round(random.uniform(0.1, 2.5), 4),
                    "bt": round(random.uniform(0.0, 1.0), 4),
                },
            )

    print("[Seed] Creating API endpoints...")
    endpoints = [
        ("/health",           "GET",  False, "gateway::load_balance"),
        ("/api/auth/login",   "POST", True,  "auth::validate_jwt"),
        ("/api/auth/refresh", "POST", True,  "auth::refresh_token"),
        ("/api/payments",     "POST", True,  "payment::process_charge"),
        ("/api/inventory",    "GET",  True,  "inventory::get_stock"),
        ("/api/search",       "GET",  True,  "search::query_index"),
        ("/api/notifications","POST", False, "notify::send_email"),
        ("/api/orders",       "POST", True,  "billing::generate_invoice"),
    ]
    for route, method, is_public, fn_id in endpoints:
        g.query(
            """MERGE (ep:API_Endpoint {route: $route})
               SET ep.method = $method, ep.is_public = $is_public
               WITH ep
               MATCH (f:Function {id: $fn_id})
               MERGE (ep)-[:ROUTES_TO {weight: 1}]->(f)""",
            {"route": route, "method": method, "is_public": is_public, "fn_id": fn_id},
        )

    print("[Seed] Creating function CALLS relationships...")
    call_graph = [
        # Gateway calls auth and payment
        ("gateway::route_request",     "auth::validate_jwt",       1),
        ("gateway::route_request",     "gateway::rate_limit",      1),
        ("gateway::authenticate_token","auth::lookup_user",        1),
        ("gateway::load_balance",      "gateway::route_request",   1),
        # Auth internal calls
        ("auth::validate_jwt",         "auth::lookup_user",        1),
        ("auth::refresh_token",        "auth::validate_jwt",       1),
        ("auth::create_session",       "cache::set",               1),
        ("auth::lookup_user",          "cache::get",               1),
        # Payment calls auth and external
        ("payment::process_charge",    "auth::validate_jwt",       1),
        ("payment::process_charge",    "payment::validate_card",   1),
        ("payment::process_charge",    "payment::call_stripe",     1),
        ("payment::process_charge",    "payment::record_transaction", 1),
        ("payment::record_transaction","queue::publish",           1),
        # Notifications driven by queue
        ("queue::consume",             "notify::send_email",       1),
        ("queue::consume",             "notify::send_push",        1),
        ("notify::send_email",         "notify::template_render",  1),
        # Inventory uses packages
        ("inventory::batch_sync",      "inventory::update_stock",  1),
        ("inventory::get_stock",       "cache::get",               1),
        ("inventory::reserve_items",   "inventory::update_stock",  1),
        # Billing
        ("billing::generate_invoice",  "billing::apply_discount",  1),
        ("billing::generate_invoice",  "payment::process_charge",  1),
        ("billing::reconcile",         "reporting::run_report",    1),
        # Search
        ("search::query_index",        "search::rerank_results",   1),
        ("search::query_index",        "search::embed_query",      1),
        # Analytics
        ("analytics::aggregate_metrics", "analytics::export_report", 1),
        # Cache  
        ("cache::warm_up",             "cache::set",               1),
        ("cache::invalidate",          "cache::get",               1),
        # Queue
        ("queue::retry_dead_letter",   "queue::publish",           1),
    ]
    for caller, callee, w in call_graph:
        g.query(
            """MATCH (a:Function {id: $caller}), (b:Function {id: $callee})
               MERGE (a)-[:CALLS {weight: $w}]->(b)""",
            {"caller": caller, "callee": callee, "w": w},
        )

    print("[Seed] Linking functions to packages (USES_PACKAGE)...")
    pkg_usage = [
        ("auth::validate_jwt",          "pyjwt"),
        ("payment::call_stripe",        "requests"),
        ("payment::process_charge",     "requests"),
        ("inventory::batch_sync",       "sqlalchemy"),
        ("inventory::get_stock",        "sqlalchemy"),
        ("notify::send_email",          "requests"),
        ("analytics::export_report",    "flask"),
        ("cache::get",                  "redis-py"),
        ("cache::set",                  "redis-py"),
        ("queue::publish",              "redis-py"),
    ]
    for fn_id, pkg_name in pkg_usage:
        g.query(
            """MATCH (f:Function {id: $fn_id}), (p:Package {name: $pkg_name})
               MERGE (f)-[:USES_PACKAGE {weight: 1}]->(p)""",
            {"fn_id": fn_id, "pkg_name": pkg_name},
        )

    print("[Seed] Creating Developer commits and ownership...")
    commits = [
        ("alice_chen",  "a1b2c3d", "auth-service",       ["auth::validate_jwt", "auth::refresh_token"],       120),
        ("alice_chen",  "b2c3d4e", "cache-service",       ["cache::get", "cache::set"],                        80),
        ("bob_smith",   "c3d4e5f", "payment-processor",   ["payment::process_charge", "payment::call_stripe"],  250),
        ("bob_smith",   "d4e5f6g", "billing-service",     ["billing::generate_invoice"],                        90),
        ("carol_jones", "e5f6g7h", "api-gateway",         ["gateway::route_request", "gateway::rate_limit"],    150),
        ("carol_jones", "f6g7h8i", "inventory-service",   ["inventory::get_stock", "inventory::batch_sync"],    200),
    ]
    for username, hash_, svc, fn_ids, lines in commits:
        g.query(
            """MATCH (d:Developer {username: $username})
               MERGE (c:Commit {hash: $hash})
               SET c.author = $username, c.service = $svc,
                   c.timestamp = $ts, c.message = $msg
               MERGE (d)-[:AUTHORED]->(c)""",
            {"username": username, "hash": hash_, "svc": svc,
             "ts": ts - random.randint(3600, 86400 * 30), "msg": f"feat({svc}): update core logic"},
        )
        for fn_id in fn_ids:
            g.query(
                """MATCH (c:Commit {hash: $hash}), (f:Function {id: $fn_id})
                   MERGE (c)-[r:MODIFIED]->(f)
                   SET r.lines_changed = $lines""",
                {"hash": hash_, "fn_id": fn_id, "lines": lines // len(fn_ids)},
            )

    print("[Seed] Creating Past Incidents...")
    for inc in PAST_INCIDENTS:
        g.query(
            """MERGE (i:PastIncident {id: $id})
               SET i.title = $title, i.root_cause = $root_cause,
                   i.resolution_patch = $resolution_patch,
                   i.description = $description,
                   i.severity = $severity,
                   i.embedding = $emb,
                   i.timestamp = $ts""",
            {**inc, "emb": dummy_emb, "ts": ts - random.randint(86400, 86400 * 90)},
        )

    # Link incident INC-001 to auth::validate_jwt
    g.query(
        """MATCH (i:PastIncident {id: 'INC-001'}), (f:Function {id: 'auth::validate_jwt'})
           MERGE (i)-[:CAUSED_BY]->(f)"""
    )
    g.query(
        """MATCH (i:PastIncident {id: 'INC-002'}), (f:Function {id: 'inventory::batch_sync'})
           MERGE (i)-[:CAUSED_BY]->(f)"""
    )

    print("[Seed] Creating Architecture Docs...")
    for adr in ADRS:
        g.query(
            """MERGE (a:ArchitectureDoc {doc_id: $doc_id})
               SET a.title = $title, a.rule_summary = $rule_summary,
                   a.body = $body, a.embedding = $emb""",
            {**adr, "emb": dummy_emb},
        )

    # ADR-001 governs functions using requests
    g.query(
        """MATCH (a:ArchitectureDoc {doc_id: 'ADR-001'}), (f:Function)
           WHERE f.id IN ['payment::call_stripe', 'notify::send_email', 'payment::process_charge']
           MERGE (a)-[:GOVERNS]->(f)"""
    )
    g.query(
        """MATCH (a:ArchitectureDoc {doc_id: 'ADR-002'}), (f:Function {id: 'auth::validate_jwt'})
           MERGE (a)-[:GOVERNS]->(f)"""
    )
    g.query(
        """MATCH (a:ArchitectureDoc {doc_id: 'ADR-003'}), (f:Function)
           WHERE f.id IN ['inventory::batch_sync', 'inventory::get_stock']
           MERGE (a)-[:GOVERNS]->(f)"""
    )

    print("[Seed] Creating Procedural Playbooks...")
    for pb in PLAYBOOKS:
        g.query(
            """MERGE (p:ProceduralPlaybook {name: $name})
               SET p.steps = $steps, p.triggers = $triggers""",
            pb,
        )

    # Link playbooks to remediated functions
    g.query(
        """MATCH (p:ProceduralPlaybook {name: 'auth-service-degradation'}),
                (f:Function {id: 'auth::validate_jwt'})
           MERGE (p)-[:REMEDIATES]->(f)"""
    )
    g.query(
        """MATCH (p:ProceduralPlaybook {name: 'payment-cascade-mitigation'}),
                (f:Function {id: 'payment::process_charge'})
           MERGE (p)-[:REMEDIATES]->(f)"""
    )
    g.query(
        """MATCH (p:ProceduralPlaybook {name: 'database-incident-response'}),
                (f:Function {id: 'inventory::batch_sync'})
           MERGE (p)-[:REMEDIATES]->(f)"""
    )

    print("[Seed] Creating sample Agent Episodes...")
    for i in range(3):
        g.query(
            """MERGE (ep:AgentEpisode {session_id: $sid, id: $eid})
               SET ep.summary = $summary, ep.timestamp = $ts, ep.embedding = $emb""",
            {
                "sid": f"session-{i+1}",
                "eid": f"ep-{i+1}",
                "summary": [
                    "Investigated payment processor outage; found auth dependency timeout as root cause",
                    "Scanned CVE-2023-32681 exploit path; identified 3-hop chain from /api/payments to requests",
                    "Ran blast radius analysis on auth::validate_jwt modification; found 12 downstream callers",
                ][i],
                "ts": ts - (i + 1) * 3600,
                "emb": dummy_emb,
            },
        )

    # Link episodes to investigated functions
    ep_fn_links = [
        ("ep-1", "auth::validate_jwt"),
        ("ep-2", "payment::call_stripe"),
        ("ep-3", "auth::validate_jwt"),
    ]
    for ep_id, fn_id in ep_fn_links:
        g.query(
            """MATCH (ep:AgentEpisode {id: $ep_id}), (f:Function {id: $fn_id})
               MERGE (ep)-[:INVESTIGATED]->(f)""",
            {"ep_id": ep_id, "fn_id": fn_id},
        )

    # Count what we created
    result = g.query("MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count ORDER BY count DESC")
    print("\n[Seed] Graph statistics:")
    for row in result.result_set:
        print(f"  {row[0]}: {row[1]}")

    result2 = g.query("MATCH ()-[r]->() RETURN type(r) AS rel, count(r) AS count ORDER BY count DESC")
    print("[Seed] Relationship counts:")
    for row in result2.result_set:
        print(f"  {row[0]}: {row[1]}")

    print(f"\n[Seed] Demo dataset seeded successfully into graph '{GRAPH}'")


if __name__ == "__main__":
    db = FalkorDB(host=HOST, port=PORT)
    seed(db)
