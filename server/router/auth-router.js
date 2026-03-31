const express=require("express");
const router=express.Router();
const authcontrollers = require("../controller/auth-controller");
const {emailSchema}= require("../validators/auth-validator");
const validate=require("../middlewares/validate-middleware");
const authMiddleware = require("../middlewares/auth-middleware");

// router.route("/register").post(validate(signupSchema),authcontrollers.register);
// router.route("/login").post(validate(loginSchema),authcontrollers.login);
router.route("/addEmail").post(authMiddleware,validate(emailSchema),authcontrollers.add_email);
router.route("/user").get(authMiddleware,authcontrollers.user);

module.exports=router;    