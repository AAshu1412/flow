import { Types } from "mongoose";
import { GoogleConnection, NotionConnection, DiscordConnection } from "../models/user-model";
import { FrontendNodeProfile, AvailableAccount, BackendNodeProfile, ServiceName, AnyOperation } from "../types/node-type";
import { getValidGoogleAccessToken, getValidNotionToken, getValidDiscordToken } from "../utils/oauth-token-refresh";
import { allNodesRegistry } from "./registry";
import { SERVICE_OPERATIONS } from "../constants";

export async function getNodeProfileForFrontend(service: string, operation: string, userId: string | Types.ObjectId): Promise<FrontendNodeProfile> {
    const targetNodeKey = Object.keys(allNodesRegistry).find(
        key => allNodesRegistry[key].service === service && allNodesRegistry[key].operation === operation
    );

    if (!targetNodeKey) {
        throw new Error(`Node not found for service: ${service}, operation: ${operation}`);
    }

    const nodeDef = allNodesRegistry[targetNodeKey];

    let availableAccounts: AvailableAccount[] = [];

    try {
        if (service === 'gmail' || service.startsWith('google_')) {
            const connections = await GoogleConnection.find({ userId });
            availableAccounts = connections.map(conn => ({
                connectionId: conn._id.toString(),
                label: conn.email, // UI will display "ashu@gmail.com"
                identifier: conn.email // Your backend Google token fetcher requires the email
            }));

        } else if (service === 'notion') {
            const connections = await NotionConnection.find({ userId });
            availableAccounts = connections.map(conn => ({
                connectionId: conn._id.toString(),
                label: conn.workspace_name || 'Unnamed Workspace', // UI will display "Ashutosh's Notion"
                identifier: conn.workspace_id // Your backend Notion token fetcher requires workspace_id
            }));

        } else if (service === 'discord') {
            const connections = await DiscordConnection.find({ userId });
            availableAccounts = connections.map(conn => ({
                connectionId: conn._id.toString(),
                label: conn.guild_name, // UI will display "superdiscord_user_idcoder"
                identifier: conn.guild_id // Your backend Discord token fetcher requires guild_id
            }));

        }
    } catch (error) {
        console.error(`Failed to fetch accounts for service ${service}:`, error);
    }

    return {
        templateId: targetNodeKey,
        service: nodeDef.service,
        operation: nodeDef.operation,
        ui: nodeDef.ui,
        inputs: nodeDef.inputs,
        availableAccounts // <-- NEW: Send the fetched accounts to the frontend!
    };
}

export function getNodeProfileForBackendProcessing(service: string, operation: string): BackendNodeProfile {
    const targetNodeKey = Object.keys(allNodesRegistry).find(
        key => allNodesRegistry[key].service === service && allNodesRegistry[key].operation === operation
    );

    if (!targetNodeKey) {
        throw new Error(`Node not found for service: ${service}, operation: ${operation}`);
    }

    const nodeDef = allNodesRegistry[targetNodeKey];

    let tokenFetcher: ((userId: string | Types.ObjectId, connectionEmail: string) => Promise<string | null>) | undefined = undefined;

    if (service === 'gmail' || service.startsWith('google_')) {
        // Covers gmail, google_docs, google_sheets, google_drive, etc.
        tokenFetcher = getValidGoogleAccessToken;
    } else if (service === 'notion') {
        tokenFetcher = getValidNotionToken;
    } else if (service === 'discord') {
        tokenFetcher = getValidDiscordToken;
    }

    return {
        templateId: targetNodeKey,
        service: nodeDef.service as ServiceName,
        operation: nodeDef.operation as AnyOperation,
        ui: nodeDef.ui,
        inputs: nodeDef.inputs,
        execute: nodeDef.execute,
        getToken: tokenFetcher
    };
}


export function getAvailableServices(): ServiceName[] {
    return Object.keys(SERVICE_OPERATIONS) as ServiceName[];
}

export function getOperationsForService<T extends ServiceName>(service: T): readonly string[] {
    return SERVICE_OPERATIONS[service];
}

export function isValidNodeOperation(service: string, operation: string): boolean {
    if (!SERVICE_OPERATIONS.hasOwnProperty(service)) {
        return false;
    }
    const validOperations = SERVICE_OPERATIONS[service as ServiceName] as readonly string[];
    return validOperations.includes(operation);
}


