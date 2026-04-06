import { Request, Response } from "express";
import { runWorkflowGraph } from "../utils/workflow-helper";
import { WorkflowPayload } from "../types/workflow-type";
import {Workflow} from "../models/workflow-template-model";

// const execute_workflow = async (req: Request, res: Response) => {
//     try {
//         const userId = req.db_doc_id; 
//         const workflowPayload: WorkflowPayload = req.body;

//         // Basic payload validation
//         if (!workflowPayload.triggerNodeId || !workflowPayload.nodes) {
//             return res.status(400).json({ message: "Invalid workflow payload provided." });
//         }

//         const finalEnvelope = await runWorkflowGraph(userId, workflowPayload);

//         return res.status(200).json({ 
//             message: "Workflow executed successfully!",
//             finalState: finalEnvelope 
//         });

//     } catch (error: any) {
//         console.error("\n[API ERROR] execute_workflow crashed:", error);
//         return res.status(500).json({ 
//             message: "Workflow execution failed", 
//             details: error.message 
//         });
//     }
// };

const execute_workflow = async (req: Request, res: Response) => {
    try {
        const userId = req.db_doc_id; 
        const workflowPayload: WorkflowPayload = req.body;

        // Validation updated: We only care that nodes exist!
        if (!workflowPayload.nodes || Object.keys(workflowPayload.nodes).length === 0) {
            return res.status(400).json({ message: "Invalid workflow payload: No nodes provided." });
        }

        const finalEnvelope = await runWorkflowGraph(userId, workflowPayload);

        return res.status(200).json({ 
            message: "Workflow executed successfully!",
            finalState: finalEnvelope 
        });

    } catch (error: any) {
        console.error("\n[API ERROR] execute_workflow crashed:", error);
        return res.status(500).json({ 
            message: "Workflow execution failed", 
            details: error.message 
        });
    }
};

const saveWorkflow = async (req: Request, res: Response) => {
    try {
        const userId = req.db_doc_id;
        const { workflowId, name, triggerNodeId, nodes, edges, isActive, description  } = req.body;

        // if (!triggerNodeId || !nodes) {
        if (!nodes || Object.keys(nodes).length === 0) {
            return res.status(400).json({ message: "Missing required workflow data." });
        }

        let workflow;

        if (workflowId) {
            workflow = await Workflow.findOneAndUpdate(
                { _id: workflowId, userId: userId }, // Security: Ensure they own it!
                { name, triggerNodeId, nodes, edges, isActive, description },
                { new: true }
            );
        } else {
            workflow = await Workflow.create({
                userId,
                name: name || "Untitled Workflow",
                triggerNodeId,
                nodes,
                edges,
                isActive: isActive || false,
                description: description || ""
            });
        }

        return res.status(200).json({ 
            message: "Workflow saved successfully", 
            workflowId: workflow?._id ? workflow?._id : ""
        });

    } catch (error: any) {
        console.error("[API ERROR] Failed to save workflow:", error);
        return res.status(500).json({ message: "Failed to save workflow", error: error.message });
    }
};

export const getWorkflow = async (req: Request, res: Response) => {
    try {
        const userId = req.db_doc_id;
        const { id } = req.params;

        if (!id || id === "all" || id === "/" || (typeof id === "string" && id.trim() === "")) {
            
            const workflows = await Workflow.find({ userId: userId })
                .sort({ updatedAt: -1 }); 
            
            return res.status(200).json({ data: workflows });
        }

        const workflow = await Workflow.findOne({ _id: id, userId: userId });

        if (!workflow) {
            return res.status(404).json({ message: "Workflow not found" });
        }

        return res.status(200).json({ data: workflow });

    } catch (error: any) {
        console.error("[API ERROR] Failed to retrieve workflow(s):", error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: "Invalid workflow ID format" });
        }
        
        return res.status(500).json({ message: "Failed to retrieve workflow", error: error.message });
    }
};

export default { execute_workflow, saveWorkflow, getWorkflow };