import { Types } from "mongoose";
import { getNodeProfileForBackendProcessing, isValidNodeOperation } from "../nodes/node_helper";
import { DiscordConnection, GoogleConnection, NotionConnection } from "../models/user-model";
import { WorkflowPayload } from "../types/workflow-type";
import vm from 'vm';

/**
 * Core Execution Engine: Runs a single node's logic.
 * This can be called directly by an API test route, or by the Workflow Graph Runner.
 */
export const executeSingleNode = async (
    userId: string | Types.ObjectId,
    service: string,
    operation: string,
    selectedAccounts: string,
    inputs: Record<string, any>,
    extraContext: Record<string, any> = {} //  added this to hold the envelope & other data
): Promise<any> => {
    
    console.log(`\n--- [EXECUTOR] STARTING: ${service}/${operation} ---`);

    // 1. Validate Operation
    if (!isValidNodeOperation(service, operation)) {
        throw new Error(`Invalid node operation: ${service}/${operation}`);
    }

    // 2. Load Profile
    const node = getNodeProfileForBackendProcessing(service, operation);
    
    // 3. Prepare Environment Object
    // We start with the extraContext (which contains the full_envelope)
    // and add the userId so the node can use it if needed.
    let nodeEnvironment: any = { 
        ...extraContext, 
        userId: userId 
    }; 

    // 4. Refresh/Fetch Tokens if needed
    if (node.getToken) {
        console.log(`[EXECUTOR] Calling getToken for account: ${selectedAccounts}`);
        await node.getToken(userId, selectedAccounts);
    }

    // 5. Retrieve Access Tokens from Database
    let connectionDoc: any = null;
    if (service === 'gmail' || service.startsWith('google_')) {
        connectionDoc = await GoogleConnection.findOne({ userId: userId, email: selectedAccounts });
    } else if (service === 'notion') {
        connectionDoc = await NotionConnection.findOne({ userId: userId, workspace_id: selectedAccounts });
    } else if (service === 'discord') {
        connectionDoc = await DiscordConnection.findOne({ userId: userId, guild_id: selectedAccounts });
    } else if (service === 'gemini') {
        nodeEnvironment.access_token = process.env.GEMINI_API_KEY;
    } else if (service === 'core') {
        nodeEnvironment.access_token = 'none_required';
    }

    // Assign the access token to the environment object passed to node.execute
    if (connectionDoc) {
        nodeEnvironment.access_token = connectionDoc.access_token;
    }

    if (!nodeEnvironment.access_token) {
        throw new Error(`Account or API Key not found for service: ${service}`);
    }

    // 6. Execute Node
    // We pass the inputs AND the enriched nodeEnvironment (token + envelope + userId)
    console.log("[EXECUTOR] Environment ready. Executing node logic...");
    const result = await node.execute(inputs, nodeEnvironment);
    
    console.log(`--- [EXECUTOR] FINISHED: ${service}/${operation} ---\n`);
    
    return result; 
};


/**
 * Safely navigates a nested object using a dot-notation string.
 * Example: resolvePath("node_trigger.budget", envelope) returns the budget number.
 */
function resolvePath(path: string, obj: any): any {
    return path.split('.').reduce((prev, curr) => (prev && prev[curr] !== undefined) ? prev[curr] : undefined, obj);
}

/**
 * Replaces {{...}} tags in a string with data from the envelope.
 */
export function parseStringExpression(str: string, envelope: Record<string, any>): any {
    // SCENARIO 1: The string is EXACTLY one variable (e.g. "{{node_trigger.budget}}").
    const exactMatch = str.match(/^\{\{([\w.]+)\}\}$/);
    if (exactMatch) {
        return resolvePath(exactMatch[1], envelope);
    }

    // SCENARIO 2: Embedded variables (e.g. "VIP LEAD: ${{node_trigger.budget}}").
    return str.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
        const val = resolvePath(path, envelope);
        
        if (val === undefined || val === null) {
            return ""; // Return empty string if variable doesn't exist
        }
        
        // 🌟 THE FIX: If it's an object, stringify it nicely so the user can debug it!
        if (typeof val === 'object') {
            return JSON.stringify(val);
        }
        
        return String(val);
    });
}

/**
 * Recursively scans all inputs of a node and parses any expressions found.
 */
export function evaluateInputs(inputs: Record<string, any>, envelope: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(inputs)) {
        if (typeof value === 'string') {
            result[key] = parseStringExpression(value, envelope);
        } else if (Array.isArray(value)) {
            // Handles arrays (like the "rules" array in the Router node)
            result[key] = value.map(item => typeof item === 'object' ? evaluateInputs(item, envelope) : item);
        } else if (typeof value === 'object' && value !== null) {
            result[key] = evaluateInputs(value, envelope);
        } else {
            result[key] = value;
        }
    }
    return result;
}

/**
 * Evaluates router conditions (e.g., "1500 >= 1000") and returns the winning handle.
 */
export function evaluateRouter(rules: { handle: string, condition: string }[], fallbackHandle: string): string {
    for (const rule of rules) {
        try {
            // We use a scoped Function constructor to evaluate the math/logic safely.
            // Example: new Function('return 1500 >= 1000')() returns true.
            const isTrue = new Function(`return ${rule.condition}`)();
            if (isTrue) {
                return rule.handle; // Return the first rule that matches!
            }
        } catch (e) {
            console.warn(`[EXPRESSION ENGINE] Failed to evaluate condition: ${rule.condition}`);
        }
    }
    return fallbackHandle; // If nothing matched, go down the Else path
}


export function evaluateJavaScript(code: string, envelope: Record<string, any>): any {
    // 1. Define what the user is allowed to see (the Data Envelope)
    const sandbox = {
        $data: envelope, // Users access data via {{$data.node_1.text}}
        console: { log: (...args: any[]) => console.log('[USER-LOG]', ...args) }
    };

    // 2. Create the isolated context
    vm.createContext(sandbox);

    try {
        // 3. Run the code with a 1000ms timeout
        // We wrap the code in an IIFE or simply execute it
        const script = new vm.Script(code);
        return script.runInContext(sandbox, { timeout: 1000 });
    } catch (error: any) {
        throw new Error(`JS Sandbox Error: ${error.message}`);
    }
}


// export const runWorkflowGraph = async (userId: string | Types.ObjectId, payload: WorkflowPayload) => {
//     console.log(`\n========== STARTING WORKFLOW: ${payload.workflowId} ==========`);
    
//     // 1. The Universal Data Envelope (Stores state)
//     const envelope: Record<string, any> = {};
    
//     // 2. The Execution Queue
//     const queue: string[] = [payload.triggerNodeId];

//     while (queue.length > 0) {
//         const currentNodeId = queue.shift()!;
//         const node = payload.nodes[currentNodeId];

//         if (!node) {
//             console.warn(`[WARNING] Node ${currentNodeId} found in edges but not in nodes object.`);
//             continue;
//         }

//         console.log(`\n[->] Processing Node: ${node.id} (${node.service}:${node.operation})`);

//         // 3. Evaluate Expressions (Inject real data into inputs)
//         const parsedInputs = evaluateInputs(node.inputs, envelope);
//         let matchedHandle = "default"; // Standard nodes use default routing

//         try {
//             // 4. Execution & Routing Logic
//             if (node.service === "core" && node.operation === "router") {
//                 console.log(`[ROUTER] Evaluating Rules...`);
//                 matchedHandle = evaluateRouter(parsedInputs.rules, parsedInputs.fallbackHandle);
//                 console.log(`[ROUTER] Path chosen: ${matchedHandle}`);
                
//                 // Save router decision to envelope just in case
//                 envelope[currentNodeId] = { matchedHandle }; 
//             } else {
//                 // Run normal API nodes AND Logic nodes!
//                 const result = await executeSingleNode(
//                     userId,
//                     node.service,
//                     node.operation,
//                     node.selectedAccounts,
//                     parsedInputs,
//                     { full_envelope: envelope } // 🌟 THE FIX: Pass the envelope for Transformer nodes!
//                 );
//                 // Save output to envelope!
//                 envelope[currentNodeId] = result;
//             }

//             // 5. Find Next Steps (Graph Traversal)
//             const outgoingEdges = payload.edges.filter(e => e.source === currentNodeId);
            
//             for (const edge of outgoingEdges) {
//                 if (node.service === "core" && node.operation === "router") {
//                     // IF IT IS A ROUTER: Only follow the edge that matches the winning handle!
//                     if (edge.sourceHandle === matchedHandle) {
//                         queue.push(edge.target);
//                     }
//                 } else {
//                     // IF NORMAL NODE: Follow all outgoing edges
//                     queue.push(edge.target);
//                 }
//             }

//         } catch (error: any) {
//             console.error(`[ERROR] Node ${node.id} failed:`, error.message);
//             // In a production app, you might want to halt the workflow or trigger a retry here.
//             throw error; 
//         }
//     }

//     console.log(`\n========== WORKFLOW FINISHED: ${payload.workflowId} ==========`);
//     return envelope; // Return the final state of all nodes
// };


export const runWorkflowGraph = async (userId: string | Types.ObjectId, payload: WorkflowPayload) => {
    console.log(`\n========== STARTING WORKFLOW: ${payload.workflowId || 'test_run'} ==========`);
    
    // 1. The Universal Data Envelope (Stores state)
    const envelope: Record<string, any> = {};
    
    // 2. AUTO-DETECT STARTING NODES
    // A starting node is any node that is NEVER listed as a "target" in the edges array.
    const allNodeIds = Object.keys(payload.nodes);
    const targetNodeIds = new Set(payload.edges.map(e => e.target));
    const startingNodes = allNodeIds.filter(id => !targetNodeIds.has(id));

    if (startingNodes.length === 0) {
        throw new Error("No starting nodes found! Is your workflow an infinite loop?");
    }

    console.log(`[ENGINE] Auto-detected starting nodes:`, startingNodes);

    // 3. The Execution Queue & Protection Set
    const queue: string[] = [...startingNodes];
    
    // 🌟 THE FIX FOR 3-to-1 CONVERGENCE:
    // This Set keeps track of nodes that have already been queued so we don't execute 
    // the target node 3 separate times when A, B, and C all connect to D.
    const enqueued = new Set<string>(startingNodes);

    while (queue.length > 0) {
        const currentNodeId = queue.shift()!;
        const node = payload.nodes[currentNodeId];

        if (!node) {
            console.warn(`[WARNING] Node ${currentNodeId} found in edges but not in nodes object.`);
            continue;
        }

        console.log(`\n[->] Processing Node: ${node.id} (${node.service}:${node.operation})`);

        // 4. Evaluate Expressions (Inject real data into inputs)
        const parsedInputs = evaluateInputs(node.inputs, envelope);
        let matchedHandle = "default"; 

        try {
            // 5. Execution Logic
            if (node.service === "core" && node.operation === "router") {
                console.log(`[ROUTER] Evaluating Rules...`);
                matchedHandle = evaluateRouter(parsedInputs.rules, parsedInputs.fallbackHandle);
                envelope[currentNodeId] = { matchedHandle }; 
            } else {
                const result = await executeSingleNode(
                    userId,
                    node.service,
                    node.operation,
                    node.selectedAccounts,
                    parsedInputs,
                    { full_envelope: envelope }
                );
                envelope[currentNodeId] = result;
            }

            // 6. Find Next Steps (Graph Traversal)
            const outgoingEdges = payload.edges.filter(e => e.source === currentNodeId);
            
            for (const edge of outgoingEdges) {
                let shouldFollowEdge = false;

                if (node.service === "core" && node.operation === "router") {
                    if (edge.sourceHandle === matchedHandle) shouldFollowEdge = true;
                } else {
                    shouldFollowEdge = true;
                }

                // If the edge is valid, AND the target node hasn't been queued yet, add it!
                if (shouldFollowEdge && !enqueued.has(edge.target)) {
                    queue.push(edge.target);
                    enqueued.add(edge.target); // Mark as queued so it doesn't run twice
                }
            }

        } catch (error: any) {
            console.error(`[ERROR] Node ${node.id} failed:`, error.message);
            throw error; 
        }
    }

    console.log(`\n========== WORKFLOW FINISHED ==========`);
    return envelope; 
};