// nodes/notion.ts

// --- Types & Interfaces ---
export interface NodeInput {
    key: string;
    label: string;
    type: 'string' | 'number' | 'boolean';
    mandatory: boolean;
    description?: string;
}

export interface NodeUI {
    type: string;
    label: string;
    description: string;
    icon: string;
}

export interface NodeDefinition {
    service: string;
    operation: string;
    ui: NodeUI;
    inputs: NodeInput[];
    execute: (evaluatedInputs: Record<string, any>, environment: Record<string, any>) => Promise<any>;
}

// --- Shared Private Helper Functions ---
async function handleNotionApiError(response: Response): Promise<Response> {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Notion API Error: ${errorData.message || 'Unknown Error'}`);
    }
    return response;
}

// Notion strictly requires the Notion-Version header. 
// We use the version specified in your documentation.
const NOTION_VERSION = '2026-03-11'; 

// --- The Exported Node Operations ---
export const notionNodes: Record<string, NodeDefinition> = {
    
    // Operation 1: Search (Helper to find Page IDs and Database IDs)
    "notion_search_v1": {
        service: "notion",
        operation: "search",
        ui: {
            type: "custom/apiNode",
            label: "Notion - Search",
            description: "Searches for Pages or Databases shared with your integration to get their IDs.",
            icon: "notion-logo-url",
        },
        inputs: [
            { 
                key: "query", 
                label: "Search Query", 
                type: "string", 
                mandatory: false, 
                description: "The title of the page or database you are looking for." 
            },
            { 
                key: "filterType", 
                label: "Filter Type", 
                type: "string", 
                mandatory: false, 
                description: "Type 'page' or 'database' to narrow down results." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { query, filterType } = evaluatedInputs;
            const accessToken = environment.notionAccessToken;

            const requestBody: any = {};
            if (query) requestBody.query = query;
            
            if (filterType && (filterType.toLowerCase() === 'page' || filterType.toLowerCase() === 'database')) {
                requestBody.filter = {
                    property: "object",
                    value: filterType.toLowerCase()
                };
            }

            const response = await fetch('https://api.notion.com/v1/search', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Notion-Version': NOTION_VERSION,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            await handleNotionApiError(response);
            
            // Returns { results: [ { object: "page", id: "...", ... } ] }
            return await response.json(); 
        }
    },

    // Operation 2: Create a Page (Child of another Page)
    "notion_create_page_v1": {
        service: "notion",
        operation: "create_page",
        ui: {
            type: "custom/apiNode",
            label: "Notion - Create Page",
            description: "Creates a new blank page as a child of an existing page.",
            icon: "notion-logo-url",
        },
        inputs: [
            { 
                key: "parentPageId", 
                label: "Parent Page ID", 
                type: "string", 
                mandatory: true, 
                description: "The ID of the page where this new page will be created." 
            },
            { 
                key: "title", 
                label: "Page Title", 
                type: "string", 
                mandatory: true, 
                description: "The title of the new page." 
            },
            { 
                key: "markdownContent", 
                label: "Markdown Content", 
                type: "string", 
                mandatory: false, 
                description: "Optional: Populate the page with markdown text." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { parentPageId, title, markdownContent } = evaluatedInputs;
            const accessToken = environment.notionAccessToken;

            const requestBody: any = {
                parent: { 
                    type: "page_id",
                    page_id: parentPageId 
                },
                properties: {
                    title: {
                        title: [{ text: { content: title } }]
                    }
                }
            };

            // Using the custom markdown parameter defined in your API spec
            if (markdownContent) {
                // Ensure newlines are properly escaped if necessary
                requestBody.markdown = markdownContent; 
            }

            const response = await fetch('https://api.notion.com/v1/pages', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Notion-Version': NOTION_VERSION,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            await handleNotionApiError(response);
            return await response.json();
        }
    },

    // Operation 3: Create Database Item (Add Row to Database)
    "notion_create_database_item_v1": {
        service: "notion",
        operation: "create_database_item",
        ui: {
            type: "custom/apiNode",
            label: "Notion - Create Database Item",
            description: "Adds a new item (row) to an existing database.",
            icon: "notion-logo-url",
        },
        inputs: [
            { 
                key: "databaseId", 
                label: "Database ID", 
                type: "string", 
                mandatory: true, 
                description: "The ID of the database to add the item to." 
            },
            { 
                key: "titlePropertyName", 
                label: "Title Property Name", 
                type: "string", 
                mandatory: true, 
                description: "The name of the main title column (usually 'Name')." 
            },
            { 
                key: "itemTitle", 
                label: "Item Title", 
                type: "string", 
                mandatory: true, 
                description: "The title/name of the new database item." 
            },
            { 
                key: "additionalPropertiesJson", 
                label: "Other Properties (JSON)", 
                type: "string", 
                mandatory: false, 
                description: "Optional: Raw JSON object for other columns (e.g., {\"Status\": {\"select\": {\"name\": \"Done\"}}})." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { databaseId, titlePropertyName, itemTitle, additionalPropertiesJson } = evaluatedInputs;
            const accessToken = environment.notionAccessToken;

            // Initialize the required Title property
            let propertiesObj: any = {
                [titlePropertyName]: {
                    title: [{ text: { content: itemTitle } }]
                }
            };

            // Safely parse and merge additional properties if the user provided them
            if (additionalPropertiesJson) {
                try {
                    const parsedProps = JSON.parse(additionalPropertiesJson);
                    propertiesObj = { ...propertiesObj, ...parsedProps };
                } catch (error) {
                    throw new Error("Notion API Error: Invalid JSON provided in 'Other Properties'.");
                }
            }

            const requestBody = {
                parent: { 
                    type: "database_id",
                    database_id: databaseId 
                },
                properties: propertiesObj
            };

            const response = await fetch('https://api.notion.com/v1/pages', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Notion-Version': NOTION_VERSION,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            await handleNotionApiError(response);
            return await response.json();
        }
    }
};