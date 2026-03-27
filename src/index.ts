#!/usr/bin/env node

import { Command } from "commander";
import { loadConfig } from "./config.js";
import { runLoop } from "./loop.js";

const program = new Command();

program
  .name("notion-auto-builder")
  .description("Automatically build and refine Notion documents using Claude AI")
  .version("1.0.0")
  .argument("<prompt>", "Description of what to build in Notion")
  .option("-m, --model <model>", "Claude model to use", "claude-sonnet-4-6")
  .option("-i, --max-iterations <number>", "Max refinement iterations (1-5)", "3")
  .option("-p, --parent-page <url>", "Notion page URL or ID to create under")
  .option("-v, --verbose", "Show detailed tool call output")
  .action(async (prompt: string, opts: Record<string, string | boolean | undefined>) => {
    const config = loadConfig({
      model: opts.model as string | undefined,
      maxIterations: opts.maxIterations ? parseInt(opts.maxIterations as string, 10) : undefined,
      verbose: opts.verbose as boolean | undefined,
      parentPage: opts.parentPage as string | undefined,
    });

    await runLoop(prompt, config);
  });

program.parse();
