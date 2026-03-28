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
- Section: "Design Philosophy" — Vanilla TypeScript with Vite, no framework dependency. Explain the deliberate choice: smaller bundle, no framework lock-in, direct DOM control for visualization-heavy workloads.
- Section: "System Layers" — Four-tier architecture: Presentation (TypeScript/Vite + globe.gl + deck.gl) → API Gateway (Vercel Edge Functions) → Services (22 protobuf service definitions) → Data (30+ external sources + Redis/Upstash cache)
- Section: "Desktop Architecture" — Tauri 2 with Rust shell and Node.js sidecar. Enables native apps on macOS, Windows, Linux with shared web codebase. Include comparison table: Tauri vs Electron (binary size, memory usage, security model, native API access).
- Section: "Deployment Topology" — Vercel Edge Functions (60+) for API proxying/caching, Railway relay for long-lived connections (WebSockets, SSE), 3-tier cache (Redis/Upstash + CDN + Service Worker).
- Section: "Data Refresh Cadences" — Table with three tiers: Live streams (5s), News feeds (10m), Economic indicators (30m). Explain why each cadence was chosen.
- Use blue callouts for architectural decisions, yellow callouts for trade-offs.

PAGE 2: "AI & Machine Learning Pipeline" 🤖
- Section: "Multi-Provider Strategy" — Four inference pathways designed for resilience and flexibility:
  - Ollama: Local inference for privacy-sensitive deployments and offline operation
  - Groq: Cloud-based fast inference for real-time synthesis tasks
  - OpenRouter: Model routing layer for access to multiple LLM providers
  - Transformers.js: Browser-side ML for client-local processing without server round-trips
- Section: "News Synthesis Pipeline" — 435+ feeds across 15 categories → deduplication → AI summarization → brief generation → cross-reference with geopolitical context
- Section: "Cross-Stream Correlation" — Pattern detection across military, economic, disaster, and escalation signal streams. Convergence analysis identifies when multiple independent signals point to the same emerging situation.
- Section: "Country Intelligence Index" — Composite risk scoring methodology. Aggregates signals across domains into per-country risk profiles. Used for the global risk heat map layer.
- Section: "Browser-Side ML" — What runs in Transformers.js client-side: lightweight classification, sentiment analysis, entity extraction. Reduces latency and server load for interactive features.
- Use toggle blocks for each AI provider with detailed capabilities and configuration.

PAGE 3: "Data Layer & API Contracts" 📡
- Section: "Protocol Buffers Architecture" — 92 proto definitions across 22 service domains. Sebuf HTTP annotations for REST-compatible access. Proto-first design: all data structures defined in .proto files, code generated for TypeScript consumption.
- Section: "Service Domains" — List of the 22 service categories with brief descriptions. Include code block showing example .proto service definition.
- Section: "External Data Sources" — 30+ sources across 6 domains: Geopolitics (conflict tracking, sanctions, diplomatic events), Finance (92 stock exchanges, commodities, crypto), Energy (oil, gas, renewables, grid status), Climate (weather events, natural disasters, environmental monitoring), Aviation (flight tracking, airspace restrictions), Cyber (threat intelligence, breach notifications).
- Section: "45 Data Layers" — Categorized breakdown of all visualization layers available on the maps. Group by domain.
- Section: "Financial Radar" — Deep-dive: 92 stock exchanges monitored, commodity tracking, cryptocurrency data feeds. Real-time and delayed data handling.
- Table: Data source domains with source count, refresh rate, protocol, and example providers.

PAGE 4: "Mapping & Visualization Engine" 🗺️
- Section: "Dual Mapping System" — Why two engines: globe.gl (Three.js-based 3D globe) for immersive geospatial overview, deck.gl (MapLibre GL) for analytical flat-map workflows. Users can switch between modes.
- Section: "globe.gl + Three.js" — 3D rendering pipeline, custom globe shaders, data point rendering at scale, camera controls and animation system.
- Section: "deck.gl + MapLibre GL" — WebGL flat map, layer composition system, MapLibre for base tiles, deck.gl for data overlay layers. Better for dense analytical views.
- Section: "45 Data Layers" — How layers are composited on both map types. Toggle system for user-controlled layer visibility. Performance budgets per layer.
- Section: "Rendering Performance" — WebGL optimization techniques, LOD (level of detail) strategies, data decimation for dense feeds, requestAnimationFrame management.
- Comparison table: globe.gl vs deck.gl (use case, rendering approach, max points, interaction model, mobile support).

PAGE 5: "Internationalization & Multi-Site Architecture" 🌐
- Section: "21-Language Support" — Full localization with native news feeds per language. RTL (right-to-left) text rendering for Arabic, Hebrew, Persian, Urdu. Bidirectional text handling in visualization labels.
- Section: "5 Site Variants" — Single codebase, multiple deployments: Standard (full dashboard), Tech (infrastructure focus), Finance (market-centric), Commodity (energy/materials), Happy (positive news filter). Shared core with variant-specific configuration.
- Section: "Variant Architecture" — How variants work: shared component library + variant config files defining enabled features, default layers, feed categories, and visual theme. Build-time code splitting.
- Section: "Localized Feed Pipeline" — Native language feeds per locale, not just translated UI. Source feeds in original language, AI synthesis respects source language.
- Use toggle blocks for each site variant with features enabled/disabled.

PAGE 6: "Scale & Performance Engineering" ⚡
- Section: "Edge-First Architecture" — 60+ Vercel Edge Functions running at the network edge. Sub-50ms response times for cached data. Function-level code splitting for minimal cold starts.
- Section: "3-Tier Caching" — Tier 1: Redis/Upstash (shared state, <10ms reads). Tier 2: CDN (static assets, geo-distributed). Tier 3: Service Worker (client-local, offline-capable). Cache invalidation strategies per tier.
- Section: "Data Refresh Architecture" — Staggered refresh prevents thundering herd: live streams on WebSocket/SSE (5s), news on polling (10m), economics on scheduled fetch (30m). Incremental updates, not full reloads.
- Section: "Client Performance" — Bundle size budgets, tree-shaking effectiveness with vanilla TS, lazy loading for map engines, Web Worker offloading for data processing.
- Section: "Offline & Degraded Connectivity" — Service worker caching strategy, graceful degradation when feeds are unavailable, local-first with Tauri desktop app.
- Use green callouts for performance wins and metrics.

PAGE 7: "Licensing & Community" 📜
- Section: "Dual Licensing Model" — AGPL-3.0 for non-commercial use (personal, research, self-hosted). Separate commercial license for SaaS deployments, rebranding, and enterprise distribution. Clear separation of use cases.
- Section: "Community Scale" — 44.9k GitHub stars, 7.2k forks, 2,856+ commits. Active contributor base. Governance model and contribution guidelines.
- Section: "Attribution Requirements" — AGPL-3.0 requires source disclosure for network-accessible deployments. Commercial license removes this requirement.
- Section: "Use Cases by License" — Table comparing AGPL vs Commercial license for: personal use, research, self-hosted enterprise, SaaS product, white-label, consulting.

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

Sample rows (create at least 15):
1. Vite Build System | Frontend | Vite 5 + TypeScript | Module bundling and dev server | Active | Medium
2. globe.gl Renderer | Frontend | globe.gl + Three.js | 3D globe visualization | Active | Critical
3. deck.gl Map | Frontend | deck.gl + MapLibre GL | Flat WebGL map rendering | Active | Critical
4. Tauri Shell | Desktop | Tauri 2 (Rust) | Native desktop container | Active | High
5. Node.js Sidecar | Desktop | Node.js | Local processing for desktop app | Active | Medium
6. Ollama Integration | AI-ML | Ollama | Local LLM inference | Active | High
7. Groq Integration | AI-ML | Groq API | Fast cloud inference | Active | Medium
8. OpenRouter | AI-ML | OpenRouter API | Multi-model routing | Active | Medium
9. Transformers.js | AI-ML | Transformers.js | Browser-side ML inference | Active | High
10. Protobuf Contracts | Data | Protocol Buffers | API schema definitions (92 protos) | Active | Critical
11. Redis Cache | Infrastructure | Upstash Redis | Shared state cache layer | Active | High
12. Edge Functions | Infrastructure | Vercel Edge | API proxying and caching (60+) | Active | Critical
13. Service Worker | Infrastructure | Web APIs | Client-side caching and offline | Active | High
14. News Feed Aggregator | Data | Custom pipeline | 435+ feed processing and dedup | Active | Critical
15. Country Intelligence Index | AI-ML | Custom scoring | Composite geopolitical risk scores | Active | Critical
16. Financial Radar | Data | Multiple APIs | 92 exchange monitoring | Active | High
17. Variant System | Frontend | Build config | 5 site variants from single codebase | Active | Medium

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

Sample rows (at least 10):
1. Global Conflict Tracker | Geopolitics | 10m | REST | High | Armed conflict events and escalation data
2. Stock Exchange Feed | Finance | 5s | WebSocket | High | Real-time data from 92 exchanges
3. Commodity Prices | Finance | 30m | REST | High | Oil, gas, metals, agricultural commodities
4. Crypto Markets | Finance | 5s | WebSocket | Medium | Major cryptocurrency exchange data
5. Weather Events | Climate | 10m | REST | High | Severe weather alerts and natural disaster tracking
6. Flight Tracking | Aviation | 5s | SSE | Medium | Global ADS-B flight position data
7. Cyber Threat Intel | Cyber | 1h | REST | Variable | Threat feeds, CVE tracking, breach notifications
8. Energy Grid Status | Energy | 30m | REST | High | Power generation and grid load data
9. Diplomatic Events | Geopolitics | Daily | RSS | Medium | Treaty signings, sanctions, diplomatic communications
10. Macro Economics | Economics | Daily | REST | High | GDP, inflation, employment, trade balance indicators
11. News Wires | News | 10m | RSS | High | 435+ curated feeds across 15 categories
12. Sanctions Lists | Geopolitics | Daily | REST | High | OFAC, EU, UN sanctions registries

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
