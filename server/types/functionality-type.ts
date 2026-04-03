export interface NodeUI {
    type: string;
    label: string;
    description: string;
    icon: string;
}

export interface NodeInput {
    key?: string;
    type: string;
    options?: string[];
    mandatory?: boolean;
    description?: string;
}

export interface GodNodeExecution {
    method: string;
    endpoint: string;
    requiresAuthentication: boolean;
    inputs: {
        requestSetup?: NodeInput[];
        headers?: NodeInput[];
        body?: NodeInput[];
    };
}

export interface ServiceNodeExecution {
    method: string;
    endpoint: string;
    requiresAuthentication: boolean;
    inputs: {
        pathVariables?: NodeInput[];
        headersParameters?: NodeInput[];
        queryParameters?: NodeInput[];
        bodyParameters?: NodeInput[];
    };
    staticHeaders?: { key: string; value: string; mandatory: boolean }[];
}

export interface GodNode {
    templateId: string;
    service: string;
    operation: string;
    ui: NodeUI;
    execution: GodNodeExecution;
}

export interface ServiceNode {
    templateId: string;
    service: string;
    operation: string;
    ui: NodeUI;
    execution: ServiceNodeExecution;
}

export interface GeneralNode {
    // Schema to be added later
    [key: string]: any;
}

export interface LLMNode {
    // Schema to be added later
    [key: string]: any;
}

export type AnyNode = GeneralNode | LLMNode | GodNode | ServiceNode;
