import { Request, Response } from "express";
import { isValidNodeOperation, getNodeProfileForBackendProcessing } from "../nodes/node";

const node_test = async (req: Request, res: Response) => {

    try {

        const userId = req.db_doc_id;

        const { service, operation, inputs } = req.body;

        if (!isValidNodeOperation(service, operation)) {
            return res.status(400).json({ message: "Invalid node operation" });
        }

        const node = getNodeProfileForBackendProcessing(service, operation);

        const result = await node.execute(inputs, {});

        return res.status(200).json({ result });




    } catch (error) {

    }

}

export default { node_test };