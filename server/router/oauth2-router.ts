import express from "express";
const router=express.Router();
import oauth2controllers from "../controller/oauth2-controller";


// router.route("/register").post(validate(signupSchema),authcontrollers.register);
// router.route("/login").post(validate(loginSchema),authcontrollers.login);
router.route("/google").get(oauth2controllers.google_authenticate);

export default router;    