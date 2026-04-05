// nodes/googleMeet.ts

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
async function handleMeetApiError(response: Response): Promise<Response> {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Meet API Error: ${errorData.error?.message || 'Unknown Error'}`);
    }
    return response;
}

// --- The Exported Node Operations ---
export const googleMeetNodes: Record<string, NodeDefinition> = {
    
    // Operation 1: Create Meeting Space
    "google_meet_create_space_v1": {
        service: "google_meet",
        operation: "create_space",
        ui: {
            type: "custom/apiNode",
            label: "Google Meet - Create Space",
            description: "Creates a new meeting space and generates a joinable Meet URL.",
            icon: "https://img.icons8.com/?size=100&id=pE97I4t7Il9M&format=png&color=000000",
        },
        inputs: [], // The API allows creating an empty space without inputs
        execute: async function (evaluatedInputs, environment) {
            const accessToken = environment.googleMeetAccessToken;

            const response = await fetch('https://meet.googleapis.com/v2/spaces', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            await handleMeetApiError(response);
            
            // Returns the Space object containing `meetingUri` (the join link) 
            // and `name` (e.g., "spaces/abc-defg-hij")
            return await response.json(); 
        }
    },

    // Operation 2: Get Space Details (Helper to find the active Conference Record)
    "google_meet_get_space_v1": {
        service: "google_meet",
        operation: "get_space",
        ui: {
            type: "custom/apiNode",
            label: "Google Meet - Get Space Details",
            description: "Gets space details, including the active Conference Record ID if a meeting is live.",
            icon: "https://img.icons8.com/?size=100&id=pE97I4t7Il9M&format=png&color=000000",
        },
        inputs: [
            { 
                key: "spaceId", 
                label: "Space ID or Meeting Code", 
                type: "string", 
                mandatory: true, 
                description: "E.g., 'abc-defg-hij' or 'spaces/abc-defg-hij'" 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { spaceId } = evaluatedInputs;
            const accessToken = environment.googleMeetAccessToken;

            // The API expects the format to be prefixed with 'spaces/'
            const formattedSpaceName = spaceId.startsWith('spaces/') ? spaceId : `spaces/${spaceId}`;

            const response = await fetch(`https://meet.googleapis.com/v2/${formattedSpaceName}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            await handleMeetApiError(response);
            
            // Returns Space object. Look for the `activeConference.conferenceRecord` field.
            return await response.json();
        }
    },

    // Operation 3: List Recordings
    "google_meet_list_recordings_v1": {
        service: "google_meet",
        operation: "list_recordings",
        ui: {
            type: "custom/apiNode",
            label: "Google Meet - List Recordings",
            description: "Gets the Drive locations of video recordings for a specific conference.",
            icon: "https://img.icons8.com/?size=100&id=pE97I4t7Il9M&format=png&color=000000",
        },
        inputs: [
            { 
                key: "conferenceRecordId", 
                label: "Conference Record ID", 
                type: "string", 
                mandatory: true, 
                description: "The unique ID of the conference session (e.g., 'conferenceRecords/12345')." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { conferenceRecordId } = evaluatedInputs;
            const accessToken = environment.googleMeetAccessToken;

            const formattedRecord = conferenceRecordId.startsWith('conferenceRecords/') 
                ? conferenceRecordId 
                : `conferenceRecords/${conferenceRecordId}`;

            const response = await fetch(`https://meet.googleapis.com/v2/${formattedRecord}/recordings`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            await handleMeetApiError(response);
            
            // Returns { recordings: [ { name: "...", driveDestination: { exportUri: "..." } } ] }
            return await response.json();
        }
    },

    // Operation 4: List Transcripts
    "google_meet_list_transcripts_v1": {
        service: "google_meet",
        operation: "list_transcripts",
        ui: {
            type: "custom/apiNode",
            label: "Google Meet - List Transcripts",
            description: "Gets the Google Docs locations of transcripts for a specific conference.",
            icon: "https://img.icons8.com/?size=100&id=pE97I4t7Il9M&format=png&color=000000",
        },
        inputs: [
            { 
                key: "conferenceRecordId", 
                label: "Conference Record ID", 
                type: "string", 
                mandatory: true, 
                description: "The unique ID of the conference session (e.g., 'conferenceRecords/12345')." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { conferenceRecordId } = evaluatedInputs;
            const accessToken = environment.googleMeetAccessToken;

            const formattedRecord = conferenceRecordId.startsWith('conferenceRecords/') 
                ? conferenceRecordId 
                : `conferenceRecords/${conferenceRecordId}`;

            const response = await fetch(`https://meet.googleapis.com/v2/${formattedRecord}/transcripts`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            await handleMeetApiError(response);
            
            // Returns { transcripts: [ { name: "...", docsDestination: { document: "...", exportUri: "..." } } ] }
            return await response.json();
        }
    },

    // Operation 5: List Transcript Entries (Get Spoken Text)
    "google_meet_list_transcript_entries_v1": {
        service: "google_meet",
        operation: "list_transcript_entries",
        ui: {
            type: "custom/apiNode",
            label: "Google Meet - Get Spoken Transcript",
            description: "Retrieves the actual line-by-line spoken text of a conference transcript.",
            icon: "https://img.icons8.com/?size=100&id=pE97I4t7Il9M&format=png&color=000000",
        },
        inputs: [
            { 
                key: "transcriptName", 
                label: "Transcript ID", 
                type: "string", 
                mandatory: true, 
                description: "The full resource name of the transcript (e.g., 'conferenceRecords/123/transcripts/456')." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { transcriptName } = evaluatedInputs;
            const accessToken = environment.googleMeetAccessToken;

            // Note: The input must be the full 'name' returned from the List Transcripts node
            const response = await fetch(`https://meet.googleapis.com/v2/${transcriptName}/entries?pageSize=100`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            await handleMeetApiError(response);
            
            // Returns { transcriptEntries: [ { participant: "...", text: "Hello everyone", languageCode: "en-US" } ] }
            return await response.json();
        }
    }
};