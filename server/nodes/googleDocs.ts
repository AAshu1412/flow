// nodes/googleDocs.ts
import { NodeDefinition } from "../types/node-type";
// --- Types & Interfaces (Assuming these are imported from your core engine types) ---
// export interface NodeInput {
//     key: string;
//     label: string;
//     type: 'string' | 'number' | 'boolean';
//     mandatory: boolean;
//     description?: string;
// }

// export interface NodeUI {
//     type: string;
//     label: string;
//     description: string;
//     icon: string;
// }

// export interface NodeDefinition {
//     service: string;
//     operation: string;
//     ui: NodeUI;
//     inputs: NodeInput[];
//     execute: (evaluatedInputs: Record<string, any>, environment: Record<string, any>) => Promise<any>;
// }

// --- Shared Private Helper Functions ---
async function handleDocsApiError(response: Response): Promise<Response> {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Docs API Error: ${errorData.error?.message || 'Unknown Error'}`);
    }
    return response;
}

// --- The Exported Node Operations ---
export const googleDocsNodes: Record<string, NodeDefinition> = {
    
    // Operation 1: Create Document
    "google_docs_create_v1": {
        service: "google_docs",
        operation: "create_document",
        ui: {
            type: "custom/apiNode",
            label: "Google Docs - Create Document",
            description: "Creates a new, blank Google Document.",
            icon: "https://img.icons8.com/?size=100&id=30464&format=png&color=000000",
        },
        inputs: [
            { 
                key: "title", 
                label: "Document Title", 
                type: "string", 
                mandatory: true, 
                description: "The name of the new document." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { title } = evaluatedInputs;
            const accessToken = environment.access_token;

            const response = await fetch('https://docs.googleapis.com/v1/documents', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: title })
            });

            await handleDocsApiError(response);
            
            // Returns the Document object which includes the new `documentId`
            return await response.json(); 
        }
    },

    // Operation 2: Append Text to Document
    "google_docs_append_v1": {
        service: "google_docs",
        operation: "append_document",
        ui: {
            type: "custom/apiNode",
            label: "Google Docs - Append Text",
            description: "Appends text to the end of an existing Google Document.",
            icon: "https://img.icons8.com/?size=100&id=30464&format=png&color=000000",
        },
        inputs: [
            { 
                key: "documentId", 
                label: "Document ID", 
                type: "string", 
                mandatory: true, 
                description: "The unique ID of the document to edit." 
            },
            { 
                key: "textToAppend", 
                label: "Text to Append", 
                type: "string", 
                mandatory: true, 
                description: "The content to add to the end of the document." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { documentId, textToAppend } = evaluatedInputs;
            const accessToken = environment.access_token;

            // Google Docs requires a batchUpdate request to modify content.
            // We use 'endOfSegmentLocation' with an empty segmentId to target the end of the main body.
            const batchUpdateRequest = {
                requests: [
                    {
                        insertText: {
                            text: textToAppend + "\n", // Ensure we add a newline so subsequent appends don't run together
                            endOfSegmentLocation: {
                                segmentId: "" 
                            }
                        }
                    }
                ]
            };

            const response = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(batchUpdateRequest)
            });

            await handleDocsApiError(response);
            return await response.json();
        }
    },

    // Operation 3: Get Document (Helper for reading data)
    "google_docs_get_v1": {
        service: "google_docs",
        operation: "get_document",
        ui: {
            type: "custom/apiNode",
            label: "Google Docs - Get Document",
            description: "Retrieves the full structural content of a document.",
            icon: "https://img.icons8.com/?size=100&id=30464&format=png&color=000000",
        },
        inputs: [
            { 
                key: "documentId", 
                label: "Document ID", 
                type: "string", 
                mandatory: true, 
                description: "The unique ID of the document to retrieve." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { documentId } = evaluatedInputs;
            const accessToken = environment.access_token;

            const response = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            await handleDocsApiError(response);
            
            // Returns the massive Document object containing the 'body' array
            return await response.json();
        }
    }
};