import { Types } from "mongoose";
import { getNodeProfileForBackendProcessing, isValidNodeOperation } from "../nodes/node_helper";
import { DiscordConnection, GoogleConnection, NotionConnection } from "../models/user-model";

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