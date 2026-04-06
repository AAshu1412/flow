import express from "express";
const router=express.Router();
import workflow_controller from "../controller/workflow-controller";
import authMiddleware from "../middlewares/auth-middleware";

router.route("/execute").post(authMiddleware,workflow_controller.execute_workflow);
router.route("/save").post(authMiddleware,workflow_controller.saveWorkflow);
router.route("/").get(authMiddleware, workflow_controller.getWorkflow);
router.route("/:id").get(authMiddleware, workflow_controller.getWorkflow);    
export default router;    