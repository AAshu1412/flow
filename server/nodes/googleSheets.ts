// nodes/googleSheets.ts
import { NodeDefinition } from "../types/node-type";
// --- Types & Interfaces ---
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
async function handleSheetsApiError(response: Response): Promise<Response> {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Sheets API Error: ${errorData.error?.message || 'Unknown Error'}`);
    }
    return response;
}

// --- The Exported Node Operations ---
export const googleSheetsNodes: Record<string, NodeDefinition> = {
    
    // Operation 1: Append Row
    "google_sheets_append_row_v1": {
        service: "google_sheets",
        operation: "append_row",
        ui: {
            type: "custom/apiNode",
            label: "Google Sheets - Append Row",
            description: "Appends a new row of data to the bottom of a sheet.",
            icon: "https://img.icons8.com/?size=100&id=30461&format=png&color=000000",
        },
        inputs: [
            { 
                key: "spreadsheetId", 
                label: "Spreadsheet ID", 
                type: "string", 
                mandatory: true, 
                description: "The unique ID of the spreadsheet file." 
            },
            { 
                key: "range", 
                label: "Sheet Range", 
                type: "string", 
                mandatory: true, 
                description: "The A1 notation of the sheet to append to (e.g., 'Sheet1!A:A')." 
            },
            { 
                key: "values", 
                label: "Row Values", 
                type: "string", 
                mandatory: true, 
                description: "Comma-separated values for the new row (e.g., 'John, Doe, 555-0199')." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { spreadsheetId, range, values } = evaluatedInputs;
            const accessToken = environment.googleSheetsAccessToken;

            // Google Sheets expects a 2D array for values: [ [col1, col2, col3] ]
            // We split the comma-separated string from the user into a proper array.
            const rowArray = values.split(',').map((val: string) => val.trim());

            // valueInputOption=USER_ENTERED ensures numbers/dates are parsed correctly,
            // rather than being pasted as raw strings.
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    majorDimension: "ROWS",
                    values: [rowArray]
                })
            });

            await handleSheetsApiError(response);
            return await response.json(); 
        }
    },

    // Operation 2: Get Many Rows
    "google_sheets_get_rows_v1": {
        service: "google_sheets",
        operation: "get_rows",
        ui: {
            type: "custom/apiNode",
            label: "Google Sheets - Get Rows",
            description: "Retrieves multiple rows of data from a specified range.",
            icon: "https://img.icons8.com/?size=100&id=30461&format=png&color=000000",
        },
        inputs: [
            { 
                key: "spreadsheetId", 
                label: "Spreadsheet ID", 
                type: "string", 
                mandatory: true, 
                description: "The unique ID of the spreadsheet file." 
            },
            { 
                key: "range", 
                label: "Range", 
                type: "string", 
                mandatory: true, 
                description: "The A1 notation of the exact cells to read (e.g., 'Sheet1!A1:D100')." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { spreadsheetId, range } = evaluatedInputs;
            const accessToken = environment.googleSheetsAccessToken;

            const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            await handleSheetsApiError(response);
            
            // Returns an object containing a 'values' array: 
            // { "values": [ ["Row1Col1", "Row1Col2"], ["Row2Col1", "Row2Col2"] ] }
            return await response.json();
        }
    },

    // Operation 3: Get Spreadsheet Info (Helper)
    "google_sheets_get_info_v1": {
        service: "google_sheets",
        operation: "get_info",
        ui: {
            type: "custom/apiNode",
            label: "Google Sheets - Get Info",
            description: "Retrieves spreadsheet metadata, including the names of all tabs.",
            icon: "https://img.icons8.com/?size=100&id=30461&format=png&color=000000",
        },
        inputs: [
            { 
                key: "spreadsheetId", 
                label: "Spreadsheet ID", 
                type: "string", 
                mandatory: true, 
                description: "The unique ID of the spreadsheet file." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { spreadsheetId } = evaluatedInputs;
            const accessToken = environment.googleSheetsAccessToken;

            // Adding ?includeGridData=false ensures we only get the lightweight metadata 
            // (like tab names) and don't accidentally download gigabytes of cell data.
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            await handleSheetsApiError(response);
            
            // Returns metadata. You can find the tab names under data.sheets[i].properties.title
            return await response.json();
        }
    }
};