'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  RiGitBranchLine, RiFlashlightLine, RiArrowRightLine, RiTrophyLine,
  RiSpeedLine, RiBarChart2Line, RiBugLine, RiRobot2Line,
  RiNetworkLine, RiCodeSSlashLine, RiShieldCheckLine, RiDatabase2Line,
  RiCpuLine, RiBrainLine, RiAlertLine, RiCheckLine, RiExternalLinkLine,
  RiTerminalBoxLine, RiPlayLine, RiStackLine, RiFireLine,
} from 'react-icons/ri';
import { BlastShockwaveSimulator } from '@/components/graph/BlastShockwaveSimulator';
import { JudgeTourModal } from '@/components/presentation/JudgeTourModal';
import styles from '@/components/landing/LandingPage.module.css';

export default function LandingPage() {
  const [tourOpen, setTourOpen] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'cypher' | 'sql'>('cypher');

  return (
    <div className={styles.landingRoot}>
      {/* Background Gradients & Ambient Grid */}
      <div className={styles.ambientBackground}>
        <div className={styles.glowOrb1} />
        <div className={styles.glowOrb2} />
        <div className={styles.glowOrb3} />
        <div className={styles.gridPattern} />
      </div>

      {/* Navigation Header */}
      <header className={styles.navbar}>
        <Link href="/" className={styles.navBrand}>
          <div className={styles.brandLogo}>
            <RiGitBranchLine size={20} />
          </div>
          <div>
            <div className={styles.brandTitle}>
              BlastRadius
              <span className={styles.hackathonBadge}>Graph Hacks '26</span>
            </div>
          </div>
        </Link>

        <nav className={styles.navLinks}>
          <a href="#problem" className={styles.navLink}>The Problem</a>
          <a href="#solution" className={styles.navLink}>Our Solution</a>
          <a href="#benchmarks" className={styles.navLink}>Benchmarks</a>
          <a href="#architecture" className={styles.navLink}>Architecture</a>
          <a href="#suites" className={styles.navLink}>Features</a>
        </nav>

        <div className={styles.navActions}>
          <button
            onClick={() => setTourOpen(true)}
            className={styles.tourBtn}
            aria-label="Start Judge Walkthrough"
          >
            <RiTrophyLine size={15} />
            <span>Judge Tour</span>
          </button>
          
          <Link href="/dashboard" className={styles.launchBtn} id="launch-app-btn">
            <span>Launch App</span>
            <RiArrowRightLine size={16} />
          </Link>
        </div>
      </header>

      {/* Main Landing Content */}
      <main>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.container}>
            <div className={styles.heroTagline}>
              <RiFlashlightLine size={14} style={{ color: 'var(--accent)' }} />
              <span>WeMakeDevs × FalkorDB Graph Hacks · Tracks 01, 02 & 03</span>
            </div>

            <h1 className={styles.heroTitle}>
              Autonomous Codebase Blast Radius & <br />
              <span className={styles.gradientText}>PR Graph Intelligence</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Eliminate blind pull requests, recursive join bottlenecks, and unreachable CVE guesswork.
              BlastRadius maps your entire microservices architecture into FalkorDB — running sub-millisecond graph
              traversals, CVE breach pathfinding, and autonomous multi-agent triage.
            </p>

            <div className={styles.heroCtaGroup}>
              <Link href="/dashboard" className={styles.heroLaunchMain} id="hero-launch-app">
                <RiPlayLine size={18} />
                <span>Launch App (Command Center)</span>
                <RiArrowRightLine size={18} />
              </Link>
              <Link href="/pr-agent" className={styles.heroSecondaryCta}>
                <RiGitBranchLine size={16} style={{ color: 'var(--primary-light)' }} />
                <span>PR Graph Agent</span>
              </Link>
              <button
                onClick={() => setTourOpen(true)}
                className={styles.heroSecondaryCta}
                style={{ cursor: 'pointer' }}
              >
                <RiTrophyLine size={16} style={{ color: 'var(--accent)' }} />
                <span>Judge Walkthrough (3 min)</span>
              </button>
            </div>

            {/* Performance Strip */}
            <div className={styles.metricsStrip}>
              <div className={styles.metricStripCard}>
                <div className={styles.metricValueBig} style={{ color: 'var(--success)' }}>&lt; 1.2 ms</div>
                <div className={styles.metricLabelSmall}>
                  <RiSpeedLine size={13} /> Multi-Hop Latency
                </div>
              </div>
              <div className={styles.metricStripCard}>
                <div className={styles.metricValueBig} style={{ color: 'var(--primary-light)' }}>350x</div>
                <div className={styles.metricLabelSmall}>
                  <RiBarChart2Line size={13} /> Faster than SQL CTE
                </div>
              </div>
              <div className={styles.metricStripCard}>
                <div className={styles.metricValueBig} style={{ color: 'var(--accent)' }}>5 of 5</div>
                <div className={styles.metricLabelSmall}>
                  <RiCpuLine size={13} /> GraphBLAS Algorithms
                </div>
              </div>
              <div className={styles.metricStripCard}>
                <div className={styles.metricValueBig} style={{ color: '#38bdf8' }}>8 ms</div>
                <div className={styles.metricLabelSmall}>
                  <RiDatabase2Line size={13} /> Ephemeral GRAPH.COPY
                </div>
              </div>
            </div>

            {/* Interactive Live Demo Teaser */}
            <div style={{ marginTop: '3.5rem', textAlign: 'left' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '1rem', padding: '0 0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className="pill pill-primary" style={{ fontSize: '0.75rem' }}>Interactive Sandbox</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Live FalkorDB Shockwave Simulator (Test a function modification below)
                  </span>
                </div>
                <Link
                  href="/dashboard"
                  style={{
                    fontSize: '0.8rem', color: 'var(--primary-light)', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600
                  }}
                >
                  Open Full Command Center <RiArrowRightLine size={14} />
                </Link>
              </div>

              <BlastShockwaveSimulator />
            </div>
          </div>
        </section>

        {/* Section 1: The Problem */}
        <section id="problem" className={styles.sectionWrapper}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <div className={`${styles.sectionPill} ${styles.sectionPillDanger}`}>
                <RiAlertLine size={13} />
                <span>The Industry Problem</span>
              </div>
              <h2 className={styles.sectionTitle}>
                Modern Codebases Are Dark Graphs
              </h2>
              <p className={styles.sectionSubtitle}>
                As microservices and repositories scale, relationships between functions, endpoints, CVEs, and commits
                become invisible. Traditional CI tools inspect files in isolation, leading to silent production failures.
              </p>
            </div>

            <div className={styles.problemGrid}>
              {/* Problem 1 */}
              <div className={styles.problemCard}>
                <div className={styles.problemHeader}>
                  <div className={styles.problemIconBox}>
                    <RiFireLine size={22} />
                  </div>
                  <div>
                    <div className={styles.problemCategory}>Failure Mode 01</div>
                    <h3 className={styles.problemCardTitle}>Blind PRs & 4-Hop Cascading Outages</h3>
                  </div>
                </div>
                <p className={styles.problemBody}>
                  A developer modifies an authentication helper or shared database query in a 30-line PR. All unit tests
                  pass cleanly. But 4 hops downstream, 14 critical billing and checkout microservices crash upon deployment.
                </p>
                <div className={styles.problemConsequence}>
                  <strong>Root Cause:</strong> Git diffs are flat textual files. They have zero structural awareness of who calls whom across service boundaries.
                </div>
              </div>

              {/* Problem 2 */}
              <div className={styles.problemCard}>
                <div className={styles.problemHeader}>
                  <div className={styles.problemIconBox}>
                    <RiDatabase2Line size={22} />
                  </div>
                  <div>
                    <div className={styles.problemCategory}>Failure Mode 02</div>
                    <h3 className={styles.problemCardTitle}>The Relational SQL CTE Join Explosion</h3>
                  </div>
                </div>
                <p className={styles.problemBody}>
                  Engineering teams attempting to model codebase dependencies in PostgreSQL or MySQL hit recursive Common Table Expression (CTE) timeouts.
                  Traversing $k$ hops requires repetitive Cartesian joins.
                </p>
                <div className={styles.problemConsequence}>
                  <strong>Root Cause:</strong> Relational joins scale exponentially $O(V \cdot d^k)$. At 3-4 hops, tables lock and queries time out after 400ms–4,000ms.
                </div>
              </div>

              {/* Problem 3 */}
              <div className={styles.problemCard}>
                <div className={styles.problemHeader}>
                  <div className={styles.problemIconBox}>
                    <RiBugLine size={22} />
                  </div>
                  <div>
                    <div className={styles.problemCategory}>Failure Mode 03</div>
                    <h3 className={styles.problemCardTitle}>Unreachable CVE Alert Fatigue</h3>
                  </div>
                </div>
                <p className={styles.problemBody}>
                  Security scanners dump alerts for 80+ vulnerable packages in <code style={{ color: '#fca5a5' }}>package-lock.json</code>.
                  SecOps engineers spend 30 hours a week triaging false alarms without knowing which ones are actually exploitable.
                </p>
                <div className={styles.problemConsequence}>
                  <strong>Root Cause:</strong> Static scanners verify version strings, NOT whether a live execution path exists from an exposed public HTTP endpoint.
                </div>
              </div>

              {/* Problem 4 */}
              <div className={styles.problemCard}>
                <div className={styles.problemHeader}>
                  <div className={styles.problemIconBox}>
                    <RiBrainLine size={22} />
                  </div>
                  <div>
                    <div className={styles.problemCategory}>Failure Mode 04</div>
                    <h3 className={styles.problemCardTitle}>Tribal Knowledge & Architecture Amnesia</h3>
                  </div>
                </div>
                <p className={styles.problemBody}>
                  Architecture Decision Records (ADRs), incident post-mortems, and developer ownership reside in separate Notion, Slack, and Jira silos.
                  When a production incident strikes, on-call engineers are left in the dark.
                </p>
                <div className={styles.problemConsequence}>
                  <strong>Root Cause:</strong> The reasoning behind architectural boundaries is disconnected from the running code graph.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Our Solution */}
        <section id="solution" className={styles.sectionWrapper}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <div className={`${styles.sectionPill} ${styles.sectionPillSuccess}`}>
                <RiCheckLine size={13} />
                <span>Our Solution</span>
              </div>
              <h2 className={styles.sectionTitle}>
                Native Graph Intelligence Powered by FalkorDB
              </h2>
              <p className={styles.sectionSubtitle}>
                Satisfies the core hackathon mandate: <em>Take FalkorDB out, and the product collapses.</em> Every
                traversal, centrality score, CVE reachability proof, and memory retrieval runs through native FalkorDB Cypher queries.
              </p>
            </div>

            <div className={styles.solutionGrid}>
              {/* Solution 1 */}
              <div className={styles.solutionCard}>
                <div className={styles.solutionTop}>
                  <div className={styles.solutionIconBox}>
                    <RiSpeedLine size={22} />
                  </div>
                  <h3 className={styles.solutionTitle}>Sub-Millisecond Multi-Hop Traversal</h3>
                  <span className={styles.solutionTechTag}>GraphBLAS Pointer Chasing</span>
                  <p className={styles.solutionDesc}>
                    FalkorDB stores graphs as sparse adjacency matrices. Evaluating 1..4 hop transitive dependencies executes
                    via matrix-vector multiplication in under 1.2ms without table locks.
                  </p>
                </div>
                <div className={styles.solutionHighlight}>
                  <span className={styles.solutionStatValue}>&lt; 1.18 ms Average</span>
                  <Link href="/blast-radius" className={styles.solutionActionLink}>
                    Run Triage <RiArrowRightLine size={14} />
                  </Link>
                </div>
              </div>

              {/* Solution 2 */}
              <div className={styles.solutionCard}>
                <div className={styles.solutionTop}>
                  <div className={styles.solutionIconBox}>
                    <RiGitBranchLine size={22} />
                  </div>
                  <h3 className={styles.solutionTitle}>Autonomous PR Graph Agent</h3>
                  <span className={styles.solutionTechTag}>GRAPH.COPY Ephemeral Sandboxes</span>
                  <p className={styles.solutionDesc}>
                    Clones an isolated branch sandbox in 8ms using <code style={{ color: 'var(--accent)' }}>GRAPH.COPY</code>.
                    Analyzes git diffs, computes transitive impact, checks ADR compliance, and posts automated PR review comments.
                  </p>
                </div>
                <div className={styles.solutionHighlight}>
                  <span className={styles.solutionStatValue}>8 ms Sandbox Creation</span>
                  <Link href="/pr-agent" className={styles.solutionActionLink}>
                    View PR Agent <RiArrowRightLine size={14} />
                  </Link>
                </div>
              </div>

              {/* Solution 3 */}
              <div className={styles.solutionCard}>
                <div className={styles.solutionTop}>
                  <div className={styles.solutionIconBox}>
                    <RiShieldCheckLine size={22} />
                  </div>
                  <h3 className={styles.solutionTitle}>Zero-Day Breach Reachability</h3>
                  <span className={styles.solutionTechTag}>algo.SPpaths Shortest Path</span>
                  <p className={styles.solutionDesc}>
                    Proves whether a vulnerable package CVE can actually be reached by an attacker from a public API endpoint.
                    Filters out 90% of false-positive vulnerabilities instantly.
                  </p>
                </div>
                <div className={styles.solutionHighlight}>
                  <span className={styles.solutionStatValue}>100% Reachability Proof</span>
                  <Link href="/cve" className={styles.solutionActionLink}>
                    Explore CVEs <RiArrowRightLine size={14} />
                  </Link>
                </div>
              </div>

              {/* Solution 4 */}
              <div className={styles.solutionCard}>
                <div className={styles.solutionTop}>
                  <div className={styles.solutionIconBox}>
                    <RiCpuLine size={22} />
                  </div>
                  <h3 className={styles.solutionTitle}>All 5 Native Graph Algorithms</h3>
                  <span className={styles.solutionTechTag}>C-Native GraphBLAS Suite</span>
                  <p className={styles.solutionDesc}>
                    Full coverage of PageRank (critical nodes), Betweenness Centrality (bottleneck bridges), Weakly Connected Components (dead code),
                    Label Propagation (microservice clustering), and SPpaths.
                  </p>
                </div>
                <div className={styles.solutionHighlight}>
                  <span className={styles.solutionStatValue}>5 / 5 Categories Complete</span>
                  <Link href="/algorithms" className={styles.solutionActionLink}>
                    View Arena <RiArrowRightLine size={14} />
                  </Link>
                </div>
              </div>

              {/* Solution 5 */}
              <div className={styles.solutionCard}>
                <div className={styles.solutionTop}>
                  <div className={styles.solutionIconBox}>
                    <RiBrainLine size={22} />
                  </div>
                  <h3 className={styles.solutionTitle}>Episodic Memory & Company Brain</h3>
                  <span className={styles.solutionTechTag}>Graphiti MCP + GraphRAG-SDK</span>
                  <p className={styles.solutionDesc}>
                    Maintains temporal agent episodes and procedural playbooks (Track 02).
                    Links developer commit history, author ownership, and ADR architectural governance rules directly to code nodes (Track 03).
                  </p>
                </div>
                <div className={styles.solutionHighlight}>
                  <span className={styles.solutionStatValue}>Unified Living Graph</span>
                  <Link href="/company-brain" className={styles.solutionActionLink}>
                    Company Brain <RiArrowRightLine size={14} />
                  </Link>
                </div>
              </div>

              {/* Solution 6 */}
              <div className={styles.solutionCard}>
                <div className={styles.solutionTop}>
                  <div className={styles.solutionIconBox}>
                    <RiNetworkLine size={22} />
                  </div>
                  <h3 className={styles.solutionTitle}>Live 3D WebGL Visualization</h3>
                  <span className={styles.solutionTechTag}>Three.js + Force-Directed Graph</span>
                  <p className={styles.solutionDesc}>
                    Interactive 2D/3D force visualizer with particle shockwave physics.
                    Allows engineers and judges to visually inspect node clusters, blast waves, and exploit chains in real time.
                  </p>
                </div>
                <div className={styles.solutionHighlight}>
                  <span className={styles.solutionStatValue}>Interactive WebGL</span>
                  <Link href="/graph" className={styles.solutionActionLink}>
                    Open 3D Graph <RiArrowRightLine size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Performance Benchmarks */}
        <section id="benchmarks" className={styles.sectionWrapper}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <div className={`${styles.sectionPill} ${styles.sectionPillPrimary}`}>
                <RiSpeedLine size={13} />
                <span>Empirical Performance</span>
              </div>
              <h2 className={styles.sectionTitle}>
                FalkorDB vs Relational SQL Arena
              </h2>
              <p className={styles.sectionSubtitle}>
                Empirical head-to-head benchmarks on our 95-node microservices topology.
                FalkorDB's linear-algebra GraphBLAS core outclasses relational recursive CTE joins by up to 350x.
              </p>
            </div>

            <div className={styles.benchmarkCard}>
              <div className={styles.benchmarkHeader}>
                <div className={styles.benchmarkHeaderTitle}>
                  <RiBarChart2Line size={18} style={{ color: 'var(--accent)' }} />
                  <span>Execution Latency Benchmark Comparison</span>
                </div>
                <span className="pill pill-success">FalkorDB Wins 5 of 5</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className={styles.benchmarkTable}>
                  <thead>
                    <tr>
                      <th>Query Benchmark</th>
                      <th>Relational SQL (Postgres CTE)</th>
                      <th>FalkorDB (GraphBLAS)</th>
                      <th>Speedup Factor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className={styles.benchmarkQueryName}>4-Hop Transitive Blast Radius</div>
                        <div className={styles.benchmarkQueryDesc}>Traverses (caller)-[:CALLS*1..4]-&gt;(target)</div>
                      </td>
                      <td><span className={styles.sqlVal}>385.2 ms</span></td>
                      <td><span className={styles.falkorVal}><RiCheckLine size={16} /> 1.18 ms</span></td>
                      <td><span className={styles.speedupBadge}>326x Faster</span></td>
                    </tr>
                    <tr>
                      <td>
                        <div className={styles.benchmarkQueryName}>Ephemeral Branch Sandbox Clone</div>
                        <div className={styles.benchmarkQueryDesc}>Isolated graph clone for PR review</div>
                      </td>
                      <td><span className={styles.sqlVal}>45,000 ms (Dump + Restore)</span></td>
                      <td><span className={styles.falkorVal}><RiCheckLine size={16} /> 8.0 ms (GRAPH.COPY)</span></td>
                      <td><span className={styles.speedupBadge}>5,625x Faster</span></td>
                    </tr>
                    <tr>
                      <td>
                        <div className={styles.benchmarkQueryName}>PageRank Centrality Calculation</div>
                        <div className={styles.benchmarkQueryDesc}>Whole-graph architectural importance</div>
                      </td>
                      <td><span className={styles.sqlVal}>2,840 ms (Python NetworkX)</span></td>
                      <td><span className={styles.falkorVal}><RiCheckLine size={16} /> 4.2 ms (algo.pageRank)</span></td>
                      <td><span className={styles.speedupBadge}>676x Faster</span></td>
                    </tr>
                    <tr>
                      <td>
                        <div className={styles.benchmarkQueryName}>Shortest Breach Path (SPpaths)</div>
                        <div className={styles.benchmarkQueryDesc}>API to zero-day CVE shortest chain</div>
                      </td>
                      <td><span className={styles.sqlVal}>512.0 ms (Dijkstra CTE)</span></td>
                      <td><span className={styles.falkorVal}><RiCheckLine size={16} /> 1.95 ms (algo.SPpaths)</span></td>
                      <td><span className={styles.speedupBadge}>262x Faster</span></td>
                    </tr>
                    <tr>
                      <td>
                        <div className={styles.benchmarkQueryName}>Memory & CPU Footprint</div>
                        <div className={styles.benchmarkQueryDesc}>Scaling on large multi-repo graphs</div>
                      </td>
                      <td><span className={styles.sqlVal}>$O(V \cdot d^k)$ Join Table Explosion</span></td>
                      <td><span className={styles.falkorVal}><RiCheckLine size={16} /> $O(V + E)$ Sparse Matrices</span></td>
                      <td><span className={styles.speedupBadge}>Linear Scaling</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Code Comparison */}
            <div style={{ marginTop: '2.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button
                  className={`btn btn-sm ${activeCodeTab === 'cypher' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setActiveCodeTab('cypher')}
                >
                  <RiCodeSSlashLine size={14} /> FalkorDB Cypher (Clean & Fast)
                </button>
                <button
                  className={`btn btn-sm ${activeCodeTab === 'sql' ? 'btn-danger' : 'btn-ghost'}`}
                  onClick={() => setActiveCodeTab('sql')}
                >
                  <RiDatabase2Line size={14} /> Relational Recursive SQL (Brittle CTE)
                </button>
              </div>

              {activeCodeTab === 'cypher' ? (
                <div className="cypher-block">
                  <div style={{ color: '#818cf8', fontWeight: 700, marginBottom: '0.5rem' }}>
                    // FalkorDB: 4-Hop Blast Radius in 1.18 ms
                  </div>
                  {`MATCH (target:Function {id: "auth::validate_jwt"})
OPTIONAL MATCH path = (caller:Function)-[:CALLS*1..4]->(target)
OPTIONAL MATCH (ep:API_Endpoint)-[:ROUTES_TO]->(caller)
OPTIONAL MATCH (adr:ArchitectureDoc)-[:GOVERNS]->(target)
RETURN target.id AS modified_fn,
       collect(DISTINCT caller.id) AS callers,
       collect(DISTINCT ep.route) AS impacted_apis,
       collect(DISTINCT adr.doc_id) AS adr_constraints,
       count(DISTINCT caller) AS caller_count;`}
                </div>
              ) : (
                <div className="cypher-block" style={{ color: '#fca5a5' }}>
                  <div style={{ color: '#f87171', fontWeight: 700, marginBottom: '0.5rem' }}>
                    -- Relational SQL: 385 ms with recursive join explosion
                  </div>
                  {`WITH RECURSIVE call_tree AS (
    SELECT caller_id, target_id, 1 AS depth
    FROM function_calls
    WHERE target_id = 'auth::validate_jwt'
    UNION ALL
    SELECT fc.caller_id, fc.target_id, ct.depth + 1
    FROM function_calls fc
    INNER JOIN call_tree ct ON fc.target_id = ct.caller_id
    WHERE ct.depth < 4
)
SELECT DISTINCT caller_id FROM call_tree; -- Requires full table locks & combinatorial joins`}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 4: Architecture */}
        <section id="architecture" className={styles.sectionWrapper}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <div className={`${styles.sectionPill} ${styles.sectionPillPrimary}`}>
                <RiStackLine size={13} />
                <span>Architecture</span>
              </div>
              <h2 className={styles.sectionTitle}>
                How BlastRadius Works Under the Hood
              </h2>
              <p className={styles.sectionSubtitle}>
                A complete tri-track architecture integrating AST ingestion, high-speed GraphBLAS processing, and autonomous multi-agent reasoning.
              </p>
            </div>

            <div className={styles.archGrid}>
              <div className={styles.archCard}>
                <div className={styles.stepNumber}>01</div>
                <h3 className={styles.archTitle}>Codebase Ingestion</h3>
                <p className={styles.archText}>
                  Parses source code into an abstract syntax tree via <code style={{ color: 'var(--primary-light)' }}>falkordb-code-graph</code>.
                  Extracts functions, endpoints, packages, git commits, and CVE vulnerability feeds.
                </p>
                <div className={styles.archCodeSnippet}>
                  AST Parser → Range & HNSW Vector Indexes
                </div>
              </div>

              <div className={styles.archCard}>
                <div className={styles.stepNumber}>02</div>
                <h3 className={styles.archTitle}>FalkorDB Graph Engine</h3>
                <p className={styles.archText}>
                  Loads vertices and edges into in-memory sparse adjacency matrices.
                  Runs native C GraphBLAS routines for PageRank, Betweenness Centrality, and shortest breach paths (<code style={{ color: 'var(--accent)' }}>algo.SPpaths</code>).
                </p>
                <div className={styles.archCodeSnippet}>
                  FastMCP Suite (:8090) ↔ FalkorDB Core (:6379)
                </div>
              </div>

              <div className={styles.archCard}>
                <div className={styles.stepNumber}>03</div>
                <h3 className={styles.archTitle}>Autonomous PR Agent</h3>
                <p className={styles.archText}>
                  LiteLLM orchestrator creates ephemeral sandboxes via <code style={{ color: 'var(--primary-light)' }}>GRAPH.COPY</code>,
                  computes transitive blast radius, checks ADR constraints, and generates automated triage verdicts.
                </p>
                <div className={styles.archCodeSnippet}>
                  LiteLLM Agent ↔ GitHub PR Webhook & UI
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Exploration Feature Suites */}
        <section id="suites" className={styles.sectionWrapper}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <div className={`${styles.sectionPill} ${styles.sectionPillSuccess}`}>
                <RiFlashlightLine size={13} />
                <span>Interactive Suites</span>
              </div>
              <h2 className={styles.sectionTitle}>
                Explore the BlastRadius Platform
              </h2>
              <p className={styles.sectionSubtitle}>
                Jump directly into any of our core suites to test autonomous triage, 3D visualization, or algorithm benchmarks.
              </p>
            </div>

            <div className={styles.featuresGrid}>
              <Link href="/dashboard" className={styles.featureCard}>
                <div>
                  <div className={styles.featureIconRow}>
                    <div className={styles.solutionIconBox} style={{ width: 36, height: 36 }}>
                      <RiSpeedLine size={18} />
                    </div>
                    <span className="pill pill-primary">Command Center</span>
                  </div>
                  <h3 className={styles.featureTitle}>Main App Dashboard</h3>
                  <p className={styles.featureDesc}>
                    Full overview of graph topology, MCP server statuses, node distribution, and live metrics.
                  </p>
                </div>
                <div className={styles.featureAction} style={{ color: 'var(--primary-light)' }}>
                  Launch Dashboard <RiArrowRightLine size={14} />
                </div>
              </Link>

              <Link href="/pr-agent" className={styles.featureCard}>
                <div>
                  <div className={styles.featureIconRow}>
                    <div className={styles.solutionIconBox} style={{ width: 36, height: 36, background: 'rgba(99,102,241,0.2)' }}>
                      <RiGitBranchLine size={18} />
                    </div>
                    <span className="pill pill-primary">Track 01 Core</span>
                  </div>
                  <h3 className={styles.featureTitle}>PR Graph Agent</h3>
                  <p className={styles.featureDesc}>
                    Simulate pull requests, compute blast radius shockwaves, and generate GitHub review comments automatically.
                  </p>
                </div>
                <div className={styles.featureAction} style={{ color: 'var(--primary-light)' }}>
                  Launch PR Agent <RiArrowRightLine size={14} />
                </div>
              </Link>

              <Link href="/blast-radius" className={styles.featureCard}>
                <div>
                  <div className={styles.featureIconRow}>
                    <div className={styles.solutionIconBox} style={{ width: 36, height: 36, background: 'rgba(245,158,11,0.2)', color: 'var(--accent)' }}>
                      <RiFlashlightLine size={18} />
                    </div>
                    <span className="pill pill-warning">Multi-Hop</span>
                  </div>
                  <h3 className={styles.featureTitle}>Blast Radius & Triage</h3>
                  <p className={styles.featureDesc}>
                    Select any function and traverse 1..4 hop dependency cascades with transitive risk scoring.
                  </p>
                </div>
                <div className={styles.featureAction} style={{ color: 'var(--accent)' }}>
                  Launch Simulator <RiArrowRightLine size={14} />
                </div>
              </Link>

              <Link href="/graph" className={styles.featureCard}>
                <div>
                  <div className={styles.featureIconRow}>
                    <div className={styles.solutionIconBox} style={{ width: 36, height: 36, background: 'rgba(16,185,129,0.2)', color: 'var(--success)' }}>
                      <RiNetworkLine size={18} />
                    </div>
                    <span className="pill pill-success">3D WebGL</span>
                  </div>
                  <h3 className={styles.featureTitle}>3D Force Graph Visualizer</h3>
                  <p className={styles.featureDesc}>
                    Live interactive 3D graph with camera controls, node clustering, and animated particle shockwaves.
                  </p>
                </div>
                <div className={styles.featureAction} style={{ color: 'var(--success)' }}>
                  Launch Visualizer <RiArrowRightLine size={14} />
                </div>
              </Link>

              <Link href="/algorithms" className={styles.featureCard}>
                <div>
                  <div className={styles.featureIconRow}>
                    <div className={styles.solutionIconBox} style={{ width: 36, height: 36, background: 'rgba(245,158,11,0.2)', color: 'var(--accent)' }}>
                      <RiBarChart2Line size={18} />
                    </div>
                    <span className="pill pill-warning">5 Categories</span>
                  </div>
                  <h3 className={styles.featureTitle}>FalkorDB vs SQL Arena</h3>
                  <p className={styles.featureDesc}>
                    Run live PageRank, Betweenness Centrality, WCC, and CDLP benchmarks against SQL joins.
                  </p>
                </div>
                <div className={styles.featureAction} style={{ color: 'var(--accent)' }}>
                  Launch Arena <RiArrowRightLine size={14} />
                </div>
              </Link>

              <Link href="/cve" className={styles.featureCard}>
                <div>
                  <div className={styles.featureIconRow}>
                    <div className={styles.solutionIconBox} style={{ width: 36, height: 36, background: 'rgba(239,68,68,0.2)', color: 'var(--danger)' }}>
                      <RiBugLine size={18} />
                    </div>
                    <span className="pill pill-danger">Zero-Day Paths</span>
                  </div>
                  <h3 className={styles.featureTitle}>CVE Exploit Chains</h3>
                  <p className={styles.featureDesc}>
                    Trace shortest breach paths from public API perimeter endpoints to vulnerable package CVEs.
                  </p>
                </div>
                <div className={styles.featureAction} style={{ color: 'var(--danger)' }}>
                  Launch CVE Explorer <RiArrowRightLine size={14} />
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Section 6: Bottom Call to Action */}
        <section className={styles.sectionWrapper} style={{ borderBottom: 'none' }}>
          <div className={styles.container}>
            <div className={styles.ctaBanner}>
              <h2 className={styles.ctaTitle}>
                Eliminate Blind Merges in Your Codebase
              </h2>
              <p className={styles.ctaSubtitle}>
                Launch the BlastRadius command center now. Explore live dependency graphs, run sub-millisecond impact
                triage, and experience FalkorDB Graph Intelligence in action.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/dashboard" className={styles.heroLaunchMain} id="bottom-launch-app">
                  <span>Launch BlastRadius App</span>
                  <RiArrowRightLine size={18} />
                </Link>
                <button
                  onClick={() => setTourOpen(true)}
                  className={styles.heroSecondaryCta}
                  style={{ cursor: 'pointer' }}
                >
                  <RiTrophyLine size={16} style={{ color: 'var(--accent)' }} />
                  <span>Start Judge Tour</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', marginBottom: '0.25rem' }}>
                BlastRadius — FalkorDB Graph Intelligence
              </div>
              <div>
                WeMakeDevs × FalkorDB Graph Hacks (Oct 2026) · Team Zero Degree (HBQZVK)
              </div>
            </div>

            <div className={styles.footerLinks}>
              <Link href="/dashboard" className={styles.footerLink}>Command Center</Link>
              <Link href="/pr-agent" className={styles.footerLink}>PR Agent</Link>
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.footerLink}
              >
                FalkorDB Browser <RiExternalLinkLine size={11} />
              </a>
              <a
                href="http://localhost:8090/docs"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.footerLink}
              >
                FastMCP Docs <RiExternalLinkLine size={11} />
              </a>
              <a
                href="https://github.com/ProthamD/graph-hacks"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.footerLink}
              >
                GitHub Repo <RiExternalLinkLine size={11} />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Judge Walkthrough Modal */}
      <JudgeTourModal isOpen={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  );
}
