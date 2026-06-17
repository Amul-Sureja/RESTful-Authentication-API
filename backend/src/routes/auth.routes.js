import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.get("/signupVerifyOtp", authController.signupVerifyOtp);
authRouter.post("/login", authController.login);
authRouter.get('/loginVerifyOtp', authController.loginVerifyOtp);
authRouter.get('/refreshToken', authController.refreshToken);
authRouter.get('/profile', authController.getProfile);
authRouter.patch('/update-profile', upload.single("image"), authController.updateProfile);
authRouter.get('/logout', authController.logout);
authRouter.get('/logout-all', authController.logoutAll);
authRouter.post('/resend-otp', authController.resendOtp);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password/:token', authController.resetPassword);

export default authRouter;