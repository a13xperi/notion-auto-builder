export const QUALITY_RUBRIC = `
## Quality Evaluation Rubric

Score each dimension 1-5. Pass threshold: average >= 4.0, no dimension below 3.

### 1. Structural Completeness (HIGH weight)
1 = Missing major sections/entities. 2 = Missing 2+ components. 3 = All expected present. 4 = Comprehensive. 5 = Includes bonus elements.
- Database: TITLE + STATUS + 4+ properties + 2+ views + description
- Page: Title + intro + 3+ sections + closing
- Multi-entity: Hub page + all databases + relations + views + navigation

### 2. Content Depth (HIGH weight)
1 = Placeholder text. 2 = Generic. 3 = Domain-appropriate but surface. 4 = Specific with examples. 5 = Rich detail, actionable guidance.

### 3. Notion Feature Usage (MEDIUM weight)
1 = Plain text only. 2 = Headers + lists. 3 = Plus callouts or toggles. 4 = Plus tables, dividers, multiple views. 5 = Plus colored callouts, formulas, rollups.

### 4. Visual Organization (MEDIUM weight)
1 = Wall of text. 2 = Headers but dense. 3 = Clear hierarchy. 4 = Visual rhythm + color coding. 5 = Publication quality.

### 5. Actionability (HIGH weight)
1 = Not usable. 2 = Empty structure. 3 = Has status options. 4 = Realistic defaults + sample data. 5 = Immediately usable with Quick Start.

### 6. Internal Consistency (MEDIUM weight)
1 = Broken references. 2 = Inconsistent naming. 3 = All links work. 4 = Consistent naming scheme. 5 = Perfect cross-referencing.

Refinement priority (fix lowest-scoring HIGH-weight dimensions first):
1. Structural Completeness -> 2. Actionability -> 3. Content Depth -> 4. Internal Consistency -> 5. Notion Feature Usage -> 6. Visual Organization
`;

export const DOCUMENT_ARCHETYPES = `
## Document Archetypes

Classify the request:
- Tracking items with properties? -> Does it need multiple related collections?
  - YES to multiple -> MULTI-ENTITY (project tracker, CRM, OKR system)
  - NO -> DATABASE (task list, inventory, contacts)
- Rich narrative content? -> PAGE (guide, handbook, wiki page)

### Database Minimum Properties
Every database needs: TITLE, STATUS (select with 3+ colored options), 4+ domain-relevant properties, and at least 2 views.

### Page Minimum Structure
Every page needs: title, intro paragraph, 3+ sections with ## headers, at least 1 callout block, at least 1 toggle section, dividers between sections.

### Multi-Entity Pattern (Hub-and-Spoke)
1. Create hub page first
2. Create databases as children of hub
3. Create views on each database
4. Add relations between databases
5. Update hub page with links to all components
6. Create guide/docs child pages
`;

export const NOTION_BLOCK_REFERENCE = `
## Notion Block Types Reference

When creating page content, use these block structures:

### Paragraph
{type: "paragraph", paragraph: {rich_text: [{type: "text", text: {content: "text"}}]}}

### Headings
{type: "heading_1", heading_1: {rich_text: [{type: "text", text: {content: "Title"}}]}}
{type: "heading_2", heading_2: {rich_text: [{type: "text", text: {content: "Section"}}]}}
{type: "heading_3", heading_3: {rich_text: [{type: "text", text: {content: "Subsection"}}]}}

### Lists
{type: "bulleted_list_item", bulleted_list_item: {rich_text: [{type: "text", text: {content: "item"}}]}}
{type: "numbered_list_item", numbered_list_item: {rich_text: [{type: "text", text: {content: "step"}}]}}

### To-Do
{type: "to_do", to_do: {rich_text: [{type: "text", text: {content: "task"}}], checked: false}}

### Toggle
{type: "toggle", toggle: {rich_text: [{type: "text", text: {content: "Summary"}}], children: [/* child blocks */]}}

### Callout
{type: "callout", callout: {rich_text: [{type: "text", text: {content: "message"}}], icon: {type: "emoji", emoji: "💡"}, color: "blue_background"}}
Colors: blue_background, yellow_background, green_background, red_background, gray_background

### Divider
{type: "divider", divider: {}}

### Code
{type: "code", code: {rich_text: [{type: "text", text: {content: "code here"}}], language: "javascript"}}

### Quote
{type: "quote", quote: {rich_text: [{type: "text", text: {content: "quoted text"}}]}}

### Table (with rows)
{type: "table", table: {table_width: 3, has_column_header: true, has_row_header: false, children: [
  {type: "table_row", table_row: {cells: [[{type: "text", text: {content: "Header 1"}}], [{type: "text", text: {content: "Header 2"}}], [{type: "text", text: {content: "Header 3"}}]]}},
  {type: "table_row", table_row: {cells: [[{type: "text", text: {content: "Value"}}], [{type: "text", text: {content: "Value"}}], [{type: "text", text: {content: "Value"}}]]}}
]}}

## Database Property Types

title: {title: {}}
rich_text: {rich_text: {}}
number: {number: {format: "number"}}  // formats: number, dollar, percent, etc.
select: {select: {options: [{name: "Option", color: "blue"}]}}
multi_select: {multi_select: {options: [{name: "Tag", color: "green"}]}}
date: {date: {}}
people: {people: {}}
checkbox: {checkbox: {}}
url: {url: {}}
email: {email: {}}
phone_number: {phone_number: {}}
status: {status: {options: [{name: "Not Started", color: "default"}, {name: "In Progress", color: "blue"}, {name: "Done", color: "green"}]}}
relation: {relation: {database_id: "target_db_id", type: "dual_property"}}
created_time: {created_time: {}}
last_edited_time: {last_edited_time: {}}

## Setting Property Values (for database rows)

title: {title: [{text: {content: "Page Title"}}]}
rich_text: {rich_text: [{text: {content: "Some text"}}]}
number: {number: 42}
select: {select: {name: "Option Name"}}
multi_select: {multi_select: [{name: "Tag1"}, {name: "Tag2"}]}
date: {date: {start: "2024-01-15"}}
people: {people: [{id: "user_id"}]}
checkbox: {checkbox: true}
url: {url: "https://example.com"}
status: {status: {name: "In Progress"}}
relation: {relation: [{id: "page_id"}]}
`;
