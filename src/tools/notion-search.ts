import { Client } from "@notionhq/client";
import type { ToolResult } from "../types.js";

export async function search(
  notion: Client,
  input: {
    query: string;
    filter_type?: "page" | "database";
    page_size?: number;
  }
): Promise<ToolResult> {
  try {
    const params: Record<string, unknown> = {
      query: input.query,
      page_size: input.page_size ?? 10,
    };

    if (input.filter_type) {
      params.filter = { value: input.filter_type, property: "object" };
    }

    const response = await notion.search(
      params as Parameters<typeof notion.search>[0]
    );

    const results = response.results.map((r) => {
      const record = r as Record<string, unknown>;
      const object = record.object as string;
      let title = "Untitled";

      if (object === "page") {
        const props = record.properties as Record<string, Record<string, unknown>> | undefined;
        if (props) {
          for (const prop of Object.values(props)) {
            if (prop.type === "title") {
              const titleArr = prop.title as Array<{ plain_text: string }> | undefined;
              if (titleArr?.[0]) title = titleArr[0].plain_text;
              break;
            }
          }
        }
      } else if (object === "database") {
        const titleArr = record.title as Array<{ plain_text: string }> | undefined;
        if (titleArr?.[0]) title = titleArr[0].plain_text;
      }

      return {
        id: record.id,
        type: object,
        title,
        url: record.url,
      };
    });

    return {
      success: true,
      data: {
        result_count: results.length,
        results,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Search failed: ${msg}` };
  }
}
