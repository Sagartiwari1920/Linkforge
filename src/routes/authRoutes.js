const {register,login, verifyRegisterOtp, logout} = require("../controller/authController");

const express = require("express");
const authRouter = express.Router();
const userAuth=require("../middleware/userAuth");
const rateLimiter=require("../middleware/rateLimiter");


authRouter.post("/register", rateLimiter, register);

authRouter.post(
  "/verify-register-otp",
  rateLimiter,
  verifyRegisterOtp
);

authRouter.post("/login", rateLimiter, login);

authRouter.post(
  "/logout",
  userAuth,
  logout
);

module.exports=authRouter;
