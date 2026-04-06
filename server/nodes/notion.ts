// nodes/notion.ts
import { NodeDefinition } from "../types/node-type";

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
            icon: "https://img.icons8.com/?size=100&id=F6H2fsqXKBwH&format=png&color=000000",
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
                type: "select", 
                mandatory: false, 
                description: "Filter to return only pages or databases.",
                options: [
                    { label: "Both (All)", value: "" },
                    { label: "Page", value: "page" },
                    { label: "Database", value: "data_source" } // The UI shows "Database", but sends "data_source"
                ],
                defaultValue: ""
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { query, filterType } = evaluatedInputs;
            const accessToken = environment.access_token;

            const requestBody: any = {};
            if (query) requestBody.query = query;
            
            if (filterType) {
                // Map the common word 'database' to the API-required 'data_source' 
                // just in case it is passed dynamically via an expression instead of the dropdown
                let apiFilterValue = filterType.toLowerCase();
                if (apiFilterValue === 'database') {
                    apiFilterValue = 'data_source';
                }

                if (apiFilterValue === 'page' || apiFilterValue === 'data_source') {
                    requestBody.filter = {
                        property: "object",
                        value: apiFilterValue
                    };
                }
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
            icon: "https://img.icons8.com/?size=100&id=F6H2fsqXKBwH&format=png&color=000000",
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
            const accessToken = environment.access_token;

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

            if (markdownContent) {
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
            label: "Notion - Add Database Item",
            description: "Adds a new item (row) to an existing database.",
            icon: "https://img.icons8.com/?size=100&id=F6H2fsqXKBwH&format=png&color=000000",
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
            const accessToken = environment.access_token;

            let propertiesObj: any = {
                [titlePropertyName]: {
                    title: [{ text: { content: itemTitle } }]
                }
            };

            if (additionalPropertiesJson) { // For create_database, this is additionalPropertiesJson. For create_database_item, it's additionaladditionalPropertiesJson
                try {
                    // 1. Intelligently check if it's already an object, or if it needs parsing
                    const parsedProps = typeof additionalPropertiesJson === 'string' 
                        ? JSON.parse(additionalPropertiesJson) 
                        : additionalPropertiesJson;
                    
                    // 2. Merge the properties
                    propertiesObj = { ...propertiesObj, ...parsedProps };
                } catch (error) {
                    throw new Error("Notion API Error: Invalid JSON provided in 'Database Properties'.");
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
    },

    // Operation 4: Create Database
    "notion_create_database_v1": {
        service: "notion",
        operation: "create_database",
        ui: {
            type: "custom/apiNode",
            label: "Notion - Create Database",
            description: "Creates a new database inside a specific Notion page.",
            icon: "https://img.icons8.com/?size=100&id=F6H2fsqXKBwH&format=png&color=000000",
        },
        inputs: [
            { 
                key: "parentPageId", 
                label: "Parent Page ID", 
                type: "string", 
                mandatory: true, 
                description: "The ID of the page where this database will be created." 
            },
            { 
                key: "title", 
                label: "Database Title", 
                type: "string", 
                mandatory: true, 
                description: "The name of the new database." 
            },
            { 
                key: "propertiesJson", 
                label: "Database Properties (JSON)", 
                type: "string", 
                mandatory: false, 
                description: "Optional: Define custom columns. Defaults to a single 'Name' column if left blank.  (e.g. {\"Name\": {\"title\": {}}})" 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { parentPageId, title, propertiesJson } = evaluatedInputs;
            const accessToken = environment.access_token;

            // Notion Databases MUST have at least one title property
            let propertiesObj: any = {
                "Name": { "title": {} }
            };

            if (propertiesJson) { // For create_database, this is propertiesJson. For create_database_item, it's additionalPropertiesJson
                try {
                    // 1. Intelligently check if it's already an object, or if it needs parsing
                    const parsedProps = typeof propertiesJson === 'string' 
                        ? JSON.parse(propertiesJson) 
                        : propertiesJson;
                    
                    // 2. Merge the properties
                    propertiesObj = { ...propertiesObj, ...parsedProps };
                } catch (error) {
                    throw new Error("Notion API Error: Invalid JSON provided in 'Database Properties'.");
                }
            }

            const requestBody = {
                parent: { 
                    type: "page_id",
                    page_id: parentPageId 
                },
                title: [
                    {
                        type: "text",
                        text: { content: title }
                    }
                ],
                properties: propertiesObj
            };

            const response = await fetch('https://api.notion.com/v1/databases', {
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

    // Operation 5: Append Block / Write to existing Page
    "notion_append_block_v1": {
        service: "notion",
        operation: "append_block",
        ui: {
            type: "custom/apiNode",
            label: "Notion - Write to Page",
            description: "Appends text or blocks to the bottom of an existing Notion page.",
            icon: "https://img.icons8.com/?size=100&id=F6H2fsqXKBwH&format=png&color=000000",
        },
        inputs: [
            { 
                key: "pageId", 
                label: "Page ID", 
                type: "string", 
                mandatory: true, 
                description: "The ID of the page you want to write to." 
            },
            { 
                key: "textContent", 
                label: "Text Content", 
                type: "string", 
                mandatory: true, 
                description: "The text you want to append." 
            },
            { 
                key: "blockType", 
                label: "Block Type", 
                type: "select", 
                mandatory: false, 
                description: "What type of text block should this be?",
                options: [
                    { label: "Paragraph", value: "paragraph" },
                    { label: "Heading 1", value: "heading_1" },
                    { label: "Heading 2", value: "heading_2" },
                    { label: "Heading 3", value: "heading_3" },
                    { label: "To Do Item", value: "to_do" },
                    { label: "Quote", value: "quote" }
                ],
                defaultValue: "paragraph"
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { pageId, textContent, blockType } = evaluatedInputs;
            const accessToken = environment.access_token;
            
            // Default to paragraph if not provided
            const type = blockType || "paragraph";

            const requestBody = {
                children: [
                    {
                        object: "block",
                        type: type,
                        [type]: {
                            rich_text: [
                                {
                                    type: "text",
                                    text: { content: textContent }
                                }
                            ]
                        }
                    }
                ]
            };

            // In Notion, appending to a page uses the Blocks API (A page is just a type of block)
            const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
                method: 'PATCH',
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
    // Operation 6: Get Database
    "notion_get_database_v1": {
        service: "notion",
        operation: "get_database",
        ui: {
            type: "custom/apiNode",
            label: "Notion - Get Database",
            description: "Retrieves the structure and metadata of a specific database.",
            icon: "https://img.icons8.com/?size=100&id=F6H2fsqXKBwH&format=png&color=000000",
        },
        inputs: [
            { 
                key: "databaseId", 
                label: "Database ID", 
                type: "string", 
                mandatory: true, 
                description: "The unique ID of the database you want to retrieve." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { databaseId } = evaluatedInputs;
            const accessToken = environment.access_token;

            const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Notion-Version': NOTION_VERSION,
                    'Accept': 'application/json'
                }
            });

            await handleNotionApiError(response);
            
            // Returns the full Database object, including its property schema
            return await response.json();
        }
    },

    // Operation 7: Get Page
    "notion_get_page_v1": {
        service: "notion",
        operation: "get_page",
        ui: {
            type: "custom/apiNode",
            label: "Notion - Get Page",
            description: "Retrieves the properties and metadata of a specific page.",
            icon: "https://img.icons8.com/?size=100&id=F6H2fsqXKBwH&format=png&color=000000",
        },
        inputs: [
            { 
                key: "pageId", 
                label: "Page ID", 
                type: "string", 
                mandatory: true, 
                description: "The unique ID of the page you want to retrieve." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { pageId } = evaluatedInputs;
            const accessToken = environment.access_token;

            const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Notion-Version': NOTION_VERSION,
                    'Accept': 'application/json'
                }
            });

            await handleNotionApiError(response);
            
            // Returns the Page object (properties and metadata, but NOT the block content inside it)
            return await response.json();
        }
    },
    // Operation 8: Query Database (Get Rows/Items)
    "notion_query_database_v1": {
        service: "notion",
        operation: "query_database",
        ui: {
            type: "custom/apiNode",
            label: "Notion - Get Database Items",
            description: "Retrieves the rows (items) inside a specific database.",
            icon: "https://img.icons8.com/?size=100&id=F6H2fsqXKBwH&format=png&color=000000",
        },
        inputs: [
            { 
                key: "databaseId", 
                label: "Database ID", 
                type: "string", 
                mandatory: true, 
                description: "The unique ID of the database you want to read." 
            },
            { 
                key: "filterJson", 
                label: "Filter (JSON)", 
                type: "string", 
                mandatory: false, 
                description: "Optional: JSON object to filter results (e.g. {\"property\": \"Status\", \"select\": {\"equals\": \"Done\"}})." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { databaseId, filterJson } = evaluatedInputs;
            const accessToken = environment.access_token;

            let requestBody: any = {};

            if (filterJson) {
                try {
                    const parsedFilter = typeof filterJson === 'string' 
                        ? JSON.parse(filterJson) 
                        : filterJson;
                    requestBody.filter = parsedFilter;
                } catch (error) {
                    throw new Error("Notion API Error: Invalid JSON provided in 'Filter'.");
                }
            }

            const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
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

    // Operation 9: Get Page Content (Read Blocks)
    "notion_get_page_content_v1": {
        service: "notion",
        operation: "get_page_content",
        ui: {
            type: "custom/apiNode",
            label: "Notion - Get Page Content",
            description: "Retrieves the actual text, headings, and blocks inside a Notion page.",
            icon: "https://img.icons8.com/?size=100&id=F6H2fsqXKBwH&format=png&color=000000",
        },
        inputs: [
            { 
                key: "pageId", 
                label: "Page ID", 
                type: "string", 
                mandatory: true, 
                description: "The unique ID of the page whose content you want to read." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { pageId } = evaluatedInputs;
            const accessToken = environment.access_token;

           
            const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Notion-Version': NOTION_VERSION,
                    'Accept': 'application/json'
                }
            });

            await handleNotionApiError(response);
            
            return await response.json();
        }
    }
};