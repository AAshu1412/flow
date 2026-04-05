import express from "express";
const router=express.Router();
import node_test_controller from "../controller/node_test-controller";
import authMiddleware from "../middlewares/auth-middleware";

router.route("/user").get(authMiddleware,node_test_controller.node_test);
    
export default router;    