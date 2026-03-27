import dotenv from "dotenv";
import type { Config } from "./types.js";

dotenv.config();

export function loadConfig(opts: {
  model?: string;
  maxIterations?: number;
  verbose?: boolean;
  parentPage?: string;
}): Config {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    console.error("Missing ANTHROPIC_API_KEY. Set it in .env or environment.");
    process.exit(1);
  }

  const notionApiKey = process.env.NOTION_API_KEY;
  if (!notionApiKey) {
    console.error("Missing NOTION_API_KEY. Set it in .env or environment.");
    process.exit(1);
  }

  const maxIterations = opts.maxIterations ?? 3;
  if (maxIterations < 1 || maxIterations > 5) {
    console.error("max-iterations must be between 1 and 5.");
    process.exit(1);
  }

  let parentPageId: string | undefined;
  if (opts.parentPage) {
    // Extract page ID from Notion URL or use as-is
    const match = opts.parentPage.match(
      /([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i
    );
    parentPageId = match ? match[1] : opts.parentPage;
  }

  return {
    anthropicApiKey,
    notionApiKey,
    model: opts.model ?? "claude-sonnet-4-6",
    maxIterations,
    verbose: opts.verbose ?? false,
    parentPageId,
  };
}
