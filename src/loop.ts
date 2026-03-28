import Anthropic from "@anthropic-ai/sdk";
import type { Config, BuildReport, CreatedEntity, Phase } from "./types.js";
import { toolDefinitions, ToolExecutor } from "./tools/index.js";
import { buildSystemPrompt } from "./prompts/system.js";
import { createDashboard } from "./ui.js";

const MAX_ROUND_TRIPS = 80;

export async function runLoop(prompt: string, config: Config): Promise<void> {
  const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
  const executor = new ToolExecutor(config.notionApiKey);
  const systemPrompt = buildSystemPrompt(config.maxIterations, config.parentPageId);
  const dashboard = createDashboard(config, prompt);

  const createdEntities: CreatedEntity[] = [];

  // SIGINT handler
  const sigintHandler = () => {
    dashboard.interruptReport();
    process.exit(130);
  };
  process.on("SIGINT", sigintHandler);

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: prompt },
  ];

  let roundTrips = 0;

  try {
    while (roundTrips < MAX_ROUND_TRIPS) {
      roundTrips++;
      dashboard.update({ round: roundTrips, currentTool: null });

      const response = await anthropic.messages.create({
        model: config.model,
        max_tokens: 16384,
        system: systemPrompt,
        tools: toolDefinitions,
        messages,
      });

      messages.push({ role: "assistant", content: response.content });

      // Process text blocks - detect phase transitions
      for (const block of response.content) {
        if (block.type === "text" && block.text.trim()) {
          const phase = detectPhase(block.text);
          if (phase) dashboard.setPhase(phase);
          dashboard.setClaudeText(block.text.trim().slice(0, 80));
        }
      }

      // Collect tool_use blocks
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ContentBlockParam & {
          type: "tool_use";
          id: string;
          name: string;
          input: Record<string, unknown>;
        } => b.type === "tool_use"
      );

      if (toolUseBlocks.length === 0) {
        if (response.stop_reason === "end_turn") {
          dashboard.interruptReport();
          break;
        }
        continue;
      }

      // Execute each tool call
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolBlock of toolUseBlocks) {
        const { id, name, input } = toolBlock;

        // Check for report_complete (loop termination)
        if (name === "report_complete") {
          const report = input as unknown as BuildReport;
          process.removeListener("SIGINT", sigintHandler);
          dashboard.finish(report);
          return;
        }

        // Show tool as running
        dashboard.update({ currentTool: name });
        dashboard.addToolLog({ name, status: "running" });

        // Execute
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
            const entity: CreatedEntity = {
              name:
                (data.title as string) ??
                (input as Record<string, unknown>).title as string ??
                (input as Record<string, unknown>).name as string ??
                "Untitled",
              type: entityType as CreatedEntity["type"],
              id: data.id as string,
              url: data.url as string,
            };
            createdEntities.push(entity);
            dashboard.addEntity(entity);
          }
        }

        // Mark tool done
        const resultSummary = result.success
          ? (result.data as Record<string, unknown>)?.message as string ?? "OK"
          : result.error ?? "Error";
        dashboard.markToolDone(name, result.success ? "success" : "error", resultSummary.slice(0, 30));

        toolResults.push({
          type: "tool_result",
          tool_use_id: id,
          content: JSON.stringify(result),
        });
      }

      messages.push({ role: "user", content: toolResults });
    }

    if (roundTrips >= MAX_ROUND_TRIPS) {
      dashboard.interruptReport();
    }
  } catch (err: unknown) {
    dashboard.interruptReport();
    if (err instanceof Anthropic.APIError) {
      console.error(`Claude API error: ${err.message} (status: ${err.status})`);
    } else {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  } finally {
    process.removeListener("SIGINT", sigintHandler);
  }
}

function detectPhase(text: string): Phase | null {
  const lower = text.toLowerCase();
  // Check for specific phase keywords - order matters (evaluate before refine)
  if (lower.includes("phase 1") || lower.includes("plan")) return "PLAN";
  if (lower.includes("phase 2") || (lower.includes("build") && !lower.includes("rebuild")))
    return "BUILD";
  if (lower.includes("phase 3") || lower.includes("evaluat")) return "EVALUATE";
  if (lower.includes("phase 4") || lower.includes("refin")) return "REFINE";
  return null;
}
