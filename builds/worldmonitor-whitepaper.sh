#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$REPO_ROOT"

# --- Pre-flight checks ---

if [ ! -f .env ]; then
  echo "ERROR: .env file not found in $REPO_ROOT"
  echo "Create .env with ANTHROPIC_API_KEY and NOTION_API_KEY (see .env.example)"
  exit 1
fi

if ! grep -q 'ANTHROPIC_API_KEY=.\+' .env; then
  echo "ERROR: ANTHROPIC_API_KEY not set in .env"
  exit 1
fi

if ! grep -q 'NOTION_API_KEY=.\+' .env; then
  echo "ERROR: NOTION_API_KEY not set in .env"
  exit 1
fi

PARENT_FLAG=""
if [ -n "${1:-}" ]; then
  PARENT_FLAG="-p $1"
  echo "Parent page: $1"
else
  echo "WARNING: No parent page URL provided. Entities will be created at workspace root."
  echo "Usage: $0 [notion-page-url]"
  echo ""
  read -r -p "Continue without parent page? [y/N] " confirm
  if [[ ! "$confirm" =~ ^[yY]$ ]]; then
    exit 0
  fi
fi

echo "Starting WorldMonitor white paper build (4 iterations, verbose)..."
echo ""

# --- Build ---

npm run dev -- -i 4 -v $PARENT_FLAG "$(cat <<'PROMPT'
Build a comprehensive technical deep-dive white paper about the WorldMonitor project as a MULTI-ENTITY Notion document.

WorldMonitor (https://github.com/koala73/worldmonitor) is an AI-powered real-time global intelligence dashboard with 2,856+ commits and 44.9k GitHub stars, licensed AGPL-3.0 non-commercial.

=== HUB PAGE: "WorldMonitor: Technical Deep-Dive White Paper" ===

Create a hub page with:
- Title: "WorldMonitor: Technical Deep-Dive White Paper"
- Icon: 🌍
- Executive summary (2-3 paragraphs): WorldMonitor is an open-source, AI-powered real-time global intelligence dashboard that aggregates news, geopolitical data, financial markets, and infrastructure monitoring into a unified situational awareness interface. It processes 435+ curated news feeds across 15 categories, synthesizing them via AI into actionable briefs. The system monitors 92 stock exchanges, tracks 45 data layers through dual 3D/2D mapping engines, and performs cross-stream correlation analysis to detect convergence patterns across military, economic, disaster, and escalation domains.
- Key metrics callout (blue_background): 435+ news feeds | 45 data layers | 92 protobuf definitions | 22 services | 60+ edge functions | 21 languages | 30+ data sources | 5 site variants
- "How to Navigate This Document" toggle section explaining the hub-and-spoke structure
- Table of contents with links to all child pages and databases below

=== CHILD PAGES (create as children of hub) ===

PAGE 1: "Architecture Overview" 🏗️
- Section: "Design Philosophy" — Vanilla TypeScript with Vite, no framework dependency. Deliberate choice: smaller bundle, no framework lock-in, direct DOM control for visualization-heavy workloads. ES2020 target, ESNext modules, strict TypeScript (noUncheckedIndexedAccess, noUnusedLocals). Path alias @/* → src/*. Build outputs with Brotli precompression for .js/.css/.html/.svg/.json/.xml/.wasm (1KB+). Chunk splitting: transformers (~2-4MB), onnxruntime, maplibre, deck-stack, d3, topojson, i18n, sentry, panels, lazy-loaded locale-* per language. Warning threshold 1200KB (accounts for geospatial libs).
- Section: "System Layers" — Four-tier architecture: Presentation (TypeScript/Vite + globe.gl + deck.gl) → API Gateway (Vercel Edge Functions, 60+) → Services (22 protobuf service definitions, sebuf HTTP annotations) → Data (31 singleton trackers + Redis/Upstash cache). Gold standard: all frontend API calls route through server-side backends, eliminating direct browser-to-third-party connections.
- Section: "Desktop Architecture" — Tauri 2 (Rust Edition 2021) with Node.js sidecar. Binary ~600KB (leverages OS native WebView). Rust deps: serde, keyring 3 (Apple Keychain/Windows Credential Manager/Linux), reqwest 0.12 with native TLS, getrandom for CSPRNG. Build optimization: LTO enabled, single codegen unit, panic abort, symbol stripping, opt-level "z" for size. Include comparison table: Tauri vs Electron (binary size, memory, security, native APIs, WebView).
- Section: "Deployment Topology" — Vercel Edge Functions (60+) for API proxying/caching, Railway relay for RSS feeds/military flight tracking/OREF alerts, Cloudflare R2 + PMTiles for self-hosted basemaps (migrated from CARTO). Docker/Docker Compose for self-hosting.
- Section: "Data Refresh Cadences" — Table: AIS streams/GPS jamming (5s), News aggregation (10m), Economic indicators/market data (30m), Satellite imagery/military flights (1h), Strategic infrastructure (6h). Staggered refresh prevents thundering herd. Cache TTLs: chokepoints 5min, news 10min, economics 30min, CII 24h, static assets 365 days.
- Section: "Security Architecture" — CSP with script hashes (migrated from unsafe-inline), CORS on 25+ endpoints, rate limiting via Cloudflare proxy (cf-connecting-ip priority), keyring-based credential vault (single auth prompt on desktop, down from 20+).
- Use blue callouts for architectural decisions, yellow callouts for trade-offs.

PAGE 2: "AI & Machine Learning Pipeline" 🤖
- Section: "4-Tier Inference Fallback Chain" — Four inference pathways with 5-second timeouts between tiers, designed for resilience:
  1. Ollama (Local/Air-Gapped): Auto-discovery of local instances, no API key, fully offline. Models: Llama 2, Mistral, Phi.
  2. Groq Cloud API: Llama 3.1 at extreme speed, free tier available, credentials in OS keychain.
  3. OpenRouter (Meta-Llama/Llama-3.3-70b-instruct:free): Higher quality, 50 req/day rate limit. Cache sharing across providers prevents duplicate work.
  4. Browser-Side T5 (Transformers.js + ONNX Runtime Web): Xenova/t5-small, ONNX quantized weights, Web Worker execution, WebAssembly + WebGPU acceleration. No internet required after first download.
  Include a table comparing the 4 tiers (latency, cost, privacy, quality, offline capability).
- Section: "News Synthesis Pipeline" — 435+ feeds across 15 categories → Redis-backed content deduplication (identical headlines trigger only one LLM call, 24h TTL) → AI summarization → brief generation → cross-reference with geopolitical context. Per-user deduplication prevents N×M redundant API calls.
- Section: "Cross-Stream Correlation Engine" — 14 signal types monitored simultaneously: news velocity, ADS-B military concentration, AIS chokepoint transits, ACLED protest events, satellite fires, AIS disruptions, internet outages (Cloudflare Radar), earthquake activity, stock market volatility, crypto price shock, commodity spikes, power grid anomalies, prediction market odds (Polymarket), supply chain disruptions. Convergence model: credibility weighting by source tier, physical indicator agreement (ADS-B + satellite heat signature in same location), temporal correlation (48h window), spatial clustering (50km radius).
- Section: "Country Intelligence Index (CII)" — Composite score 0-100 with weighted formula: Baseline Risk 40% (historical instability, governance), Unrest Indicators 20% (ACLED protests, fatalities, actor diversity), Security Events 20% (military concentration, weapons, territorial violations), Information Velocity 20% (articles/hour, mention acceleration, sentiment shift). Uses Welford's Online Algorithm for streaming mean/variance per event type, region, day-of-week, and month (90-day rolling window). Z-score thresholds: 1.5σ mild, 2.0σ moderate, 3.0σ severe. Minimum 10 historical observations before anomaly reporting. Include code block showing the z-score threshold logic.
- Section: "Browser-Side ML" — Transformers.js with ONNX Runtime Web running Xenova/t5-small. Executes in Web Workers (non-blocking). WebAssembly + WebGPU acceleration. Local caching after first model download. Handles lightweight classification, sentiment analysis, entity extraction without server round-trips.
- Section: "Infrastructure Cascade Analysis" — Graph-based impact modeling: 279 infrastructure nodes (cables, pipelines, ports, chokepoints, countries) + 280 dependency edges. BFS propagation: impact = edge_strength × disruption_level × (1 - redundancy). Impact categories: Critical >0.8, High >0.5, Medium >0.2, Low ≤0.2. Example: cable cut → connectivity disruption → trade route impact → regional economic projection.
- Use toggle blocks for each AI provider tier with detailed capabilities and configuration.

PAGE 3: "Data Layer & API Contracts" 📡
- Section: "Protocol Buffers Architecture" — 92 proto definitions across 22 service domains. Sebuf HTTP annotations for REST-compatible access (sebuf.http.get, sebuf.http.post). Proto-first design: all data structures defined in .proto files, auto-generated TypeScript clients with type safety, auto-generated OpenAPI docs. Field validation at definition time. POST→GET conversion (v2.5.20) for edge caching: 52 endpoints converted, 46% CDN egress reduction. Include code block showing example .proto service definition with sebuf annotations.
- Section: "22 Service Domains" — Full list in a table: Seismology (USGS), Wildfire (NASA FIRMS), Climate, Military (ADS-B/OpenSky), Naval/Maritime (AIS), Infrastructure (cables/pipelines/ports), Finance (exchanges/commodities/crypto), Economic Indicators (FRED/BIS/WTO), Cybersecurity (threat actors/malware/CVEs), Social Unrest (ACLED), Health (epidemiology), Energy (EIA/OPEC), Supply Chain, Nuclear Facilities (IAEA), Telecommunications, Aviation, Hotspots (escalation scoring), Prediction Markets (Polymarket), Satellite Surveillance (TLE orbital tracking), Water Resources, Governance (elections/political risk), AI/Tech Infrastructure (datacenters/GPU clusters).
- Section: "31 Singleton Data Trackers" — Detailed breakdown: GDELT (15M+ events/day), GDELT Doc, RSS (435+ feeds), Polymarket, OpenSky ADS-B, Wingbits military callsigns, ACLED conflict data, Feodo Tracker C2 servers, URLhaus malware, AbuseIPDB, AIS Stream (real-time vessels with backpressure), IMF PortWatch, CorridorRisk chokepoints, undersea cables (CSHIA), pipelines, OREF Israel Sirens (Hebrew→English, 24h history), USGS earthquakes, weather/storms, NASA FIRMS fires, flooding, Cloudflare Radar internet outages, HackerOne vulnerabilities, FRED, BIS, WTO Trade, EIA, Central Bank APIs (13 banks), UNHCR refugees, HAPI humanitarian indicators.
- Section: "45+ Data Layers" — Grouped by domain in tables: Political & Conflict (12 layers), Military & Defense (12 layers including ADS-B tracking, chokepoint vessel monitoring, GPS jamming zones, nuclear sites), Infrastructure & Networks (12 layers including undersea cables, pipelines, GPU datacenter locations), Environmental (6 layers), Cyber (3 layers), Additional Intelligence (4 layers including orbital satellite TLE propagation).
- Section: "Financial Radar" — 92 stock exchanges (mega: NYSE, NASDAQ, Shanghai, Euronext, Tokyo; major: HKEX, LSE, NSE/BSE, TSX, KRX, Tadawul; 75+ emerging). 7-signal macro composite: US equity momentum, bond yield curve spread, VIX, USD index, commodity index, crypto market cap, credit spreads → BUY/CASH verdict. 13 central banks tracked. Commodities: gold, silver, oil, gas, rare earths (lithium, cobalt).
- Table: Data source domains with source count, refresh rate, protocol, and example providers.

PAGE 4: "Mapping & Visualization Engine" 🗺️
- Section: "Dual Mapping System" — Why two engines: globe.gl (Three.js-based 3D globe) for immersive geospatial overview, deck.gl (MapLibre GL) for analytical flat-map workflows. Users switch between modes.
- Section: "globe.gl + Three.js" — Spherical projection, WebGL hardware acceleration, real-time point cloud rendering (vessels, aircraft, bases), custom material shaders for heatmaps, smooth camera transitions. Three.js scene: globe geometry with procedural texture, data layer point clouds, fragment shaders for heatmap colors.
- Section: "deck.gl + MapLibre GL" — Mercator projection, GeoJSON/TopoJSON support. Layer types: PolygonLayer (conflict zones), ScatterplotLayer (bases, ports), LineLayer (routes, pipelines, cables), HeatmapLayer (density), GeoJsonLayer (boundaries). MapLibre: MVT support, custom styles, raster tiles, 3D extrusion.
- Section: "Self-Hosted Basemaps" — PMTiles format on Cloudflare R2, migrated from CARTO (proprietary) to open infrastructure. Complete data sovereignty, no third-party map provider dependency, offline-capable with Service Worker. Global CDN edge caching.
- Section: "45+ Data Layers" — Toggle system for user-controlled visibility. Layers composited on both map types. Performance budgets per layer.
- Section: "Rendering Performance" — AIS relay backpressure with spatial indexing (O(n) vs O(n×m)), message batching (100ms windows) prevents DOM thrashing during 10k+ vessel updates. Pre-serialized gzipped snapshots eliminate per-request JSON serialization (60-70% transmission reduction). LOD strategies, data decimation, requestAnimationFrame management.
- Comparison table: globe.gl vs deck.gl (use case, projection, rendering, max points, layer types, interaction model, mobile support).

PAGE 5: "Internationalization & Multi-Site Architecture" 🌐
- Section: "21-Language Support" — Languages: English, Spanish, French, German, Italian, Dutch, Swedish, Turkish, Polish, Greek, Russian, Japanese, Korean, Vietnamese, Thai, Portuguese, Simplified Chinese, Traditional Chinese, Arabic (RTL), Hebrew (RTL), Persian (RTL). CSS logical properties (margin-inline-start, padding-inline-end), HTML dir="rtl", icon mirroring, number formatting (Arabic numerals vs Eastern Arabic). 1100+ translated keys via i18next, hierarchical naming (domain.component.element), fallback to English. Lazy-loaded locale bundles (English always loaded).
- Section: "5 Site Variants" — VITE_VARIANT=full|tech|finance|commodity|happy. Deployments: worldmonitor.app, tech.worldmonitor.app, finance.worldmonitor.app, commodity.worldmonitor.app, happy.worldmonitor.app. Dynamic loading: feed config filtering, map layer enablement, panel priority reordering, UI text via i18n keys, CSS color scheme overrides.
- Section: "Variant Architecture" — HTML Variant Plugin (Vite): injects variant-specific metadata (title, description, OG tags), variant identifier for desktop builds. Shared component library + variant config files defining enabled features, default layers, feed categories, and visual theme. Build-time code splitting.
- Section: "Feed Curation by Variant" — Full: regional politics, thematic (100-150 feeds/session). Tech: startups/VC, regional tech, developer resources, security, hardware, cloud, DeFi. Finance: market analysis, forex/bonds, commodities, crypto, central banks. Commodity: gold/silver, mining, critical minerals (lithium, cobalt, rare earths), base metals, ESG. Happy: positive news networks, science, nature, health, inspiring stories.
- Section: "Propaganda Risk Assessment" — Feed trust tiers: High Risk (Xinhua, TASS, RT, Press TV, KCNA), Medium Risk (Al Jazeera/Qatar, Al Arabiya/Saudi, TRT/Turkish), Low Risk (Reuters, AP, BBC, FT, Bellingcat). Credibility weighting applied to convergence model.
- Use toggle blocks for each site variant with features and feed categories.

PAGE 6: "Scale & Performance Engineering" ⚡
- Section: "Production Scale" — 2M+ monthly active users. Peak concurrency ~50-100k simultaneous. 435+ RSS checks every 10min, 31 trackers simultaneous, 14+ signal correlations/second, 60+ edge functions. Latency targets: map pan/zoom <100ms, layer toggle <200ms, search <500ms, LLM summary <5s.
- Section: "Edge-First Architecture" — 60+ Vercel Edge Functions, single data concern per function. Sub-50ms response for cached data. POST→GET conversion (v2.5.20) for CDN compatibility: 52 endpoints converted, 46% egress reduction. Batch API consolidation (comma-separated series IDs) eliminates Vercel 25-second timeouts.
- Section: "3-Tier Caching" — Tier 1: Redis/Upstash (5ms global latency, serverless REST APIs, connection pooling). Key patterns: cii:{country}:{ts}, news:cluster:{id}, summary:{hash}, signal:{type}:{region}. Tier 2: CDN (Vercel/Cloudflare edge). Tier 3: Service Worker (NetworkFirst for HTML/PMTiles/live feeds, CacheFirst for fonts/protomaps, max 4MB file size, 365-day static expiry, 7-day image expiry). Stale-while-revalidate across all tiers.
- Section: "Resource Consumption" — Browser: typical 200-400MB, with 10k+ AIS vessels 600-800MB. IndexedDB up to 50MB/origin. Bandwidth: ~20-30MB/hour continuous, peak 50MB, Brotli reduces 40-50%. Server: Redis 5-10GB working set for 100k concurrent users.
- Section: "Client Performance" — Brotli precompression, chunk splitting (transformers, onnxruntime, maplibre, deck-stack, d3 as separate chunks). 1200KB warning threshold. Lazy loading for map engines. Web Worker offloading. Pre-serialized gzipped snapshots (60-70% transmission reduction).
- Section: "Offline & Degraded Connectivity" — Service worker with full offline strategy. IndexedDB for user monitors, preferences, alert history. Optimistic updates with server-side rollback. Tauri desktop: local-first with Node.js sidecar. Graceful degradation when feeds unavailable.
- Use green callouts for performance wins and specific metrics.

PAGE 7: "Licensing & Community" 📜
- Section: "Dual Licensing Model" — AGPL-3.0 (Copyright 2024-2026 Elie Habib) for non-commercial use: personal, research, self-hosted. Network clause: modified source on public servers must be made available to users. Separate commercial license for SaaS, rebranding, enterprise distribution, white-label, custom variants, priority support SLA, trademark usage. Contact maintainer for commercial terms.
- Section: "Community Scale" — 44.9k GitHub stars, 7.2k forks, 2,856+ commits. Active contributor base. Created by Elie Habib (CEO of Anghami). AI-assisted development policy: contributors welcome to use AI tools, same quality bar regardless of authorship, code explanation required during review if questioned.
- Section: "Developer Experience" — Build commands: make install, npm run dev (per variant: dev:tech, dev:finance), npm run typecheck, npm run test:data, npm run test:e2e (Playwright), npm run build. Buf CLI for protobuf compilation/linting. Sebuf plugins for TypeScript client/server generation.
- Section: "Attribution Requirements" — AGPL-3.0 network reciprocity enforced. GPL v3 compatible. Patent grant: non-exclusive, worldwide, royalty-free from contributors. No warranty.
- Section: "Use Cases by License" — Table comparing AGPL vs Commercial: personal use, research, self-hosted enterprise, SaaS product, white-label, consulting, custom feed integration, priority API rate limits, dedicated support.

=== DATABASE: "Technical Component Registry" ⚙️ ===

Create a database as a child of the hub page, tracking major technical components:
Properties:
- Name (title)
- Category (select: Frontend | Backend | AI-ML | Data | Infrastructure | Desktop — colors: blue, purple, green, orange, red, brown)
- Technology (rich_text)
- Purpose (rich_text)
- Status (status: Active | Planned | Deprecated)
- Complexity (select: Low | Medium | High | Critical — colors: green, yellow, orange, red)
- Refresh Rate (rich_text)

Sample rows (create at least 20):
1. Vite Build System | Frontend | Vite 5 + TypeScript | Module bundling, ES2020 target, Brotli precompression | Active | Medium
2. globe.gl Renderer | Frontend | globe.gl + Three.js | 3D globe visualization with custom shaders | Active | Critical
3. deck.gl Map | Frontend | deck.gl + MapLibre GL | Flat WebGL map with 6 layer types | Active | Critical
4. Tauri Shell | Desktop | Tauri 2 (Rust 2021) | ~600KB native container with LTO, opt-level z | Active | High
5. Node.js Sidecar | Desktop | Node.js | RSS proxying, feed processing for desktop | Active | Medium
6. Ollama Integration | AI-ML | Ollama | Tier 1: local/air-gapped LLM inference | Active | High
7. Groq Cloud API | AI-ML | Groq + Llama 3.1 | Tier 2: fast cloud inference, free tier | Active | Medium
8. OpenRouter | AI-ML | Meta-Llama-3.3-70b | Tier 3: high-quality inference, 50 req/day | Active | Medium
9. Transformers.js | AI-ML | Xenova/t5-small + ONNX | Tier 4: browser-side ML, WebAssembly + WebGPU | Active | High
10. Protobuf Contracts | Data | Protocol Buffers + sebuf | 92 protos, 22 services, auto-gen TypeScript | Active | Critical
11. Redis Cache | Infrastructure | Upstash Redis | 5ms global latency, serverless REST APIs | Active | High
12. Edge Functions | Infrastructure | Vercel Edge | 60+ functions, single data concern each | Active | Critical
13. Service Worker | Infrastructure | Web APIs | 3-strategy caching, 4MB max, offline-capable | Active | High
14. News Feed Aggregator | Data | Custom pipeline | 435+ feeds, dedup, 4-tier AI synthesis | Active | Critical
15. Country Intelligence Index | AI-ML | Welford's Algorithm | Composite 0-100 risk scores, z-score anomaly detection | Active | Critical
16. Financial Radar | Data | Multiple APIs | 92 exchanges, 7-signal macro composite, BUY/CASH | Active | High
17. Variant System | Frontend | Vite plugin | 5 variants, dynamic feed/layer/panel config | Active | Medium
18. Cross-Stream Correlator | AI-ML | Custom engine | 14 signal types, convergence detection | Active | Critical
19. PMTiles Basemaps | Infrastructure | Cloudflare R2 | Self-hosted maps, migrated from CARTO | Active | High
20. AIS Vessel Tracking | Data | AISStream WebSocket | 10k+ vessels, spatial indexing, backpressure | Active | High
21. Cascade Analyzer | AI-ML | Graph BFS | 279 nodes, 280 edges, impact propagation | Active | High
22. i18n System | Frontend | i18next | 21 languages, 1100+ keys, RTL, lazy loading | Active | Medium

Views:
1. Default table view (all columns)
2. Board view grouped by Category
3. Gallery view showing Name + Purpose + Status

=== DATABASE: "Data Source Catalog" 📊 ===

Create a database as a child of the hub page, cataloging external data sources:
Properties:
- Source Name (title)
- Domain (select: Geopolitics | Finance | Energy | Climate | Aviation | Cyber | News | Economics — colors: red, green, orange, blue, purple, gray, yellow, brown)
- Refresh Rate (select: 5s | 10m | 30m | 1h | Daily — colors: red, orange, yellow, blue, gray)
- Protocol (select: REST | WebSocket | Protobuf | RSS | SSE — colors: blue, green, purple, orange, red)
- Reliability (select: High | Medium | Variable — colors: green, yellow, orange)
- Notes (rich_text)

Sample rows (at least 15):
1. GDELT | Geopolitics | 10m | REST | High | Global Database of Events, Language, Tone — 15M+ events/day
2. ACLED Conflict | Geopolitics | 10m | REST | High | Armed Conflict Location & Event Data — protests, battles, fatalities
3. OpenSky ADS-B | Aviation | 5s | SSE | Medium | Real-time military/civil aircraft positions, ICAO hex, callsigns
4. AISStream | Geopolitics | 5s | WebSocket | High | Real-time vessel tracking, 10k+ simultaneous, chokepoint detection
5. Stock Exchange Feed | Finance | 5s | WebSocket | High | Real-time from 92 exchanges (NYSE, NASDAQ, Shanghai, Euronext, Tokyo+)
6. Commodity Markets | Finance | 30m | REST | High | Gold, silver, oil, gas, rare earths (lithium, cobalt)
7. Polymarket | Finance | 10m | REST | Medium | Prediction market odds for geopolitical events
8. NASA FIRMS | Climate | 1h | REST | High | Satellite wildfire detection, global coverage
9. USGS Earthquakes | Climate | 10m | REST | High | Real-time seismic data with magnitude and depth
10. Cloudflare Radar | Cyber | 10m | REST | High | Internet outages, DDoS trends, country-level connectivity
11. Feodo Tracker | Cyber | 1h | REST | Variable | C2 server infrastructure, botnet tracking
12. FRED | Economics | Daily | REST | High | Federal Reserve Economic Data — GDP, inflation, employment
13. OREF Israel Sirens | Geopolitics | 5s | SSE | High | Civil defense alerts, Hebrew→English translation, 24h history
14. IMF PortWatch | Economics | 30m | REST | High | Global port congestion alerts, trade disruption
15. CSHIA Cables | Geopolitics | Daily | REST | High | Submarine fiber optic cable network data, landing points
16. Central Bank APIs | Finance | Daily | REST | High | 13 reserve banks — Fed, ECB, BoE, BoJ, PBoC, etc.
17. UNHCR | Geopolitics | Daily | REST | High | Refugee population data, displacement tracking

Views:
1. Default table view (all columns)
2. Board view grouped by Domain
3. Table view filtered to real-time sources only (5s and 10m refresh rates)

=== QUALITY TARGETS ===

This is a publication-quality technical white paper. Target scores:
- Structural Completeness: 5 (all pages + databases + hub navigation)
- Content Depth: 5 (specific technical details from the actual project, not generic)
- Notion Feature Usage: 5 (callouts, toggles, tables, code blocks, colored backgrounds, dividers, multiple views)
- Visual Organization: 5 (clear hierarchy, visual rhythm, emoji icons, color-coded callouts)
- Actionability: 4 (readers can understand the full system architecture)
- Internal Consistency: 5 (consistent naming, cross-references between pages)

Formatting directives:
- Blue callouts for architectural decisions
- Yellow callouts for trade-offs and warnings
- Green callouts for performance wins and metrics
- Gray callouts for historical context
- Toggle blocks for detailed specs readers may want to expand
- Tables for all comparisons
- Code blocks for protobuf schema examples
- Dividers between major sections
PROMPT
)"
