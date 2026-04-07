import express from "express";
const router=express.Router();
import waitlist_controller from "../controller/waitlist-controller";

router.route("/request").post(waitlist_controller.waitlist_request);
    
export default router;    