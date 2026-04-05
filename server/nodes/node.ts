import { gmailNodes } from "./gmail_node";

const allNodesRegistry = {
    ...gmailNodes,
};


function getNodeProfileForFrontend(service: string, operation: string) {
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