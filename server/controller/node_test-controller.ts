import { Request, Response } from "express";
import { executeSingleNode } from "../utils/workflow-helper"; // Adjust path as needed

const node_test = async (req: Request, res: Response) => {
    try {
        const userId = req.db_doc_id;
        const { service, operation, selectedAccounts, inputs } = req.body;

        console.log("[DEBUG] Request Payload:", { userId, service, operation, selectedAccounts, inputs });

        // Safely fallback strings/objects if they are missing from the request body
        const accountId = selectedAccounts || "";
        const nodeInputs = inputs || {};

        // Run the core engine
        const result = await executeSingleNode(userId, service, operation, accountId, nodeInputs);

        return res.status(200).json({ result: result });

    } catch (error: any) {
        console.error("\n[ERROR] Exception caught in node_test:");
        console.error(error.message || error);
        
        // Return a 400 for validation/missing account errors, and 500 for actual API crashes
        const statusCode = error.message.includes("Invalid node operation") || error.message.includes("not found") ? 400 : 500;

        return res.status(statusCode).json({ 
            message: "Node execution failed", 
            details: error.message 
        });
    }
}

export default { node_test };