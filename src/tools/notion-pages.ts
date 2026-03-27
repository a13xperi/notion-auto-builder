import { Client } from "@notionhq/client";
import type { ToolResult } from "../types.js";

export async function createPage(
  notion: Client,
  input: {
    parent_type: "page_id" | "database_id";
    parent_id: string;
    title?: string;
    icon?: string;
    properties?: Record<string, unknown>;
    children?: unknown[];
  }
): Promise<ToolResult> {
  try {
    const parent =
      input.parent_type === "database_id"
        ? { database_id: input.parent_id }
        : { page_id: input.parent_id };

    let properties = input.properties ?? {};
    if (input.title && !input.properties) {
      properties = {
        title: { title: [{ text: { content: input.title } }] },
      };
    }

    const params: Record<string, unknown> = {
      parent,
      properties,
    };

    if (input.icon) {
      params.icon = { type: "emoji", emoji: input.icon };
    }

    if (input.children && input.children.length > 0) {
      params.children = input.children;
    }

    const response = await notion.pages.create(params as Parameters<typeof notion.pages.create>[0]);
    const url = (response as Record<string, unknown>).url as string;

    return {
      success: true,
      data: {
        id: response.id,
        url,
        message: `Page created: ${url}`,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to create page: ${msg}` };
  }
}

export async function updatePageProperties(
  notion: Client,
  input: {
    page_id: string;
    icon?: string;
    properties?: Record<string, unknown>;
  }
): Promise<ToolResult> {
  try {
    const params: Record<string, unknown> = {
      page_id: input.page_id,
    };

    if (input.icon) {
      params.icon = { type: "emoji", emoji: input.icon };
    }
    if (input.properties) {
      params.properties = input.properties;
    }

    await notion.pages.update(params as Parameters<typeof notion.pages.update>[0]);
    return { success: true, data: { message: "Page properties updated" } };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to update page: ${msg}` };
  }
}

export async function appendBlocks(
  notion: Client,
  input: { block_id: string; children: unknown[] }
): Promise<ToolResult> {
  try {
    const response = await notion.blocks.children.append({
      block_id: input.block_id,
      children: input.children as Parameters<
        typeof notion.blocks.children.append
      >[0]["children"],
    });
    return {
      success: true,
      data: {
        message: `Appended ${response.results.length} blocks`,
        block_ids: response.results.map((b) => b.id),
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to append blocks: ${msg}` };
  }
}

export async function updateBlock(
  notion: Client,
  input: { block_id: string; block: Record<string, unknown> }
): Promise<ToolResult> {
  try {
    await notion.blocks.update({
      block_id: input.block_id,
      ...input.block,
    } as Parameters<typeof notion.blocks.update>[0]);
    return { success: true, data: { message: "Block updated" } };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to update block: ${msg}` };
  }
}

export async function deleteBlock(
  notion: Client,
  input: { block_id: string }
): Promise<ToolResult> {
  try {
    await notion.blocks.delete({ block_id: input.block_id });
    return { success: true, data: { message: "Block deleted" } };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to delete block: ${msg}` };
  }
}

export async function fetchPage(
  notion: Client,
  pageId: string
): Promise<ToolResult> {
  try {
    const page = await notion.pages.retrieve({ page_id: pageId });
    const blocks = await getAllBlocks(notion, pageId);

    const serialized = serializeBlocks(blocks);
    const props = (page as Record<string, unknown>).properties;
    const url = (page as Record<string, unknown>).url;

    return {
      success: true,
      data: {
        id: pageId,
        url,
        properties: props,
        content: serialized,
        block_count: blocks.length,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to fetch page: ${msg}` };
  }
}

async function getAllBlocks(
  notion: Client,
  blockId: string,
  depth = 0
): Promise<Record<string, unknown>[]> {
  if (depth > 3) return [];

  const blocks: Record<string, unknown>[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const block of response.results) {
      const b = block as Record<string, unknown>;
      blocks.push(b);

      if (b.has_children) {
        const children = await getAllBlocks(notion, b.id as string, depth + 1);
        (b as Record<string, unknown>).children_blocks = children;
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return blocks;
}

function serializeBlocks(blocks: Record<string, unknown>[], indent = 0): string {
  const lines: string[] = [];
  const prefix = "  ".repeat(indent);

  for (const block of blocks) {
    const type = block.type as string;
    const id = block.id as string;
    const content = block[type] as Record<string, unknown> | undefined;

    let text = "";
    if (content?.rich_text) {
      text = (content.rich_text as Array<{ plain_text: string }>)
        .map((t) => t.plain_text)
        .join("");
    }

    switch (type) {
      case "heading_1":
        lines.push(`${prefix}[block:${id}] # ${text}`);
        break;
      case "heading_2":
        lines.push(`${prefix}[block:${id}] ## ${text}`);
        break;
      case "heading_3":
        lines.push(`${prefix}[block:${id}] ### ${text}`);
        break;
      case "paragraph":
        lines.push(`${prefix}[block:${id}] ${text}`);
        break;
      case "bulleted_list_item":
        lines.push(`${prefix}[block:${id}] - ${text}`);
        break;
      case "numbered_list_item":
        lines.push(`${prefix}[block:${id}] 1. ${text}`);
        break;
      case "to_do": {
        const checked = (content as Record<string, unknown>)?.checked ? "x" : " ";
        lines.push(`${prefix}[block:${id}] [${checked}] ${text}`);
        break;
      }
      case "toggle":
        lines.push(`${prefix}[block:${id}] <toggle> ${text}`);
        break;
      case "callout": {
        const icon = (content as Record<string, unknown>)?.icon as Record<string, unknown> | undefined;
        const emoji = icon?.emoji ?? "💡";
        lines.push(`${prefix}[block:${id}] > ${emoji} ${text}`);
        break;
      }
      case "divider":
        lines.push(`${prefix}[block:${id}] ---`);
        break;
      case "code": {
        const lang = (content as Record<string, unknown>)?.language ?? "";
        lines.push(`${prefix}[block:${id}] \`\`\`${lang}\n${prefix}${text}\n${prefix}\`\`\``);
        break;
      }
      case "quote":
        lines.push(`${prefix}[block:${id}] > ${text}`);
        break;
      case "child_database": {
        const title = (content as Record<string, unknown>)?.title ?? "Untitled";
        lines.push(`${prefix}[block:${id}] [child_database: ${title}]`);
        break;
      }
      case "child_page": {
        const pageTitle = (content as Record<string, unknown>)?.title ?? "Untitled";
        lines.push(`${prefix}[block:${id}] [child_page: ${pageTitle}]`);
        break;
      }
      default:
        lines.push(`${prefix}[block:${id}] [${type}] ${text}`);
    }

    const children = block.children_blocks as Record<string, unknown>[] | undefined;
    if (children && children.length > 0) {
      lines.push(serializeBlocks(children, indent + 1));
    }
  }

  return lines.join("\n");
}
