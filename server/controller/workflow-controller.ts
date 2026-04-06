import { Request, Response } from "express";
import { runWorkflowGraph } from "../utils/workflow-helper";
import { WorkflowPayload } from "../types/workflow-type";

export const execute_workflow = async (req: Request, res: Response) => {
    try {
        const userId = req.db_doc_id; // From your auth middleware
        const workflowPayload: WorkflowPayload = req.body;

        // Basic payload validation
        if (!workflowPayload.triggerNodeId || !workflowPayload.nodes) {
            return res.status(400).json({ message: "Invalid workflow payload provided." });
        }

        // Send to the Graph Runner!
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

export default { execute_workflow };