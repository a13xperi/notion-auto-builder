# Builds

Reusable build scripts for generating Notion documents with notion-auto-builder.

## Prerequisites

Create a `.env` file in the repo root with your API keys:

```
ANTHROPIC_API_KEY=sk-ant-...
NOTION_API_KEY=ntn_...
```

## Running a Build

```bash
./builds/worldmonitor-whitepaper.sh "https://notion.so/your-parent-page-id"
```

The parent page URL is optional but recommended — without it, entities are created at the workspace root.

## Available Builds

| Script | Description | Entities | Iterations |
|--------|-------------|----------|------------|
| `worldmonitor-whitepaper.sh` | Technical deep-dive white paper for WorldMonitor | 7 pages + 2 databases + hub | 4 |

## Creating New Builds

Copy an existing script and modify the prompt in the heredoc. Key flags:

- `-i <n>` — Refinement iterations (1-5). Use 3-4 for complex multi-entity builds.
- `-v` — Verbose output to monitor progress.
- `-p <url>` — Parent Notion page URL or ID.
