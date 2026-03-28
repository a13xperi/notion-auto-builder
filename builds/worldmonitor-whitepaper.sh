#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Pre-flight: check .env
if [[ ! -f "$PROJECT_DIR/.env" ]]; then
  echo "ERROR: .env file not found at $PROJECT_DIR/.env"
  echo "Create it with ANTHROPIC_API_KEY and NOTION_API_KEY"
  exit 1
fi

if ! grep -q "ANTHROPIC_API_KEY=sk-" "$PROJECT_DIR/.env"; then
  echo "ERROR: ANTHROPIC_API_KEY not set in .env"
  exit 1
fi

if ! grep -q "NOTION_API_KEY=ntn_" "$PROJECT_DIR/.env"; then
  echo "ERROR: NOTION_API_KEY not set in .env"
  exit 1
fi

# Optional parent page URL
PARENT_FLAG=""
if [[ -n "${1:-}" ]]; then
  PARENT_FLAG="-p $1"
fi

cd "$PROJECT_DIR"

PROMPT=$(cat <<'PROMPT_END'
Build a MULTI-ENTITY white paper system: "WorldMonitor: Technical Deep-Dive White Paper"

WorldMonitor is an AI-powered real-time global intelligence dashboard (44.9k GitHub stars, 2,856+ commits, koala73/worldmonitor) with 435+ news feeds, 45 data layers, 92 protobuf definitions, 22 microservices, dual mapping engines (globe.gl + deck.gl), Tauri 2 desktop app, 60+ Supabase Edge Functions, multi-provider AI (Ollama/Groq/OpenRouter/Transformers.js), 21 languages, 5 site variants, and AGPL-3.0 licensing.

Create a hub-and-spoke structure with these entities:

=== HUB PAGE: "WorldMonitor: Technical Deep-Dive White Paper" ===
- Icon: globe emoji
- Overview section: 2-3 paragraphs positioning WorldMonitor as a category-defining real-time intelligence platform
- Table of contents linking to all child pages
- Key stats callout (blue): stars, commits, feeds, languages, services
- Quick navigation section with links to both databases
- "How to Read This Paper" toggle with suggested reading paths for different audiences (architects, ML engineers, DevOps, contributors)

=== CHILD PAGE 1: "Architecture Overview" ===
- Monorepo structure diagram (text-based): apps/, packages/, supabase/, protobuf/
- Service mesh: 22 microservices with Supabase Edge Functions
- Frontend: Next.js 14 App Router + React Server Components + Tailwind
- Desktop: Tauri 2.0 with Rust backend, custom window chrome
- State management: Zustand stores with middleware pipeline
- Build system: Turborepo with remote caching
- Callout (yellow): key architectural decisions and tradeoffs
- Toggle: "Dependency Graph" showing package relationships
- Table: Service inventory (name, runtime, protocol, scaling)

=== CHILD PAGE 2: "AI/ML Pipeline" ===
- Multi-provider architecture: Ollama (local), Groq (cloud fast), OpenRouter (routing), Transformers.js (browser)
- Pipeline stages: ingestion -> classification -> entity extraction -> sentiment -> summarization -> embedding
- Model selection strategy with fallback chains
- Real-time inference: streaming responses, token budgeting
- Embedding pipeline: vector storage in Supabase pgvector
- Callout (green): performance benchmarks per provider
- Toggle: "Model Configuration Matrix" with provider capabilities
- Code block: example pipeline configuration
- Table: Provider comparison (latency, cost, context window, models)

=== CHILD PAGE 3: "Data Layer & APIs" ===
- 435+ news feed sources with categorization
- 45 data layers: geopolitical, economic, environmental, military, health
- 92 protobuf definitions for type-safe cross-service communication
- Supabase stack: Postgres, Realtime subscriptions, Row Level Security
- 60+ Edge Functions: API gateway pattern with rate limiting
- Data freshness: real-time WebSocket feeds + polling intervals
- Callout (blue): data pipeline throughput metrics
- Toggle: "API Endpoint Reference" with key routes
- Table: Data layer catalog (layer, source count, update frequency, format)

=== CHILD PAGE 4: "Mapping & Visualization" ===
- Dual engine architecture: globe.gl (3D globe) + deck.gl (2D analytical)
- Layer rendering pipeline: data -> GeoJSON -> visual encoding -> GPU
- Custom WebGL shaders for heatmaps and particle systems
- Dynamic level-of-detail with viewport-aware data loading
- Animation system: interpolated transitions between views
- Callout (green): rendering performance targets (60fps at 100k points)
- Toggle: "Layer Types Reference" with visual examples described
- Table: Visualization engine comparison (feature, globe.gl, deck.gl)

=== CHILD PAGE 5: "Internationalization & Multi-Site" ===
- 21 languages with dynamic loading and fallback chains
- 5 site variants: global, regional (EU, APAC, MENA, Americas)
- Content negotiation and locale detection
- Right-to-left (RTL) layout support for Arabic, Hebrew, Farsi
- Translation pipeline: AI-assisted with human review
- Callout (yellow): locale-specific data source routing
- Table: Language coverage matrix (language, completion %, variant)

=== CHILD PAGE 6: "Scale & Performance" ===
- Edge-first architecture: Vercel Edge + Supabase Edge Functions
- CDN strategy: static assets + ISR for semi-dynamic content
- Database: connection pooling, read replicas, materialized views
- Caching: multi-layer (browser, CDN, application, database)
- Monitoring: OpenTelemetry traces, custom metrics, error budgets
- Load testing results and scaling characteristics
- Callout (red): known bottlenecks and mitigation strategies
- Toggle: "Performance Budget" with target metrics
- Table: Scaling characteristics (component, current, target, strategy)

=== CHILD PAGE 7: "Licensing & Community" ===
- AGPL-3.0: rationale, implications for self-hosting and modifications
- Contributor guidelines and governance model
- Community metrics: stars, forks, contributors, issue response time
- Roadmap: upcoming features and architectural evolution
- Callout (blue): contribution quickstart guide
- Toggle: "License FAQ" for common questions

=== DATABASE 1: "Technical Component Registry" ===
Properties:
- Component (title)
- Category: select with options Architecture:blue, AI/ML:purple, Data:green, Visualization:orange, Infrastructure:gray, i18n:yellow
- Technology: rich_text (e.g., "Next.js 14", "Ollama", "globe.gl")
- Status: select with Active:green, Beta:yellow, Planned:gray, Deprecated:red
- Complexity: select with High:red, Medium:yellow, Low:green
- Description: rich_text
- Dependencies: rich_text
- Owner: rich_text
- Last Updated: date
- Documentation URL: url

Create 15+ rows covering key components: Next.js App Router, Tauri 2 Desktop, Zustand State, Ollama Local AI, Groq Cloud AI, OpenRouter, Transformers.js Browser AI, globe.gl 3D Maps, deck.gl 2D Analytics, Supabase Postgres, Supabase Realtime, Edge Functions API, Protobuf Schema, i18n Engine, Turborepo Build

Views:
1. "All Components" - Table sorted by Category
2. "By Category" - Board grouped by Category
3. "Architecture Map" - Table filtered to Architecture+Infrastructure, sorted by Complexity

=== DATABASE 2: "Data Source Catalog" ===
Properties:
- Source Name (title)
- Category: select with News:blue, Geopolitical:red, Economic:green, Environmental:yellow, Military:gray, Health:purple, Technology:orange
- Feed Type: select with RSS:blue, API:green, WebSocket:orange, Scraper:red
- Update Frequency: select with Real-time:green, Hourly:blue, Daily:yellow, Weekly:gray
- Reliability: select with High:green, Medium:yellow, Low:red
- Region: multi_select with Global, Americas, Europe, APAC, MENA, Africa
- Data Format: select with JSON:blue, XML:yellow, Protobuf:purple, CSV:gray
- Estimated Volume: rich_text (e.g., "~500 items/day")
- Notes: rich_text

Create 10+ rows: Reuters Wire, AP News, BBC World, Al Jazeera, GDELT Project, ACLED Conflict Data, World Bank API, WHO Health Alerts, NOAA Weather, USGS Earthquakes, NASA EONET

Views:
1. "All Sources" - Table sorted by Category
2. "By Category" - Board grouped by Category
3. "Real-time Feeds" - Table filtered to Update Frequency = Real-time or WebSocket feed type

IMPORTANT FORMATTING DIRECTIVES:
- Use colored callouts extensively: blue for info, green for success/performance, yellow for warnings/notes, red for critical/bottlenecks
- Use toggle blocks for detailed reference material
- Use tables for structured comparisons
- Use code blocks for configuration examples and API snippets
- Add dividers between major sections
- Every page should have an emoji icon
- The hub page must link to ALL child pages and databases
- Target quality: all 6 dimensions at 4 or 5
PROMPT_END
)

echo "=========================================="
echo "  WorldMonitor White Paper Builder"
echo "=========================================="
echo ""
echo "This will create ~16 entities in Notion:"
echo "  - 1 hub page"
echo "  - 7 child pages"
echo "  - 2 databases with 25+ rows"
echo "  - 6 database views"
echo ""
echo "Estimated: 40-60 API round trips, ~5-10 minutes"
echo ""

# shellcheck disable=SC2086
exec npx tsx src/index.ts "$PROMPT" -i 4 -v $PARENT_FLAG
