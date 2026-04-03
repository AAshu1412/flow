import express from "express";
const router=express.Router();
import authcontrollers from "../controller/auth-controller";


// router.route("/register").post(validate(signupSchema),authcontrollers.register);
// router.route("/login").post(validate(loginSchema),authcontrollers.login);
router.route("/google/callback").get(authcontrollers.user);

export default router;    