# notion-auto-builder

Automatically build and iteratively refine Notion documents using Claude AI. Run one command, get a fully refined Notion page, database, or multi-entity system.

## How It Works

```
You: "Create a project tracker for a 5-person engineering team"
                    |
                    v
            Claude plans the build
                    |
                    v
       Creates databases, views, pages in Notion
                    |
                    v
        Fetches back and evaluates quality (6 dimensions)
                    |
                    v
         Refines deficiencies automatically
                    |
                    v
     Repeats until quality threshold met (4.0/5.0)
                    |
                    v
        Outputs report with Notion URLs
```

Claude acts as the orchestrator via tool_use, deciding what to create, evaluating quality against a rubric, and making targeted improvements. The CLI executes Notion API calls.

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/notion-auto-builder.git
cd notion-auto-builder
npm install
```

Create a `.env` file:

```
ANTHROPIC_API_KEY=sk-ant-...
NOTION_API_KEY=ntn_...
```

**Notion API key:** Create an [internal integration](https://www.notion.so/my-integrations) and share your target workspace pages with it.

## Usage

```bash
# Development
npm run dev -- "Create a project tracker for engineering"

# Built CLI
npm run build
npm start -- "Create a team onboarding guide"

# With options
npm run dev -- -i 5 -v "Build a lightweight CRM with contacts and deals"
npm run dev -- -p "https://notion.so/mypage-abc123" "Create a content calendar"
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-m, --model <model>` | Claude model | `claude-sonnet-4-6` |
| `-i, --max-iterations <n>` | Refinement iterations (1-5) | `3` |
| `-p, --parent-page <url>` | Notion page to create under | workspace root |
| `-v, --verbose` | Show detailed tool calls | `false` |

## Quality Rubric

The tool evaluates and refines against 6 dimensions:

| Dimension | Weight | What it measures |
|-----------|--------|-----------------|
| Structural Completeness | HIGH | All expected sections/entities present |
| Content Depth | HIGH | Domain-specific, useful content |
| Notion Feature Usage | MEDIUM | Toggles, callouts, views, formulas |
| Visual Organization | MEDIUM | Layout hierarchy, visual rhythm |
| Actionability | HIGH | Ready to use with defaults, sample data |
| Internal Consistency | MEDIUM | Cross-references work, naming consistent |

Pass threshold: average >= 4.0/5.0, no dimension below 3.

## What It Creates

- **Simple pages**: Guides, handbooks, onboarding docs with callouts, toggles, tables
- **Databases**: Task trackers, content calendars, inventories with views and sample data
- **Multi-entity systems**: Project management (Projects + Tasks + Views + Hub), CRMs, OKR systems

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run with tsx (development) |
| `npm run build` | Compile TypeScript |
| `npm run typecheck` | Type check without emitting |
| `npm start` | Run compiled output |

## Architecture

```
src/
  index.ts          CLI entry (commander)
  config.ts         Environment + option validation
  loop.ts           Agentic conversation loop (Claude tool_use)
  ui.ts             Terminal output (chalk, ora)
  types.ts          Shared interfaces
  tools/
    definitions.ts  14 Claude tool schemas
    executor.ts     Tool call dispatcher
    notion-*.ts     Notion SDK wrappers
  prompts/
    system.ts       System prompt assembly
    rubric.ts       Quality rubric + archetypes
```

## License

MIT
