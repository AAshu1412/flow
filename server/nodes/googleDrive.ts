// nodes/googleDrive.ts

export interface NodeDefinition {
    service: string;
    operation: string;
    ui: any;
    inputs: any[];
    execute: (evaluatedInputs: Record<string, any>, environment: Record<string, any>) => Promise<any>;
}

async function handleDriveApiError(response: Response): Promise<Response> {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Drive API Error: ${errorData.error?.message || 'Unknown Error'}`);
    }
    return response;
}

export const googleDriveNodes: Record<string, NodeDefinition> = {
    
    // Operation: Search / List Files
    "google_drive_list_v1": {
        service: "google_drive",
        operation: "list_files",
        ui: {
            type: "custom/apiNode",
            label: "Google Drive - Search Files",
            description: "Search for files and folders in Google Drive to get their IDs.",
            icon: "https://img.icons8.com/?size=100&id=ya4CrqO7PgnY&format=png&color=000000",
        },
        inputs: [
            { 
                key: "searchQuery", 
                label: "Search File Name", 
                type: "string", 
                mandatory: false, 
                description: "Type a name to search for (e.g., 'Q3 Report')." 
            },
            { 
                key: "fileType", 
                label: "File Type Filter", 
                type: "string", 
                mandatory: false, 
                // In your frontend, you could make this a dropdown menu!
                description: "Leave blank for all, or type 'document', 'spreadsheet', 'folder'." 
            },
            { 
                key: "pageSize", 
                label: "Max Results", 
                type: "number", 
                mandatory: false, 
                description: "Max files to return (Default: 10)." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { searchQuery, fileType, pageSize } = evaluatedInputs;
            
            // IMPORTANT: This node requires a Google Drive scope/token, not Docs!
            const accessToken = environment.googleDriveAccessToken; 

            const url = new URL('https://www.googleapis.com/drive/v3/files');

            // 1. Build the Drive 'q' (query) string
            let qArray = [];
            
            if (searchQuery) {
                // Searches for files where the name contains the user's input
                qArray.push(`name contains '${searchQuery.replace(/'/g, "\\'")}'`);
            }

            if (fileType) {
                // Map user-friendly words to Google's strict MIME types
                if (fileType.toLowerCase() === 'document') {
                    qArray.push("mimeType = 'application/vnd.google-apps.document'");
                } else if (fileType.toLowerCase() === 'spreadsheet') {
                    qArray.push("mimeType = 'application/vnd.google-apps.spreadsheet'");
                } else if (fileType.toLowerCase() === 'folder') {
                    qArray.push("mimeType = 'application/vnd.google-apps.folder'");
                }
            }

            // Exclude trashed files by default
            qArray.push("trashed = false");

            // Combine the query array into a single string
            if (qArray.length > 0) {
                url.searchParams.append('q', qArray.join(' and '));
            }

            // 2. Set pagination
            if (pageSize) {
                url.searchParams.append('pageSize', pageSize.toString());
            }

            // 3. IMPORTANT: Drive API v3 returns almost no data by default. 
            // We MUST specify the fields we want back (id and name).
            url.searchParams.append('fields', 'files(id, name, mimeType)');

            // 4. Make the request
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            await handleDriveApiError(response);
            
            // Returns: { files: [ { id: "1A2B3C...", name: "My Doc", mimeType: "..." } ] }
            return await response.json(); 
        }
    }
};