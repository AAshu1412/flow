import { Types } from "mongoose";
import { SERVICE_OPERATIONS } from "../constants";


// ----------------------------------------------------
// Connections Type
// ----------------------------------------------------
export type Provider = 'google' | 'notion' | 'discord';



// ----------------------------------------------------
// Nodes Type
// ----------------------------------------------------
export type ServiceName = keyof typeof SERVICE_OPERATIONS;


// Generates specific operations based on the service selected.
// e.g., OperationName<"gemini"> results in exactly: "generate_text"
export type OperationName<T extends ServiceName> = (typeof SERVICE_OPERATIONS)[T][number];

// A union of absolutely every operation across all services
export type AnyOperation = (typeof SERVICE_OPERATIONS)[ServiceName][number];


export interface NodeInput {
    key: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'select'; 
    mandatory: boolean;
    description?: string;
    options?: { label: string; value: string }[]; 
    defaultValue?: any;
}


export interface NodeUI {
    type: string;           // e.g., "custom/apiNode" or "custom/triggerNode"
    label: string;          // e.g., "Gmail - Send Email"
    description: string;
    icon: string;           // URL to the icon
}



export interface NodeDefinition {
    service: ServiceName;
    operation: AnyOperation;
    ui: NodeUI;
    inputs: NodeInput[];
    /**
     * The core execution logic for the node.
     * @param evaluatedInputs The final values after the expression engine parses them.
     * @param environment Contains tokens and API keys (e.g., { gmailAccessToken: "..." })
     */
    execute: (evaluatedInputs: Record<string, any>, environment: {access_token?:string, apiKey?:string}) => Promise<any>;
}


export interface BackendNodeProfile extends NodeDefinition {
    templateId: string;
    getToken?: (userId: string | Types.ObjectId, connectionEmail: string) => Promise<string | null>; 
}


export interface AvailableAccount {
    connectionId: string;
    label: string;      // What the user sees (e.g., "ashu@gmail.com")
    identifier: string; // What the backend needs (e.g., the email or workspace_id)
}

export interface FrontendNodeProfile extends Omit<NodeDefinition, 'execute'> {
    templateId: string;
    availableAccounts: AvailableAccount[];
}