import express from "express";
const router=express.Router();
import authcontrollers from "../controller/auth-controller";
import {emailSchema} from "../validators/auth-validator";
import validate from "../middlewares/validate-middleware";
import authMiddleware from "../middlewares/auth-middleware";

// router.route("/register").post(validate(signupSchema),authcontrollers.register);
// router.route("/login").post(validate(loginSchema),authcontrollers.login);
router.route("/user").get(authMiddleware,authcontrollers.user);

export default router;    