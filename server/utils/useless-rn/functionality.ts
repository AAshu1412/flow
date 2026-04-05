import { GodNode, ServiceNode, GeneralNode, LLMNode, AnyNode, NodePayload, ExecutionResult } from "../../types/functionality-type";
import god_node from "../../nodes/god_node.json";

const service_mapping = async (service:string, operation:string): Promise<AnyNode | null> => {
    if (service === "god_node") {
        if (operation === "generic_http") {
            return god_node.generic_http;
        }
    }
    return null;
}


const api_execution = async (service: string, operation: string, nodePayload: NodePayload): Promise<ExecutionResult | null> => {

    if (service === "god_node" && operation === "generic_http") {
        
        const method = (nodePayload.method || "GET").toUpperCase();
        const endpoint = nodePayload.url;
        const req_headers = nodePayload.headers || {};
        const req_body = nodePayload.body || null;

        if (!endpoint) {
            throw new Error("HTTP Node execution failed: URL is required.");
        }

        // 1. Safely handle headers using the native Headers object
        // This automatically handles case-insensitivity (e.g., 'content-type' vs 'Content-Type')
        const headers = new Headers();
        
        for (const [key, value] of Object.entries(req_headers)) {
            headers.append(key, value as string);
        }

        const fetchOptions: RequestInit = {
            method: method,
            headers: headers
        };

        if (req_body && method !== "GET" && method !== "HEAD") {
            if (typeof req_body === 'object') {
                fetchOptions.body = JSON.stringify(req_body);
                // Only inject application/json if the user completely forgot to set ANY content-type, 
                // preventing the API from silently dropping the object payload.
                if (!headers.has("Content-Type")) {
                    headers.set("Content-Type", "application/json");
                }
            } else {
                // If it's a string (e.g., raw XML, form data), pass it exactly as is
                fetchOptions.body = req_body;
            }
        }

        try {
            const response = await fetch(endpoint, fetchOptions);
            
            const contentType = response.headers.get("content-type");
            let responseData: any;
            
            // 3. Dynamic Response Parsing
            if (contentType && contentType.includes("application/json")) {
                responseData = await response.json();
            } else if (contentType && (contentType.includes("text/") || contentType.includes("xml"))) {
                responseData = await response.text();
            } else {
                // Fallback for files/blobs if your engine eventually supports downloading files
                responseData = await response.arrayBuffer(); 
            }

            return {
                success: response.ok,
                statusCode: response.status,
                data: responseData
            };

        } catch (error: any) {
            return {
                success: false,
                error: error?.message || "Unknown error occurred"
            };
        }
    }
    
    return null;
};


export { service_mapping, api_execution };