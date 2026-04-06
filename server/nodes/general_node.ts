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

export const coreNodes: Record<string, NodeDefinition> = {

    // Operation 1: Manual Input (Trigger)
    "core_manual_input_v1": {
        service: "core",
        operation: "manual_input",
        ui: {
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


            if (rawData) {
                try {
                    parsedData = JSON.parse(rawData);
                } catch (e) {

                }
            }

            return {
                timestamp: new Date().toISOString(),
                data: parsedData
            };
        }
    },
    // Operation 2: Transform
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

            const envelope = environment.full_envelope;
            const userId = environment.userId;

            if (mode === "js") {
                return evaluateJavaScript(instruction, envelope);
            } else {
                if (!userId) {
                    throw new Error("User ID is required for AI mode");
                }
                const prompt = `
                You are a data transformation engine. 
                CONTEXTUAL DATA (JSON): ${JSON.stringify(envelope)}
                USER INSTRUCTION: ${instruction}
                
                Return ONLY the result of the instruction. Do not explain.
            `;

                const aiResult = await executeSingleNode(
                    userId,
                    "gemini",
                    "generate_text",
                    "",
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