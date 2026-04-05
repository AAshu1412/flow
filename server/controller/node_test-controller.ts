import { Request, Response } from "express";
import { getNodeProfileForBackendProcessing, isValidNodeOperation } from "../nodes/node_helper";
import { DiscordConnection, GoogleConnection, NotionConnection } from "../models/user-model";

const node_test = async (req: Request, res: Response) => {
    console.log("\n--- [DEBUG] STARTING node_test ---");

    try {
        const userId = req.db_doc_id;
        const { service, operation, selectedAccounts, inputs } = req.body;

        console.log("[DEBUG] Request Payload:", { userId, service, operation, selectedAccounts, inputs });

        if (!isValidNodeOperation(service, operation)) {
            console.warn(`[DEBUG] Validation failed: Invalid operation (${service}/${operation})`);
            return res.status(400).json({ message: "Invalid node operation" });
        }

        const node = getNodeProfileForBackendProcessing(service, operation);
        console.log(`[DEBUG] Loaded backend profile for: ${node.templateId}`);

        // Initialize as an empty object so it's never undefined
        let environment: any = {}; 

        if (node.getToken) {
            console.log(`[DEBUG] Calling getToken for account: ${selectedAccounts}`);
            await node.getToken(userId, selectedAccounts);
        }

        console.log(`[DEBUG] Fetching environment for service: ${service}`);
        
        // 1. OAUTH SERVICES (Requires DB Lookup)
        if (service === 'gmail' || service.startsWith('google_')) {
            environment = await GoogleConnection.findOne({ userId: userId, email: selectedAccounts });
        } else if (service === 'notion') {
            environment = await NotionConnection.findOne({ userId: userId, workspace_id: selectedAccounts });
        } else if (service === 'discord') {
            environment = await DiscordConnection.findOne({ userId: userId, guild_id: selectedAccounts });
        } 
        // 2. SYSTEM/API KEY SERVICES (No DB lookup needed!)
        else if (service === 'gemini') {
            // Feed the system API key directly into the environment
            environment = { access_token: process.env.GEMINI_API_KEY };
        } else if (service === 'core') {
            // Core nodes like "manual_input" don't need tokens at all
            environment = { access_token: 'none_required' };
        }

        // 3. Validation Check
        if (!environment || !environment.access_token) {
            console.error(`[DEBUG] Missing access token for service: ${service}`);
            return res.status(404).json({ message: `Account or API Key not found for service: ${service}` });
        }

        console.log("[DEBUG] Environment ready. Executing node logic...");
        
        const result = await node.execute(inputs, { access_token: environment.access_token });
        
        console.log("[DEBUG] Node executed successfully. Result:", result);
        console.log("--- [DEBUG] FINISHED node_test ---\n");

        return res.status(200).json({ result: result });

    } catch (error: any) {
        console.error("\n[ERROR] Exception caught in node_test:");
        console.error(error.message || error);
        console.error(error.stack);
        
        return res.status(500).json({ 
            message: "Internal server error", 
            details: error.message 
        });
    }
}

export default { node_test };