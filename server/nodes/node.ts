import { gmailNodes } from "./gmail_node";
import { discordNodes } from "./discord";
import { notionNodes } from "./notion";
import {googleSheetsNodes} from "./googleSheets";
import {googleDocsNodes} from "./googleDocs";
import {googleDriveNodes} from "./googleDrive";
import {googleFormsNodes} from "./googleForms";
import {googleMeetNodes} from "./googleMeet";
import {geminiNodes} from "./gemini";
import {coreNodes} from "./general_node";
import { AnyOperation, BackendNodeProfile, ServiceName } from "../types/node-type";
import {SERVICE_OPERATIONS, GOOGLE_SERVICES} from "../constants";
import { getValidGoogleAccessToken, getValidNotionToken, getValidDiscordToken } from "../utils/oauth-token-refresh";


const allNodesRegistry = {
    ...gmailNodes,
    ...discordNodes,
    ...notionNodes,
    ...googleSheetsNodes,
    ...googleDocsNodes,
    ...googleDriveNodes,
    ...googleFormsNodes,
    ...googleMeetNodes,
    ...geminiNodes,
    ...coreNodes,
};


export function getNodeProfileForFrontend(service: string, operation: string) {
    // 1. Find the node in your registry that matches the service and operation
    const targetNodeKey = Object.keys(allNodesRegistry).find(
        key => allNodesRegistry[key].service === service && allNodesRegistry[key].operation === operation
    );

    if (!targetNodeKey) {
        throw new Error(`Node not found for service: ${service}, operation: ${operation}`);
    }

    const nodeDef = allNodesRegistry[targetNodeKey];

    // 2. Return ONLY the safe data to the frontend (exclude the execute function)
    return {
        templateId: targetNodeKey, // e.g., "gmail_send_message_v1"
        service: nodeDef.service,
        operation: nodeDef.operation,
        ui: nodeDef.ui,
        inputs: nodeDef.inputs 
    };
}

export function getNodeProfileForBackendProcessing(service: string, operation: string): BackendNodeProfile {
    // 1. Find the node in your registry that matches the service and operation
    const targetNodeKey = Object.keys(allNodesRegistry).find(
        key => allNodesRegistry[key].service === service && allNodesRegistry[key].operation === operation
    );

    if (!targetNodeKey) {
        throw new Error(`Node not found for service: ${service}, operation: ${operation}`);
    }

    const nodeDef = allNodesRegistry[targetNodeKey];

    // 2. Determine which token fetcher to attach based on the service
    let tokenFetcher: ((userId: string) => Promise<string>) | undefined = undefined;

    if (service === 'gmail' || service.startsWith('google_')) {
        // Covers gmail, google_docs, google_sheets, google_drive, etc.
        tokenFetcher = getValidGoogleAccessToken;
    } else if (service === 'notion') {
        tokenFetcher = getValidNotionToken;
    } else if (service === 'discord') {
        tokenFetcher = getValidDiscordToken;
    } 
    // If service is 'core' or 'gemini', tokenFetcher safely remains undefined.

    // 3. Return the full backend-ready profile
    return {
        templateId: targetNodeKey, 
        service: nodeDef.service as ServiceName,
        operation: nodeDef.operation as AnyOperation,
        ui: nodeDef.ui,
        inputs: nodeDef.inputs,
        execute: nodeDef.execute,
        getToken: tokenFetcher // Inject the correct function here!
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