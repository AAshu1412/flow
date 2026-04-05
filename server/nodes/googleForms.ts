// nodes/googleForms.ts
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
async function handleFormsApiError(response: Response): Promise<Response> {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Forms API Error: ${errorData.error?.message || 'Unknown Error'}`);
    }
    return response;
}

// --- The Exported Node Operations ---
export const googleFormsNodes: Record<string, NodeDefinition> = {
    
    // Operation 1: Get Form Responses (The Polling Action)
    "google_forms_list_responses_v1": {
        service: "google_forms",
        operation: "list_responses",
        ui: {
            type: "custom/apiNode",
            label: "Google Forms - Get Responses",
            description: "Retrieves the submitted responses for a specific form.",
            icon: "https://img.icons8.com/?size=100&id=E4VmOrv6BZqd&format=png&color=000000",
        },
        inputs: [
            { 
                key: "formId", 
                label: "Form ID", 
                type: "string", 
                mandatory: true, 
                description: "The unique ID of the Google Form. (Drive (fileType: 'form'))" 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { formId } = evaluatedInputs;
            const accessToken = environment.googleFormsAccessToken;

            // This endpoint gets all responses. In a production "Trigger" node, 
            // your engine would poll this and keep track of the most recent response ID 
            // in a database so it only processes new ones.
            const url = `https://forms.googleapis.com/v1/forms/${formId}/responses`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            await handleFormsApiError(response);
            
            // Returns an object containing a 'responses' array
            return await response.json(); 
        }
    },

    // Operation 2: Get Form Details (Crucial Helper for mapping Question IDs)
    "google_forms_get_form_v1": {
        service: "google_forms",
        operation: "get_form_details",
        ui: {
            type: "custom/apiNode",
            label: "Google Forms - Get Form Details",
            description: "Retrieves the structure and questions of a form.",
            icon: "https://img.icons8.com/?size=100&id=E4VmOrv6BZqd&format=png&color=000000",
        },
        inputs: [
            { 
                key: "formId", 
                label: "Form ID", 
                type: "string", 
                mandatory: true, 
                description: "The unique ID of the Google Form." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { formId } = evaluatedInputs;
            const accessToken = environment.googleFormsAccessToken;

            const url = `https://forms.googleapis.com/v1/forms/${formId}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            await handleFormsApiError(response);
            
            // Returns the form metadata, including the "items" array which contains 
            // the human-readable text for every question ID.
            return await response.json();
        }
    },

    // Operation 3: Create Form
    "google_forms_create_v1": {
        service: "google_forms",
        operation: "create_form",
        ui: {
            type: "custom/apiNode",
            label: "Google Forms - Create Form",
            description: "Creates a new, blank Google Form.",
            icon: "https://img.icons8.com/?size=100&id=E4VmOrv6BZqd&format=png&color=000000",
        },
        inputs: [
            { 
                key: "title", 
                label: "Form Title", 
                type: "string", 
                mandatory: true, 
                description: "The main title displayed on the form itself." 
            },
            { 
                key: "documentTitle", 
                label: "Document File Name", 
                type: "string", 
                mandatory: false, 
                description: "The name of the file in Google Drive (Defaults to the Form Title if left blank)." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { title, documentTitle } = evaluatedInputs;
            const accessToken = environment.googleFormsAccessToken;

            // Construct the payload. The API expects an 'info' object containing the title.
            const requestBody: any = {
                info: {
                    title: title
                }
            };

            // If the user provided a specific drive file name, include it.
            if (documentTitle) {
                requestBody.info.documentTitle = documentTitle;
            }

            const response = await fetch('https://forms.googleapis.com/v1/forms', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            await handleFormsApiError(response);
            
            // Returns the new Form object, which includes the crucial new `formId`
            // Example response: { "formId": "1a2b3c...", "info": { "title": "My Form" } }
            return await response.json(); 
        }
    },
    // Operation 4: Add Question to Form (Uses batchUpdate under the hood)
    "google_forms_add_question_v1": {
        service: "google_forms",
        operation: "add_question",
        ui: {
            type: "custom/apiNode",
            label: "Google Forms - Add Question",
            description: "Adds a new question (Text or Multiple Choice) to an existing form.",
            icon: "https://img.icons8.com/?size=100&id=E4VmOrv6BZqd&format=png&color=000000",
        },
        inputs: [
            { 
                key: "formId", 
                label: "Form ID", 
                type: "string", 
                mandatory: true, 
                description: "The unique ID of the form to update." 
            },
            { 
                key: "questionText", 
                label: "Question Title", 
                type: "string", 
                mandatory: true, 
                description: "The text of the question (e.g., 'What is your favorite color?')." 
            },
            { 
                key: "questionType", 
                label: "Question Type", 
                type: "string", 
                mandatory: true, 
                description: "Type 'TEXT' for a short answer, or 'RADIO' for multiple choice." 
            },
            { 
                key: "choices", 
                label: "Multiple Choice Options", 
                type: "string", 
                mandatory: false, 
                description: "If using RADIO, provide comma-separated options (e.g., 'Red, Blue, Green')." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { formId, questionText, questionType, choices } = evaluatedInputs;
            const accessToken = environment.googleFormsAccessToken;

            // 1. Initialize the base 'createItem' request structure
            let itemDef: any = {
                title: questionText,
                questionItem: {
                    question: {
                        required: true // Making questions required by default is usually preferred
                    }
                }
            };

            // 2. Build the specific question structure based on user input
            if (questionType.toUpperCase() === 'TEXT') {
                itemDef.questionItem.question.textQuestion = { paragraph: false };
            } 
            else if (questionType.toUpperCase() === 'RADIO') {
                if (!choices) throw new Error("Google Forms Error: 'choices' input is required for RADIO questions.");
                
                // Convert the comma-separated string into the array of objects Google expects
                const optionsArray = choices.split(',').map((choice: string) => ({ value: choice.trim() }));
                
                itemDef.questionItem.question.choiceQuestion = {
                    type: "RADIO",
                    options: optionsArray
                };
            } else {
                throw new Error(`Google Forms Error: Unsupported questionType '${questionType}'. Use TEXT or RADIO.`);
            }

            // 3. Wrap it in the batchUpdate request envelope
            // We use location index: 0 so it always adds the newest question to the top of the form,
            // or you could omit 'location' to append to the bottom.
            const batchUpdateRequest = {
                requests: [
                    {
                        createItem: {
                            item: itemDef,
                            location: { index: 0 } 
                        }
                    }
                ]
            };

            // 4. Send the massive payload to the batchUpdate endpoint
            const response = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(batchUpdateRequest)
            });

            await handleFormsApiError(response);
            
            // Returns the response mapping, containing the new itemId and questionId
            return await response.json(); 
        }
    }
};