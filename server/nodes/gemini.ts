// nodes/gemini.ts
import { NodeDefinition } from "../types/node-type";
// export interface NodeDefinition {
//     service: string;
//     operation: string;
//     ui: any;
//     inputs: any[];
//     execute: (evaluatedInputs: Record<string, any>, environment: Record<string, any>) => Promise<any>;
// }

export const geminiNodes: Record<string, NodeDefinition> = {
    "gemini_generate_text_v1": {
        service: "gemini",
        operation: "generate_text",
        ui: {
            type: "custom/apiNode",
            label: "Gemini - Generate Text",
            description: "Sends a prompt to the Gemini API to generate a text response.",
            icon: "https://img.icons8.com/?size=100&id=eoxMN35Z6JKg&format=png&color=000000",
        },
        inputs: [
            { 
                key: "model", 
                label: "AI Model", 
                // Changed from 'string' to 'select' for the frontend dropdown
                type: "select", 
                mandatory: true, 
                description: "Select the Gemini model to use.",
                // Provide the exact API strings as values for the dropdown
                options: [
                    { label: "Gemini 1.5 Flash (Fast & Cheap)", value: "gemini-1.5-flash" },
                    { label: "Gemini 1.5 Pro (Advanced Reasoning)", value: "gemini-1.5-pro" },
                    { label: "Gemini 2.0 Flash (Next Gen Fast)", value: "gemini-2.0-flash" }
                ],
                defaultValue: "gemini-1.5-flash" // Safe default
            },
            { 
                key: "prompt", 
                label: "Prompt", 
                type: "string", 
                mandatory: true, 
                description: "The instructions or text you want Gemini to respond to." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            // The frontend passes the 'value' from the dropdown (e.g., "gemini-1.5-flash")
            const { model, prompt } = evaluatedInputs;
            const apiKey = environment.apiKey || null;

            const requestBody = {
                contents: [
                    {
                        parts: [{ text: prompt }]
                    }
                ]
            };

            // The selected model is injected into the URL dynamically
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Gemini API Error: ${errorData.error?.message || 'Unknown Error'}`);
            }
            
            const data = await response.json();
            
            return {
                rawResponse: data,
                text: data.candidates[0].content.parts[0].text
            };
        }
    }
};