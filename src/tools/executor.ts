import { Client } from "@notionhq/client";
import type { ToolResult } from "../types.js";
import { createPage, updatePageProperties, appendBlocks, updateBlock, deleteBlock, fetchPage } from "./notion-pages.js";
import { createDatabase, updateDatabase, queryDatabase, createDatabaseRows, fetchDatabase } from "./notion-databases.js";
import { createView } from "./notion-views.js";
import { search } from "./notion-search.js";

export class ToolExecutor {
  private notion: Client;
  private notionApiKey: string;

  constructor(notionApiKey: string) {
    this.notionApiKey = notionApiKey;
    this.notion = new Client({ auth: notionApiKey });
  }

  async execute(toolName: string, input: Record<string, unknown>): Promise<ToolResult> {
    switch (toolName) {
      case "notion_create_page":
        return createPage(this.notion, input as Parameters<typeof createPage>[1]);

      case "notion_create_database":
        return createDatabase(this.notion, input as Parameters<typeof createDatabase>[1]);

      case "notion_update_page_properties":
        return updatePageProperties(this.notion, input as Parameters<typeof updatePageProperties>[1]);

      case "notion_append_page_content":
        return appendBlocks(this.notion, input as Parameters<typeof appendBlocks>[1]);

      case "notion_update_block":
        return updateBlock(this.notion, input as Parameters<typeof updateBlock>[1]);

      case "notion_delete_block":
        return deleteBlock(this.notion, input as Parameters<typeof deleteBlock>[1]);

      case "notion_update_database":
        return updateDatabase(this.notion, input as Parameters<typeof updateDatabase>[1]);

      case "notion_query_database":
        return queryDatabase(this.notion, input as Parameters<typeof queryDatabase>[1]);

      case "notion_create_database_rows":
        return createDatabaseRows(this.notion, input as Parameters<typeof createDatabaseRows>[1]);

      case "notion_create_view":
        return createView(this.notionApiKey, input as Parameters<typeof createView>[1]);

      case "notion_fetch": {
        const fetchInput = input as { id: string; type: string };
        if (fetchInput.type === "database") {
          return fetchDatabase(this.notion, fetchInput.id);
        }
        return fetchPage(this.notion, fetchInput.id);
      }

      case "notion_search":
        return search(this.notion, input as Parameters<typeof search>[1]);

      case "report_complete":
        // Handled in the loop - should not reach here
        return { success: true, data: input };

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  }
}
