import Anthropic from "@anthropic-ai/sdk";
import type { Config, BuildReport, CreatedEntity } from "./types.js";
import { toolDefinitions, ToolExecutor } from "./tools/index.js";
import { buildSystemPrompt } from "./prompts/system.js";
import {
  startSpinner,
  updateSpinner,
  succeedSpinner,
  failSpinner,
  stopSpinner,
  logPhase,
  logInfo,
  logToolCall,
  logError,
  logReport,
  logPartialReport,
} from "./ui.js";

const MAX_ROUND_TRIPS = 80;

export async function runLoop(prompt: string, config: Config): Promise<void> {
  const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
  const executor = new ToolExecutor(config.notionApiKey);
  const systemPrompt = buildSystemPrompt(config.maxIterations, config.parentPageId);

  const createdEntities: CreatedEntity[] = [];

  // SIGINT handler for partial report
  const sigintHandler = () => {
    stopSpinner();
    logPartialReport(createdEntities);
    process.exit(130);
  };
  process.on("SIGINT", sigintHandler);

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: prompt,
    },
  ];

  logPhase("STARTING");
  logInfo(`Prompt: "${prompt}"`);
  logInfo(`Model: ${config.model} | Max iterations: ${config.maxIterations}`);

  let roundTrips = 0;

  try {
    while (roundTrips < MAX_ROUND_TRIPS) {
      roundTrips++;
      startSpinner(`Thinking... (round ${roundTrips})`);

      const response = await anthropic.messages.create({
        model: config.model,
        max_tokens: 16384,
        system: systemPrompt,
        tools: toolDefinitions,
        messages,
      });

      // Push assistant response to history
      messages.push({ role: "assistant", content: response.content });

      // Process text blocks (Claude's reasoning/status)
      for (const block of response.content) {
        if (block.type === "text" && block.text.trim()) {
          stopSpinner();
          detectPhase(block.text);
          if (config.verbose) {
            logInfo(block.text.slice(0, 200) + (block.text.length > 200 ? "..." : ""));
          }
        }
      }

      // Check for tool use
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ContentBlockParam & { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } =>
          b.type === "tool_use"
      );

      if (toolUseBlocks.length === 0) {
        // No tool calls and end_turn - Claude is done talking
        if (response.stop_reason === "end_turn") {
          stopSpinner();
          logError("Claude ended without calling report_complete. Outputting partial results.");
          logPartialReport(createdEntities);
          break;
        }
        continue;
      }

      // Execute tool calls
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolBlock of toolUseBlocks) {
        const { id, name, input } = toolBlock;

        // Check for report_complete (loop termination)
        if (name === "report_complete") {
          succeedSpinner("Build complete!");
          const report = input as unknown as BuildReport;

          // Merge tracked entities with Claude's report
          if (report.entities?.length) {
            logReport(report);
          } else {
            logPartialReport(createdEntities);
          }

          process.removeListener("SIGINT", sigintHandler);
          return;
        }

        logToolCall(name, config.verbose);
        updateSpinner(`Executing: ${name}`);

        const result = await executor.execute(name, input as Record<string, unknown>);

        // Track created entities
        if (result.success && result.data) {
          const data = result.data as Record<string, unknown>;
          if (data.id && data.url) {
            const entityType = name.includes("database")
              ? "database"
              : name.includes("view")
              ? "view"
              : "page";
            createdEntities.push({
              name: (data.title as string) ?? (input as Record<string, unknown>).title as string ?? "Untitled",
              type: entityType as CreatedEntity["type"],
              id: data.id as string,
              url: data.url as string,
            });
          }
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: id,
          content: JSON.stringify(result),
        });
      }

      // Push tool results back
      messages.push({ role: "user", content: toolResults });
    }

    if (roundTrips >= MAX_ROUND_TRIPS) {
      stopSpinner();
      logError(`Hit max round trips (${MAX_ROUND_TRIPS}). Stopping.`);
      logPartialReport(createdEntities);
    }
  } catch (err: unknown) {
    stopSpinner();
    if (err instanceof Anthropic.APIError) {
      logError(`Claude API error: ${err.message} (status: ${err.status})`);
    } else {
      logError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    logPartialReport(createdEntities);
  } finally {
    process.removeListener("SIGINT", sigintHandler);
  }
}

function detectPhase(text: string): void {
  const lower = text.toLowerCase();
  if (lower.includes("plan")) logPhase("PLAN");
  else if (lower.includes("build")) logPhase("BUILD");
  else if (lower.includes("evaluat")) logPhase("EVALUATE");
  else if (lower.includes("refin")) logPhase("REFINE");
}
