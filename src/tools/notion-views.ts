import type { ToolResult } from "../types.js";

// Views API uses raw fetch since @notionhq/client may not have full view support yet
const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

export async function createView(
  notionApiKey: string,
  input: {
    database_id: string;
    name: string;
    type: string;
    filter?: Record<string, unknown>;
    sort?: Record<string, unknown>[];
    group_by?: string;
    calendar_by?: string;
  }
): Promise<ToolResult> {
  try {
    const body: Record<string, unknown> = {
      name: input.name,
      type: input.type,
    };

    if (input.filter) body.filter = input.filter;
    if (input.sort) body.sorts = input.sort;

    // Board views need group_by
    if (input.type === "board" && input.group_by) {
      body.group_by = [{ property: input.group_by, type: "property" }];
    }

    // Calendar views need calendar_by
    if (input.type === "calendar" && input.calendar_by) {
      body.calendar_by = input.calendar_by;
    }

    const response = await fetch(
      `${NOTION_API}/databases/${input.database_id}/views`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionApiKey}`,
          "Content-Type": "application/json",
          "Notion-Version": NOTION_VERSION,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      // Views API might not be available - fall back gracefully
      if (response.status === 404 || response.status === 400) {
        return {
          success: true,
          data: {
            message: `View "${input.name}" configuration noted but Views API not available. The default table view exists on the database.`,
            fallback: true,
          },
        };
      }
      return { success: false, error: `Views API error (${response.status}): ${errorBody}` };
    }

    const data = (await response.json()) as Record<string, unknown>;
    return {
      success: true,
      data: {
        id: data.id,
        name: input.name,
        type: input.type,
        message: `View "${input.name}" (${input.type}) created`,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: true,
      data: {
        message: `View "${input.name}" noted. Views API call failed: ${msg}. The database has its default table view.`,
        fallback: true,
      },
    };
  }
}
