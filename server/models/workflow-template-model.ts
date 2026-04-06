import { Schema, model, Document, Types } from "mongoose";
import { IWorkflow } from "../types/workflow-type";

const positionSchema = new Schema({ x: { type: Number }, y: { type: Number } }, { _id: false });

const nodeSchema = new Schema({
    id: { type: String, required: true },
    service: { type: String, required: true },
    operation: { type: String, required: true },
    selectedAccounts: { type: String, default: "" },
    position: { type: positionSchema, required: true },
    ui: { type: Schema.Types.Mixed, default: {} },      // Visual data (width/height from React Flow)
    inputs: { type: Schema.Types.Mixed, default: {} }   // The actual data values the user entered
}, { _id: false });

const edgeSchema = new Schema({
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: { type: String, default: "default" }
}, { _id: false });

// --- Main Workflow Schema ---
const workflowSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, default: 'Untitled Workflow' },
    triggerNodeId: { type: String, required: false },
    nodes: { type: Map, of: nodeSchema, default: {} },
    edges: { type: [edgeSchema], default: [] },
    isActive: { type: Boolean, default: false },
    
    isPublic: { type: Boolean, default: false },
    description: { type: String, default: "" },
    tags: { type: [String], default: [] } // e.g., ["Marketing", "Discord", "AI"]

}, { timestamps: true });

const Workflow = model<IWorkflow>('Workflow', workflowSchema);

export {Workflow};
