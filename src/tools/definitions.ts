import type { ToolDefinition } from "../types.js";

export const toolDefinitions: ToolDefinition[] = [
  {
    name: "notion_create_page",
    description:
      "Create a new Notion page. Provide parent (page_id or database_id), title, and content blocks. For database pages, include properties matching the database schema.",
    input_schema: {
      type: "object" as const,
      properties: {
        parent_type: {
          type: "string",
          enum: ["page_id", "database_id"],
          description: "Type of parent: page_id for a page, database_id for a database row",
        },
        parent_id: {
          type: "string",
          description: "The ID of the parent page or database",
        },
        title: {
          type: "string",
          description: "Page title (used as the title property)",
        },
        icon: {
          type: "string",
          description: "Emoji icon for the page (e.g. '🚀')",
        },
        properties: {
          type: "object",
          description:
            "Page properties as JSON. For database pages, keys are property names. Values depend on type: {title: [{text: {content: 'text'}}]} for title, {select: {name: 'Option'}} for select, etc.",
        },
        children: {
          type: "array",
          description:
            "Array of Notion block objects for page content. Each block has a type and corresponding content. Common types: paragraph, heading_1/2/3, bulleted_list_item, numbered_list_item, to_do, toggle, callout, divider, code, table, quote.",
          items: { type: "object" },
        },
      },
      required: ["parent_type", "parent_id"],
    },
  },
  {
    name: "notion_create_database",
    description:
      "Create a new Notion database with a property schema. Returns the database ID and URL.",
    input_schema: {
      type: "object" as const,
      properties: {
        parent_page_id: {
          type: "string",
          description: "The page ID to create the database under",
        },
        title: {
          type: "string",
          description: "Database title",
        },
        icon: {
          type: "string",
          description: "Emoji icon for the database",
        },
        description: {
          type: "string",
          description: "Database description text",
        },
        properties: {
          type: "object",
          description:
            'Database property schema. Keys are property names. Values are property config objects like {title: {}}, {select: {options: [{name: "Option", color: "blue"}]}}, {number: {format: "dollar"}}, {date: {}}, {people: {}}, {checkbox: {}}, {url: {}}, {email: {}}, {rich_text: {}}, {multi_select: {options: [...]}}, {relation: {database_id: "..."}}, {created_time: {}}, {last_edited_time: {}}.',
        },
      },
      required: ["parent_page_id", "title", "properties"],
    },
  },
  {
    name: "notion_update_page_properties",
    description: "Update a page's properties (title, icon, cover, or database row properties).",
    input_schema: {
      type: "object" as const,
      properties: {
        page_id: { type: "string", description: "The page ID to update" },
        icon: { type: "string", description: "New emoji icon" },
        properties: {
          type: "object",
          description: "Properties to update. Same format as create.",
        },
      },
      required: ["page_id"],
    },
  },
  {
    name: "notion_append_page_content",
    description:
      "Append block children to a page or block. Use this to add new sections to existing pages.",
    input_schema: {
      type: "object" as const,
      properties: {
        block_id: {
          type: "string",
          description: "The page or block ID to append to",
        },
        children: {
          type: "array",
          description: "Array of Notion block objects to append",
          items: { type: "object" },
        },
      },
      required: ["block_id", "children"],
    },
  },
  {
    name: "notion_update_block",
    description: "Update an existing block's content. Use the block ID from notion_fetch results.",
    input_schema: {
      type: "object" as const,
      properties: {
        block_id: { type: "string", description: "The block ID to update" },
        block: {
          type: "object",
          description:
            "The block update payload. Include the block type key with updated content. E.g. {paragraph: {rich_text: [{text: {content: 'new text'}}]}}",
        },
      },
      required: ["block_id", "block"],
    },
  },
  {
    name: "notion_delete_block",
    description: "Delete a block by ID. Use carefully - this is irreversible.",
    input_schema: {
      type: "object" as const,
      properties: {
        block_id: { type: "string", description: "The block ID to delete" },
      },
      required: ["block_id"],
    },
  },
  {
    name: "notion_update_database",
    description:
      "Update a database's schema - add, rename, or modify properties. Also can update title and description.",
    input_schema: {
      type: "object" as const,
      properties: {
        database_id: { type: "string", description: "The database ID to update" },
        title: { type: "string", description: "New database title" },
        description: { type: "string", description: "New database description" },
        properties: {
          type: "object",
          description:
            "Properties to add or modify. To add: provide full config. To rename: use {name: 'new_name'}. To remove: set to null.",
        },
      },
      required: ["database_id"],
    },
  },
  {
    name: "notion_query_database",
    description: "Query rows from a database with optional filters and sorts.",
    input_schema: {
      type: "object" as const,
      properties: {
        database_id: { type: "string", description: "The database ID to query" },
        filter: { type: "object", description: "Notion filter object" },
        sorts: {
          type: "array",
          description: "Array of sort objects [{property: 'Name', direction: 'ascending'}]",
          items: { type: "object" },
        },
        page_size: {
          type: "number",
          description: "Max results (1-100, default 10)",
        },
      },
      required: ["database_id"],
    },
  },
  {
    name: "notion_create_database_rows",
    description: "Create multiple rows in a database. Each row has properties matching the schema.",
    input_schema: {
      type: "object" as const,
      properties: {
        database_id: { type: "string", description: "The database ID" },
        rows: {
          type: "array",
          description:
            "Array of row objects. Each has a properties field matching the database schema.",
          items: {
            type: "object",
            properties: {
              properties: { type: "object" },
            },
          },
        },
      },
      required: ["database_id", "rows"],
    },
  },
  {
    name: "notion_create_view",
    description: "Create a new view on a database (table, board, calendar, timeline, gallery, list).",
    input_schema: {
      type: "object" as const,
      properties: {
        database_id: { type: "string", description: "The database ID" },
        name: { type: "string", description: "View name" },
        type: {
          type: "string",
          enum: ["table", "board", "calendar", "timeline", "gallery", "list"],
          description: "View type",
        },
        filter: { type: "object", description: "View filter config" },
        sort: {
          type: "array",
          description: "View sort config",
          items: { type: "object" },
        },
        group_by: {
          type: "string",
          description: "Property name to group by (required for board views)",
        },
        calendar_by: {
          type: "string",
          description: "Date property name (required for calendar views)",
        },
      },
      required: ["database_id", "name", "type"],
    },
  },
  {
    name: "notion_fetch",
    description:
      "Fetch and read back a Notion page or database, returning its full content as structured text. Use this to evaluate what was created. Returns properties, content blocks (with block IDs), and child database info.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "The page or database ID to fetch",
        },
        type: {
          type: "string",
          enum: ["page", "database"],
          description: "Whether to fetch a page or database",
        },
      },
      required: ["id", "type"],
    },
  },
  {
    name: "notion_search",
    description: "Search the Notion workspace for pages and databases matching a query.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query text" },
        filter_type: {
          type: "string",
          enum: ["page", "database"],
          description: "Filter to only pages or databases",
        },
        page_size: { type: "number", description: "Max results (1-100, default 10)" },
      },
      required: ["query"],
    },
  },
  {
    name: "report_complete",
    description:
      "Call this tool when the build is complete and all refinement iterations are done. This signals the end of the loop and outputs the final report to the user.",
    input_schema: {
      type: "object" as const,
      properties: {
        entities: {
          type: "array",
          description: "All created entities with name, type, id, and url",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              type: { type: "string", enum: ["page", "database", "view"] },
              id: { type: "string" },
              url: { type: "string" },
            },
            required: ["name", "type", "id", "url"],
          },
        },
        scores: {
          type: "object",
          description: "Final quality scores (1-5 each)",
          properties: {
            structuralCompleteness: { type: "number" },
            contentDepth: { type: "number" },
            notionFeatureUsage: { type: "number" },
            visualOrganization: { type: "number" },
            actionability: { type: "number" },
            internalConsistency: { type: "number" },
          },
          required: [
            "structuralCompleteness",
            "contentDepth",
            "notionFeatureUsage",
            "visualOrganization",
            "actionability",
            "internalConsistency",
          ],
        },
        iterations: {
          type: "number",
          description: "Number of refinement iterations performed",
        },
        suggestions: {
          type: "array",
          description: "2-3 suggestions for manual customization",
          items: { type: "string" },
        },
      },
      required: ["entities", "scores", "iterations", "suggestions"],
    },
  },
];
