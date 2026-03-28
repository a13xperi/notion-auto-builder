# Build Scripts

Reusable build prompts for `notion-auto-builder`. Each script wraps a complex prompt with pre-flight checks and sensible defaults.

## Usage

```bash
# Run a build (creates in workspace root)
./builds/worldmonitor-whitepaper.sh

# Run with a parent page (creates under that page)
./builds/worldmonitor-whitepaper.sh "https://notion.so/your-page-id"
```

## Prerequisites

- `.env` file with `ANTHROPIC_API_KEY` and `NOTION_API_KEY`
- `npm install` completed

## Available Builds

| Script | Entities | Iterations | Description |
|--------|----------|------------|-------------|
| `worldmonitor-whitepaper.sh` | ~16 | 4 | Technical deep-dive white paper with 7 pages + 2 databases |

## Convention

Each build script:
1. Checks `.env` exists with valid keys
2. Accepts an optional parent Notion page URL as `$1`
3. Runs `npx tsx src/index.ts` with the full prompt, `-i` iterations, and `-v` verbose
