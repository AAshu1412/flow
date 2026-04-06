import { Types } from "mongoose";

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

export interface IWorkflowNode {
    id: string;
    service: string;
    operation: string;
    selectedAccounts: string;
    position: { x: number; y: number };
    ui?: Record<string, any>;
    inputs: Record<string, any>;
}

export interface IWorkflowEdge {
    source: string;
    target: string;
    sourceHandle?: string;
}

export interface IWorkflow extends Document {
    userId: Types.ObjectId;
    name: string;
    triggerNodeId?: string;
    nodes: Map<string, IWorkflowNode>;
    edges: IWorkflowEdge[];
    isActive: boolean;

    isPublic: boolean;
    description: string;
    tags: string[];

    createdAt: Date;
    updatedAt: Date;
}