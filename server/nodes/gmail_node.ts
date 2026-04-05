// nodes/gmail.ts
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
//     // EvaluatedInputs is a dictionary of the final values (e.g., { to: "user@test.com" })
//     execute: (evaluatedInputs: Record<string, any>, environment: Record<string, any>) => Promise<any>;
// }

// --- Shared Private Helper Functions ---
function encodeBase64Url(rawString: string): string {
    // 1. Convert the string to a UTF-8 byte array
    const bytes = new TextEncoder().encode(rawString);
    
    // 2. Convert the byte array to a binary string
    let binString = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binString += String.fromCharCode(bytes[i]);
    }
    
    // 3. Encode to standard Base64
    const base64 = btoa(binString);
    
    // 4. Convert Standard Base64 to Base64URL format
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function handleGmailApiError(response: Response): Promise<Response> {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gmail API Error: ${errorData.error?.message || 'Unknown Error'}`);
    }
    return response;
}

// --- The Exported Node Operations ---
// We define them in a dictionary where the key is the templateId
export const gmailNodes: Record<string, NodeDefinition> = {
    
    // Operation 1: Send Message
    "gmail_send_message_v1": {
        service: "gmail",
        operation: "send_message",
        ui: {
            type: "custom/apiNode",
            label: "Gmail - Send Email",
            description: "Sends an email using the authenticated user's account.",
            icon: "https://img.icons8.com/?size=100&id=P7UIlhbpWzZm&format=png&color=000000",
        },
        inputs: [
            { key: "to", label: "To", type: "string", mandatory: true },
            { key: "subject", label: "Subject", type: "string", mandatory: true },
            { key: "bodyText", label: "Body", type: "string", mandatory: true }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { to, subject, bodyText } = evaluatedInputs;
            const accessToken = environment.access_token;

            const mimeMessage = `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset="UTF-8"\r\n\r\n${bodyText}`;
            const rawEncodedMessage = encodeBase64Url(mimeMessage);

            const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ raw: rawEncodedMessage })
            });

            await handleGmailApiError(response);
            return await response.json(); 
        }
    },

    // Operation 2: Get Thread
    "gmail_get_thread_v1": {
        service: "gmail",
        operation: "get_thread",
        ui: {
            type: "custom/apiNode",
            label: "Gmail - Get Thread",
            description: "Retrieves a full email thread by its ID.",
            icon: "https://img.icons8.com/?size=100&id=P7UIlhbpWzZm&format=png&color=000000",
        },
        inputs: [
            { key: "threadId", label: "Thread ID", type: "string", mandatory: true, description: "The ID of the thread to retrieve." }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { threadId } = evaluatedInputs;
            const accessToken = environment.access_token;

            const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            await handleGmailApiError(response);
            return await response.json();
        }
    },

    // Operation 3: List Threads
    "gmail_list_threads_v1": {
        service: "gmail",
        operation: "list_threads",
        ui: {
            type: "custom/apiNode",
            label: "Gmail - List Threads",
            description: "Retrieves a list of email threads matching specific search criteria.",
            icon: "https://img.icons8.com/?size=100&id=P7UIlhbpWzZm&format=png&color=000000",
        },
        // Notice how 'mandatory' is false for these, as the API allows an empty request to just fetch recent threads.
        inputs: [
            { 
                key: "q", 
                label: "Search Query", 
                type: "string", 
                mandatory: false, 
                description: "Standard Gmail search query (e.g., 'is:unread from:boss@company.com')." 
            },
            { 
                key: "maxResults", 
                label: "Max Results", 
                type: "number", 
                mandatory: false, 
                description: "Maximum number of threads to return (Default: 100, Max: 500)." 
            },
            { 
                key: "labelIds", 
                label: "Label IDs", 
                type: "string", 
                mandatory: false, 
                description: "Comma-separated list of Label IDs (e.g., 'INBOX, UNREAD')." 
            },
            { 
                key: "includeSpamTrash", 
                label: "Include Spam & Trash", 
                type: "boolean", 
                mandatory: false, 
                description: "Set to true to include threads from SPAM and TRASH." 
            },
            { 
                key: "pageToken", 
                label: "Page Token", 
                type: "string", 
                mandatory: false, 
                description: "Token to retrieve a specific page of results." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { q, maxResults, labelIds, includeSpamTrash, pageToken } = evaluatedInputs;
            const accessToken = environment.access_token;

            // 1. Initialize the base URL
            const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/threads');

            // 2. Safely append query parameters only if the user provided them
            if (q) url.searchParams.append('q', q);
            if (maxResults) url.searchParams.append('maxResults', maxResults.toString());
            if (includeSpamTrash) url.searchParams.append('includeSpamTrash', includeSpamTrash.toString());
            if (pageToken) url.searchParams.append('pageToken', pageToken);

            // The Gmail API expects multiple 'labelIds' parameters for arrays (e.g., ?labelIds=INBOX&labelIds=UNREAD)
            // We allow the user to type a simple comma-separated string, and we split it for the API here.
            if (labelIds) {
                const labelsArray = labelIds.split(',').map((label: string) => label.trim());
                labelsArray.forEach((label: string) => url.searchParams.append('labelIds', label));
            }

            // 3. Execute the fetch call using the fully constructed URL
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            await handleGmailApiError(response); // Reusing the shared error handler!
            
            // Returns: { threads: [{ id: "...", snippet: "..." }], nextPageToken: "...", resultSizeEstimate: 123 }
            return await response.json();
        }
    }
};