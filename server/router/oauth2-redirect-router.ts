import express from "express";
const router=express.Router();
import oauth2redirectcontrollers from "../controller/oauth2-redirect-controller";


// router.route("/register").post(validate(signupSchema),authcontrollers.register);
// router.route("/login").post(validate(loginSchema),authcontrollers.login);
router.route("/google/callback").get(oauth2redirectcontrollers.google_authenticate_callback);

export default router;    