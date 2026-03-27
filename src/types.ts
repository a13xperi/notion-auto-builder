import type Anthropic from "@anthropic-ai/sdk";

export interface Config {
  anthropicApiKey: string;
  notionApiKey: string;
  model: string;
  maxIterations: number;
  verbose: boolean;
  parentPageId?: string;
}

export interface CreatedEntity {
  name: string;
  type: "page" | "database" | "view";
  id: string;
  url: string;
  dataSourceId?: string;
}

export interface QualityScores {
  structuralCompleteness: number;
  contentDepth: number;
  notionFeatureUsage: number;
  visualOrganization: number;
  actionability: number;
  internalConsistency: number;
}

export interface BuildReport {
  entities: CreatedEntity[];
  scores: QualityScores;
  iterations: number;
  suggestions: string[];
}

export type ToolDefinition = Anthropic.Tool;

export type ToolResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};
