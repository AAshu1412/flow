import { Request, Response } from "express";
import { runWorkflowGraph } from "../utils/workflow-helper";
import { WorkflowPayload } from "../types/workflow-type";
import {Workflow} from "../models/workflow-template-model";
import { User } from "../models/user-model";

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
        console.log("*****************************")
        console.log("payload: "+JSON.stringify(workflowPayload))

        // Validation updated: We only care that nodes exist!
        if (!workflowPayload.nodes || Object.keys(workflowPayload.nodes).length === 0) {
            return res.status(400).json({ message: "Invalid workflow payload: No nodes provided." });
        }

        const finalEnvelope = await runWorkflowGraph(userId, workflowPayload);
console.log("Execute Output: "+JSON.stringify(finalEnvelope));

// -- ASHU
 const hasPartialFailure = Object.values(finalEnvelope).some(
            (nodeResult: any) => nodeResult && nodeResult._execution_error === true
        );

        if (hasPartialFailure) {
            return res.status(400).json({  
                status_response: 400,
                message: "Workflow stopped because a node failed.",
                data: finalEnvelope 
            });
        }
// --- ASHU
        return res.status(200).json({ 
            status_response: 200,
            message: "Workflow executed successfully!",
            data: finalEnvelope 
        });

    } catch (error: any) {
        console.error("\n[API ERROR] execute_workflow crashed:", error);
        return res.status(500).json({ 
            status_response: 500,
            message: "Workflow execution failed", 
            error: error.message 
        });
    }
};

const saveWorkflow = async (req: Request, res: Response) => {
    try {
        const userId = req.db_doc_id;
        const { workflowId, name, triggerNodeId, nodes, edges, isActive, description } = req.body;

        if (!workflowId) {
            return res.status(400).json({ message: "workflowId is required." });
        }

        if (!nodes || Object.keys(nodes).length === 0) {
            return res.status(400).json({ message: "Missing required workflow data." });
        }

        // 2. Search by the custom frontend UUID, NOT the Mongo _id
        let workflow = await Workflow.findOne({ workflowId: workflowId });

        if (workflow) {
            if (workflow.userId.toString() !== userId.toString()) {
                return res.status(403).json({ message: "Unauthorized to edit this workflow." });
            }

            workflow = await Workflow.findOneAndUpdate(
                { workflowId: workflowId }, 
                { name, triggerNodeId, nodes, edges, isActive, description },
                { new: true }
            );
        } else {
            workflow = await Workflow.create({
                workflowId: workflowId, 
                userId,
                name: name || "Untitled Workflow",
                triggerNodeId,
                nodes,
                edges,
                isActive: isActive || false,
                description: description || ""
            });
            
            await User.findByIdAndUpdate(userId, {
                $push: { workflow_connections: workflow._id }
            });
        }

        if (workflow){
 return res.status(200).json({ 
            status_response: 200,
            message: "Workflow saved successfully", 
            data: { workflowId:  workflow.workflowId }
        });
        } else{
             return res.status(500).json({ 
            status_response: 500,
            message: "Failed to save workflow", 
            error: "Workflow not found"
        });
        }

       

    } catch (error: any) {
        console.error("[API ERROR] Failed to save workflow:", error);
        return res.status(500).json({ message: "Failed to save workflow", error: error.message });
    }
};

 const getWorkflow = async (req: Request, res: Response) => {
    try {
        const userId = req.db_doc_id;
        const { id } = req.params; // This is now the UUID string from the frontend

        if (!id || id === "all" || id === "/" || (typeof id === "string" && id.trim() === "")) {
            const workflows = await Workflow.find({ userId: userId })
                .sort({ updatedAt: -1 }); 
            
            return res.status(200).json({ 
                status_response: 200, 
                message: "Workflows retrieved successfully", 
                data: workflows 
            });
        }

        const workflow = await Workflow.findOne({ workflowId: id, userId: userId });

        if (!workflow) {
            return res.status(404).json({ message: "Workflow not found" });
        }

        return res.status(200).json({ 
            status_response: 200, 
            message: "Workflow retrieved successfully", 
            data: workflow 
        });

    } catch (error: any) {
        console.error("[API ERROR] Failed to retrieve workflow(s):", error);
        return res.status(500).json({ message: "Failed to retrieve workflow", error: error.message });
    }
};


const fetchAllWorkflowIds = async (req: Request, res: Response) => {
    try {
        const userId = req.db_doc_id;
        const workflows = await Workflow.find({ userId: userId })
            .select('workflowId name description');
        if (!workflows) {
            return res.status(404).json({ message: "Workflows not found", error: "Workflows not found" });
        }  
        const workflowIds = workflows.map((workflow: any) => {return {workflowId: workflow.workflowId, name: workflow.name, description: workflow.description}});
        
        return res.status(200).json({ 
            status_response: 200, 
            message: "Workflows Ids retrieved successfully", 
            data: workflowIds 
        });
    } catch (error: any) {
        console.error("[API ERROR] Failed to retrieve workflow ids:", error);
        return res.status(500).json({ message: "Failed to retrieve workflow ids", error: error.message });
    }
};


export default { execute_workflow, saveWorkflow, getWorkflow, fetchAllWorkflowIds };