# 🎙️ BlastRadius — Official Voiceover Script (Matched to Screen Recording)
**WeMakeDevs × FalkorDB Graph Hacks (Oct 15–18, 2026)**  
**Team:** Zero Degree (`HBQZVK`)  
**Track:** Track 01 — Agents That Act on Connected Data *(Primary)* · *Includes Track 02 (Graphiti) & Track 03 (QueryWeaver)*  

> [!NOTE]
> This voiceover script is timed second-by-second to **`Screen Recording 2026-10-18 210453.mp4`** (3 minutes 51 seconds).
> It is written in a natural, spoken human voice with reasoning and conversational pacing so you can record your voiceover cleanly while watching the video.

---

## 📹 Video Recording Properties

| Property | Value |
| :--- | :--- |
| **Recorded File** | `Screen Recording 2026-10-18 210453.mp4` |
| **Duration** | **3 min 51 sec** (230.90s — complete recording, no freezing) |
| **Resolution** | 1918 × 866 @ 30 fps |
| **Audio Track** | Silent — ready for microphone voiceover overdub |
| **Total Chapters** | 11 choreographed scenes across all features |

---

## ⏱️ Second-by-Second Spoken Voiceover Script

### **[0:00 – 0:34] Scene 1: Welcome & The Problem (Command Center)**
*Screen shows: BlastRadius Command Center (`/`). Hovering over stats cards: 95 Nodes, 126 Edges, 350x Faster than SQL CTE, <1.2ms latency.*

> *"Hey everyone! We're Team Zero Degree, and this is **BlastRadius** — an autonomous PR triage and codebase governance agent built natively on FalkorDB for Track 01.
>
> Here's the nightmare every microservice team faces: a developer changes one innocent line in a shared library, and suddenly three downstream services crash in production. 
> 
> Traditional Vector RAG is completely blind to this. Embeddings cluster words by text similarity — they have no clue how functions actually call each other across service boundaries. 
>
> That's why BlastRadius exists. And right here on our Command Center, you can see our golden rule: take FalkorDB out, and the product collapses. FalkorDB powers our entire codebase graph — 95 nodes, 126 traversal edges, running in under 1.2 milliseconds."*

---

### **[0:35 – 1:18] Scene 2: Autonomous PR Agent in Action (`PR-142`)**
*Screen clicks `/pr-agent` on the sidebar. Selects `PR-142: auth::validate_jwt`, sets 4 hops, clicks "Run PR Graph Agent". 2D subgraph lights up red. Reasoning trace streams on left. Verdict banner displays `🔴 BLOCKED` with 100/100 risk score.*

> *"Now, let's see Track 01's primary requirement: **an agent that acts autonomously on connected data**.
>
> Imagine developer Alice opens PR-142, modifying `auth::validate_jwt`. Instead of asking an LLM to guess what might break, our agent queries FalkorDB up to 4 hops deep.
>
> Watch the 2D visualizer light up in real time — isolating Ground Zero and cascading through the call chain.
>
> Immediately, BlastRadius issues an autonomous **BLOCKED** verdict with a maximum risk score of 100 out of 100.
>
> Look at the agent's reasoning trace on the left:
> First, it checks PageRank centrality — this function is in the top 5% of critical bridge nodes in the company.
> Second, it traverses 3 upstream callers, jumping across microservice boundaries straight into payments.
> Third, it discovers two public endpoints are exposed: `auth/login` and `payments/charge`.
> Fourth, it uncovers an active CVE in the transitive `pyjwt` dependency.
> And fifth, it catches an explicit architectural violation of ADR-002.
>
> With one click, it drafts an evidence-backed GitHub review comment ready to post."*

---

### **[1:19 – 1:33] Scene 3: The Contrast Test (`PR-303` — Safe Leaf Node)**
*Screen clicks `PR-303: shipping::calculate_rate` preset card, hits "Run PR Graph Agent". The graph isolates a single green node, and verdict flips to `🟢 APPROVED` (Risk: 10/100).*

> *"Now, to prove this isn't hardcoded: let's switch to `PR-303` in the shipping service.
>
> When we run the agent here, it recognizes `calculate_rate` is an isolated leaf node. There are zero upstream callers and zero public perimeter exposure.
>
> The agent instantly evaluates this as **APPROVED** with only 10 out of 100 risk. Safe changes get greenlit without blocking developers."*

---

### **[1:34 – 1:48] Scene 4: True FastMCP Protocol Telemetry**
*Screen switches to the "FalkorDB MCP Tools (5)" tab. Scrolls through logged tool executions: `blast_radius`, `compute_centrality`, `cve_exploit_chain`, and `get_ownership`.*

> *"Under the hood, every single decision runs through the official **Model Context Protocol**.
>
> Right here in our live MCP telemetry tab, you can see each tool execution: `blast_radius`, `compute_centrality`, `cve_exploit_chain`, and `get_ownership`.
>
> Each call returns verifiable Cypher queries, FalkorDB EXPLAIN plans, and sub-millisecond execution times. No hallucinations — pure graph truth."*

---

### **[1:49 – 2:03] Scene 5: Impact Tiers & Autonomous `GRAPH.COPY` Sandbox**
*Screen clicks "Impact Tiers (d1 / d2 / d3)" tab showing depth analysis, then clicks "Autonomous Actions" tab showing `GRAPH.COPY` sandbox creation, passing check run, and commit-ownership reviewer assignment.*

> *"Our agent groups impacted symbols into depth tiers — Tier 1 direct callers, Tier 2 transitive callers, and Tier 3 public perimeter endpoints — allowing graduated review policies.
>
> And here's the autonomous action: the agent executes native FalkorDB `GRAPH.COPY` to clone an isolated sandbox graph, `blastradius_pr_PR-303`. CI tests can simulate failure modes safely without touching production data.
>
> It also traverses our git commit ownership graph to automatically assign Alice Chen as the lead reviewer."*

---

### **[2:04 – 2:13] Scene 6: CVE Exploit Chain Explorer (`/cve`)**
*Screen navigates to `/cve`. Selects `requests` with `CVE-2023-32681`. Clicks "Trace Exploit Chain". Exploit results show 2 hops from `/api/payments` -> `process_charge` -> `requests`.*

> *"Over in our CVE Explorer, we use FalkorDB shortest paths to answer a critical SecOps question: can an external attacker actually reach a vulnerable package?
>
> In just 1.2 milliseconds, `algo.SPpaths` proves that an attacker hitting our public payment endpoint can traverse directly through `process_charge` into a vulnerable `requests` header leak."*

---

### **[2:14 – 2:43] Scene 7: 3D Spherical Graph Visualizer & Live Shockwave (`/graph`)**
*Screen opens `/graph`. Rotates interactive 3D WebGL Spherical graph. Clicks node to inspect commit metadata (Node ID 82, PageRank 0.5). At 2:25, switches to "Live Blast Radius Shockwave" tab and inspects `payment::process_charge`.*

> *"For architects, our Graph Visualizer renders the complete codebase in an interactive 3D WebGL sphere with full keyboard accessibility.
>
> You can rotate through every cluster, inspect individual commits and centrality metrics, and click into our Live Blast Radius Shockwave.
>
> Selecting any break target immediately highlights the cascading blast path across services, giving developers visual intuition before they ever push code."*

---

### **[2:44 – 3:08] Scene 8: The Killer Diff — Vector RAG vs. FalkorDB Graph RAG (`/algorithms`)**
*Screen navigates to `/algorithms`. Shows side-by-side comparison: Traditional Vector RAG (20% Recall, Missed 100% of callers) vs. FalkorDB Graph RAG (100% Recall in 1.15ms via GraphBLAS).*

> *"Now, here is the technical core of our project: **Vector Search versus FalkorDB Graph RAG**.
>
> We posed the exact same question to both: 'What services break if `validate_jwt` changes?'
>
> Look at the results. Vector embeddings achieved a dismal 20% recall — missing 100% of cross-service callers and public endpoints because embeddings only match textual docstrings.
>
> FalkorDB Graph RAG achieved **100% recall** in 1.15 milliseconds using GraphBLAS sparse matrix traversal, pinpointing every causal path with mathematical certainty."*

---

### **[3:09 – 3:23] Scene 9: Algorithm Arena — 425x Faster than Relational SQL**
*Screen scrolls down `/algorithms` to Algorithm Arena & Benchmarks. Highlights the live benchmark: FalkorDB native Cypher (0.85 ms) vs. Relational CTE (362.4 ms) — 425x speedup.*

> *"We also benchmarked FalkorDB against relational SQL recursive CTEs.
>
> To find a 4-hop call path, SQL requires four self-joins, generating massive intermediate tables that took over 360 milliseconds.
>
> FalkorDB traversed direct memory pointers in just 0.85 milliseconds — a **425x speedup**. That's why real-time PR triage is only feasible on FalkorDB."*

---

### **[3:24 – 3:33] Scene 10: Company Brain — Ownership & ADR Governance (`/company-brain`)**
*Screen opens `/company-brain`. Shows Track 03: Developer Ownership 2-hop traversal, blast radius analysis, and ingested Architecture Decision Records (ADR-001, ADR-002, ADR-003).*

> *"On `/company-brain`, we connect code structure with organizational context for Track 03.
>
> By traversing commit history alongside call graphs, BlastRadius identifies true code ownership and validates changes against ingested Architecture Decision Records before architectural drift occurs."*

---

### **[3:34 – 3:51] Scene 11: Official FastMCP Terminal Verification & Grand Conclusion**
*Screen switches to IDE terminal running `python scripts/test_mcp.py`. Live output displays stdio handshake (Protocol 2025-11-25), discovery of 9 registered tools, blast radius execution, and `[SUCCESS] 100% Verified MCP Tool Protocol Compliance!`.*

> *"Finally, here is terminal proof of true Model Context Protocol compliance.
>
> Running our test script performs a live stdio handshake over protocol version 2025-11-25, discovers all 9 registered graph tools, and executes a live blast radius query with full EXPLAIN plans.
>
> BlastRadius unites Track 01 autonomous triage, Track 02 Graphiti episodic memory, and Track 03 QueryWeaver Cypher synthesis into one cohesive platform.
>
> Everything is 100% open-source, deployed live on Railway and Vercel, and reproducible with a single command. 
>
> Thank you!"*

---

## 🎙️ Recording & Voiceover Tips for a Natural Delivery

1. **Keep it conversational:** Speak like you're showing a colleague a cool project you built over the weekend. Don't rush; let the natural transitions breathe.
2. **Match the screen action:**
   - When the screen clicks `/pr-agent` at **0:35**, transition into Scene 2.
   - When the red graph lights up around **0:48 – 0:52**, talk about the blast radius.
   - When the contrast test `PR-303` is clicked at **1:19**, emphasize that safe changes get approved.
   - When `/cve` opens at **2:04**, switch to the CVE exploit chain.
   - When `/graph` rotates in 3D at **2:14**, describe the WebGL visualizer.
   - When the Vector vs Graph diff appears at **2:44**, deliver the 100% vs 20% punchline.
   - When the terminal runs at **3:34**, speak with finality and confidence.
3. **Audio Setup:** Record with your microphone in a quiet room using Windows Voice Recorder, Audacity, or OBS Studio while watching the video playback.
4. **Merge & Export:** Drop the video and your voiceover into CapCut, Clipchamp, or DaVinci Resolve, balance audio levels, and export at 1080p.
