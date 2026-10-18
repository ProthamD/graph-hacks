# 🎬 BlastRadius — Official 3–5 Minute Hackathon Video & Demo Script
**WeMakeDevs × FalkorDB Graph Hacks (Oct 15–18, 2026)**  
**Team:** Zero Degree (`HBQZVK`) · 
**Track:** Track 01 — Agents That Act on Connected Data *(Primary)* · *Includes Track 02 (Graphiti) & Track 03 (QueryWeaver)*

---

## 🌐 Demo Environments (Use Live Cloud or Local)

| Environment | Frontend URL | Backend API / Health | FalkorDB Instance |
| :--- | :--- | :--- | :--- |
| **🚀 Live Cloud (Recommended)** | `https://<your-vercel-app>.vercel.app` | `https://graph-hacks-production.up.railway.app/health` | Railway Private Network (`falkordb.railway.internal:6379`) |
| **💻 Localhost** | `http://localhost:3000` (or `:3001`) | `http://localhost:8090/health` | Local Docker / FalkorDB Container |

---

## ⏱️ Video Time Budget (Target: 3 min 45 sec)

| Time | Scene | Screen / Route | Core Message & Rubric Hit |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:35** | **The Hook & Problem** | Architecture Diagram / Slides / Web Landing (`/`) | *"If you take out FalkorDB, the graph is decoration."* Show why Vector RAG misses 80–100% of multi-hop cross-service callers. |
| **0:35 – 1:30** | **Autonomous PR Agent in Action** | `/pr-agent` (or `/blast-radius`) | **Core Track 01 Criterion:** Agent autonomously calculates risk ($0..100$), traces 5 FastMCP tools, issues `BLOCKED` verdict, executes `GRAPH.COPY` sandbox, and posts PR comment. |
| **1:30 – 2:15** | **Vector vs. FalkorDB Graph RAG Diff** | `/algorithms` | Interactive comparison of 3 test cases showing why Vector RAG produces 0% recall on 3-hop call chains. Run all 5 native FalkorDB algorithms. |
| **2:15 – 3:00** | **2D / 3D Force Graph & Exploit Glow** | `/graph` & `/cve` | Switch between 2D Canvas and 3D WebGL Spherical projection. Trace `algo.SPpaths` from public `/api/v1/payments/charge` to CVE-2023-32681. |
| **3:00 – 3:35** | **True MCP Protocol Verification** | Terminal (`python scripts/test_mcp.py`) | Handshake over stdio, tool listing of all 9 graph algorithms, and tool execution telemetry (`GRAPH.EXPLAIN` + `PROFILE`). |
| **3:35 – 3:55** | **Conclusion & 4-Way MCP Hub** | `/` or `/company-brain` | Recap FalkorDB + Graphiti (Track 02) + QueryWeaver (Track 03) multi-track coverage and WCAG 2.2 AA accessibility. |

---

## 🎙️ Step-by-Step Speaker Script & Click Actions

### **Scene 1: Introduction & The Core Problem (0:00 – 0:35)**
- **What to show on screen:** Open browser to Home Dashboard (`/`).
- **Speaker Script:**
  > *"Hello judges! I'm Pratham Dey from Team Zero Degree, and this is **BlastRadius** — an autonomous codebase, PR triage, and SecOps graph agent built entirely on top of FalkorDB's native graph database and official MCP stack for Track 01.*
  >
  > *In modern microservices, single-line code changes trigger silent cascading failures across services. Traditional Vector RAG fails miserably here because embeddings cluster semantic text similarities, completely blind to structural call chains. BlastRadius proves the hackathon golden rule: the product cannot exist without FalkorDB."*

---

### **Scene 2: Autonomous PR Graph Agent in Action (0:35 – 1:30)**
- **What to show on screen:** Navigate to `/pr-agent` *(or `/blast-radius`)*.
- **Actions to perform:**
  1. Click the preset card **`PR-142: auth::validate_jwt`** (or pick `auth::validate_jwt` from quick-picks).
  2. Click **"Run Autonomous PR Triage"**.
  3. Watch the **Interactive 2D Subgraph Visualizer** light up and the **5-Step FastMCP Agent reasoning timeline** stream live:
     - `blast_radius(auth::validate_jwt, hops=4)`
     - `page_rank(d=0.85)`
     - `trace_exploit_chain(CVE-2022-29217)`
     - `verify_adr_compliance(ADR-002)`
     - `graph_copy(sandbox=blastradius_pr_PR-142)`
- **Speaker Script:**
  > *"Let's see Track 01's primary requirement in action: **an agent that acts autonomously on connected data**. 
  > 
  > Here, developer Alice opened PR-142 modifying `auth::validate_jwt`. Instead of an LLM hallucinating about code diffs, our agent invokes FalkorDB's native graph traversal up to 4 hops deep.*
  >
  > *(Point to the Verdict Banner & Real-time Graph)*
  > *Immediately, BlastRadius issues an autonomous **🔴 BLOCKED** decision with a Risk Score of **100/100**. Why?*
  > *1. It found 3 upstream caller functions and identified that 2 critical public endpoints (`/api/v1/auth/login` and `/api/v1/payments/charge`) are directly exposed.*
  > *2. PageRank centrality reveals this symbol is in the top 5% most critical bridge nodes in the company architecture.*
  > *3. Under ADR Governance, it flagged an explicit violation of **ADR-002** — direct changes to JWT validation violate mandatory algorithm allowlists.*
  > *4. It detected an active CVE (CVE-2022-29217) in the transitive dependency `pyjwt`.*
  >
  > *(Point to Sandbox Box)*
  > *Crucially, BlastRadius took an autonomous action: it executed `GRAPH.COPY` to create an isolated sandbox `blastradius_pr_PR-142` so integration tests run safely without polluting production.*
  >
  > *(Click "Copy Markdown PR Comment")*
  > *And with one click, it writes the entire markdown policy review comment for the pull request."*
- **Comparison Action:**
  1. Click **`PR-303: shipping::calculate_rate`** (leaf node).
  2. Click **"Run Autonomous PR Triage"**.
  3. Point to the **🟢 APPROVED (Risk: 10/100)** verdict — zero upstream callers impacted, isolated shipping leaf!

---

### **Scene 3: Vector vs. Graph RAG Diff & The 5 Graph Algorithms (1:30 – 2:15)**
- **What to show on screen:** Navigate to `/algorithms`.
- **Actions to perform:**
  1. Scroll to the **Vector Search vs. FalkorDB Graph RAG Diff** component.
  2. Click through the 3 tabs: **Multi-Hop Blast Radius**, **CVE Exploit Path**, **Causal Incident Attribution**.
  3. Scroll down and click **"Run Centrality Suite"** (`algo.pageRank` + `algo.betweenness`).
- **Speaker Script:**
  > *"Next, to prove that the graph is NOT decoration, we built this interactive Vector vs. Graph RAG diff.*
  >
  > *Look at Test Case 1: When finding upstream callers 3 hops away, Vector embeddings search for text similarity and achieve **0% recall** — they miss every single caller! FalkorDB achieves **100% recall** in 1.15 milliseconds.*
  >
  > *Down here, BlastRadius wraps all 5 official FalkorDB algorithm categories as deterministic tools: PageRank, Betweenness Centrality, Shortest Paths with `algo.SPpaths`, Weakly Connected Components, and Label Propagation for community clustering."*

---

### **Scene 4: 2D & 3D Force Graph Visualizer with Path Lighting (2:15 – 3:00)**
- **What to show on screen:** Navigate to `/graph`.
- **Actions to perform:**
  1. Show the 2D Canvas force graph with all 80+ nodes and call edges.
  2. Toggle to **3D WebGL Spherical** projection.
  3. Click node `auth::validate_jwt` — show the real-time path lighting illuminating callers.
  4. Type `payment::process_charge` in the search box and press <kbd>Enter</kbd> to demonstrate WCAG 2.2 AA keyboard navigation.
  5. Jump to `/cve`, select `requests` + `CVE-2023-32681`, and click **"Trace Exploit Chain"**.
- **Speaker Script:**
  > *"Our visualizer supports both 2D Canvas and full 3D WebGL Spherical projection with WCAG 2.2 AA accessibility.*
  >
  > *When I click any symbol, real-time path illumination highlights the entire cascade. In our CVE explorer, `algo.SPpaths` proves in 0.35 milliseconds that an attacker hitting our public payment checkout endpoint can traverse through `payment::process_charge` directly into vulnerable `requests` header forwarding."*

---

### **Scene 5: True Model Context Protocol (MCP) Verification (3:00 – 3:35)**
- **What to show on screen:** Switch to terminal in `blastradius` directory.
- **Run command:**
  ```powershell
  python scripts/test_mcp.py
  ```
- **Speaker Script:**
  > *"To ensure seamless agent interoperability, all tools are exposed via the official Model Context Protocol.*
  >
  > *Running our automated test script performs a live MCP stdio handshake using protocol version 2025-11-25. It discovers all 9 graph tools and executes a blast radius query returning full `GRAPH.EXPLAIN` telemetry and sparse-matrix execution times."*

---

### **Scene 6: Conclusion & 4-Way MCP Architecture (3:35 – 3:55)**
- **What to show on screen:** Switch back to Home Dashboard (`/`) or show `/company-brain`.
- **Speaker Script:**
  > *"BlastRadius isn't just a prototype — our production backend unites:
  > - **Track 01**: FalkorDB autonomous PR triage agent
  > - **Track 02**: Graphiti native FalkorDB episodic memory on `/company-brain`
  > - **Track 03**: QueryWeaver natural Cypher synthesis
  >
  > Everything is 100% open-source, deployed live on Railway & Vercel, and reproducible with a single command. Thank you!"*

---

## 🛠️ Pre-Recording Checklist

1. **Verify Backend Health (Live Railway or Local):**
   - **Live Railway:**
     ```powershell
     python -c "import urllib.request; print(urllib.request.urlopen('https://graph-hacks-production.up.railway.app/health').read().decode())"
     ```
   - **Localhost:**
     ```powershell
     python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8090/health').read().decode())"
     ```
   *(Ensure `\"falkordb\": {\"status\": \"ok\"}`)*

2. **Verify Frontend UI:**
   - Open `/pr-agent`, `/blast-radius`, `/algorithms`, and `/graph` in browser.
   - Confirm nodes load smoothly without console errors.

3. **Screen Resolution:**
   - Set browser window to 1080p ($1920 \times 1080$) at 100% zoom.
   - Close distracting browser tabs and notification popups.

4. **Recording Tool:**
   - OBS Studio, Windows Game Bar (<kbd>Win</kbd>+<kbd>Alt</kbd>+<kbd>R</kbd>), or Loom.
   - Keep mic volume crisp and pace steady!
