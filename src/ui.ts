import chalk from "chalk";
import ora, { type Ora } from "ora";
import type { BuildReport, CreatedEntity } from "./types.js";

let spinner: Ora | null = null;

export function startSpinner(text: string): void {
  spinner = ora({ text, color: "cyan" }).start();
}

export function updateSpinner(text: string): void {
  if (spinner) spinner.text = text;
}

export function succeedSpinner(text: string): void {
  if (spinner) spinner.succeed(text);
  spinner = null;
}

export function failSpinner(text: string): void {
  if (spinner) spinner.fail(text);
  spinner = null;
}

export function stopSpinner(): void {
  if (spinner) spinner.stop();
  spinner = null;
}

export function logPhase(phase: string): void {
  stopSpinner();
  console.log(chalk.bold.cyan(`\n[${ phase }]`));
}

export function logInfo(msg: string): void {
  console.log(chalk.gray(`  ${msg}`));
}

export function logSuccess(msg: string): void {
  console.log(chalk.green(`  ${msg}`));
}

export function logWarn(msg: string): void {
  console.log(chalk.yellow(`  ${msg}`));
}

export function logError(msg: string): void {
  console.log(chalk.red(`  ${msg}`));
}

export function logToolCall(name: string, verbose: boolean): void {
  if (verbose) {
    console.log(chalk.dim(`    -> ${name}`));
  }
}

export function logScores(scores: Record<string, number>): void {
  console.log(chalk.bold("\n  Quality Scores:"));
  for (const [dimension, score] of Object.entries(scores)) {
    const color = score >= 4 ? chalk.green : score >= 3 ? chalk.yellow : chalk.red;
    const bar = "█".repeat(score) + "░".repeat(5 - score);
    console.log(`    ${dimension.padEnd(28)} ${color(bar)} ${color(score + "/5")}`);
  }
  const avg = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
  console.log(chalk.bold(`    ${"Average".padEnd(28)} ${avg.toFixed(1)}/5`));
}

export function logReport(report: BuildReport): void {
  console.log(chalk.bold.green("\n\n  Build Complete!\n"));

  console.log(chalk.bold("  Created:"));
  for (const entity of report.entities) {
    const icon = entity.type === "database" ? "📊" : entity.type === "view" ? "👁" : "📄";
    console.log(`    ${icon} ${entity.name} (${entity.type})`);
    console.log(chalk.dim(`       ${entity.url}`));
  }

  console.log(chalk.bold("\n  Final Quality Scores:"));
  const scoreEntries: Record<string, number> = {
    "Structural Completeness": report.scores.structuralCompleteness,
    "Content Depth": report.scores.contentDepth,
    "Notion Feature Usage": report.scores.notionFeatureUsage,
    "Visual Organization": report.scores.visualOrganization,
    "Actionability": report.scores.actionability,
    "Internal Consistency": report.scores.internalConsistency,
  };
  logScores(scoreEntries);

  console.log(chalk.bold(`\n  Refinement iterations: ${report.iterations}`));

  if (report.suggestions.length > 0) {
    console.log(chalk.bold("\n  Suggestions for manual customization:"));
    for (const s of report.suggestions) {
      console.log(chalk.gray(`    - ${s}`));
    }
  }
  console.log();
}

export function logPartialReport(entities: CreatedEntity[]): void {
  if (entities.length === 0) {
    console.log(chalk.yellow("\n  No entities created yet."));
    return;
  }
  console.log(chalk.yellow("\n  Partial results (interrupted):"));
  for (const entity of entities) {
    console.log(`    - ${entity.name} (${entity.type}): ${entity.url}`);
  }
}
