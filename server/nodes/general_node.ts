// nodes/core.ts
import { NodeDefinition } from "../types/node-type";
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

// --- The Exported Core Nodes ---
export const coreNodes: Record<string, NodeDefinition> = {
    
    // Operation 1: Manual Input (Trigger)
    "core_manual_input_v1": {
        service: "core",
        operation: "manual_input",
        ui: {
            // You might want your frontend to render triggers differently (e.g., starting nodes)
            type: "custom/triggerNode", 
            label: "Manual Input",
            description: "Start the workflow and provide initial starting data.",
            icon: "https://img.icons8.com/?size=100&id=45557&format=png&color=000000",
        },
        inputs: [
            { 
                key: "rawData", 
                label: "Input Data (Text or JSON)", 
                type: "string", 
                mandatory: false, 
                description: "Type plain text, or paste a JSON object to pass structured variables into the workflow." 
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { rawData } = evaluatedInputs;

            let parsedData = rawData;

            // 1. Intelligent Parsing Layer
            // If the user pastes JSON (e.g., {"clientEmail": "test@test.com", "name": "John"}), 
            // we parse it into a real JavaScript object. 
            // This allows the next node to use your expression engine like this: {{node1.data.clientEmail}}
            if (rawData) {
                try {
                    parsedData = JSON.parse(rawData);
                } catch (e) {
                    // If it fails to parse, it means the user just typed normal text. 
                    // We catch the error silently and leave parsedData as a simple string.
                }
            }

            // 2. Return the data to the engine
            return {
                timestamp: new Date().toISOString(),
                data: parsedData
            };
        }
    }
};