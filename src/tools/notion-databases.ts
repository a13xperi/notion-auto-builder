import { Client } from "@notionhq/client";
import type { ToolResult } from "../types.js";

export async function createDatabase(
  notion: Client,
  input: {
    parent_page_id: string;
    title: string;
    icon?: string;
    description?: string;
    properties: Record<string, unknown>;
  }
): Promise<ToolResult> {
  try {
    const params: Record<string, unknown> = {
      parent: { page_id: input.parent_page_id },
      title: [{ text: { content: input.title } }],
      properties: input.properties,
    };

    if (input.icon) {
      params.icon = { type: "emoji", emoji: input.icon };
    }

    if (input.description) {
      params.description = [{ text: { content: input.description } }];
    }

    const response = await notion.databases.create(
      params as Parameters<typeof notion.databases.create>[0]
    );
    const url = (response as Record<string, unknown>).url as string;

    return {
      success: true,
      data: {
        id: response.id,
        url,
        message: `Database "${input.title}" created: ${url}`,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to create database: ${msg}` };
  }
}

export async function updateDatabase(
  notion: Client,
  input: {
    database_id: string;
    title?: string;
    description?: string;
    properties?: Record<string, unknown>;
  }
): Promise<ToolResult> {
  try {
    const params: Record<string, unknown> = {
      database_id: input.database_id,
    };

    if (input.title) {
      params.title = [{ text: { content: input.title } }];
    }
    if (input.description) {
      params.description = [{ text: { content: input.description } }];
    }
    if (input.properties) {
      params.properties = input.properties;
    }

    await notion.databases.update(
      params as Parameters<typeof notion.databases.update>[0]
    );
    return { success: true, data: { message: "Database updated" } };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to update database: ${msg}` };
  }
}

export async function queryDatabase(
  notion: Client,
  input: {
    database_id: string;
    filter?: Record<string, unknown>;
    sorts?: Record<string, unknown>[];
    page_size?: number;
  }
): Promise<ToolResult> {
  try {
    const params: Record<string, unknown> = {
      database_id: input.database_id,
      page_size: input.page_size ?? 10,
    };
    if (input.filter) params.filter = input.filter;
    if (input.sorts) params.sorts = input.sorts;

    const response = await notion.databases.query(
      params as Parameters<typeof notion.databases.query>[0]
    );

    const rows = response.results.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: r.id,
        url: r.url,
        properties: r.properties,
      };
    });

    return {
      success: true,
      data: {
        row_count: rows.length,
        has_more: response.has_more,
        rows,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to query database: ${msg}` };
  }
}

export async function createDatabaseRows(
  notion: Client,
  input: {
    database_id: string;
    rows: Array<{ properties: Record<string, unknown> }>;
  }
): Promise<ToolResult> {
  try {
    const created: Array<{ id: string; url: string }> = [];

    for (const row of input.rows) {
      const response = await notion.pages.create({
        parent: { database_id: input.database_id },
        properties: row.properties,
      } as Parameters<typeof notion.pages.create>[0]);

      created.push({
        id: response.id,
        url: (response as Record<string, unknown>).url as string,
      });
    }

    return {
      success: true,
      data: {
        message: `Created ${created.length} rows`,
        rows: created,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to create rows: ${msg}` };
  }
}

export async function fetchDatabase(
  notion: Client,
  databaseId: string
): Promise<ToolResult> {
  try {
    const db = await notion.databases.retrieve({ database_id: databaseId });
    const dbRecord = db as Record<string, unknown>;

    const properties = dbRecord.properties as Record<string, Record<string, unknown>>;
    const schema: Record<string, string> = {};
    for (const [name, prop] of Object.entries(properties)) {
      schema[name] = prop.type as string;
    }

    return {
      success: true,
      data: {
        id: databaseId,
        url: dbRecord.url,
        title: ((dbRecord.title as Array<{ plain_text: string }>)?.[0])?.plain_text ?? "Untitled",
        description: dbRecord.description,
        schema,
        full_properties: properties,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to fetch database: ${msg}` };
  }
}
