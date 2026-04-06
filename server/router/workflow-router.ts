import express from "express";
const router=express.Router();
import workflow_controller from "../controller/workflow-controller";
import authMiddleware from "../middlewares/auth-middleware";

router.route("/execute").post(authMiddleware,workflow_controller.execute_workflow);
    
export default router;    