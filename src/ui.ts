import chalk from "chalk";
import logUpdate from "log-update";
import type {
  Config,
  DashboardState,
  CreatedEntity,
  ToolLogEntry,
  QualityScores,
  BuildReport,
  Phase,
} from "./types.js";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const WIDTH = 64;

// ── Box Drawing Helpers ──

function hLine(left: string, fill: string, right: string, w = WIDTH): string {
  return left + fill.repeat(w - 2) + right;
}

function row(content: string, w = WIDTH): string {
  const stripped = stripAnsi(content);
  const pad = Math.max(0, w - 4 - stripped.length);
  return `║ ${content}${" ".repeat(pad)} ║`;
}

function emptyRow(w = WIDTH): string {
  return row("", w);
}

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + "...";
}

function shortUrl(url: string): string {
  return url.replace("https://www.notion.so/", "notion.so/").slice(0, 30);
}

// ── Render Sections ──

function renderHeader(state: DashboardState): string {
  const title = chalk.bold.cyan("NOTION AUTO-BUILDER");
  const roundStr = chalk.dim(`Round ${String(state.round).padStart(2)} / ${state.maxRounds}`);
  const titleLen = stripAnsi(title).length;
  const roundLen = stripAnsi(roundStr).length;
  const gap = WIDTH - 4 - titleLen - roundLen;
  const content = `${title}${" ".repeat(Math.max(1, gap))}${roundStr}`;
  return [
    chalk.cyan(hLine("╔", "═", "╗")),
    chalk.cyan("║") + ` ${content}` + " ".repeat(Math.max(0, WIDTH - 4 - stripAnsi(content).length)) + chalk.cyan(" ║"),
    chalk.cyan(hLine("╠", "═", "╣")),
  ].join("\n");
}

function renderStatus(state: DashboardState): string {
  const phaseColors: Record<Phase, (s: string) => string> = {
    STARTING: chalk.gray,
    PLAN: chalk.blue,
    BUILD: chalk.yellow,
    EVALUATE: chalk.magenta,
    REFINE: chalk.green,
    COMPLETE: chalk.greenBright,
  };
  const colorFn = phaseColors[state.phase] ?? chalk.white;
  const phaseStr = colorFn(chalk.bold(state.phase));
  const iterStr = chalk.dim(`Iteration: ${state.iteration} / ${state.maxIterations}`);

  const spinner = state.currentTool
    ? chalk.cyan(SPINNER_FRAMES[state.spinnerFrame % SPINNER_FRAMES.length])
    : chalk.green("✓");

  const toolStr = state.currentTool
    ? `${spinner} ${chalk.dim("Executing:")} ${chalk.white(truncate(state.currentTool, 30))}`
    : `${spinner} ${chalk.dim(truncate(state.claudeText || "Idle", 40))}`;

  const lines = [
    row(`Phase: ${phaseStr}${"  ".repeat(3)}${iterStr}`),
    row(toolStr),
    chalk.cyan(hLine("╠", "═", "╣")),
  ];
  return lines.join("\n");
}

function renderEntities(state: DashboardState): string {
  const lines: string[] = [row(chalk.bold("CREATED ENTITIES"))];

  if (state.entities.length === 0) {
    lines.push(row(chalk.dim("  (none yet)")));
  } else {
    for (const e of state.entities.slice(-6)) {
      const icon = e.type === "database" ? "📊" : e.type === "view" ? "👁 " : "📄";
      const name = truncate(e.name, 26);
      const url = chalk.dim(shortUrl(e.url));
      lines.push(row(`  ${icon} ${name.padEnd(27)} ${url}`));
    }
    if (state.entities.length > 6) {
      lines.push(row(chalk.dim(`  ... and ${state.entities.length - 6} more`)));
    }
  }

  lines.push(chalk.cyan(hLine("╠", "═", "╣")));
  return lines.join("\n");
}

function renderScores(state: DashboardState): string | null {
  if (!state.scores) return null;

  const s = state.scores;
  const entries: [string, number][] = [
    ["Structural Completeness", s.structuralCompleteness],
    ["Content Depth", s.contentDepth],
    ["Notion Feature Usage", s.notionFeatureUsage],
    ["Visual Organization", s.visualOrganization],
    ["Actionability", s.actionability],
    ["Internal Consistency", s.internalConsistency],
  ];

  const avg = entries.reduce((sum, [, v]) => sum + v, 0) / entries.length;
  const avgColor = avg >= 4 ? chalk.green : avg >= 3 ? chalk.yellow : chalk.red;

  const lines: string[] = [
    row(`${chalk.bold("QUALITY SCORES")}${"".padEnd(15)}${avgColor(`Avg: ${avg.toFixed(1)} / 5.0`)}`),
  ];

  for (const [label, score] of entries) {
    const bar = scoreBar(score);
    lines.push(row(`  ${label.padEnd(26)} ${bar}  ${scoreColor(score)(`${score}/5`)}`));
  }

  lines.push(chalk.cyan(hLine("╠", "═", "╣")));
  return lines.join("\n");
}

function scoreBar(score: number): string {
  const filled = chalk.cyan("█".repeat(score));
  const empty = chalk.gray("░".repeat(5 - score));
  return filled + empty;
}

function scoreColor(score: number): (s: string) => string {
  if (score >= 4) return chalk.green;
  if (score >= 3) return chalk.yellow;
  return chalk.red;
}

function renderToolLog(state: DashboardState): string {
  const lines: string[] = [row(chalk.bold("TOOL LOG"))];
  const entries = state.toolLog.slice(-6);

  if (entries.length === 0) {
    lines.push(row(chalk.dim("  (waiting...)")));
  } else {
    for (const entry of entries) {
      const icon =
        entry.status === "running"
          ? chalk.cyan(SPINNER_FRAMES[state.spinnerFrame % SPINNER_FRAMES.length])
          : entry.status === "success"
          ? chalk.green("✓")
          : chalk.red("✗");
      const name = truncate(entry.name.replace("notion_", ""), 24);
      const result = entry.result ? chalk.dim(truncate(entry.result, 22)) : "";
      lines.push(row(`  ${icon} ${name.padEnd(25)} ${result}`));
    }
  }

  lines.push(chalk.cyan(hLine("╚", "═", "╝")));
  return lines.join("\n");
}

// ── Main Render ──

function render(state: DashboardState): string {
  const sections = [
    renderHeader(state),
    renderStatus(state),
    renderEntities(state),
  ];

  const scores = renderScores(state);
  if (scores) sections.push(scores);

  sections.push(renderToolLog(state));

  return sections.join("\n");
}

// ── Dashboard Controller ──

export interface Dashboard {
  update(partial: Partial<DashboardState>): void;
  setPhase(phase: Phase): void;
  addEntity(entity: CreatedEntity): void;
  addToolLog(entry: ToolLogEntry): void;
  markToolDone(name: string, status: "success" | "error", result?: string): void;
  setScores(scores: QualityScores): void;
  setClaudeText(text: string): void;
  finish(report: BuildReport): void;
  interruptReport(): void;
}

export function createDashboard(config: Config, prompt: string): Dashboard {
  const state: DashboardState = {
    phase: "STARTING",
    round: 0,
    maxRounds: 80,
    iteration: 0,
    maxIterations: config.maxIterations,
    currentTool: null,
    entities: [],
    scores: null,
    toolLog: [],
    spinnerFrame: 0,
    claudeText: `"${truncate(prompt, 50)}"`,
    prompt,
    model: config.model,
  };

  // Render at 80ms intervals for smooth spinner animation
  const timer = setInterval(() => {
    state.spinnerFrame++;
    logUpdate(render(state));
  }, 80);

  function stop(): void {
    clearInterval(timer);
    logUpdate.clear();
  }

  return {
    update(partial) {
      Object.assign(state, partial);
    },

    setPhase(phase) {
      state.phase = phase;
      if (phase === "EVALUATE") {
        state.iteration++;
      }
    },

    addEntity(entity) {
      state.entities.push(entity);
    },

    addToolLog(entry) {
      state.toolLog.push(entry);
    },

    markToolDone(name, status, result) {
      const entry = [...state.toolLog].reverse().find((e) => e.name === name && e.status === "running");
      if (entry) {
        entry.status = status;
        if (result) entry.result = result;
      }
    },

    setScores(scores) {
      state.scores = scores;
    },

    setClaudeText(text) {
      state.claudeText = text;
      state.currentTool = null;
    },

    finish(report) {
      stop();
      printFinalReport(report);
    },

    interruptReport() {
      stop();
      printPartialReport(state.entities);
    },
  };
}

// ── Final Report (static, after dashboard clears) ──

function printFinalReport(report: BuildReport): void {
  const divider = chalk.dim("─".repeat(60));
  console.log();
  console.log(chalk.bold.green("  ✅ Build Complete!"));
  console.log();
  console.log(divider);
  console.log(chalk.bold("  Created:"));

  for (const e of report.entities) {
    const icon = e.type === "database" ? "📊" : e.type === "view" ? "👁 " : "📄";
    console.log(`    ${icon} ${chalk.bold(e.name)}`);
    console.log(chalk.cyan(`       ${e.url}`));
  }

  console.log();
  console.log(divider);

  const s = report.scores;
  const entries: [string, number][] = [
    ["Structural Completeness", s.structuralCompleteness],
    ["Content Depth", s.contentDepth],
    ["Notion Feature Usage", s.notionFeatureUsage],
    ["Visual Organization", s.visualOrganization],
    ["Actionability", s.actionability],
    ["Internal Consistency", s.internalConsistency],
  ];
  const avg = entries.reduce((sum, [, v]) => sum + v, 0) / entries.length;
  const avgColor = avg >= 4 ? chalk.green : chalk.yellow;

  console.log(
    chalk.bold(`  Quality: ${avgColor(`${avg.toFixed(1)}/5.0`)} (${report.iterations} refinement ${report.iterations === 1 ? "iteration" : "iterations"})`)
  );
  for (const [label, score] of entries) {
    const bar = scoreBar(score);
    console.log(`    ${label.padEnd(28)} ${bar}  ${scoreColor(score)(`${score}/5`)}`);
  }

  if (report.suggestions.length > 0) {
    console.log();
    console.log(divider);
    console.log(chalk.bold("  Suggestions:"));
    for (const s of report.suggestions) {
      console.log(chalk.dim(`    • ${s}`));
    }
  }

  console.log();
}

function printPartialReport(entities: CreatedEntity[]): void {
  console.log();
  if (entities.length === 0) {
    console.log(chalk.yellow("  ⚠ Interrupted. No entities were created."));
  } else {
    console.log(chalk.yellow("  ⚠ Interrupted. Partial results:"));
    for (const e of entities) {
      const icon = e.type === "database" ? "📊" : e.type === "view" ? "👁 " : "📄";
      console.log(`    ${icon} ${e.name}: ${chalk.cyan(e.url)}`);
    }
  }
  console.log();
}
