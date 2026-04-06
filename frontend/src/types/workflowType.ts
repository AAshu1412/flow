
// ============================================================================
// 2. WORKFLOW TYPES
// ============================================================================

/**
 * Lightweight workflow returned inside the User Profile (No nodes/edges)
 * Perfect for rendering a list on the dashboard!
 */
export interface WorkflowSummary {
    _id: string;
    userId: string;
    name: string;
    isActive: boolean;
    isPublic: boolean;
    description: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    __v?: number;
}

export interface Position {
    x: number;
    y: number;
}

export interface WorkflowNode {
    id: string;
    service: string;
    operation: string;
    selectedAccounts: string;
    position: Position;
    ui?: Record<string, any>;
    inputs: Record<string, any>;
}

export interface WorkflowEdge {
    source: string;
    target: string;
    sourceHandle?: string;
}


export interface WorkflowBlueprint extends WorkflowSummary {
    triggerNodeId?: string;
    // Mongoose Maps are converted to standard JS Objects/Records in JSON!
    nodes: Record<string, WorkflowNode>; 
    edges: WorkflowEdge[];
}
