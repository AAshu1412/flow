export interface WorkflowEdge {
    source: string;
    target: string;
    sourceHandle?: string; 
}

export interface WorkflowNode {
    id: string;
    service: string;
    operation: string;
    selectedAccounts: string;
    inputs: Record<string, any>;
}

export interface WorkflowPayload {
    workflowId: string;
    triggerNodeId: string;
    nodes: Record<string, WorkflowNode>;
    edges: WorkflowEdge[];
}