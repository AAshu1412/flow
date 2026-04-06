// nodes/core.ts
import { NodeDefinition } from "../types/node-type";
import { evaluateJavaScript, executeSingleNode } from "../utils/workflow-helper";
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
    },
    "core_transform_v1": {
    service: "core",
    operation: "transform",
    ui: {
        type: "custom/logicNode",
        label: "Data Transformer",
        description: "Manipulate data using JavaScript or AI instructions.",
        icon: "https://img.icons8.com/fluency/48/variable.png"
    },
        inputs: [
            {
                key: "mode", label: "Mode", type: "select", options: [
                    { label: "JavaScript (Fast/Exact)", value: "js" },
                    { label: "AI (Natural Language)", value: "ai" }
                ], defaultValue: "js", mandatory: true
            },
            { key: "instruction", label: "Instruction / Code", type: "string", mandatory: true }
        ],
   execute: async function (evaluatedInputs, environment) {
        const { mode, instruction } = evaluatedInputs;
        
        // 1. Pull the master data and the User ID from the environment
        const envelope = environment.full_envelope; 
        const userId = environment.userId; // Passed from the Graph Executor

        if (mode === "js") {
            // JS doesn't need to call other nodes, it just runs locally in the VM
            return evaluateJavaScript(instruction, envelope);
        } else {
            // AI MODE: We need to call the Gemini node
            if (!userId){
                throw new Error("User ID is required for AI mode");
            }
            const prompt = `
                You are a data transformation engine. 
                CONTEXTUAL DATA (JSON): ${JSON.stringify(envelope)}
                USER INSTRUCTION: ${instruction}
                
                Return ONLY the result of the instruction. Do not explain.
            `;

            // 2. Pass the real userId so executeSingleNode can find the Gemini API Key
            const aiResult = await executeSingleNode(
                userId, 
                "gemini", 
                "generate_text", 
                "", // Gemini usually doesn't need a selectedAccount (it uses process.env)
                { 
                    model: "gemini-2.5-flash", 
                    prompt 
                }
            );
            
            return aiResult.text;
        }
    }
}
};