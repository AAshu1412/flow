import express from "express";
const router=express.Router();
import oauth2controllers from "../controller/oauth2-controller";
import authMiddleware from "../middlewares/auth-middleware";


router.route("/google").get(oauth2controllers.google_authenticate);

// -- ASHU
// router.route("/notion").get(authMiddleware,oauth2controllers.notion_authenticate);
// -- ASHU
router.route("/notion").get(authMiddleware,oauth2controllers.notion_authenticate);
router.route("/discord").get(authMiddleware, oauth2controllers.discord_authenticate);


export default router;    