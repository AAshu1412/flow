import { Types } from "mongoose";
import { getNodeProfileForBackendProcessing, isValidNodeOperation } from "../nodes/node_helper";
import { DiscordConnection, GoogleConnection, NotionConnection } from "../models/user-model";
import { WorkflowPayload } from "../types/workflow-type";

/**
 * Core Execution Engine: Runs a single node's logic.
 * This can be called directly by an API test route, or by the Workflow Graph Runner.
 */
export const executeSingleNode = async (
    userId: string | Types.ObjectId,
    service: string,
    operation: string,
    selectedAccounts: string,
    inputs: Record<string, any>
): Promise<any> => {
    
    console.log(`\n--- [EXECUTOR] STARTING: ${service}/${operation} ---`);

    // 1. Validate Operation
    if (!isValidNodeOperation(service, operation)) {
        throw new Error(`Invalid node operation: ${service}/${operation}`);
    }

    // 2. Load Profile
    const node = getNodeProfileForBackendProcessing(service, operation);
    console.log(`[EXECUTOR] Loaded backend profile for: ${node.templateId}`);

    let environment: any = {}; 

    // 3. Refresh/Fetch Tokens if needed
    if (node.getToken) {
        console.log(`[EXECUTOR] Calling getToken for account: ${selectedAccounts}`);
        await node.getToken(userId, selectedAccounts);
    }

    console.log(`[EXECUTOR] Fetching environment for service: ${service}`);
    
    // 4. Retrieve Environment/Credentials from Database
    if (service === 'gmail' || service.startsWith('google_')) {
        environment = await GoogleConnection.findOne({ userId: userId, email: selectedAccounts });
    } else if (service === 'notion') {
        environment = await NotionConnection.findOne({ userId: userId, workspace_id: selectedAccounts });
    } else if (service === 'discord') {
        environment = await DiscordConnection.findOne({ userId: userId, guild_id: selectedAccounts });
    } else if (service === 'gemini') {
        environment = { access_token: process.env.GEMINI_API_KEY };
    } else if (service === 'core') {
        environment = { access_token: 'none_required' };
    }

    if (!environment || !environment.access_token) {
        throw new Error(`Account or API Key not found for service: ${service}`);
    }

    // 5. Execute Node
    console.log("[EXECUTOR] Environment ready. Executing node logic...");
    const result = await node.execute(inputs, { access_token: environment.access_token });
    
    console.log(`--- [EXECUTOR] FINISHED: ${service}/${operation} ---\n`);
    
    // Return the raw data so the Graph Runner can inject it into the Universal Data Envelope
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



export const runWorkflowGraph = async (userId: string | Types.ObjectId, payload: WorkflowPayload) => {
    console.log(`\n========== STARTING WORKFLOW: ${payload.workflowId} ==========`);
    
    // 1. The Universal Data Envelope (Stores state)
    const envelope: Record<string, any> = {};
    
    // 2. The Execution Queue
    const queue: string[] = [payload.triggerNodeId];

    while (queue.length > 0) {
        const currentNodeId = queue.shift()!;
        const node = payload.nodes[currentNodeId];

        if (!node) {
            console.warn(`[WARNING] Node ${currentNodeId} found in edges but not in nodes object.`);
            continue;
        }

        console.log(`\n[->] Processing Node: ${node.id} (${node.service}:${node.operation})`);

        // 3. Evaluate Expressions (Inject real data into inputs)
        const parsedInputs = evaluateInputs(node.inputs, envelope);
        let matchedHandle = "default"; // Standard nodes use default routing

        try {
            // 4. Execution & Routing Logic
            if (node.service === "core" && node.operation === "router") {
                console.log(`[ROUTER] Evaluating Rules...`);
                matchedHandle = evaluateRouter(parsedInputs.rules, parsedInputs.fallbackHandle);
                console.log(`[ROUTER] Path chosen: ${matchedHandle}`);
                
                // Save router decision to envelope just in case
                envelope[currentNodeId] = { matchedHandle }; 
            } else {
                // Run normal API nodes!
                const result = await executeSingleNode(
                    userId,
                    node.service,
                    node.operation,
                    node.selectedAccounts,
                    parsedInputs
                );
                // Save output to envelope!
                envelope[currentNodeId] = result;
            }

            // 5. Find Next Steps (Graph Traversal)
            const outgoingEdges = payload.edges.filter(e => e.source === currentNodeId);
            
            for (const edge of outgoingEdges) {
                if (node.service === "core" && node.operation === "router") {
                    // IF IT IS A ROUTER: Only follow the edge that matches the winning handle!
                    if (edge.sourceHandle === matchedHandle) {
                        queue.push(edge.target);
                    }
                } else {
                    // IF NORMAL NODE: Follow all outgoing edges
                    queue.push(edge.target);
                }
            }

        } catch (error: any) {
            console.error(`[ERROR] Node ${node.id} failed:`, error.message);
            // In a production app, you might want to halt the workflow or trigger a retry here.
            throw error; 
        }
    }

    console.log(`\n========== WORKFLOW FINISHED: ${payload.workflowId} ==========`);
    return envelope; // Return the final state of all nodes
};